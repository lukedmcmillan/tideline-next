import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data, error } = await supabase
    .from("velocity_scores")
    .select("score, score_volume, score_recency, score_signals, story_count_30d, momentum_direction, interpretation, calculated_at")
    .eq("tracker_slug", slug)
    .order("calculated_at", { ascending: false })
    .limit(12);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "No velocity data" }, { status: 404 });
  }

  const latest = data[0];
  const history = data.map((d) => ({ score: d.score, score_volume: d.score_volume, score_recency: d.score_recency, score_signals: d.score_signals, calculated_at: d.calculated_at, interpretation: d.interpretation }));

  return NextResponse.json({ latest, history });
}
