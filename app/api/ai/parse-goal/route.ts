import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM_PROMPT = `You are Sworn's goal advisor. Parse this user goal and return JSON only with these fields:
- parsed_title (short clear version of their goal, max 10 words)
- activity_type (one word like 'running' or 'reading')
- recommended_app (best app from this list: Strava, Apple Health, Fitbit, Garmin, Oura Ring, Whoop, MyFitnessPal, Duolingo, Todoist, GitHub, RescueTime, Calm, Headspace — or null if nothing fits well)
- confidence ('high', 'medium', or 'low' — how confident you are in the app recommendation)
- tracking_method ('connected' if recommended_app exists with high confidence, 'timer' for meditation/bible/study/journal/yoga/stretching/prayer/reading, 'manual_count' for counting goals like pushups/pages/glasses/drinks/miles manually, 'manual' for simple daily yes/no habits, 'uncertain' if not sure)
- target_unit (for manual_count goals: 'pushups', 'pages', 'glasses', 'miles', 'reps', etc — or null)
- target_count (number — e.g. 100 for pushups, 30 for pages, 8 for glasses of water — or null)
- target_duration_seconds (for timer goals: seconds — e.g. 1800 for 30 minutes, 600 for 10 minutes — or null)
- frequency ('daily', 'weekly', or 'custom')
- period_target (number of times per period — e.g. 3 for '3 times a week', 1 for once daily — or null)

Return only valid JSON with no markdown, no explanation.`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { goal_text } = await req.json();
  if (!goal_text?.trim()) return NextResponse.json({ error: "goal_text required" }, { status: 400 });

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: goal_text.trim() }],
    });

    const raw = (msg.content[0] as any).text ?? "";
    const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error("AI parse error:", e);
    return NextResponse.json({ error: "Failed to parse goal." }, { status: 500 });
  }
}
