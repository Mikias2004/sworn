import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const CATEGORIES: Record<string, string[]> = {
  Fitness: ["run", "walk", "workout", "exercise", "gym", "swim", "bike", "cycle", "yoga", "lift", "strength", "cardio", "jog", "hike", "sport"],
  Faith: ["pray", "prayer", "bible", "church", "devotion", "meditat", "faith", "scripture", "worship"],
  Focus: ["focus", "work", "study", "read", "code", "program", "learn", "pomodoro", "deep work"],
  Health: ["sleep", "water", "hydrat", "diet", "eat", "meal", "vitamin", "health", "wellness"],
  Mindfulness: ["journal", "meditat", "gratitude", "reflect", "breath", "mindful"],
  Learning: ["learn", "course", "book", "language", "practice", "skill", "study"],
  Productivity: ["task", "todo", "habit", "routine", "plan", "schedule", "goal"],
};

function inferCategory(title: string): string {
  const lower = title.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "Productivity";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const supabase = getSupabaseAdmin();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  // All active goals from last 30 days
  const { data: goals } = await supabase
    .from("goals")
    .select("id, title, tracking_method, user_id, streak_count")
    .eq("status", "active")
    .gte("created_at", since.toISOString());

  if (!goals?.length) return NextResponse.json({ goals: [] });

  // Get datapoints for hit rate
  const goalIds = goals.map((g) => g.id);
  const { data: datapoints } = await supabase
    .from("datapoints")
    .select("goal_id, met_target")
    .in("goal_id", goalIds)
    .gte("logged_at", since.toISOString());

  const dpByGoal: Record<string, { total: number; hits: number }> = {};
  for (const dp of datapoints ?? []) {
    if (!dpByGoal[dp.goal_id]) dpByGoal[dp.goal_id] = { total: 0, hits: 0 };
    dpByGoal[dp.goal_id].total++;
    if (dp.met_target) dpByGoal[dp.goal_id].hits++;
  }

  // Get friends of current user
  const { data: friendships } = await supabase
    .from("friendships")
    .select("following_id")
    .eq("follower_id", userId)
    .eq("status", "accepted");

  const friendIds = new Set((friendships ?? []).map((f) => f.following_id));

  // Get friend names
  const friendUserIds = Array.from(friendIds);
  let friendNames: Record<string, string> = {};
  if (friendUserIds.length > 0) {
    const { data: friendUsers } = await supabase
      .from("users")
      .select("id, name")
      .in("id", friendUserIds);
    for (const u of friendUsers ?? []) friendNames[u.id] = u.name;
  }

  // Normalize and group goals by title (case-insensitive)
  const grouped: Record<string, typeof goals> = {};
  for (const g of goals) {
    const key = g.title.toLowerCase().trim();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(g);
  }

  const ranked = Object.entries(grouped)
    .map(([, members]) => {
      const activeUsers = members.length;
      const allDps = members.flatMap((g) => {
        const d = dpByGoal[g.id];
        return d ? [d] : [];
      });
      const totalDps = allDps.reduce((s, d) => s + d.total, 0);
      const totalHits = allDps.reduce((s, d) => s + d.hits, 0);
      const hitRate = totalDps > 0 ? Math.round((totalHits / totalDps) * 100) : 0;
      const avgStreak = Math.round(members.reduce((s, g) => s + (g.streak_count ?? 0), 0) / members.length);

      const friendsDoingThis = members.filter((g) => friendIds.has(g.user_id));
      const friendNamesArr = Array.from(new Set(friendsDoingThis.map((g) => friendNames[g.user_id]).filter(Boolean)));

      const representative = members[0];
      return {
        id: representative.id,
        title: representative.title,
        category: inferCategory(representative.title),
        tracking_method: representative.tracking_method ?? "manual",
        active_users: activeUsers,
        hit_rate: hitRate,
        avg_streak: avgStreak,
        friend_names: friendNamesArr.slice(0, 3),
        friend_count: friendsDoingThis.length,
      };
    })
    .sort((a, b) => b.active_users - a.active_users)
    .slice(0, 20);

  return NextResponse.json({ goals: ranked });
}
