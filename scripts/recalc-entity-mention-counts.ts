/**
 * scripts/recalc-entity-mention-counts.ts
 *
 * Recalculates entities.mention_count from entity_mentions truth table.
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/recalc-entity-mention-counts.ts
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/recalc-entity-mention-counts.ts --dry-run
 *
 * Dry-run shows: rows changing, top 20 deltas, before/after totals, zero-mention count.
 * Live run updates entities.mention_count for all rows.
 * Both modes always run the final integrity assertion.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(`\n[recalc] mode=${DRY_RUN ? "DRY-RUN" : "LIVE"}`);

  // 1. Fetch all entities with their current mention_count
  const { data: entities, error: entErr } = await supabase
    .from("entities")
    .select("id, name, mention_count")
    .order("mention_count", { ascending: false });

  if (entErr || !entities) {
    console.error("[recalc] failed to fetch entities:", entErr);
    process.exit(1);
  }

  // 2. Fetch all entity_mentions to compute true counts
  let allMentions: { entity_id: string }[] = [];
  let from = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("entity_mentions")
      .select("entity_id")
      .range(from, from + PAGE - 1);

    if (error) {
      console.error("[recalc] failed to fetch entity_mentions:", error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allMentions = allMentions.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // 3. Build true count map
  const trueCount = new Map<string, number>();
  for (const m of allMentions) {
    trueCount.set(m.entity_id, (trueCount.get(m.entity_id) ?? 0) + 1);
  }

  // 4. Compute deltas
  const deltas: { id: string; name: string; current: number; correct: number; delta: number }[] = [];
  let beforeTotal = 0;
  let afterTotal = 0;
  let zeroMentionCount = 0;

  for (const entity of entities) {
    const current = entity.mention_count ?? 0;
    const correct = trueCount.get(entity.id) ?? 0;
    beforeTotal += current;
    afterTotal += correct;
    if (correct === 0) zeroMentionCount++;
    if (current !== correct) {
      deltas.push({ id: entity.id, name: entity.name, current, correct, delta: correct - current });
    }
  }

  // 5. Report
  console.log(`\n[recalc] entities total: ${entities.length}`);
  console.log(`[recalc] entity_mentions total (truth): ${allMentions.length}`);
  console.log(`[recalc] rows changing: ${deltas.length} (expect ~488)`);
  console.log(`[recalc] before SUM(mention_count): ${beforeTotal} (expect ~8759)`);
  console.log(`[recalc] after  SUM(mention_count): ${afterTotal} (expect ~770)`);
  console.log(`[recalc] zero-mention entities: ${zeroMentionCount} (expect ~459)`);

  const top20 = [...deltas].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 20);
  console.log("\n[recalc] top 20 deltas (largest absolute change):");
  console.log("  current → correct  name");
  for (const d of top20) {
    const sign = d.delta > 0 ? "+" : "";
    console.log(`  ${String(d.current).padStart(5)} → ${String(d.correct).padStart(5)}  (${sign}${d.delta})  ${d.name}`);
  }

  if (DRY_RUN) {
    console.log("\n[recalc] DRY-RUN: no writes performed.");
  } else {
    // 6. Apply updates in batches
    console.log(`\n[recalc] applying ${deltas.length} updates...`);
    let updated = 0;

    for (const d of deltas) {
      const { error } = await supabase
        .from("entities")
        .update({ mention_count: d.correct })
        .eq("id", d.id);

      if (error) {
        console.error(`[recalc] failed to update ${d.id} (${d.name}):`, error.message);
      } else {
        updated++;
      }
    }

    console.log(`[recalc] updated ${updated}/${deltas.length} rows`);
  }

  // 7. Final integrity assertion (always runs, reads live DB)
  console.log("\n[recalc] running integrity assertion...");

  const { data: sumData, error: sumErr } = await supabase
    .from("entities")
    .select("mention_count");

  if (sumErr || !sumData) {
    console.error("[recalc] assertion failed — could not read entities:", sumErr);
    process.exit(1);
  }

  const { count: mentionCount, error: mcErr } = await supabase
    .from("entity_mentions")
    .select("*", { count: "exact", head: true });

  if (mcErr) {
    console.error("[recalc] assertion failed — could not count entity_mentions:", mcErr);
    process.exit(1);
  }

  const liveSum = sumData.reduce((acc, e) => acc + (e.mention_count ?? 0), 0);

  if (DRY_RUN) {
    // In dry-run, assert the projected after total matches truth
    if (afterTotal === allMentions.length) {
      console.log(`[recalc] ✓ dry-run assertion: projected SUM (${afterTotal}) = entity_mentions count (${allMentions.length})`);
    } else {
      console.error(`[recalc] ✗ ASSERTION FAILED: projected SUM (${afterTotal}) ≠ entity_mentions count (${allMentions.length})`);
      process.exit(1);
    }
  } else {
    if (liveSum === mentionCount) {
      console.log(`[recalc] ✓ assertion passed: SUM(mention_count) (${liveSum}) = COUNT(entity_mentions) (${mentionCount})`);
    } else {
      console.error(`[recalc] ✗ ASSERTION FAILED: SUM(mention_count) (${liveSum}) ≠ COUNT(entity_mentions) (${mentionCount})`);
      process.exit(1);
    }
  }

  console.log("\n[recalc] done.\n");
}

main().catch((err) => {
  console.error("[recalc] unexpected error:", err);
  process.exit(1);
});
