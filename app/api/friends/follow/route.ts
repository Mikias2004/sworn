import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const followerId = (session.user as any).id;
  const { following_id } = await req.json();

  if (!following_id || following_id === followerId) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Check existing
  const { data: existing } = await supabase
    .from("friendships")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", following_id)
    .single();

  if (existing) return NextResponse.json({ status: "already_exists" });

  const { error } = await supabase.from("friendships").insert({
    follower_id: followerId,
    following_id,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: "Failed to follow." }, { status: 500 });
  return NextResponse.json({ status: "pending" });
}
