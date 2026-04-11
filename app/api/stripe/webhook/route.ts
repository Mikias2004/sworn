import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";

// Stripe sends raw body — must read it as text, not JSON
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  switch (event.type) {
    // User saved a payment method via SetupIntent
    case "setup_intent.succeeded": {
      const intent = event.data.object as Stripe.SetupIntent;
      const customerId = intent.customer as string;
      const paymentMethodId = intent.payment_method as string;

      await db
        .from("users")
        .update({ stripe_payment_method_id: paymentMethodId })
        .eq("stripe_customer_id", customerId);

      break;
    }

    // Charge succeeded — record it
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const customerId = intent.customer as string;

      const { data: user } = await db
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (user && intent.metadata?.goal_id) {
        await db.from("charges").insert({
          goal_id: intent.metadata.goal_id,
          user_id: user.id,
          amount: intent.amount / 100,
          reason: intent.description ?? "Missed goal",
        });
      }

      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.error(
        `Payment failed for customer ${intent.customer}:`,
        intent.last_payment_error?.message
      );
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
