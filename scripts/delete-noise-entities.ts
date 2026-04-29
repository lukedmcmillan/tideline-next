/**
 * scripts/delete-noise-entities.ts
 *
 * Deletes 7 confirmed noise entity rows along with their entity_mentions and entity_aliases.
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/delete-noise-entities.ts --dry-run
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/delete-noise-entities.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DRY_RUN = process.argv.includes("--dry-run");

const NOISE_NAMES = [
  "US convenience store giant",
  "Attention-Deficit/Hyperactivity Disorder",
  "targeted next-generation sequencing gene panel",
  "God Squad",
  "public hospital",
  "Quality Maternal and Newborn Care Framework",
  "Quality Maternal and Newborn Care Framework index",
];

async function main() {
  console.log(`\n[delete-noise] mode=${DRY_RUN ? "DRY-RUN" : "LIVE"}`);

  // Lookup IDs by name
  const { data: entities, error } = await supabase
    .from("entities")
    .select("id, name, entity_type, mention_count")
    .in("name", NOISE_NAMES);

  if (error) { console.error("lookup failed:", error); process.exit(1); }

  const found = entities ?? [];
  console.log(`\nFound ${found.length}/${NOISE_NAMES.length} noise entities:`);

  const notFound = NOISE_NAMES.filter(n => !found.some(e => e.name === n));
  if (notFound.length > 0) {
    console.log(`Not found (already deleted?): ${notFound.join(", ")}`);
  }

  for (const entity of found) {
    const { count: mentionCount } = await supabase
      .from("entity_mentions")
      .select("*", { count: "exact", head: true })
      .eq("entity_id", entity.id);

    const { count: aliasCount } = await supabase
      .from("entity_aliases")
      .select("*", { count: "exact", head: true })
      .eq("entity_id", entity.id);

    console.log(`  "${entity.name}" (${entity.entity_type}) — ${mentionCount ?? 0} mentions, ${aliasCount ?? 0} aliases`);

    if (!DRY_RUN) {
      // Delete in FK order: aliases → mentions → entity
      const { error: aErr } = await supabase.from("entity_aliases").delete().eq("entity_id", entity.id);
      if (aErr) { console.error(`  alias delete failed for ${entity.id}:`, aErr.message); continue; }

      const { error: mErr } = await supabase.from("entity_mentions").delete().eq("entity_id", entity.id);
      if (mErr) { console.error(`  mention delete failed for ${entity.id}:`, mErr.message); continue; }

      const { error: eErr } = await supabase.from("entities").delete().eq("id", entity.id);
      if (eErr) { console.error(`  entity delete failed for ${entity.id}:`, eErr.message); continue; }

      console.log(`    ✓ deleted`);
    }
  }

  if (DRY_RUN) {
    console.log("\n[delete-noise] DRY-RUN: no writes performed.");
  } else {
    // Integrity check
    const { data: sumData } = await supabase.from("entities").select("mention_count");
    const { count: mentionTotal } = await supabase.from("entity_mentions").select("*", { count: "exact", head: true });
    const liveSum = (sumData ?? []).reduce((acc, e) => acc + (e.mention_count ?? 0), 0);
    if (liveSum === mentionTotal) {
      console.log(`\n[delete-noise] ✓ integrity: SUM(mention_count) (${liveSum}) = COUNT(entity_mentions) (${mentionTotal})`);
    } else {
      console.error(`\n[delete-noise] ✗ MISMATCH: sum=${liveSum} vs mentions=${mentionTotal}`);
    }
  }

  console.log("\n[delete-noise] done.\n");
}

main().catch(err => { console.error(err); process.exit(1); });
