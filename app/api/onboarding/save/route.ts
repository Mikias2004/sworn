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
  const {
    title,
    frequency,
    pledge_amount,
    tracking_app,
    tracking_method,
    connected_app,
    target_duration_seconds,
    started_via_goal_id,
    started_via_type,
  } = await req.json();

  if (!title || !frequency || !pledge_amount) {
    return NextResponse.json(
      { error: "title, frequency, and pledge_amount are required." },
      { status: 400 }
    );
  }

  const metric =
    frequency === "daily"
      ? "1× per day"
      : frequency === "4x_week"
      ? "4× per week"
      : frequency === "3x_week"
      ? "3× per week"
      : frequency;

  const derivedMethod =
    tracking_method ??
    (tracking_app ? "connected" : "manual");

  const db = getSupabaseAdmin();

  // Attempt full insert (works when all migrations have been applied).
  const { data: goal, error: fullError } = await db
    .from("goals")
    .insert({
      user_id: userId,
      title,
      frequency,
      metric,
      pledge_amount,
      status: "active",
      tracking_app: tracking_app ?? null,
      tracking_method: derivedMethod,
      connected_app: connected_app ?? tracking_app ?? null,
      target_duration_seconds: target_duration_seconds ?? null,
      started_via_goal_id: started_via_goal_id ?? null,
      started_via_type: started_via_type ?? null,
    })
    .select("*")
    .single();

  if (!fullError) {
    return NextResponse.json({ goal }, { status: 201 });
  }

  // Full insert failed — likely because migration columns are missing.
  // Fall back to base-schema-only insert so goal creation always works.
  console.error(
    "Onboarding save (full insert) failed — pending migrations?",
    JSON.stringify(fullError)
  );

  const { data: baseGoal, error: baseError } = await db
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

  if (baseError) {
    console.error("Onboarding save (base insert) failed:", JSON.stringify(baseError));
    return NextResponse.json(
      { error: baseError.message ?? "Failed to save goal." },
      { status: 500 }
    );
  }

  // Base goal saved. Attempt to patch tracking columns (silently skip if
  // columns don't exist yet — run migration 007 to enable them).
  const trackingPatch: Record<string, unknown> = {
    tracking_app: tracking_app ?? null,
    tracking_method: derivedMethod,
    connected_app: connected_app ?? tracking_app ?? null,
    target_duration_seconds: target_duration_seconds ?? null,
    started_via_goal_id: started_via_goal_id ?? null,
    started_via_type: started_via_type ?? null,
  };

  const { error: patchError } = await db
    .from("goals")
    .update(trackingPatch)
    .eq("id", baseGoal.id);

  if (patchError) {
    console.warn(
      "Tracking patch skipped (run pending migrations to enable):",
      patchError.message
    );
  }

  return NextResponse.json({ goal: baseGoal }, { status: 201 });
}
