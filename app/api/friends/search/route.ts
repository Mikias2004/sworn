import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const q = new URL(req.url).searchParams.get("q") ?? "";

  if (!q.trim()) return NextResponse.json({ users: [] });

  const supabase = getSupabaseAdmin();

  const { data: users } = await supabase
    .from("users")
    .select("id, name, username")
    .ilike("username", `%${q}%`)
    .neq("id", userId)
    .limit(20);

  if (!users?.length) return NextResponse.json({ users: [] });

  // Get active goal counts
  const userIds = users.map((u) => u.id);
  const { data: goals } = await supabase
    .from("goals")
    .select("user_id")
    .in("user_id", userIds)
    .eq("status", "active");

  const goalCounts: Record<string, number> = {};
  for (const g of goals ?? []) goalCounts[g.user_id] = (goalCounts[g.user_id] ?? 0) + 1;

  // Get friendship statuses
  const { data: friendships } = await supabase
    .from("friendships")
    .select("following_id, status")
    .eq("follower_id", userId)
    .in("following_id", userIds);

  const statusMap: Record<string, string> = {};
  for (const f of friendships ?? []) statusMap[f.following_id] = f.status;

  const result = users.map((u) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    active_goals_count: goalCounts[u.id] ?? 0,
    streak_count: 0,
    friendship_status: (statusMap[u.id] ?? "none") as "none" | "pending" | "accepted",
  }));

  return NextResponse.json({ users: result });
}
