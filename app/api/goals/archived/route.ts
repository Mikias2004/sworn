import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const supabase = getSupabaseAdmin();

  const { data: goals, error } = await supabase
    .from("goals")
    .select("id, title, created_at, updated_at, status")
    .eq("user_id", userId)
    .eq("status", "archived")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ goals: [] });

  const goalIds = (goals ?? []).map((g) => g.id);
  let statsByGoal: Record<string, { completed: number; missed: number }> = {};
  let chargesByGoal: Record<string, number> = {};

  if (goalIds.length > 0) {
    const { data: dps } = await supabase
      .from("datapoints")
      .select("goal_id, met_target")
      .in("goal_id", goalIds);

    for (const dp of dps ?? []) {
      if (!statsByGoal[dp.goal_id]) statsByGoal[dp.goal_id] = { completed: 0, missed: 0 };
      if (dp.met_target) statsByGoal[dp.goal_id].completed++;
      else statsByGoal[dp.goal_id].missed++;
    }

    const { data: charges } = await supabase
      .from("charges")
      .select("goal_id, amount")
      .in("goal_id", goalIds);

    for (const c of charges ?? []) {
      chargesByGoal[c.goal_id] = (chargesByGoal[c.goal_id] ?? 0) + c.amount;
    }
  }

  const rows = (goals ?? []).map((g) => ({
    id: g.id,
    title: g.title,
    created_at: g.created_at,
    archived_at: g.updated_at,
    total_completed: statsByGoal[g.id]?.completed ?? 0,
    total_missed: statsByGoal[g.id]?.missed ?? 0,
    total_charged: chargesByGoal[g.id] ?? 0,
  }));

  return NextResponse.json({ goals: rows });
}
