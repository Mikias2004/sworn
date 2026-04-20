import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const { data: user } = await getSupabaseAdmin()
    .from("users")
    .select("password_hash")
    .eq("id", userId)
    .single();

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

  const newHash = await bcrypt.hash(newPassword, 12);
  const { error } = await getSupabaseAdmin()
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  return NextResponse.json({ success: true });
}
