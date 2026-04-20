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
    .select("notification_time_morning, notification_time_midday, notification_time_deadline, notification_streak_celebrations, notification_miss_notifications, notification_weekly_summary, notification_friends_activity, notification_quiet_hours_enabled, notification_quiet_from, notification_quiet_to")
    .eq("id", userId)
    .single();

  if (error) return NextResponse.json({ prefs: null });

  return NextResponse.json({
    prefs: {
      time_morning: data.notification_time_morning ?? "08:00",
      time_midday: data.notification_time_midday ?? "12:00",
      time_deadline: data.notification_time_deadline ?? "22:00",
      streak_celebrations: data.notification_streak_celebrations ?? true,
      miss_notifications: data.notification_miss_notifications ?? true,
      weekly_summary: data.notification_weekly_summary ?? true,
      friends_activity: data.notification_friends_activity ?? false,
      quiet_hours_enabled: data.notification_quiet_hours_enabled ?? false,
      quiet_from: data.notification_quiet_from ?? "22:00",
      quiet_to: data.notification_quiet_to ?? "07:00",
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();

  const { error } = await getSupabaseAdmin()
    .from("users")
    .update({
      notification_time_morning: body.time_morning,
      notification_time_midday: body.time_midday,
      notification_time_deadline: body.time_deadline,
      notification_streak_celebrations: body.streak_celebrations,
      notification_miss_notifications: body.miss_notifications,
      notification_weekly_summary: body.weekly_summary,
      notification_friends_activity: body.friends_activity,
      notification_quiet_hours_enabled: body.quiet_hours_enabled,
      notification_quiet_from: body.quiet_from,
      notification_quiet_to: body.quiet_to,
    })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: "Failed to save preferences." }, { status: 500 });
  return NextResponse.json({ success: true });
}
