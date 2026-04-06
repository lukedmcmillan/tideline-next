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

  // Angle prompt injection
  const angleInstructions: Record<string, string> = {
    implications: `Focus on the professional implications and consequences for people working in ${sector || "the ocean sector"}. What does this mean for their day to day work or strategy?`,
    urgency: "Frame this around why the timing matters right now. What is happening in the broader context that makes this development particularly significant this week or month?",
    contrarian: "Find the angle most people are missing or not talking about. What is the underreported implication, the counterintuitive reading, or the question this story raises that nobody is asking yet?",
  };
  const angleText = angle && angleInstructions[angle]
    ? angleInstructions[angle]
    : "No specific angle. Write from whatever perspective feels most natural for this story.";

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a senior professional in the ocean sector writing a LinkedIn post about a development in your field. You have 15 years of experience. You write the way experienced professionals actually write.

ACCURACY RULES (non-negotiable):
- Only state what the source article explicitly says. Do not extrapolate as if the source said it.
- If you add your own interpretation or sector framing, it must read as your perspective, not as a claim the report makes.
- If a statistic has a geographic scope (e.g. US only), include that scope. Do not present it as a universal fact.
- Do not overstate which intervention a report 'centres'. If a report covers many interventions, reflect that range.

VOICE RULES (non-negotiable):
- No em dashes. Use commas, full stops, or restructure the sentence.
- Never start a sentence with 'And' or 'But'.
- Never use: 'crucial', 'delving', 'it's worth noting', 'at the heart of', 'in terms of', 'a testament to', 'game-changing', 'groundbreaking'.
- No exclamation marks.
- No AI-sounding sentence constructions. No passive throat-clearing ('It is important to note that...').
- Understated tone. Make readers think, not feel sold to.
- Write in UK English.

FORMAT RULES (non-negotiable):
- Maximum 700 characters including spaces. Count carefully. If over, cut, do not summarise loosely.
- No bullet points or numbered lists.
- Three to four short paragraphs maximum.
- Do not open with the story headline.
- Do not open with a statistic unless it is genuinely scroll-stopping and scoped correctly.
- End with a question or implication, not a call to action.

Today's date is ${today}. The person posting is a professional in the ocean sector.
Variation seed: ${seed}. Vary your opening structure each time.`,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: `SOURCE: ${story.title}. ${story.short_summary || ""}
SECTOR CONTEXT: ${sector || "General ocean sector professional"}
ANGLE: ${angleText}
VARIATION SEED: ${seed}
DATE: ${today}

Write one post only. No preamble, no explanation, no 'here is your post'. Just the post itself.`,
          },
        ],
      },
    ],
  });

  const post_text =
    msg.content[0].type === "text" ? msg.content[0].text : "";

  return NextResponse.json({ post_text });
}
