import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = { params: { username: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const viewerId = (session.user as any).id;
  const supabase = getSupabaseAdmin();

  const { data: user } = await supabase
    .from("users")
    .select("id, name, username")
    .eq("username", params.username)
    .single();

  if (!user) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const [{ data: goals }, { data: datapoints }, { data: friendship }] = await Promise.all([
    supabase.from("goals").select("id, title, frequency, streak_count, pledge_amount").eq("user_id", user.id).eq("status", "active"),
    supabase.from("datapoints").select("met_target").eq("user_id", user.id),
    supabase.from("friendships").select("status").eq("follower_id", viewerId).eq("following_id", user.id).single(),
  ]);

  const total = (datapoints ?? []).length;
  const hits = (datapoints ?? []).filter((d) => d.met_target).length;
  const hitRate = total > 0 ? Math.round((hits / total) * 100) : 0;
  const maxStreak = Math.max(...(goals ?? []).map((g) => g.streak_count ?? 0), 0);

  const profile = {
    id: user.id,
    name: user.name,
    username: user.username,
    active_goals_count: (goals ?? []).length,
    streak_count: maxStreak,
    hit_rate: hitRate,
    friendship_status: (friendship?.status ?? "none") as "none" | "pending" | "accepted",
    goals: (goals ?? []).map((g) => ({
      id: g.id,
      title: g.title,
      frequency: g.frequency,
      streak_count: g.streak_count ?? 0,
      pledge_amount: g.pledge_amount,
    })),
  };

  return NextResponse.json({ profile });
}
