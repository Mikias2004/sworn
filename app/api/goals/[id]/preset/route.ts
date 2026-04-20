import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: goal } = await getSupabaseAdmin()
    .from("goals")
    .select("id, title, frequency, tracking_method")
    .eq("id", params.id)
    .single();

  if (!goal) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({
    title: goal.title,
    frequency: goal.frequency,
    tracking_method: goal.tracking_method,
  });
}
