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

  try {
    const result = await runDivergenceDetection(24);
    return NextResponse.json({
      ...result,
      durationMs: Date.now() - start,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[divergence-detection] Fatal error:", msg);
    return NextResponse.json(
      { error: msg, durationMs: Date.now() - start },
      { status: 500 }
    );
  }
}
