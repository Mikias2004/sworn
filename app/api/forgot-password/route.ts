import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendEmail, passwordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = getSupabaseAdmin();

  const { data: user } = await db
    .from("users")
    .select("id, email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!user) {
    return NextResponse.json(
      { error: "No account found with that email." },
      { status: 404 }
    );
  }

  // Generate a secure token valid for 24 hours
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: insertError } = await db
    .from("password_reset_tokens")
    .insert({ user_id: user.id, token, expires_at: expiresAt });

  if (insertError) {
    console.error("Failed to create reset token:", insertError);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://sworn.app";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: normalizedEmail,
    subject: "Reset your Sworn password",
    html: passwordResetEmail(resetUrl),
  });

  return NextResponse.json({ ok: true });
}
