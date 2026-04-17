import { NextResponse } from "next/server";
import { runDivergenceDetection } from "@/app/lib/divergence";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();

  // Parse optional ?hours=N override (valid positive int under 720)
  const url = new URL(request.url);
  const hoursParam = url.searchParams.get("hours");
  const parsedHours = hoursParam ? parseInt(hoursParam, 10) : NaN;
  const defaultHours = 72;
  const sinceHours = (!isNaN(parsedHours) && parsedHours > 0 && parsedHours <= 720) ? parsedHours : defaultHours;

  // ?debug=true enables per-pair score logging
  if (url.searchParams.get("debug") === "true") {
    process.env.DIVERGENCE_DEBUG = "true";
  }

  try {
    const result = await runDivergenceDetection(sinceHours);
    delete process.env.DIVERGENCE_DEBUG;
    return NextResponse.json({
      ...result,
      sinceHours,
      durationMs: Date.now() - start,
    });
  } catch (err) {
    delete process.env.DIVERGENCE_DEBUG;
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[divergence-detection] Fatal error:", msg);
    return NextResponse.json(
      { error: msg, durationMs: Date.now() - start },
      { status: 500 }
    );
  }
}
