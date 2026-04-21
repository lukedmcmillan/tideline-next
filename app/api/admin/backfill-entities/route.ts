import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { matchEntitiesBatch } from "@/lib/entity-matching";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && querySecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only process stories that have a summary — nothing to match against otherwise
  const { data: toProcess } = await supabase
    .from("stories")
    .select("id")
    .or("entities_extracted.eq.false,entities_extracted.is.null")
    .not("short_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(50);

  const ids = (toProcess || []).map((s) => s.id);

  const result = await matchEntitiesBatch(ids);

  // Mark all processed stories as extracted
  if (ids.length > 0) {
    await supabase
      .from("stories")
      .update({ entities_extracted: true })
      .in("id", ids);
  }

  // Count remaining (including those without summaries yet)
  const { count } = await supabase
    .from("stories")
    .select("id", { count: "exact", head: true })
    .or("entities_extracted.eq.false,entities_extracted.is.null");

  return NextResponse.json({
    processed: result.processed,
    total_matches: result.totalMatches,
    avg_matches_per_story: result.avgMatchesPerStory,
    total_remaining: count ?? 0,
    batch_size: ids.length,
  });
}
