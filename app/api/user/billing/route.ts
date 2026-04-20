import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const supabase = getSupabaseAdmin();

  const { data: charges, error } = await supabase
    .from("charges")
    .select("id, goal_id, amount, reason, charged_at, status, refunded_at")
    .eq("user_id", userId)
    .order("charged_at", { ascending: false });

  if (error) return NextResponse.json({ charges: [] });

  // Fetch goal titles
  const goalIds = Array.from(new Set((charges ?? []).map((c) => c.goal_id).filter(Boolean)));
  let goalTitles: Record<string, string> = {};
  if (goalIds.length > 0) {
    const { data: goals } = await supabase
      .from("goals")
      .select("id, title")
      .in("id", goalIds);
    for (const g of goals ?? []) goalTitles[g.id] = g.title;
  }

  const rows = (charges ?? []).map((c) => ({
    id: c.id,
    charged_at: c.charged_at,
    reason: c.reason,
    goal_title: c.goal_id ? (goalTitles[c.goal_id] ?? null) : null,
    amount: c.amount,
    status: c.status ?? "charged",
  }));

  return NextResponse.json({ charges: rows });
}
