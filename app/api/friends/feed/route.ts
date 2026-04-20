import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const supabase = getSupabaseAdmin();

  // Get who the user follows (accepted)
  const { data: friendships } = await supabase
    .from("friendships")
    .select("following_id")
    .eq("follower_id", userId)
    .eq("status", "accepted");

  const followingIds = (friendships ?? []).map((f) => f.following_id);

  // Get suggested users (public — users with most active goals, not already following)
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, name, username")
    .neq("id", userId)
    .limit(20);

  const notFollowing = (allUsers ?? []).filter((u) => !followingIds.includes(u.id));

  const suggestedIds = notFollowing.map((u) => u.id);
  let goalCounts: Record<string, number> = {};
  if (suggestedIds.length > 0) {
    const { data: goals } = await supabase
      .from("goals")
      .select("user_id")
      .in("user_id", suggestedIds)
      .eq("status", "active");
    for (const g of goals ?? []) goalCounts[g.user_id] = (goalCounts[g.user_id] ?? 0) + 1;
  }

  // Get friendship statuses for suggested
  const { data: myFriendships } = await supabase
    .from("friendships")
    .select("following_id, status")
    .eq("follower_id", userId)
    .in("following_id", suggestedIds.slice(0, 50));

  const statusMap: Record<string, string> = {};
  for (const f of myFriendships ?? []) statusMap[f.following_id] = f.status;

  const suggested = notFollowing
    .sort((a, b) => (goalCounts[b.id] ?? 0) - (goalCounts[a.id] ?? 0))
    .slice(0, 10)
    .map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      active_goals_count: goalCounts[u.id] ?? 0,
      streak_count: 0,
      friendship_status: (statusMap[u.id] ?? "none") as "none" | "pending" | "accepted",
    }));

  let feed: any[] = [];

  if (followingIds.length > 0) {
    // Recent datapoints from friends
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const { data: recentDps } = await supabase
      .from("datapoints")
      .select("id, goal_id, user_id, met_target, logged_at")
      .in("user_id", followingIds)
      .gte("logged_at", since.toISOString())
      .order("logged_at", { ascending: false })
      .limit(30);

    const { data: recentGoals } = await supabase
      .from("goals")
      .select("id, title, user_id, created_at, streak_count, pledge_amount")
      .in("user_id", followingIds)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    // Get friend names
    const { data: friendUsers } = await supabase
      .from("users")
      .select("id, name, username")
      .in("id", followingIds);

    const friendMap: Record<string, { name: string; username: string }> = {};
    for (const u of friendUsers ?? []) friendMap[u.id] = { name: u.name, username: u.username };

    // Goal title map
    const allGoalIds = Array.from(new Set((recentDps ?? []).map((d) => d.goal_id)));
    let goalTitleMap: Record<string, { title: string; pledge_amount: number; streak_count: number }> = {};
    if (allGoalIds.length > 0) {
      const { data: goalData } = await supabase
        .from("goals")
        .select("id, title, pledge_amount, streak_count")
        .in("id", allGoalIds);
      for (const g of goalData ?? []) goalTitleMap[g.id] = { title: g.title, pledge_amount: g.pledge_amount, streak_count: g.streak_count };
    }

    for (const dp of recentDps ?? []) {
      const friend = friendMap[dp.user_id];
      if (!friend) continue;
      const goal = goalTitleMap[dp.goal_id];
      feed.push({
        id: dp.id,
        friend_name: friend.name,
        friend_username: friend.username,
        action: dp.met_target ? "logged" : "missed",
        goal_title: goal?.title ?? "a goal",
        goal_id: dp.goal_id,
        created_at: dp.logged_at,
        streak_count: goal?.streak_count ?? 0,
        pledge_amount: goal?.pledge_amount ?? 0,
      });
    }

    for (const g of recentGoals ?? []) {
      const friend = friendMap[g.user_id];
      if (!friend) continue;
      feed.push({
        id: `goal-${g.id}`,
        friend_name: friend.name,
        friend_username: friend.username,
        action: "new_goal",
        goal_title: g.title,
        goal_id: g.id,
        created_at: g.created_at,
        streak_count: g.streak_count ?? 0,
        pledge_amount: g.pledge_amount ?? 0,
      });
    }

    feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    feed = feed.slice(0, 20);
  }

  return NextResponse.json({ feed, suggested });
}
