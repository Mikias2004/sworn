export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const { data: goal, error } = await getSupabaseAdmin()
    .from("goals")
    .select("title")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (error || !goal) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 40,
    system:
      "Write one short motivational line under 10 words for someone actively doing their goal. Be specific to the activity. No generic phrases. No punctuation at the end. Return only the line.",
    messages: [
      { role: "user", content: `Goal: "${goal.title}"` },
    ],
  });

  const line =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  return NextResponse.json({ line });
}
