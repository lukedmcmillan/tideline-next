import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TRACKER_SLUGS = ["bbnj", "iuu", "isa", "30x30", "blue-finance", "plastics"];

export async function GET() {
  // Signal of the day
  let signal = null;
  try {
    const { data } = await supabase
      .from("daily_signals")
      .select("signal_text, meaning_text, meeting_note, authored_by, signal_date")
      .eq("signal_date", new Date().toISOString().split("T")[0])
      .limit(1)
      .maybeSingle();
    signal = data;
  } catch {}

  // Velocity scores — latest per tracker
  let velocityScores: { tracker_slug: string; score: number; momentum_direction: string }[] = [];
  try {
    const results = await Promise.all(
      TRACKER_SLUGS.map(async (slug) => {
        const { data } = await supabase
          .from("velocity_scores")
          .select("score, momentum_direction")
          .eq("tracker_slug", slug)
          .order("calculated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return { tracker_slug: slug, score: data?.score ?? 0, momentum_direction: data?.momentum_direction ?? "stable" };
      })
    );
    velocityScores = results;
  } catch {}

  return NextResponse.json({ signal, velocityScores });
}
