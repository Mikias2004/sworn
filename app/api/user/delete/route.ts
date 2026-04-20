import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const supabase = getSupabaseAdmin();

  // Delete in dependency order
  await supabase.from("datapoints").delete().eq("user_id", userId);
  await supabase.from("charges").delete().eq("user_id", userId);
  await supabase.from("goals").delete().eq("user_id", userId);
  await supabase.from("friendships").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
  await supabase.from("users").delete().eq("id", userId);

  return NextResponse.json({ success: true });
}
