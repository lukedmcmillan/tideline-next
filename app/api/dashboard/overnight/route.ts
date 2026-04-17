import { NextResponse } from "next/server";
import type { OvernightData } from "@/app/lib/types/dashboard";

// Sprint 1: mocked response. Wire to real data in Sprint 2.
export async function GET() {
  const data: OvernightData = {
    hours: 14,
    doc_count: 347,
    source_count: 89,
    top_mover_line: "ISA moved 6.4 \u2192 6.8 (accelerating)",
    divergence_line: "Two new divergences detected. One Council document landed at 3:14am",
    countdown_line: "MEPC 84 is now 16 days away",
    readiness_pct: 64,
  };

  return NextResponse.json(data);
}
