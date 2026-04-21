import { createClient } from "@supabase/supabase-js";
import { matchEntitiesBatch } from "../lib/entity-matching";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get stories with summaries but not yet entity-matched
  const { data: stories } = await sb
    .from("stories")
    .select("id")
    .not("short_summary", "is", null)
    .or("entities_extracted.is.null,entities_extracted.eq.false")
    .order("published_at", { ascending: false })
    .limit(20);

  if (!stories || stories.length === 0) {
    console.log("No unmatched stories found");
    return;
  }

  console.log(`Backfilling entity matching for ${stories.length} stories...\n`);
  const ids = stories.map(s => s.id);
  const result = await matchEntitiesBatch(ids);

  console.log(`\n─── Backfill Complete ───`);
  console.log(`  Processed: ${result.processed}`);
  console.log(`  Total matches: ${result.totalMatches}`);
  console.log(`  Avg per story: ${result.avgMatchesPerStory}`);

  // Mark as processed
  if (result.totalMatches > 0) {
    await sb.from("stories").update({ entities_extracted: true }).in("id", ids);
    console.log(`  Marked ${ids.length} stories as entities_extracted=true`);
  }
}

main().catch(console.error);
