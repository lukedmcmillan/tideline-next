import { createClient } from "@supabase/supabase-js";
import { matchEntitiesToStory } from "../lib/entity-matching";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH = 20;

const args = process.argv.slice(2);
const skipSemantic = args.includes("--skip-semantic");
const force = args.includes("--force");
const limitArg = args.indexOf("--limit");
const limit = limitArg !== -1 ? parseInt(args[limitArg + 1], 10) : 500;

async function main() {
  // Count total eligible stories
  let countQuery = sb
    .from("stories")
    .select("*", { count: "exact", head: true })
    .not("short_summary", "is", null);

  if (!force) {
    countQuery = countQuery.or("entities_extracted.is.null,entities_extracted.eq.false");
  }

  const { count: total } = await countQuery;

  if (!total) {
    console.log("No stories to process.");
    return;
  }

  const toProcess = Math.min(total, limit);
  console.log(`\nFull corpus backfill`);
  console.log(`  Eligible stories : ${total}`);
  console.log(`  This run limit   : ${toProcess}`);
  console.log(`  Skip semantic    : ${skipSemantic}`);
  console.log(`  Force (re-run)   : ${force}`);
  console.log();

  let processed = 0;
  let totalMatches = 0;
  let errors = 0;
  const startMs = Date.now();

  while (processed < toProcess) {
    const remaining = toProcess - processed;

    let batchQuery = sb
      .from("stories")
      .select("id")
      .not("short_summary", "is", null);

    if (!force) {
      batchQuery = batchQuery.or("entities_extracted.is.null,entities_extracted.eq.false");
    }

    const { data: batch } = await batchQuery
      .order("published_at", { ascending: false })
      .limit(Math.min(BATCH, remaining));

    if (!batch || batch.length === 0) break;

    for (const story of batch) {
      if (processed >= toProcess) break;

      try {
        const result = await matchEntitiesToStory(story.id, { skipSemantic });
        totalMatches += result.matched;
      } catch {
        errors++;
      }

      await sb.from("stories").update({ entities_extracted: true }).eq("id", story.id);
      processed++;

      if (processed % 50 === 0) {
        const elapsed = ((Date.now() - startMs) / 1000).toFixed(0);
        const pct = ((processed / toProcess) * 100).toFixed(1);
        const avg = (totalMatches / processed).toFixed(1);
        console.log(
          `  [${pct}%] ${processed}/${toProcess} | ${totalMatches} mentions | ${avg} avg | ${elapsed}s${errors > 0 ? ` | ${errors} errors` : ""}`
        );
      }
    }
  }

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  const avg = processed > 0 ? (totalMatches / processed).toFixed(2) : "0";

  console.log(`\n─── Backfill Complete ───`);
  console.log(`  Stories processed : ${processed}`);
  console.log(`  Entity mentions   : ${totalMatches}`);
  console.log(`  Avg per story     : ${avg}`);
  console.log(`  Errors            : ${errors}`);
  console.log(`  Time              : ${elapsed}s`);
  console.log(`  Remaining         : ${Math.max(0, total - processed)} stories`);
}

main().catch(console.error);
