import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // Breaking ticker: most recent critical/important governance event or treaty alert
  const { data: breakingStory } = await supabase
    .from("stories")
    .select("title, published_at, alert_type")
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  // BBNJ ratification counts
  const { data: bbnjRows } = await supabase
    .from("treaty_ratifications")
    .select("country_name, status")
    .eq("treaty_name", "BBNJ Agreement")
    .order("recorded_at", { ascending: false });

  // Deduplicate: latest status per country
  const bbnjSeen = new Set<string>();
  let bbnjRatified = 0;
  let bbnjTotal = 0;
  for (const row of bbnjRows || []) {
    if (!bbnjSeen.has(row.country_name)) {
      bbnjSeen.add(row.country_name);
      bbnjTotal++;
      if (row.status === "ratified") bbnjRatified++;
    }
  }

  // Governance events: upcoming count
  const { count: upcomingEvents } = await supabase
    .from("governance_events")
    .select("id", { count: "exact", head: true })
    .gte("starts_at", new Date().toISOString());

  // Stories count today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: storiesToday } = await supabase
    .from("stories")
    .select("id", { count: "exact", head: true })
    .gte("published_at", todayStart.toISOString());

  // Time since breaking story
  let breakingAge = "just now";
  if (breakingStory?.published_at) {
    const mins = Math.floor((Date.now() - new Date(breakingStory.published_at).getTime()) / 60000);
    if (mins < 60) breakingAge = `${mins}m ago`;
    else if (mins < 1440) breakingAge = `${Math.floor(mins / 60)}h ago`;
    else breakingAge = `${Math.floor(mins / 1440)}d ago`;
  }

  return NextResponse.json({
    ticker: {
      title: breakingStory?.title || "Monitoring 80+ institutional sources across 31 ocean topics",
      age: breakingAge,
    },
    trackers: {
      bbnj_ratified: bbnjRatified,
      bbnj_total: bbnjTotal,
      bbnj_progress: bbnjTotal > 0 ? Math.round((bbnjRatified / bbnjTotal) * 100) : 0,
      upcoming_events: upcomingEvents || 0,
      stories_today: storiesToday || 0,
    },
  });
}
