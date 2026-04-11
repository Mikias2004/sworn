import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const { data: goals, error } = await getSupabaseAdmin()
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Goals fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch goals." }, { status: 500 });
  }

  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { title, frequency, metric, pledge_amount } = await req.json();

  if (!title || !frequency || !metric || !pledge_amount) {
    return NextResponse.json(
      { error: "title, frequency, metric, and pledge_amount are required." },
      { status: 400 }
    );
  }

  const { data: goal, error } = await getSupabaseAdmin()
    .from("goals")
    .insert({
      user_id: userId,
      title,
      frequency,
      metric,
      pledge_amount,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    console.error("Goal insert error:", error);
    return NextResponse.json({ error: "Failed to create goal." }, { status: 500 });
  }

  return NextResponse.json({ goal }, { status: 201 });
}
