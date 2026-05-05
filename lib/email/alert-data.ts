import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { INST_TYPE, PREP_HORIZON } from "@/app/lib/tracker-metadata";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Plain-English institutional type descriptions for the Haiku prompt.
 * Maps tracker-metadata.ts type codes to non-jargon characterisations.
 * Type 6 (voluntary standard-setting) is closest to "plurilateral with clear mandate".
 */
const PLAIN_INST_TYPE: Record<string, string> = {
  "Type 1": "unilateral decision-maker",
  "Type 1/2": "unilateral decision-maker",
  "Type 2": "plurilateral with clear mandate",
  "Type 3": "multilateral with known veto players",
  "Type 6": "plurilateral with clear mandate",
};

function plainInstType(shortSlug: string): string {
  const instData = INST_TYPE[shortSlug];
  if (!instData) return "multilateral";
  return PLAIN_INST_TYPE[instData.type] ?? "multilateral";
}

/**
 * fetchSparklineScores — last 12 weekly velocity_scores for a tracker.
 * Returns scores in ascending chronological order.
 */
export async function fetchSparklineScores(shortSlug: string): Promise<number[]> {
  const since = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("velocity_scores")
    .select("score, calculated_at")
    .eq("tracker_slug", shortSlug)
    .gte("calculated_at", since)
    .order("calculated_at", { ascending: true })
    .limit(12);
  if (error || !data) return [];
  return data.map((r) => Number(r.score));
}

export interface RecentStory {
  sourceName: string;
  headline: string;
  summary: string;
  publishedAt: string;
}

/**
 * fetchRecentStory — most significant story for this tracker in last 14 days.
 * Uses topic (long slug) column on stories table.
 * Returns null if no story found; caller must omit the story block entirely.
 */
export async function fetchRecentStory(longSlug: string): Promise<RecentStory | null> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("stories")
    .select("title, source_name, short_summary, full_summary, published_at")
    .eq("topic", longSlug)
    .gte("published_at", since)
    .order("significance_score", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const row = data[0];
  const summary = (
    (row.short_summary as string) ||
    (row.full_summary as string) ||
    ""
  ).trim();
  if (!summary) return null;

  return {
    sourceName: (row.source_name as string).toUpperCase(),
    headline: row.title as string,
    summary,
    publishedAt: new Date(row.published_at as string).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

/**
 * getOrCreateInterpretation — Haiku-generated crossing paragraph with caching.
 *
 * Cache key: (tracker_slug, velocity_calculated_at) — the velocity_scores row
 * that triggered the crossing. One crossing event = one interpretation, period.
 * No time windows. No reuse across different crossings with the same band pair.
 *
 * Cache read: queries alert_sends for any row matching (tracker_slug,
 * velocity_calculated_at) that already has interpretation set. Returns it
 * immediately on hit (covers multi-user fan-out: user 2 reuses user 1's result).
 *
 * Cache miss: calls claude-haiku-4-5-20251001, returns the result.
 * The CALLER must pass both interpretation and velocityCalculatedAt to the
 * alert_sends INSERT so subsequent sends for the same event get cache hits.
 *
 * Requires: alert_sends.velocity_calculated_at column
 * (migration: 20260505_alert_sends_velocity_key.sql)
 */
export async function getOrCreateInterpretation(
  longSlug: string,
  bandFrom: string,
  bandTo: string,
  shortSlug: string,
  trackerName: string,
  velocityCalculatedAt: string, // ISO string from velocity_scores.calculated_at
): Promise<string> {
  // ── Cache read: keyed on the specific crossing event ──
  const { data: cached } = await supabase
    .from("alert_sends")
    .select("interpretation")
    .eq("tracker_slug", longSlug)
    .eq("velocity_calculated_at", velocityCalculatedAt)
    .not("interpretation", "is", null)
    .limit(1);

  if (cached && cached.length > 0 && cached[0].interpretation) {
    return cached[0].interpretation as string;
  }

  // ── Cache miss: call Haiku ──
  const instType = plainInstType(shortSlug);
  const prepHorizon = PREP_HORIZON[shortSlug] ?? "timing uncertain";

  const prompt =
    `A Pulse Score for ${trackerName} just moved from ${bandFrom} to ${bandTo}. ` +
    `This domain's governing body is a ${instType}, with a typical preparation ` +
    `horizon of ${prepHorizon} between elevated signals and decision events. ` +
    `Write one paragraph (max 60 words) explaining what this band crossing means ` +
    `for an ocean compliance, ESG, or legal professional tracking this domain. ` +
    `Plain prose, no em dashes, no jargon, no hedging.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  return text || `${trackerName} activity has crossed into ${bandTo} territory.`;
}
