import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const { data: user } = await getSupabaseAdmin()
    .from("users")
    .select("stripe_payment_method_id")
    .eq("id", userId)
    .single();

  return NextResponse.json({
    hasPaymentMethod: !!user?.stripe_payment_method_id,
  });
}
