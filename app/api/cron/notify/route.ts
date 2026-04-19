export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendPushNotification } from "@/lib/webpush";
import type { PushSubscription as WebPushSubscription } from "web-push";

const client = new Anthropic();

type NotificationType = "morning" | "midday" | "danger_zone" | "miss";

async function generateNotificationText(
  type: NotificationType,
  goalTitle: string,
  streakCount: number,
  stakeAmount: number,
  missedRecently: boolean
): Promise<string> {
  const context = [
    `Goal: "${goalTitle}"`,
    `Streak: ${streakCount} day${streakCount !== 1 ? "s" : ""}`,
    `Stake: $${stakeAmount} per miss`,
    `Notification type: ${type}`,
    missedRecently ? "User missed yesterday." : null,
  ]
    .filter(Boolean)
    .join(". ");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 80,
    system:
      "You are Sworn's notification writer. Write a single push notification for a user based on their goal and context. Be direct, slightly provocative, and personality-driven like Duolingo but for serious adult commitments. Never be mean. Always be under 100 characters. Return only the notification text, nothing else.",
    messages: [{ role: "user", content: context }],
  });

  return message.content[0].type === "text" ? message.content[0].text.trim() : "";
}

function isGoalDueToday(frequency: string): boolean {
  const day = new Date().getDay(); // 0=Sun
  if (frequency === "daily") return true;
  if (frequency === "4x_week") return day >= 1 && day <= 5; // Mon–Fri
  if (frequency === "3x_week") return day === 1 || day === 3 || day === 5; // MWF
  return true;
}

function didMissYesterday(lastCompletedDate: string | null): boolean {
  if (!lastCompletedDate) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];
  const last = new Date(lastCompletedDate).toISOString().split("T")[0];
  return last < yStr;
}

function completedToday(lastCompletedDate: string | null): boolean {
  if (!lastCompletedDate) return false;
  const today = new Date().toISOString().split("T")[0];
  return new Date(lastCompletedDate).toISOString().split("T")[0] === today;
}

function getNotificationTypeByHour(hour: number): NotificationType {
  if (hour === 8) return "morning";
  if (hour === 12) return "midday";
  return "danger_zone";
}

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets Authorization header automatically)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const utcHour = new Date().getUTCHours();
  const typeFromQuery = req.nextUrl.searchParams.get("type") as NotificationType | null;
  const type: NotificationType = typeFromQuery ?? getNotificationTypeByHour(utcHour);

  const supabase = getSupabaseAdmin();

  // Fetch all active goals with their users' push subscriptions
  const { data: goals, error } = await supabase
    .from("goals")
    .select(
      `
      id, title, frequency, pledge_amount, streak_count, last_completed_date, last_notified_at,
      users!inner ( id, push_subscription )
    `
    )
    .eq("status", "active")
    .not("users.push_subscription", "is", null);

  if (error) {
    console.error("Cron fetch error:", error);
    return NextResponse.json({ error: "DB fetch failed" }, { status: 500 });
  }

  const now = new Date().toISOString();
  let sent = 0;
  let skipped = 0;

  for (const goal of goals ?? []) {
    const user = (goal as any).users;
    const subscription = user?.push_subscription as WebPushSubscription | null;
    if (!subscription) { skipped++; continue; }

    // For midday/danger_zone: skip if already completed today
    if ((type === "midday" || type === "danger_zone") && completedToday(goal.last_completed_date)) {
      skipped++;
      continue;
    }

    // For morning: check if goal is due today
    if (type === "morning" && !isGoalDueToday(goal.frequency)) {
      skipped++;
      continue;
    }

    // For miss type: only send if they missed yesterday and it's a new day
    if (type === "miss" && !didMissYesterday(goal.last_completed_date)) {
      skipped++;
      continue;
    }

    try {
      const missed = didMissYesterday(goal.last_completed_date);
      const body = await generateNotificationText(
        type,
        goal.title,
        goal.streak_count ?? 0,
        goal.pledge_amount,
        missed
      );

      const delivered = await sendPushNotification(subscription, {
        title: "Sworn",
        body,
        tag: `sworn-${type}-${goal.id}`,
        url: "/dashboard",
      });

      if (delivered) {
        await supabase
          .from("goals")
          .update({ last_notified_at: now })
          .eq("id", goal.id);
        sent++;
      } else {
        // Expired subscription — clear it
        await supabase
          .from("users")
          .update({ push_subscription: null })
          .eq("id", user.id);
        skipped++;
      }
    } catch (err) {
      console.error(`Failed to notify goal ${goal.id}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, type, sent, skipped });
}
