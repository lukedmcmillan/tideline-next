/**
 * One-off cleanup: remove commodity/species entities that cause false positives.
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/cleanup-entities.ts
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Delete commodity/species entities that are not governance entities
  const toDelete = ['fishmeal', 'cod', 'haddock'];

  const { data: found } = await sb
    .from("entities")
    .select("id, name, entity_type")
    .in("name", toDelete)
    .eq("entity_type", "instrument");

  console.log(`Found ${found?.length || 0} entities to delete:`, found?.map(e => e.name));

  if (found && found.length > 0) {
    const ids = found.map(e => e.id);

    const r1 = await sb.from("entity_mentions").delete().in("entity_id", ids);
    console.log("Mentions:", r1.error?.message || `deleted`);

    const r2 = await sb.from("entity_aliases").delete().in("entity_id", ids);
    console.log("Aliases:", r2.error?.message || `deleted`);

    const r3 = await sb.from("entities").delete().in("id", ids);
    console.log("Entities:", r3.error?.message || `deleted ${ids.length}`);
  }

  // Also apply the updated RPC (match_entities_in_text with 3-tier logic)
  // This needs to be done in Supabase dashboard — just print the SQL
  console.log("\n─── APPLY THIS SQL IN SUPABASE DASHBOARD ───\n");
  console.log(`-- Three-tier length logic for match_entities_in_text
-- Tier 1: >= 7 chars = bare ILIKE
-- Tier 2: 4-6 chars = word boundary required
-- Tier 3: 2-3 chars = strict word boundary

-- Also add 'fuzzy' to constraint:
ALTER TABLE entity_mentions DROP CONSTRAINT IF EXISTS entity_mentions_match_method_check;
ALTER TABLE entity_mentions ADD CONSTRAINT entity_mentions_match_method_check
  CHECK (match_method IN ('exact','semantic','alias','fuzzy'));
`);
}

main().catch(console.error);
