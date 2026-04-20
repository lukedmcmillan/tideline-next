// NOTE: endpoint is live but currently has no consumers.
// TickerStrip was disabled on dashboard pending content
// direction. Safe to call, safe to ignore.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DOMAIN_NAMES } from "@/app/lib/tracker-metadata";
import { eventsWithinDays } from "@/app/lib/events";
import type { MixedTickerItem } from "@/app/lib/types/dashboard";

export const revalidate = 120;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SLUGS = Object.keys(DOMAIN_NAMES);
const MAX_TOTAL = 20;
const MAX_HEADLINES_PER_SOURCE = 2;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diff / 3600);
  return `${hrs}h ago`;
}

// ── 1. Headlines (stories, last 4h, max 5, max 2 per source) ─────────
async function fetchHeadlines(): Promise<MixedTickerItem[]> {
  const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("stories")
    .select("title, source_name, published_at")
    .gte("published_at", since)
    .eq("status", "live")
    .order("published_at", { ascending: false })
    .limit(30); // fetch extras for dedup

  if (!data || data.length === 0) return [];

  const perSource: Record<string, number> = {};
  const items: MixedTickerItem[] = [];
  for (const row of data) {
    const src = row.source_name || "Unknown";
    perSource[src] = (perSource[src] || 0) + 1;
    if (perSource[src] > MAX_HEADLINES_PER_SOURCE) continue;
    items.push({
      type: "headline",
      title: row.title,
      source_name: src,
      time_ago: timeAgo(row.published_at),
    });
    if (items.length >= 5) break;
  }
  return items;
}

// ── 2. Score deltas (|delta| >= 0.2, sorted by abs(delta) desc) ──────
async function fetchScoreDeltas(): Promise<MixedTickerItem[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const items: MixedTickerItem[] = [];

  for (const slug of SLUGS) {
    const { data: latest } = await supabase
      .from("velocity_scores")
      .select("score")
      .eq("tracker_slug", slug)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: prior } = await supabase
      .from("velocity_scores")
      .select("score")
      .eq("tracker_slug", slug)
      .lte("calculated_at", sevenDaysAgo)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest) continue;
    const score = latest.score;
    const priorScore = prior?.score ?? score;
    const delta = Math.round((score - priorScore) * 10) / 10;
    if (Math.abs(delta) < 0.2) continue;

    items.push({
      type: "score_delta",
      name: DOMAIN_NAMES[slug] ?? slug,
      score,
      delta,
    });
  }

  // Sort by abs(delta) descending: biggest movers first
  items.sort((a, b) => {
    const ad = a.type === "score_delta" ? Math.abs(a.delta) : 0;
    const bd = b.type === "score_delta" ? Math.abs(b.delta) : 0;
    return bd - ad;
  });

  return items.slice(0, 10);
}

// ── 3. Countdowns (events within 90 days, max 5) ─────────────────────
function fetchCountdowns(): MixedTickerItem[] {
  return eventsWithinDays(90)
    .slice(0, 5)
    .map(e => ({
      type: "countdown" as const,
      event_name: e.title,
      days: e.days_until,
    }));
}

// ── 4. Doc ingestion (stories last 24h, grouped by source, top 3) ────
async function fetchDocIngestion(): Promise<MixedTickerItem[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("stories")
    .select("source_name, published_at")
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(500);

  if (!data || data.length === 0) return [];

  const groups: Record<string, { count: number; latest: string }> = {};
  for (const row of data) {
    const src = row.source_name || "Unknown";
    if (!groups[src]) {
      groups[src] = { count: 0, latest: row.published_at };
    }
    groups[src].count++;
    if (row.published_at > groups[src].latest) {
      groups[src].latest = row.published_at;
    }
  }

  return Object.entries(groups)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([src, g]) => ({
      type: "doc_ingestion" as const,
      count: g.count,
      source: src,
      time_ago: timeAgo(g.latest),
    }));
}

// ── Fallback: all tracker scores (guaranteed non-empty) ──────────────
async function fetchFallbackScores(): Promise<MixedTickerItem[]> {
  const items: MixedTickerItem[] = [];
  for (const slug of SLUGS) {
    const { data } = await supabase
      .from("velocity_scores")
      .select("score")
      .eq("tracker_slug", slug)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    items.push({
      type: "score_delta",
      name: DOMAIN_NAMES[slug] ?? slug,
      score: data?.score ?? 0,
      delta: 0,
    });
  }
  return items;
}

// ── Interleave via round-robin ───────────────────────────────────────
function interleave(buckets: MixedTickerItem[][]): MixedTickerItem[] {
  const result: MixedTickerItem[] = [];
  let round = 0;
  while (result.length < MAX_TOTAL) {
    let added = false;
    for (const bucket of buckets) {
      if (round < bucket.length) {
        result.push(bucket[round]);
        added = true;
        if (result.length >= MAX_TOTAL) break;
      }
    }
    if (!added) break;
    round++;
  }
  return result;
}

export async function GET() {
  try {
    const [headlines, scoreDeltas, docIngestion] = await Promise.all([
      fetchHeadlines(),
      fetchScoreDeltas(),
      fetchDocIngestion(),
    ]);
    const countdowns = fetchCountdowns();

    const buckets = [headlines, scoreDeltas, countdowns, docIngestion];
    let result = interleave(buckets);

    // Fallback: if completely empty, show all tracker scores
    if (result.length === 0) {
      result = await fetchFallbackScores();
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("[dashboard/ticker] error:", e);
    // Fallback on error
    const fallback = await fetchFallbackScores().catch(() => []);
    return NextResponse.json(fallback);
  }
}
