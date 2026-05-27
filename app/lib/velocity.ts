import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Maps each tracker slug to its cross_tracker_flags value (underscore form).
// Source of truth: PULSE_SCORE_METHODOLOGY.md §4 Domain Thresholds.
// cross_tracker_flags is the AI-assigned, classifier-verified tracker column — use this,
// NOT stories.topic (coarse RSS source tag, contaminated for several trackers).
// Architecture note: velocity was previously queried via stories.topic. Switched to
// cross_tracker_flags on 2026-05-11 after discovering topic='bluefinance' returns ESG/energy
// stories unrelated to ocean blue finance, and topic='shipping' includes 94+ geopolitical
// stories (Hormuz, naval) not within IMO regulatory scope.
const TRACKER_FLAG: Record<string, string> = {
  isa:                     "isa",
  bbnj:                    "bbnj",
  iuu:                     "iuu",
  "30x30":                 "30x30",
  "blue-finance":          "blue_finance",
  plastics:                "plastics",
  "imo-shipping":          "imo_shipping",
  "offshore-wind":         "offshore_wind",
  "cites-marine":          "cites_marine",
  "wto-fisheries":         "wto_fisheries",
  "blue-carbon-credits":   "blue_carbon_credits",
};

const INSTITUTIONAL_MULTIPLIER: Record<string, number> = {
  "imo-shipping":          0.75,
  "wto-fisheries":         0.75,
  isa:                     0.75,
  bbnj:                    0.46,
  plastics:                0.46,
  "30x30":                 0.85,
  iuu:                     0.85,
  "blue-finance":          0.80,
  "offshore-wind":         0.85,
  "cites-marine":          0.75,
  "blue-carbon-credits":   0.80,  // Type 6 Voluntary standard-setting (Verra, Plan Vivo, Gold Standard, ICVCM)
};

const DECISION_PATTERN =
  /ratif|adopt|enforc|sanction|decision|resolution|agreement|signed|implement|deadline|entry into force|enters into force|in force|final text|mandate|conclude|binding|approved|adopted|enacted|compliance|effective/i;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function deduplicateByTitle<T extends { title: string }>(stories: T[]): T[] {
  const seen = new Set<string>();
  return stories.filter(s => {
    const key = s.title?.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function calculateVelocityScore(trackerSlug: string, asOf?: Date) {
  const flag = TRACKER_FLAG[trackerSlug];
  if (!flag) throw new Error(`Unknown tracker slug: ${trackerSlug}`);

  const now = asOf ?? new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  // Current 30d stories — filtered by AI-assigned tracker flag, not coarse topic tag
  const { data: currentRaw } = await supabase
    .from("stories")
    .select("id, title, published_at, short_summary")
    .contains("cross_tracker_flags", [flag])
    .gte("published_at", d30)
    .order("published_at", { ascending: false });

  // Previous 30d stories (30-60 days ago)
  const { data: prevRaw } = await supabase
    .from("stories")
    .select("id, title")
    .contains("cross_tracker_flags", [flag])
    .gte("published_at", d60)
    .lt("published_at", d30);

  const currentStories = deduplicateByTitle(currentRaw || []);
  const prevAll = deduplicateByTitle(prevRaw || []);
  const currentCount = currentStories.length;
  const prevCount = prevAll.length;

  // Component A: Story Volume Trend (40%)
  const growth = (currentCount - prevCount) / Math.max(prevCount, 1);
  const scoreA = clamp(5 + growth * 5, 0, 10);

  // Component B: Recency (35%)
  let scoreB = 2;
  if (currentStories.length > 0) {
    const latest = new Date(currentStories[0].published_at);
    const daysSince = (now.getTime() - latest.getTime()) / (24 * 60 * 60 * 1000);
    scoreB = Math.max(2, parseFloat((10 * Math.exp(-0.05 * daysSince)).toFixed(1)));
  }

  // Component C: Decision Signals (25%) — scan title AND short_summary
  const matchedDecisions = currentStories.filter(
    (s) => DECISION_PATTERN.test(s.title) || DECISION_PATTERN.test(s.short_summary || "")
  );

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

  // Final score (base + institutional multiplier)
  const baseScore = Math.round((scoreA * 0.4 + scoreB * 0.35 + scoreC * 0.25) * 10) / 10;
  const multiplier = INSTITUTIONAL_MULTIPLIER[trackerSlug] ?? 0.75;
  const score = Math.round(baseScore * multiplier * 10) / 10;

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
    score_volume: Math.round(scoreA * multiplier * 10) / 10,
    score_recency: Math.round(scoreB * multiplier * 10) / 10,
    score_signals: Math.round(scoreC * multiplier * 10) / 10,
    story_count_30d: currentCount,
    momentum_direction: momentumDirection,
    interpretation,
    ...(asOf ? { calculated_at: asOf.toISOString() } : {}),
  });

  if (error) console.error(`velocity_scores insert error for ${trackerSlug}:`, error.message);

  return {
    trackerSlug, score,
    scoreA: Math.round(scoreA * multiplier * 10) / 10,
    scoreB: Math.round(scoreB * multiplier * 10) / 10,
    scoreC: Math.round(scoreC * multiplier * 10) / 10,
    currentCount, momentumDirection, interpretation,
  };
}

// ── Shared week-deduplication helper ─────────────────────────────────────────
// Takes an array of rows that have a `calculated_at` ISO string, deduplicates
// to one row per ISO week (most recent within each week wins), and returns up
// to `limit` rows newest-first.
export function weeklyDedupe<T extends { calculated_at: string }>(rows: T[], limit = 10): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const row of rows) {
    const dt = new Date(row.calculated_at);
    const jan4 = new Date(dt.getFullYear(), 0, 4);
    const weekNum = Math.ceil(((dt.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);
    const key = `${dt.getFullYear()}-W${weekNum}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(row);
    }
    if (deduped.length >= limit) break;
  }
  return deduped;
}
