/**
 * scripts/backfill-entity-aliases.ts
 *
 * Backfills known aliases for 13 entities.
 * Pre-flight check: confirms no alias conflicts with existing canonical entity names.
 * Uses ON CONFLICT DO NOTHING via ignoreDuplicates: true.
 *
 * Usage:
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/backfill-entity-aliases.ts --dry-run
 *   npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/backfill-entity-aliases.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DRY_RUN = process.argv.includes("--dry-run");

// Map: canonical entity name → aliases to backfill
const ALIAS_MAP: Record<string, string[]> = {
  "International Maritime Organization": ["IMO", "International Maritime Organisation"],
  "European Commission": ["EC"],
  "Lloyds Register": ["LR", "Lloyd's Register"],
  "Biodiversity Beyond National Jurisdiction": ["BBNJ"],
  "BBNJ Agreement": ["BBNJ", "Biodiversity Beyond National Jurisdiction Agreement"],
  "International Seabed Authority": ["ISA"],
  "Food and Agriculture Organization": ["FAO", "Food and Agriculture Organisation"],
  "Convention on Biological Diversity": ["CBD", "Convention on Biological Diversity Text"],
  "World Trade Organization": ["WTO", "World Trade Organisation"],
  "US Coast Guard": ["USCG"],
  "Indian Ocean Commission": ["IOC"],
  "Indian Ocean Tuna Commission": ["IOTC"],
  "NOAA": ["National Oceanic and Atmospheric Administration"],
};

async function main() {
  console.log(`\n[alias-backfill] mode=${DRY_RUN ? "DRY-RUN" : "LIVE"}`);

  // 1. Resolve entity names → IDs
  const canonicalNames = Object.keys(ALIAS_MAP);
  const { data: entities, error: entErr } = await supabase
    .from("entities")
    .select("id, name")
    .in("name", canonicalNames);

  if (entErr) { console.error("entity lookup failed:", entErr); process.exit(1); }

  const entityMap = new Map((entities ?? []).map(e => [e.name, e.id]));

  const notFound = canonicalNames.filter(n => !entityMap.has(n));
  if (notFound.length > 0) {
    console.log(`\nNot found in entities table (${notFound.length}):`);
    notFound.forEach(n => console.log(`  - ${n}`));
  }

  // 2. Pre-flight: check aliases don't conflict with existing canonical entity names
  const allAliases = Object.values(ALIAS_MAP).flat();
  const { data: conflictEntities, error: conflictErr } = await supabase
    .from("entities")
    .select("id, name")
    .in("name", allAliases);

  if (conflictErr) { console.error("conflict check failed:", conflictErr); process.exit(1); }

  if (conflictEntities && conflictEntities.length > 0) {
    console.log(`\nPre-flight WARNING: ${conflictEntities.length} aliases match existing canonical entity names:`);
    for (const e of conflictEntities) {
      // Find which canonical entity's alias conflicts
      const conflictingMaps = Object.entries(ALIAS_MAP)
        .filter(([, aliases]) => aliases.includes(e.name))
        .map(([canonical]) => canonical);
      console.log(`  "${e.name}" (id: ${e.id}) — alias for: ${conflictingMaps.join(", ")}`);
    }
    console.log("  These entities will keep their own row; the alias insert is still valid (different entity_id).");
  } else {
    console.log("\nPre-flight ✓ — no aliases conflict with existing canonical entity names.");
  }

  // 3. Build inserts
  const toInsert: { canonical: string; entityId: string; alias: string }[] = [];

  for (const [canonical, aliases] of Object.entries(ALIAS_MAP)) {
    const entityId = entityMap.get(canonical);
    if (!entityId) {
      console.log(`  SKIP "${canonical}" — not found in entities table`);
      continue;
    }
    for (const alias of aliases) {
      toInsert.push({ canonical, entityId, alias });
    }
  }

  console.log(`\nAlias inserts planned: ${toInsert.length}`);
  for (const { canonical, alias } of toInsert) {
    console.log(`  "${alias}" → ${canonical}`);
  }

  if (DRY_RUN) {
    console.log("\n[alias-backfill] DRY-RUN: no writes performed.");
    console.log("\n[alias-backfill] done.\n");
    return;
  }

  // 4. Insert aliases
  let inserted = 0;
  let skipped = 0;

  for (const { canonical, entityId, alias } of toInsert) {
    const { data, error } = await supabase
      .from("entity_aliases")
      .upsert(
        { entity_id: entityId, alias_text: alias },
        { onConflict: "entity_id,alias_text", ignoreDuplicates: true }
      )
      .select();

    if (error) {
      console.error(`  error inserting "${alias}" for ${canonical}:`, error.message);
    } else if (data && data.length > 0) {
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log(`\nInserted: ${inserted}, skipped (already existed): ${skipped}`);
  console.log("\n[alias-backfill] done.\n");
}

main().catch(err => { console.error(err); process.exit(1); });
