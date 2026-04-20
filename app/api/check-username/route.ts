import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username") ?? "";

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json({ available: false, invalid: true });
  }

  const { data } = await getSupabaseAdmin()
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  return NextResponse.json({ available: !data, invalid: false });
}
