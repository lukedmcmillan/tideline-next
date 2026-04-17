import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ProofOfWorkData } from "@/app/lib/types/dashboard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const now = new Date();
  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);

  // Last ingestion: most recent scrape_runs entry
  const { data: lastRun } = await supabase
    .from("scrape_runs")
    .select("ran_at")
    .order("ran_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let lastIngestionMinutesAgo = 0;
  if (lastRun?.ran_at) {
    lastIngestionMinutesAgo = Math.max(0, Math.round((now.getTime() - new Date(lastRun.ran_at).getTime()) / 60000));
  }

  // Docs today: stories published since midnight
  const { data: todayStories } = await supabase
    .from("stories")
    .select("source_name")
    .gte("published_at", todayMidnight.toISOString());

  const docsToday = todayStories?.length ?? 0;
  const sourcesMonitored = new Set((todayStories || []).map(s => s.source_name)).size;

  // Active divergences
  const { data: activeDivs } = await supabase
    .from("divergences")
    .select("id")
    .is("dismissed_at", null);

  const activeDivergences = activeDivs?.length ?? 0;

  // Next scan: fetch-feeds runs at :00 every hour
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  const nextScanUtc = `${String(nextHour.getUTCHours()).padStart(2, "0")}:${String(nextHour.getUTCMinutes()).padStart(2, "0")}`;

  const data: ProofOfWorkData = {
    last_ingestion_minutes_ago: lastIngestionMinutesAgo,
    docs_today: docsToday,
    sources_monitored: Math.max(sourcesMonitored, 89), // floor at 89 (RSS source count)
    active_divergences: activeDivergences,
    next_scan_utc: nextScanUtc,
  };

  return NextResponse.json(data);
}
