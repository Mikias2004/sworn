import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

// Re-export for webhook route which uses it directly
export { getStripe as stripe };

/**
 * Create a Stripe customer for a new user.
 */
export async function createStripeCustomer(email: string, name?: string) {
  return getStripe().customers.create({ email, name });
}

/**
 * Create a SetupIntent so the user can save a payment method.
 * Returns the client_secret needed by Stripe.js on the frontend.
 */
export async function createSetupIntent(customerId: string) {
  return getStripe().setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
  });
}

/**
 * Charge a saved payment method. Used when a user misses a goal.
 */
export async function chargeForMissedGoal({
  customerId,
  paymentMethodId,
  amountCents,
  description,
}: {
  customerId: string;
  paymentMethodId: string;
  amountCents: number;
  description: string;
}) {
  return getStripe().paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: true,
    off_session: true,
    description,
  });
}
