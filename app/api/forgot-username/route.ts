import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendEmail, usernameReminderEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = getSupabaseAdmin();

  const { data: user } = await db
    .from("users")
    .select("email, username")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!user) {
    return NextResponse.json(
      { error: "No account found with that email." },
      { status: 404 }
    );
  }

  if (!user.username) {
    return NextResponse.json(
      { error: "No username is associated with this account." },
      { status: 404 }
    );
  }

  await sendEmail({
    to: normalizedEmail,
    subject: "Your Sworn username",
    html: usernameReminderEmail(user.username),
  });

  return NextResponse.json({ ok: true });
}
