import { NextRequest, NextResponse } from "next/server";
import { calculateVelocityScore } from "@/app/lib/velocity";

export const maxDuration = 60;

const TRACKER_SLUGS = ["isa", "bbnj", "iuu", "30x30", "blue-finance"];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = [];
  for (const slug of TRACKER_SLUGS) {
    try {
      const result = await calculateVelocityScore(slug);
      results.push(result);
    } catch (err) {
      console.error(`Velocity score failed for ${slug}:`, err);
      results.push({ trackerSlug: slug, error: String(err) });
    }
  }

  return NextResponse.json({ ok: true, results });
}
