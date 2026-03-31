import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Seed data — used as fallback until the consultations table is migrated
const SEED: {
  organisation: string;
  title: string;
  description: string;
  deadline: string;
  type: string;
  covered: boolean;
  story_count: number;
  tracker_tags: string[];
}[] = [
  { organisation: "OSPAR", title: "Revised North-East Atlantic Fisheries Recovery Zones", description: "Public consultation on proposed amendments to OSPAR Recommendation 2003/1 concerning the management of fisheries recovery zones in Regions II, III and IV.", deadline: "2026-04-03T23:59:00Z", type: "consultation", covered: true, story_count: 6, tracker_tags: ["30x30", "IUU Enforcement", "BBNJ Treaty"] },
  { organisation: "European Commission", title: "EU CSRD Ocean Reporting Obligations", description: "Deadline for first mandatory disclosure under CSRD ocean-related reporting provisions for large undertakings in the maritime, fisheries and aquaculture sectors.", deadline: "2026-03-31T23:59:00Z", type: "deadline", covered: true, story_count: 3, tracker_tags: ["Blue Finance"] },
  { organisation: "ISA", title: "Environmental Safeguard Provisions \u2014 90-day review", description: "Open review period for proposed environmental safeguard provisions under the draft exploitation regulations for mineral resources in the Area.", deadline: "2026-04-30T23:59:00Z", type: "consultation", covered: true, story_count: 11, tracker_tags: ["ISA Mining", "BBNJ Treaty"] },
  { organisation: "IMO", title: "ISWG-GHG 17 \u2014 GHG Reduction Strategy", description: "Seventeenth meeting of the Intersessional Working Group on Reduction of GHG Emissions from Ships.", deadline: "2026-05-16T23:59:00Z", type: "event", covered: true, story_count: 4, tracker_tags: ["IMO Shipping"] },
  { organisation: "CBD", title: "Post-2020 MPA Finance Mechanism", description: "Consultation on the proposed financial mechanism for marine protected area establishment and management under the Kunming-Montreal Global Biodiversity Framework.", deadline: "2026-06-02T23:59:00Z", type: "consultation", covered: false, story_count: 0, tracker_tags: ["30x30", "Blue Finance"] },
  { organisation: "ISA", title: "Council Session 29", description: "Twenty-ninth session of the Council of the International Seabed Authority.", deadline: "2026-07-14T23:59:00Z", type: "event", covered: true, story_count: 8, tracker_tags: ["ISA Mining", "BBNJ Treaty"] },
];

function groupByUrgency(rows: { days_remaining: number }[]) {
  const urgent = rows.filter((r) => r.days_remaining <= 14);
  const warning = rows.filter(
    (r) => r.days_remaining > 14 && r.days_remaining <= 60
  );
  const upcoming = rows.filter((r) => r.days_remaining > 60);
  return { urgent, warning, upcoming };
}

function addDaysRemaining<T extends { deadline: string }>(rows: T[]) {
  const now = new Date();
  return rows
    .map((row) => {
      const deadlineMs = new Date(row.deadline).getTime();
      const days_remaining = Math.max(
        0,
        Math.ceil((deadlineMs - now.getTime()) / (1000 * 60 * 60 * 24))
      );
      return { ...row, days_remaining };
    })
    .sort((a, b) => a.days_remaining - b.days_remaining);
}

export async function GET() {
  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .order("deadline", { ascending: true });

  // If the table exists and returns data, use it
  if (!error && data) {
    const rows = addDaysRemaining(data);
    return NextResponse.json(groupByUrgency(rows));
  }

  // Fallback to seed data until migration is applied
  const rows = addDaysRemaining(SEED);
  return NextResponse.json(groupByUrgency(rows));
}
