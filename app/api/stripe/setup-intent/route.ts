import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSetupIntent } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerId = (session.user as any).stripeCustomerId;
  if (!customerId) {
    return NextResponse.json(
      { error: "No Stripe customer found for this account." },
      { status: 400 }
    );
  }

  const setupIntent = await createSetupIntent(customerId);
  return NextResponse.json({ clientSecret: setupIntent.client_secret });
}
