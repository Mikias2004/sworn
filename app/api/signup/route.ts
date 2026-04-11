import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createStripeCustomer } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
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

  // Check for existing user
  const { data: existing } = await db
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 12);

  // Create Stripe customer
  const customer = await createStripeCustomer(normalizedEmail, name);

  // Insert user into Supabase
  const { data: user, error } = await db
    .from("users")
    .insert({
      email: normalizedEmail,
      name: name ?? null,
      password_hash,
      stripe_customer_id: customer.id,
    })
    .select("id, email, name")
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
