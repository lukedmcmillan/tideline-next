import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateVelocityScore } from "@/app/lib/velocity";

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TRACKER_SLUGS = ["isa", "bbnj", "iuu", "30x30", "blue-finance"];

function getLastNMondays(n: number): Date[] {
  const now = new Date();
  const day = now.getDay();
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - ((day + 6) % 7));
  lastMonday.setHours(6, 0, 0, 0);

  return Array.from({ length: n }, (_, i) => {
    const d = new Date(lastMonday);
    d.setDate(lastMonday.getDate() - i * 7);
    return d;
  });
}

export async function GET(_req: NextRequest) {
  const mondays = getLastNMondays(10);
  let inserted = 0;

  for (const monday of mondays) {
    for (const slug of TRACKER_SLUGS) {
      const weekStart = new Date(monday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(monday);
      weekEnd.setHours(23, 59, 59, 999);

      const { data: existing } = await supabase
        .from("velocity_scores")
        .select("id")
        .eq("tracker_slug", slug)
        .gte("calculated_at", weekStart.toISOString())
        .lte("calculated_at", weekEnd.toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      try {
        await calculateVelocityScore(slug, monday);
        inserted++;
      } catch (err) {
        console.error(`Backfill failed: ${slug} @ ${monday.toISOString()}`, err);
      }
    }
  }

  return NextResponse.json({ ok: true, inserted });
}
