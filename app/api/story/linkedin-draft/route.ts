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

  const { story_id, angle } = await req.json();
  if (!story_id) return NextResponse.json({ error: "story_id required" }, { status: 400 });

  const { data: story } = await supabase
    .from("stories")
    .select("title, short_summary, source_name, published_at")
    .eq("id", story_id)
    .single();

  if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });

  // Fetch user sector
  const { data: user } = await supabase
    .from("users")
    .select("sector")
    .eq("email", email)
    .single();

  const sector = user?.sector || null;

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const seed = Math.floor(Math.random() * 1000);

  // Sector prompt injection
  const sectorPrompt = sector
    ? `\n\nThe person posting works in: ${sector}. Write the post from the perspective and language of someone in that field. Use the vocabulary, concerns, and framing that a ${sector} professional would naturally use. Do not mention the sector explicitly in the post.`
    : "";

  // Angle prompt injection
  const angleInstructions: Record<string, string> = {
    implications: `Focus on the professional implications and consequences for people working in ${sector || "the ocean sector"}. What does this mean for their day to day work or strategy?`,
    urgency: "Frame this around why the timing matters right now. What is happening in the broader context that makes this development particularly significant this week or month?",
    contrarian: "Find the angle most people are missing or not talking about. What is the underreported implication, the counterintuitive reading, or the question this story raises that nobody is asking yet?",
  };
  const anglePrompt = angle && angleInstructions[angle]
    ? `\n\nAngle instruction: ${angleInstructions[angle]}`
    : "";

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

Today's date is ${today}. The person posting is a professional in the ocean sector. Write a post that feels personally authored, not templated. Vary the opening structure — do not start with the story headline. Choose a different angle, implication, or question each time this is called.${sectorPrompt}${anglePrompt}

Variation seed: ${seed} — use this to ensure your response is uniquely structured each time.`,
      },
    ],
  });

  const post_text =
    msg.content[0].type === "text" ? msg.content[0].text : "";

  return NextResponse.json({ post_text });
}
