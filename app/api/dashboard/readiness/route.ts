import { NextResponse } from "next/server";
import type { ReadinessData } from "@/app/lib/types/dashboard";

// Sprint 1: mocked at 72% per constraint. Wire to real data in Sprint 2.
export async function GET() {
  const data: ReadinessData = {
    event_title: "MEPC 84",
    body_name: "IMO",
    days_until: 16,
    readiness_pct: 72,
  };

  return NextResponse.json(data);
}
