import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const supabase = getSupabaseAdmin();

  const { data: goal, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (error || !goal) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  const { data: datapoints } = await supabase
    .from("datapoints")
    .select("id, goal_id, met_target, logged_at, duration, started_at, stopped_at, value")
    .eq("goal_id", params.id)
    .order("logged_at", { ascending: false })
    .limit(30);

  return NextResponse.json({ goal: { ...goal, recent_datapoints: datapoints ?? [] } });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const updates = await req.json();

  // Only allow updating these fields
  const allowed = ["title", "frequency", "metric", "pledge_amount", "status"];
  const sanitized = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  );

  const { data: goal, error } = await getSupabaseAdmin()
    .from("goals")
    .update(sanitized)
    .eq("id", params.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update goal." }, { status: 500 });
  }

  return NextResponse.json({ goal });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const { error } = await getSupabaseAdmin()
    .from("goals")
    .update({ status: "archived" })
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Failed to archive goal." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
