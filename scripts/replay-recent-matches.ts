/**
 * Bounded historical replay of entity matching against real production stories.
 *
 * Finds recent stories mentioning BBNJ / ISA / IWC, runs matchEntitiesToStory()
 * on unprocessed ones, and populates project_auto_entries for auth-test-2.
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/replay-recent-matches.ts
 */

import { createClient } from "@supabase/supabase-js";
import { createInterface } from "readline";
import { matchEntitiesToStory } from "../lib/entity-matching";

const PROJECT_ID = "71243f6a-6bf7-4b70-a9db-2817e8ef7b9c";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const batchStartedAt = new Date().toISOString();

  console.log("══════════════════════════════════════════════════════════");
  console.log("  Historical Replay — Entity Matching");
  console.log("  Target project: auth-test-2 (" + PROJECT_ID + ")");
  console.log("  Batch started:", batchStartedAt);
  console.log("══════════════════════════════════════════════════════════\n");

  // ── Step 1: Find candidate stories ──────────────────────────────────────────
  console.log("Step 1 — Querying candidate stories (last 30 days)...\n");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: candidates, error: candidatesErr } = await supabase
    .from("stories")
    .select("id, title, short_summary, source_name, published_at, entities_extracted")
    .gt("published_at", thirtyDaysAgo)
    .or(
      [
        "title.ilike.%BBNJ%",
        "short_summary.ilike.%BBNJ%",
        "title.ilike.%ISA%",
        "short_summary.ilike.%International Seabed Authority%",
        "title.ilike.%whaling%",
        "short_summary.ilike.%International Whaling Commission%",
        "title.ilike.%IWC%",
      ].join(",")
    )
    .order("published_at", { ascending: false })
    .limit(20);

  if (candidatesErr || !candidates) {
    console.error("Failed to fetch candidates:", candidatesErr?.message);
    process.exit(1);
  }

  if (candidates.length === 0) {
    console.log("No candidate stories found in the last 30 days. Exiting.");
    return;
  }

  console.log(`Found ${candidates.length} candidate story(ies):\n`);
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const date = new Date(c.published_at).toISOString().slice(0, 10);
    const alreadyProcessed = c.entities_extracted === true;
    const status = alreadyProcessed ? " [already processed]" : "";
    console.log(`  ${String(i + 1).padStart(2)}. [${date}] ${c.source_name}`);
    console.log(`      ${c.title.slice(0, 80)}${c.title.length > 80 ? "…" : ""}${status}`);
  }
  console.log();

  // ── Step 2: Confirmation ─────────────────────────────────────────────────────
  const answer = await prompt(`Process these ${candidates.length} stories through matchEntitiesToStory? (y/n): `);
  if (answer.toLowerCase() !== "y") {
    console.log("\nAborted. No changes made.");
    return;
  }
  console.log();

  // ── Step 3: Process each story ───────────────────────────────────────────────
  const processedIds: string[] = [];
  let skipped = 0;
  let processed = 0;
  let totalMentionsCreated = 0;
  let totalAutoEntries = 0;
  const attached: { title: string; entityName: string }[] = [];

  for (const story of candidates) {
    const shortTitle = story.title.slice(0, 70) + (story.title.length > 70 ? "…" : "");
    console.log(`─── ${shortTitle}`);
    console.log(`    id: ${story.id}`);

    // Check if entity matching already ran
    const { count } = await supabase
      .from("entity_mentions")
      .select("*", { count: "exact", head: true })
      .eq("story_id", story.id);

    if ((count ?? 0) > 0) {
      console.log(`    SKIP (already has ${count} entity_mention row(s))\n`);
      skipped++;
      continue;
    }

    // Run matcher
    const matchResult = await matchEntitiesToStory(story.id);
    processedIds.push(story.id);
    processed++;
    totalMentionsCreated += matchResult.matched;

    console.log(`    matched: ${matchResult.matched}  method: [${matchResult.method.join(",")}]`);

    // Check for auto-entries created for our project
    const { data: autoEntries } = await supabase
      .from("project_auto_entries")
      .select("matched_entity_id, entities ( name )")
      .eq("story_id", story.id)
      .eq("project_id", PROJECT_ID);

    if (autoEntries && autoEntries.length > 0) {
      totalAutoEntries += autoEntries.length;
      for (const ae of autoEntries) {
        const entityName = (ae as { entities?: { name: string } | null }).entities?.name ?? ae.matched_entity_id ?? "(unknown)";
        console.log(`    → auto-attached to auth-test-2 via entity: ${entityName}`);
        attached.push({ title: story.title, entityName });
      }
    } else {
      console.log(`    → no auto-attach for auth-test-2 (no matching project_entities link)`);
    }
    console.log();
  }

  // ── Step 4: Summary ──────────────────────────────────────────────────────────
  console.log("══════════════════════════════════════════════════════════");
  console.log("  Replay Summary");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`  Stories considered        : ${candidates.length}`);
  console.log(`  Skipped (already done)    : ${skipped}`);
  console.log(`  Newly processed           : ${processed}`);
  console.log(`  entity_mentions created   : ${totalMentionsCreated}`);
  console.log(`  project_auto_entries (auth-test-2) : ${totalAutoEntries}`);

  if (attached.length > 0) {
    console.log("\n  Stories attached to auth-test-2:");
    for (const a of attached) {
      console.log(`    • "${a.title.slice(0, 65)}${a.title.length > 65 ? "…" : ""}"  via [${a.entityName}]`);
    }
  } else {
    console.log("\n  No stories were auto-attached to auth-test-2.");
    console.log("  (Possible: candidates were already processed, or entities not in project_entities)");
  }
  console.log();

  // ── Step 5: Rollback SQL ─────────────────────────────────────────────────────
  if (processedIds.length > 0) {
    const idList = processedIds.map((id) => `'${id}'`).join(",\n    ");
    console.log("Rollback SQL (run manually in Studio — NOT executed here):");
    console.log("─────────────────────────────────────────────────────────");
    console.log(`-- Removes only auto-entries this batch created for auth-test-2`);
    console.log(`DELETE FROM project_auto_entries`);
    console.log(`WHERE project_id = '${PROJECT_ID}'`);
    console.log(`  AND story_id IN (`);
    console.log(`    ${idList}`);
    console.log(`  )`);
    console.log(`  AND inserted_at > '${batchStartedAt}';`);
    console.log("─────────────────────────────────────────────────────────");
  } else {
    console.log("(No stories newly processed — no rollback SQL needed)");
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
