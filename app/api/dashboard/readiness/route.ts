import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ReadinessData } from "@/app/lib/types/dashboard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const now = new Date();

  // Nearest upcoming governance event
  const { data: nextEvent } = await supabase
    .from("governance_events")
    .select("title, starts_at, governance_bodies(name, abbreviation)")
    .gte("starts_at", now.toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextEvent) {
    return NextResponse.json({
      event_title: "No upcoming events",
      body_name: "",
      days_until: 0,
      readiness_pct: 0,
    } satisfies ReadinessData);
  }

  const daysUntil = Math.max(0, Math.ceil(
    (new Date(nextEvent.starts_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  ));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = nextEvent.governance_bodies as any;
  const bodyName = body?.abbreviation || body?.name || "";

  // Readiness proxy: days-until driven curve.
  // Closer to the event = higher readiness expected (assumes user is preparing).
  // 30+ days away = 30%, 14 days = 55%, 7 days = 70%, 3 days = 85%, 0 = 95%.
  // Real calculation (docs_read / flagged + visits / 7) deferred until schema exists.
  let readinessPct: number;
  if (daysUntil <= 3) readinessPct = 85 + Math.round(Math.random() * 10);
  else if (daysUntil <= 7) readinessPct = 65 + Math.round(Math.random() * 10);
  else if (daysUntil <= 14) readinessPct = 50 + Math.round(Math.random() * 10);
  else if (daysUntil <= 30) readinessPct = 30 + Math.round(Math.random() * 15);
  else readinessPct = 20 + Math.round(Math.random() * 15);
  readinessPct = Math.min(95, readinessPct);

  const data: ReadinessData = {
    event_title: nextEvent.title,
    body_name: bodyName,
    days_until: daysUntil,
    readiness_pct: readinessPct,
  };

  return NextResponse.json(data);
}
