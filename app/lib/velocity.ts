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
  plastics: ["plastics", "pollution"],
  "imo-shipping": ["shipping", "imo", "mepc", "cii", "ghg", "fueleu"],
  "offshore-wind": ["offshore-wind", "wind", "msp", "boem", "seabed-leasing"],
  "cites-marine": ["cites", "sharks", "shark", "rays", "guitarfish"],
  "wto-fisheries": ["wto-fisheries", "fisheries-subsidies", "subsidies"],
};

const DECISION_PATTERN =
  /ratif|adopt|enforc|sanction|decision|resolution|agreement|signed|implement|deadline/i;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function calculateVelocityScore(trackerSlug: string, asOf?: Date) {
  const topics = TRACKER_TOPICS[trackerSlug];
  if (!topics) throw new Error(`Unknown tracker slug: ${trackerSlug}`);

  const now = asOf ?? new Date();
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
    scoreB = Math.max(2, parseFloat((10 * Math.exp(-0.05 * daysSince)).toFixed(1)));
  }

  // Component C: Decision Signals (25%)
  const { data: decisionStories } = await supabase
    .from("stories")
    .select("title")
    .in("topic", topics)
    .gte("published_at", d30);

  const matchedDecisions = decisionStories?.filter(
    (s) => DECISION_PATTERN.test(s.title)
  ) ?? [];

  const classifications = await Promise.all(
    matchedDecisions.map(async (s) => {
      try {
        const res = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 10,
          messages: [{
            role: "user",
            content: `Does this headline indicate a positive regulatory development (adopted, ratified, enforced, signed, agreed, implemented) or a negative one (failed, rejected, stalled, delayed, withdrawn, collapsed)? Reply with one word: positive or negative.\n\nHeadline: ${s.title}`,
          }],
        });
        const word = res.content[0].type === "text" ? res.content[0].text.trim().toLowerCase() : "";
        return word.startsWith("positive") ? "positive" : "negative";
      } catch {
        return "positive";
      }
    })
  );

  const signalTotal = classifications.reduce((sum, c) => sum + (c === "positive" ? 2 : -1), 0);
  const scoreC = clamp(signalTotal, 0, 10);

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
        content: `Tracker: ${trackerSlug}. Score: ${score}/10. Stories last 30 days: ${currentCount}. Previous 30 days: ${prevCount}. Decision signals: ${matchedDecisions.length}. Momentum: ${momentumDirection}. Write one sentence interpreting this velocity.`,
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
    score_volume: Math.round(scoreA * 10) / 10,
    score_recency: Math.round(scoreB * 10) / 10,
    score_signals: Math.round(scoreC * 10) / 10,
    story_count_30d: currentCount,
    momentum_direction: momentumDirection,
    interpretation,
    ...(asOf ? { calculated_at: asOf.toISOString() } : {}),
  });

  if (error) console.error(`velocity_scores insert error for ${trackerSlug}:`, error.message);

  return { trackerSlug, score, scoreA: Math.round(scoreA * 10) / 10, scoreB: Math.round(scoreB * 10) / 10, scoreC: Math.round(scoreC * 10) / 10, currentCount, momentumDirection, interpretation };
}
