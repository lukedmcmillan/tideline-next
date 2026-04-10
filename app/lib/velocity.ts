import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const TRACKER_TOPICS: Record<string, string[]> = {
  isa: ["dsm"],
  bbnj: ["bbnj", "high-seas"],
  iuu: ["iuu"],
  "30x30": ["mpa", "30x30"],
  "blue-finance": ["blue-finance", "esg"],
};

const DECISION_PATTERN =
  /ratif|adopt|enforc|sanction|decision|resolution|agreement|signed|implement|deadline/i;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function calculateVelocityScore(trackerSlug: string) {
  const topics = TRACKER_TOPICS[trackerSlug];
  if (!topics) throw new Error(`Unknown tracker slug: ${trackerSlug}`);

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  // Current 30d stories
  const { data: currentStories } = await supabase
    .from("stories")
    .select("id, title, published_at")
    .in("topic", topics)
    .gte("published_at", d30)
    .order("published_at", { ascending: false });

  const currentCount = currentStories?.length ?? 0;

  // Previous 30d stories (30-60 days ago)
  const { data: prevStories } = await supabase
    .from("stories")
    .select("id")
    .in("topic", topics)
    .gte("published_at", d60)
    .lt("published_at", d30);

  const prevCount = prevStories?.length ?? 0;

  // Component A: Story Volume Trend (40%)
  const growth = (currentCount - prevCount) / Math.max(prevCount, 1);
  const scoreA = clamp(5 + growth * 5, 0, 10);

  // Component B: Recency (35%)
  let scoreB = 2;
  if (currentStories && currentStories.length > 0) {
    const latest = new Date(currentStories[0].published_at);
    const daysSince = (now.getTime() - latest.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSince <= 2) scoreB = 10;
    else if (daysSince <= 7) scoreB = 8;
    else if (daysSince <= 14) scoreB = 6;
    else if (daysSince <= 30) scoreB = 4;
    else scoreB = 2;
  }

  // Component C: Decision Signals (25%)
  const { data: decisionStories } = await supabase
    .from("stories")
    .select("title")
    .in("topic", topics)
    .gte("published_at", d30);

  const decisionCount = decisionStories?.filter(
    (s) => DECISION_PATTERN.test(s.title)
  ).length ?? 0;
  const scoreC = Math.min(decisionCount * 2, 10);

  // Final score
  const score = Math.round((scoreA * 0.4 + scoreB * 0.35 + scoreC * 0.25) * 10) / 10;

  // Momentum
  let momentumDirection: "accelerating" | "stable" | "decelerating" = "stable";
  if (growth > 0.2) momentumDirection = "accelerating";
  else if (growth < -0.2) momentumDirection = "decelerating";

  // Haiku interpretation
  let interpretation = "";
  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      system: "You write one-sentence regulatory velocity interpretations for ocean governance trackers. Maximum 20 words. No preamble. Just the sentence.",
      messages: [{
        role: "user",
        content: `Tracker: ${trackerSlug}. Score: ${score}/10. Stories last 30 days: ${currentCount}. Previous 30 days: ${prevCount}. Decision signals: ${decisionCount}. Momentum: ${momentumDirection}. Write one sentence interpreting this velocity.`,
      }],
    });
    const text = res.content[0];
    if (text.type === "text") interpretation = text.text.trim();
  } catch {
    interpretation = `${currentCount} developments tracked in the last 30 days.`;
  }

  // Insert
  const { error } = await supabase.from("velocity_scores").insert({
    tracker_slug: trackerSlug,
    score,
    story_count_30d: currentCount,
    momentum_direction: momentumDirection,
    interpretation,
  });

  if (error) console.error(`velocity_scores insert error for ${trackerSlug}:`, error.message);

  return { trackerSlug, score, currentCount, momentumDirection, interpretation };
}
