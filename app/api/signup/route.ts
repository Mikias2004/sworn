import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createStripeCustomer } from "@/lib/stripe";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function POST(req: NextRequest) {
  const { email, password, name, username } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  if (!username) {
    return NextResponse.json(
      { error: "Username is required." },
      { status: 400 }
    );
  }

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3–20 characters: lowercase letters, numbers, and underscores only." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const db = getSupabaseAdmin();

  // Check for existing email
  const { data: existingEmail } = await db
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingEmail) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // Check for existing username
  const { data: existingUsername } = await db
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUsername) {
    return NextResponse.json(
      { error: "That username is already taken." },
      { status: 409 }
    );
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 12);

  // Create Stripe customer
  const customer = await createStripeCustomer(normalizedEmail, name);

  // Insert user
  const { data: user, error } = await db
    .from("users")
    .insert({
      email: normalizedEmail,
      name: name ?? null,
      username,
      password_hash,
      stripe_customer_id: customer.id,
    })
    .select("id, email, name, username")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ user }, { status: 201 });
}
