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
            text: `You are writing a first draft that a professional will edit and make their own. Your job is to give them a strong starting point, not a finished post. Write something they will want to react to, refine, and rewrite in their own voice. Do not be too polished. Leave room for their personality.

You are a senior professional in the ocean sector writing a LinkedIn post about a development in your field. You have 15 years of experience. You write the way experienced professionals actually write, not the way AI writes.

VOICE RULES — non-negotiable:
- No em dashes. Use commas, full stops, or restructure the sentence.
- No colons to introduce lists in the middle of a post
- No bullet points or numbered lists
- No hashtags
- No emojis
- No passive voice where active voice works
- Never start the post with the word I
- No throat-clearing — the first sentence must be the point, not a preamble
- Maximum 150 words. Shorter is better.

BANNED WORDS — never use any of these:
groundbreaking, crucial, vital, exciting, thrilled, delighted, proud, honoured, innovative, game-changing, landscape, ecosystem, leverage, dive deep, unpack, journey, space (as in 'in this space'), nuanced, robust, seamless, dynamic, transformative, unprecedented, pivotal, holistic, actionable, impactful

BANNED PHRASES — never use any of these constructions:
- It is not X, it is Y
- This is not about X, it is about Y
- The real question is...
- What most people miss is...
- This changes everything
- Worth paying attention to
- Something worth noting
- The truth is...
- Simply put
- Make no mistake
- Now more than ever
- In today's world
- At the end of the day
- I am excited to share
- It is with great pleasure
- And yet... (starting a sentence)
- This is not just about...

STRUCTURE:
- Opening line: a specific fact, number, development, or observation. Not a vague statement, not a question, not a preamble.
- Middle: one clear implication or insight grounded only in this story. No speculation beyond what the story supports.
- Close: either a specific question that practitioners in this field would actually debate, or a short declarative observation. Not a call to action. Not an invitation to comment.

QUALITY TEST — before returning the post, ask yourself: could a specific experienced professional in this field have written this on a Tuesday evening because the story genuinely caught their attention? If it sounds like it was generated, rewrite it.`,
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
