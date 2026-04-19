import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { subscription } = await req.json();

  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription object." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("users")
    .update({ push_subscription: subscription })
    .eq("id", userId);

  if (error) {
    console.error("Subscribe save error:", error);
    return NextResponse.json({ error: "Failed to save subscription." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  await getSupabaseAdmin()
    .from("users")
    .update({ push_subscription: null })
    .eq("id", userId);

  return NextResponse.json({ ok: true });
}
