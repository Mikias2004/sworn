import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { data, error } = await getSupabaseAdmin()
    .from("users")
    .select("name, email, username, timezone")
    .eq("id", userId)
    .single();

  if (error) return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { name, username, timezone } = await req.json();

  if (username) {
    const { data: existing } = await getSupabaseAdmin()
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("id", userId)
      .single();
    if (existing) return NextResponse.json({ error: "Username already taken." }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from("users")
    .update({ name, username, timezone })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  return NextResponse.json({ success: true });
}
