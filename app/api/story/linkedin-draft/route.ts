import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { getEmailFromSession } from "@/app/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const email = await getEmailFromSession(req);
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { story_id } = await req.json();
  if (!story_id) return NextResponse.json({ error: "story_id required" }, { status: 400 });

  const { data: story } = await supabase
    .from("stories")
    .select("title, short_summary, source_name, published_at")
    .eq("id", story_id)
    .single();

  if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const seed = Math.floor(Math.random() * 1000);

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Write a 150-word professional LinkedIn post about this ocean governance development. Requirements:
- Opens with a specific fact or development, not 'I'
- Professional tone for ocean sector audience
- Specific and grounded in the story only
- One clear insight or implication
- Ends with a question to drive comments
- NO hashtags. NO emojis. NO 'Excited to share'

Source: ${story.title}. ${story.short_summary || ""}

Today's date is ${today}. The person posting is a professional in the ocean sector. Write a post that feels personally authored, not templated. Vary the opening structure — do not start with the story headline. Choose a different angle, implication, or question each time this is called.

Variation seed: ${seed} — use this to ensure your response is uniquely structured each time.`,
      },
    ],
  });

  const post_text =
    msg.content[0].type === "text" ? msg.content[0].text : "";

  return NextResponse.json({ post_text });
}
