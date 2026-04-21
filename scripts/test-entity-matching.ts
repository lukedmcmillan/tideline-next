/**
 * Test script for entity matching (dry run — does not write to DB).
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/test-entity-matching.ts
 */

import { createClient } from "@supabase/supabase-js";
import { matchEntitiesToStory } from "../lib/entity-matching";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("─── Entity Matching Test (Dry Run) ───\n");

  // Fetch 10 recent stories that have a short_summary
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, title, short_summary, source_name")
    .not("short_summary", "is", null)
    .order("published_at", { ascending: false })
    .limit(10);

  if (error || !stories?.length) {
    console.error("Failed to fetch stories:", error?.message || "no stories found");
    process.exit(1);
  }

  console.log(`Testing ${stories.length} stories:\n`);

  let totalMatches = 0;

  for (const story of stories) {
    const result = await matchEntitiesToStory(story.id, { dryRun: true });
    totalMatches += result.matched;

    console.log(`  "${story.title.slice(0, 60)}${story.title.length > 60 ? "..." : ""}"`);
    console.log(`  Source: ${story.source_name}`);
    console.log(`  Matches: ${result.matched} | Methods: [${result.method.join(", ")}]`);

    if (result.entityIds.length > 0) {
      // Fetch entity names for display
      const { data: entities } = await supabase
        .from("entities")
        .select("id, name, entity_type")
        .in("id", result.entityIds);

      if (entities) {
        for (const e of entities) {
          console.log(`    → ${e.name} (${e.entity_type})`);
        }
      }
    }
    console.log("");
  }

  const avg = stories.length > 0 ? (totalMatches / stories.length).toFixed(1) : "0";
  console.log("─── Summary ───");
  console.log(`  Stories tested: ${stories.length}`);
  console.log(`  Total matches:  ${totalMatches}`);
  console.log(`  Avg per story:  ${avg}`);
  console.log(`  Mode:           DRY RUN (no DB writes)`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
