import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type AppRecommendation = {
  app_name: string | null;
  app_reason: string;
  tracking_method: "timer" | "connected" | "manual";
  target_duration_seconds: number | null;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { raw } = await req.json();
  if (!raw?.trim()) {
    return NextResponse.json({ error: "Goal text is required." }, { status: 400 });
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 200,
    system:
      "You are Sworn's goal advisor. When given a user's goal, recommend the single best third-party app to track it and explain in one sentence why it helps. Return JSON only with these fields: app_name, app_reason, tracking_method (one of: timer, connected, manual), target_duration_seconds (null if not applicable). Only recommend from this approved list: Strava, Apple Health, MyFitnessPal, Fitbit, Garmin, Oura, Whoop, Duolingo, Todoist, GitHub, RescueTime, Calm, Headspace, Nike Run Club. If no app fits, return null for app_name and set tracking_method to timer or manual.",
    messages: [
      {
        role: "user",
        content: `User's goal: "${raw}"`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  let recommendation: AppRecommendation;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    recommendation = JSON.parse(match ? match[0] : text.trim());
  } catch {
    recommendation = {
      app_name: null,
      app_reason: "Use the built-in timer to track your progress manually.",
      tracking_method: "timer",
      target_duration_seconds: null,
    };
  }

  return NextResponse.json(recommendation);
}
