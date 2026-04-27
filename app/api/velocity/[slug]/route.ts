import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { weeklyDedupe } from "@/app/lib/velocity";
import { VELOCITY_TRACKER_SLUGS } from "@/app/lib/trackers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!VELOCITY_TRACKER_SLUGS.has(slug)) {
    return NextResponse.json({ error: "Unknown tracker" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("velocity_scores")
    .select("score, score_volume, score_recency, score_signals, story_count_30d, momentum_direction, interpretation, calculated_at")
    .eq("tracker_slug", slug)
    .order("calculated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(`[Velocity] DB error for slug ${slug}:`, error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ latest: null, history: [], status: "no_scores_yet" });
  }

  const latest = data[0];

  // Deduplicate to one row per ISO week (keep most recent per week)
  const deduped = weeklyDedupe(data, 10);

  const history = deduped.map((d) => ({ score: d.score, score_volume: d.score_volume, score_recency: d.score_recency, score_signals: d.score_signals, calculated_at: d.calculated_at, interpretation: d.interpretation }));

  return NextResponse.json({ latest, history, status: "ok" });
}
