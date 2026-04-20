import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

type Params = { params: { id: string } };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const supabase = getSupabaseAdmin();

  // Verify ownership
  const { data: goal } = await supabase
    .from("goals")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (!goal) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await supabase.from("datapoints").delete().eq("goal_id", params.id);
  await supabase.from("goals").delete().eq("id", params.id);

  return NextResponse.json({ success: true });
}
