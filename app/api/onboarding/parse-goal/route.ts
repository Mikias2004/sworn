import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type ParsedGoal = {
  confirmation: string;       // What Claude says back to the user
  title: string;              // Clean short title e.g. "Gym 4x per week"
  goalType: "fitness" | "productivity" | "learning" | "health" | "other";
  suggestedFrequency: "daily" | "3x_week" | "4x_week" | "custom";
  suggestedApp: string | null; // e.g. "Apple Health", "Duolingo", null
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
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are Sworn, a commitment contract app. A user just typed their goal. Parse it and respond with a JSON object only — no markdown, no explanation, just raw JSON.

User's goal: "${raw}"

Return exactly this shape:
{
  "confirmation": "A single conversational sentence (max 25 words) confirming what you understood, mentioning the tracking app if relevant. Friendly, direct. E.g. 'Got it — gym 4x per week. I can track this through Apple Health automatically. Does that sound right?'",
  "title": "Short clean title, max 6 words. E.g. 'Gym 4x per week'",
  "goalType": "One of: fitness, productivity, learning, health, other",
  "suggestedFrequency": "One of: daily, 3x_week, 4x_week, custom",
  "suggestedApp": "Most relevant app name from this list or null: Apple Health, Strava, Fitbit, Garmin, Runkeeper, Oura Ring, Duolingo, Notion, Todoist, GitHub, RescueTime"
}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: ParsedGoal;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    // Fallback if Claude adds any wrapping
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "Failed to parse goal." }, { status: 500 });
    }
    parsed = JSON.parse(match[0]);
  }

  return NextResponse.json(parsed);
}
