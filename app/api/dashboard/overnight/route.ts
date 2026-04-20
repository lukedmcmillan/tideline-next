import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DOMAIN_NAMES } from "@/app/lib/tracker-metadata";
import type { OvernightData } from "@/app/lib/types/dashboard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SLUGS = Object.keys(DOMAIN_NAMES);

export async function GET() {
  const now = new Date();
  // "Overnight" = since 6pm yesterday (or midnight, whichever gives a reasonable window)
  const sixPmYesterday = new Date(now);
  sixPmYesterday.setDate(sixPmYesterday.getDate() - 1);
  sixPmYesterday.setHours(18, 0, 0, 0);
  const since = sixPmYesterday.toISOString();
  const hours = Math.round((now.getTime() - sixPmYesterday.getTime()) / 3600000);

  // Doc count + source count from stories ingested overnight
  const { data: overnightStories } = await supabase
    .from("stories")
    .select("source_name")
    .gte("published_at", since);

  const docCount = overnightStories?.length ?? 0;
  const sourceNames = new Set((overnightStories || []).map(s => s.source_name));
  const sourceCount = sourceNames.size;

  // Top mover: biggest abs(delta) in velocity_scores
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let topMoverLine = "No significant score movements";
  let bestDelta = 0;
  for (const slug of SLUGS) {
    const { data: latest } = await supabase
      .from("velocity_scores")
      .select("score, momentum_direction")
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

    if (!latest || !prior) continue;
    const delta = Math.round((latest.score - prior.score) * 10) / 10;
    if (Math.abs(delta) > Math.abs(bestDelta)) {
      bestDelta = delta;
      const dir = latest.momentum_direction === "accelerating" ? "accelerating"
        : latest.momentum_direction === "decelerating" ? "decelerating" : "stable";
      topMoverLine = `${DOMAIN_NAMES[slug]} moved ${prior.score.toFixed(1)} \u2192 ${latest.score.toFixed(1)} (${dir})`;
    }
  }

  // Nearest governance event
  const { data: nextEvent } = await supabase
    .from("governance_events")
    .select("title, starts_at")
    .gte("starts_at", now.toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let countdownLine = "No upcoming governance events on the calendar";
  if (nextEvent) {
    const daysUntil = Math.ceil((new Date(nextEvent.starts_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    countdownLine = `${nextEvent.title} is now ${daysUntil} days away`;
  }

  // Readiness pct: proxy based on doc coverage. Real calculation needs Sprint 2 schema.
  const readinessPct = Math.min(90, Math.max(40, Math.round((docCount / Math.max(50, 1)) * 100)));

  const data: OvernightData = {
    hours,
    doc_count: docCount,
    source_count: sourceCount,
    top_mover_line: topMoverLine,
    countdown_line: countdownLine,
    readiness_pct: readinessPct,
  };

  return NextResponse.json(data);
}
