import { NextResponse } from "next/server";
import { GOVERNANCE_EVENTS, daysUntil } from "@/app/lib/events";
import type { Upcoming30dData, CalendarCell, CalendarEvent } from "@/app/lib/types/dashboard";

// Sprint 1: mocked heatmap cells + real events from seed.
// Sprint 2: derive intensity from historical velocity_scores averages.
export async function GET() {
  const now = new Date();
  const cells: CalendarCell[] = [];
  const intensityPattern = [1, 1, 2, 1, 2, 3, 2, 1, 2, 0, 3, 2, 1, 2, 3, 3, 0, 2, 1, 2, 3, 0, 2, 1, 2, 3, 2, 0, 1, 2];

  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    const matchingEvent = GOVERNANCE_EVENTS.find(e => e.date === dateStr);
    cells.push({
      date: dateStr,
      intensity: intensityPattern[i] ?? 1,
      event_type: matchingEvent
        ? matchingEvent.significance === "critical" ? "big-event" : "event"
        : undefined,
    });
  }

  const events: CalendarEvent[] = GOVERNANCE_EVENTS
    .map(e => ({
      title: `${e.title} · ${e.description.split(".")[0]}`,
      body_name: e.body_name,
      date: e.date,
      days_until: daysUntil(e.date),
    }))
    .filter(e => e.days_until >= 0 && e.days_until <= 30)
    .sort((a, b) => a.days_until - b.days_until)
    .slice(0, 4);

  const data: Upcoming30dData = { cells, events };
  return NextResponse.json(data);
}
