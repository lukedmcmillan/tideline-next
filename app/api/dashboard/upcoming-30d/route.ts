import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Upcoming30dData, CalendarCell, CalendarEvent } from "@/app/lib/types/dashboard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Fetch governance events in the next 30 days
  const { data: govEvents } = await supabase
    .from("governance_events")
    .select("title, starts_at, significance, governance_bodies(name, abbreviation)")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", thirtyDaysOut.toISOString())
    .order("starts_at", { ascending: true });

  // Build a lookup: date string → event info
  const eventsByDate: Record<string, { significance: string; title: string }> = {};
  for (const e of govEvents || []) {
    const d = new Date(e.starts_at).toISOString().split("T")[0];
    // Keep highest significance if multiple events on same day
    if (!eventsByDate[d] || e.significance === "critical") {
      eventsByDate[d] = { significance: e.significance, title: e.title };
    }
  }

  // Fetch average daily story count by weekday over last 60 days for intensity baseline
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentStories } = await supabase
    .from("stories")
    .select("published_at")
    .gte("published_at", sixtyDaysAgo)
    .limit(2000);

  // Count stories per weekday (0=Sun, 6=Sat)
  const weekdayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
  const weekdayDays: number[] = [0, 0, 0, 0, 0, 0, 0];
  if (recentStories) {
    const daySet: Record<string, number> = {};
    for (const s of recentStories) {
      const d = new Date(s.published_at);
      const key = d.toISOString().split("T")[0];
      const dow = d.getDay();
      weekdayCounts[dow]++;
      daySet[key] = dow;
    }
    // Count unique days per weekday
    for (const dow of Object.values(daySet)) {
      weekdayDays[dow]++;
    }
  }
  const weekdayAvg = weekdayCounts.map((c, i) => weekdayDays[i] > 0 ? c / weekdayDays[i] : 0);
  const maxAvg = Math.max(...weekdayAvg, 1);

  // Build 30 cells
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    const dow = d.getDay();
    const ev = eventsByDate[dateStr];

    // Intensity 0-3 based on weekday average story volume
    const ratio = weekdayAvg[dow] / maxAvg;
    let intensity: number;
    if (ratio >= 0.75) intensity = 3;
    else if (ratio >= 0.5) intensity = 2;
    else if (ratio >= 0.25) intensity = 1;
    else intensity = 0;

    cells.push({
      date: dateStr,
      intensity,
      event_type: ev
        ? ev.significance === "critical" ? "big-event" : "event"
        : undefined,
    });
  }

  // Build event list
  const events: CalendarEvent[] = (govEvents || [])
    .slice(0, 4)
    .map(e => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = e.governance_bodies as any;
      const bodyAbbr = body?.abbreviation || body?.name || "";
      const daysUntil = Math.max(0, Math.ceil(
        (new Date(e.starts_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ));
      return {
        title: `${e.title}`,
        body_name: bodyAbbr,
        date: new Date(e.starts_at).toISOString().split("T")[0],
        days_until: daysUntil,
      };
    });

  const data: Upcoming30dData = { cells, events };
  return NextResponse.json(data);
}
