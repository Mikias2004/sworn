import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const db = getSupabaseAdmin();

  // Look up the token
  const { data: resetToken } = await db
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (!resetToken) {
    return NextResponse.json(
      { error: "Invalid or expired reset link." },
      { status: 400 }
    );
  }

  if (resetToken.used_at) {
    return NextResponse.json(
      { error: "This reset link has already been used." },
      { status: 400 }
    );
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This reset link has expired. Please request a new one." },
      { status: 400 }
    );
  }

  // Hash the new password
  const password_hash = await bcrypt.hash(password, 12);

  // Update user's password
  const { error: updateError } = await db
    .from("users")
    .update({ password_hash })
    .eq("id", resetToken.user_id);

  if (updateError) {
    console.error("Failed to update password:", updateError);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  // Mark token as used
  await db
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", resetToken.id);

  return NextResponse.json({ ok: true });
}
