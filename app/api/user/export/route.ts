import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const supabase = getSupabaseAdmin();

  const [{ data: user }, { data: goals }, { data: datapoints }, { data: charges }] = await Promise.all([
    supabase.from("users").select("id, name, email, username, created_at").eq("id", userId).single(),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("datapoints").select("*").eq("user_id", userId),
    supabase.from("charges").select("*").eq("user_id", userId),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user,
    goals: goals ?? [],
    datapoints: datapoints ?? [],
    charges: charges ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sworn-data-${Date.now()}.json"`,
    },
  });
}
