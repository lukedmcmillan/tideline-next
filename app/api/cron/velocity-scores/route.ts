import { NextResponse } from "next/server";
import { calculateVelocityScore } from "@/app/lib/velocity";

export const maxDuration = 60;

const TRACKER_SLUGS = ["isa", "bbnj", "iuu", "30x30", "blue-finance", "plastics"];

export async function GET() {
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
