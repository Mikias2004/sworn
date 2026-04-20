import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { payment_method_id } = await req.json();
  if (!payment_method_id) return NextResponse.json({ error: "payment_method_id required" }, { status: 400 });

  const { data: user } = await getSupabaseAdmin()
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (user?.stripe_customer_id) {
    try {
      await getStripe().paymentMethods.attach(payment_method_id, { customer: user.stripe_customer_id });
      await getStripe().customers.update(user.stripe_customer_id, {
        invoice_settings: { default_payment_method: payment_method_id },
      });
    } catch {
      // may already be attached
    }
  }

  const { error } = await getSupabaseAdmin()
    .from("users")
    .update({ stripe_payment_method_id: payment_method_id })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: "Failed to save." }, { status: 500 });
  return NextResponse.json({ success: true });
}
