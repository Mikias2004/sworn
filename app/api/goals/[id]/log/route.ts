export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";
import { sendPushNotification } from "@/lib/webpush";
import type { PushSubscription as WebPushSubscription } from "web-push";

const client = new Anthropic();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const goalId = params.id;
  const { duration_seconds, met_target = true } = await req.json();

  const supabase = getSupabaseAdmin();

  // Verify the goal belongs to this user
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single();

  if (goalError || !goal) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  // Insert datapoint
  await supabase.from("datapoints").insert({
    goal_id: goalId,
    value: duration_seconds ? duration_seconds / 60 : 1,
    logged_at: new Date().toISOString(),
    met_target,
    duration: duration_seconds ?? null,
  });

  // Update streak if target was met
  let newStreak = goal.streak_count ?? 0;
  const today = new Date().toISOString().split("T")[0];

  if (met_target) {
    const lastDate = goal.last_completed_date;

    if (lastDate === today) {
      // Already logged today — no streak change
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastDate === yesterdayStr) {
        newStreak = (goal.streak_count ?? 0) + 1;
      } else {
        newStreak = 1;
      }

      const { data: updatedGoal } = await supabase
        .from("goals")
        .update({ streak_count: newStreak, last_completed_date: today })
        .eq("id", goalId)
        .select("*")
        .single();

      // Send streak celebration push notification
      const { data: userData } = await supabase
        .from("users")
        .select("push_subscription")
        .eq("id", userId)
        .single();

      const subscription = userData?.push_subscription as WebPushSubscription | null;
      if (subscription) {
        try {
          const message = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 80,
            system:
              "You are Sworn's notification writer. Write a single push notification for a user based on their goal and context. Be direct, slightly provocative, and personality-driven like Duolingo but for serious adult commitments. Never be mean. Always be under 100 characters. Return only the notification text, nothing else.",
            messages: [
              {
                role: "user",
                content: `Goal: "${goal.title}". Streak: ${newStreak} days. Notification type: streak celebration. They just logged their session.`,
              },
            ],
          });

          const body =
            message.content[0].type === "text" ? message.content[0].text.trim() : "";

          if (body) {
            await sendPushNotification(subscription, {
              title: "Sworn",
              body,
              tag: `sworn-streak-${goalId}`,
              url: "/dashboard",
            });
          }
        } catch {
          // Non-fatal — streak was still updated
        }
      }

      return NextResponse.json({
        ok: true,
        streak_count: newStreak,
        last_completed_date: today,
        goal: updatedGoal,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    streak_count: goal.streak_count,
    last_completed_date: goal.last_completed_date,
  });
}
