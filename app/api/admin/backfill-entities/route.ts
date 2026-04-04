import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractEntities } from "@/lib/entities";

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

  // Fetch stories not yet processed
  const { data: toProcess } = await supabase
    .from("stories")
    .select("id, title, short_summary, full_summary")
    .or("entities_extracted.eq.false,entities_extracted.is.null")
    .order("published_at", { ascending: false })
    .limit(50);

  let processed = 0;
  let skipped = 0;

  for (const story of toProcess || []) {
    try {
      await extractEntities(story);
      processed++;
    } catch {
      skipped++;
    }
    // Mark as processed regardless of whether entities were found
    await supabase
      .from("stories")
      .update({ entities_extracted: true })
      .eq("id", story.id);
  }

  // Count remaining
  const { count } = await supabase
    .from("stories")
    .select("id", { count: "exact", head: true })
    .or("entities_extracted.eq.false,entities_extracted.is.null");

  return NextResponse.json({
    processed,
    skipped,
    total_remaining: count ?? 0,
    batch_size: (toProcess || []).length,
  });
}
