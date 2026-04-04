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

  // Get story IDs already processed
  const { data: existingMentions } = await supabase
    .from("entity_mentions")
    .select("story_id");

  const processedIds = new Set((existingMentions || []).map((m: { story_id: string }) => m.story_id));

  // Fetch all stories (paginate if needed)
  const { data: allStories } = await supabase
    .from("stories")
    .select("id, title, short_summary, full_summary")
    .order("published_at", { ascending: false })
    .limit(200);

  const toProcess = (allStories || [])
    .filter((s) => !processedIds.has(s.id))
    .slice(0, 50);

  const totalRemaining = (allStories || []).filter((s) => !processedIds.has(s.id)).length;

  let processed = 0;
  let skipped = 0;

  for (const story of toProcess) {
    try {
      await extractEntities(story);
      processed++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({
    processed,
    skipped,
    total_remaining: Math.max(0, totalRemaining - processed),
    batch_size: toProcess.length,
  });
}
