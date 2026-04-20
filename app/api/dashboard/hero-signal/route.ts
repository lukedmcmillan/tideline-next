import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DOMAIN_NAMES } from "@/app/lib/tracker-metadata";
import { eventsWithinDays } from "@/app/lib/events";
import type { HeroSignalData } from "@/app/lib/types/dashboard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SLUGS = Object.keys(DOMAIN_NAMES);

function bandFor(score: number): string {
  if (score < 4) return "LOW";
  if (score < 7) return "WATCH";
  if (score <= 8.5) return "ELEVATED";
  return "HIGH";
}

export async function GET() {
  // ─── Priority 1: Governance event within 14 days ───────────
  const upcoming = eventsWithinDays(14);
  if (upcoming.length > 0) {
    const e = upcoming[0];
    const result: HeroSignalData = {
      type: "governance_event",
      governance_event: {
        title: e.title,
        body_name: e.body_name,
        date: e.date,
        days_until: e.days_until,
        significance: e.significance,
        description: e.description,
      },
    };
    return NextResponse.json(result);
  }

  // ─── Priority 2: Band crossing in last 24h ────────────────
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    for (const slug of SLUGS) {
      const { data: rows } = await supabase
        .from("velocity_scores")
        .select("score, momentum_direction, interpretation, calculated_at")
        .eq("tracker_slug", slug)
        .order("calculated_at", { ascending: false })
        .limit(2);
      if (!rows || rows.length < 2) continue;
      const [current, previous] = rows;
      if (new Date(current.calculated_at) < new Date(oneDayAgo)) continue;
      const bandNow = bandFor(current.score);
      const bandPrev = bandFor(previous.score);
      if (bandNow === bandPrev) continue;

      const result: HeroSignalData = {
        type: "band_crossing",
        band_crossing: {
          slug,
          name: DOMAIN_NAMES[slug] ?? slug,
          score: current.score,
          band_from: bandPrev,
          band_to: bandNow,
          direction: current.momentum_direction ?? "stable",
          interpretation: current.interpretation ?? "",
        },
      };
      return NextResponse.json(result);
    }
  } catch {}

  // ─── Priority 3: Highest-velocity tracker (always has data) ─
  let best: { slug: string; score: number; direction: string; history: number[] } | null = null;
  for (const slug of SLUGS) {
    try {
      const { data: rows } = await supabase
        .from("velocity_scores")
        .select("score, momentum_direction")
        .eq("tracker_slug", slug)
        .order("calculated_at", { ascending: false })
        .limit(10);
      if (!rows || rows.length === 0) continue;
      const score = rows[0].score;
      if (!best || score > best.score) {
        best = {
          slug,
          score,
          direction: rows[0].momentum_direction ?? "stable",
          history: rows.map(r => r.score).reverse(),
        };
      }
    } catch {}
  }

  if (best) {
    const result: HeroSignalData = {
      type: "top_velocity",
      top_velocity: {
        slug: best.slug,
        name: DOMAIN_NAMES[best.slug] ?? best.slug,
        score: best.score,
        direction: best.direction,
        history: best.history,
      },
    };
    return NextResponse.json(result);
  }

  // Should never reach here — top_velocity always finds something
  return NextResponse.json({ type: "top_velocity", top_velocity: { slug: "", name: "Tideline", score: 0, direction: "stable", history: [] } } satisfies HeroSignalData);
}
