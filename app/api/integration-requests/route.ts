import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { app_name, use_case } = await req.json();

  if (!app_name?.trim()) return NextResponse.json({ error: "app_name required" }, { status: 400 });

  const { error } = await getSupabaseAdmin().from("integration_requests").insert({
    user_id: userId,
    app_name: app_name.trim(),
    use_case: use_case?.trim() ?? null,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: "Failed to save request." }, { status: 500 });
  return NextResponse.json({ success: true });
}
