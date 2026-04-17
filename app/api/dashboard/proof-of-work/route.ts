import { NextResponse } from "next/server";
import type { ProofOfWorkData } from "@/app/lib/types/dashboard";

// Sprint 1: mocked. Wire to real data in Sprint 2.
export async function GET() {
  const data: ProofOfWorkData = {
    last_ingestion_minutes_ago: 2,
    docs_today: 347,
    sources_monitored: 89,
    active_divergences: 3,
    next_scan_utc: "02:00",
  };

  return NextResponse.json(data);
}
