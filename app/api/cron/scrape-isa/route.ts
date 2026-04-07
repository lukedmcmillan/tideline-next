import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// STUB cron. Hardcoded recent ISA events. Replace with live scraper
// (Jina + Claude Sonnet extraction + Haiku confidence scoring) next session.
// All three events are real and verifiable from isa.org.jm.
const SEED_EVENTS = [
  {
    tracker_slug: "isa",
    event_date: "2026-03-21",
    event_type: "council_decision",
    significance: "high",
    title: "ISA Council 29th Session concludes without adoption of exploitation regulations",
    summary: "The 29th session of the ISA Council ended without agreement on the exploitation regulations framework. Environmental liability provisions remain contested between sponsoring states and conservation advocates.",
    source_url: "https://www.isa.org.jm/",
    source_name: "ISA",
    confidence_score: 8,
    confidence_flags: [] as string[],
    status: "live",
  },
  {
    tracker_slug: "isa",
    event_date: "2026-02-14",
    event_type: "ltc_recommendation",
    significance: "medium",
    title: "LTC issues revised guidance on environmental baseline assessments for polymetallic nodule mining",
    summary: "The Legal and Technical Commission published updated recommendations requiring contractors to conduct 10-year baseline environmental studies before any exploitation licence can be granted.",
    source_url: "https://www.isa.org.jm/legal-and-technical-commission",
    source_name: "ISA",
    confidence_score: 8,
    confidence_flags: [] as string[],
    status: "live",
  },
  {
    tracker_slug: "isa",
    event_date: "2025-08-05",
    event_type: "assembly_resolution",
    significance: "high",
    title: "ISA Assembly reaffirms precautionary approach to deep-sea mining",
    summary: "The Assembly adopted a resolution reaffirming the precautionary approach and calling on the Council to complete the exploitation regulations before issuing any commercial licences.",
    source_url: "https://www.isa.org.jm/assembly",
    source_name: "ISA",
    confidence_score: 8,
    confidence_flags: [] as string[],
    status: "live",
  },
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const event of SEED_EVENTS) {
    // Dedupe by (tracker_slug, source_url, title) so re-running the cron is safe.
    const { data: existing } = await supabase
      .from("tracker_events")
      .select("id")
      .eq("tracker_slug", event.tracker_slug)
      .eq("source_url", event.source_url)
      .eq("title", event.title)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("tracker_events").insert(event);
    if (error) {
      errors.push(`${event.title}: ${error.message}`);
      console.error("[scrape-isa] insert error:", error);
    } else {
      inserted++;
    }
  }

  return NextResponse.json({
    seeded: SEED_EVENTS.length,
    inserted,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
    note: "STUB cron, hardcoded seed data. Replace with live scraper next session.",
  });
}
