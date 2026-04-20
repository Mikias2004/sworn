import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const supabase = getSupabaseAdmin();

  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Goals fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch goals." }, { status: 500 });
  }

  // Fetch last 7 days of datapoints for all active goals
  const activeIds = (goals ?? []).filter((g) => g.status === "active").map((g) => g.id);
  let datapointsByGoal: Record<string, any[]> = {};

  if (activeIds.length > 0) {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const { data: dps } = await supabase
      .from("datapoints")
      .select("id, goal_id, met_target, logged_at, duration")
      .in("goal_id", activeIds)
      .gte("logged_at", since.toISOString());

    for (const dp of dps ?? []) {
      if (!datapointsByGoal[dp.goal_id]) datapointsByGoal[dp.goal_id] = [];
      datapointsByGoal[dp.goal_id].push(dp);
    }
  }

  const goalsWithDatapoints = (goals ?? []).map((g) => ({
    ...g,
    recent_datapoints: datapointsByGoal[g.id] ?? [],
  }));

  return NextResponse.json({ goals: goalsWithDatapoints });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { title, frequency, metric, pledge_amount } = await req.json();

  if (!title || !frequency || !metric || !pledge_amount) {
    return NextResponse.json(
      { error: "title, frequency, metric, and pledge_amount are required." },
      { status: 400 }
    );
  }

  const { data: goal, error } = await getSupabaseAdmin()
    .from("goals")
    .insert({
      user_id: userId,
      title,
      frequency,
      metric,
      pledge_amount,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    console.error("Goal insert error:", error);
    return NextResponse.json({ error: "Failed to create goal." }, { status: 500 });
  }

  return NextResponse.json({ goal }, { status: 201 });
}
