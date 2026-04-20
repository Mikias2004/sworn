import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { data: user } = await getSupabaseAdmin()
    .from("users")
    .select("stripe_customer_id, stripe_payment_method_id")
    .eq("id", userId)
    .single();

  if (!user?.stripe_payment_method_id) return NextResponse.json({ card: null });

  try {
    const pm = await getStripe().paymentMethods.retrieve(user.stripe_payment_method_id);
    if (pm.card) {
      return NextResponse.json({
        card: {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        },
      });
    }
  } catch {
    // payment method may have been deleted
  }

  return NextResponse.json({ card: null });
}
