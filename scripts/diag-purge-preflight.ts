// Step A verification: pre-purge checks before DELETE FROM delta_classifications WHERE category IS NULL
// Runs checks (1) and (2) from the approved purge conditions.

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // CHECK (1): category IS NULL counts by prompt_version
  console.log("=== CHECK (1): category IS NULL rows by prompt_version ===");
  const { data: nullRows, error: e1 } = await supabase
    .from("delta_classifications")
    .select("prompt_version, story_id")
    .is("category", null);

  if (e1) { console.error("ERROR:", e1.message); process.exit(1); }

  const byVersion = new Map<string, number>();
  for (const r of nullRows ?? []) {
    byVersion.set(r.prompt_version, (byVersion.get(r.prompt_version) ?? 0) + 1);
  }
  const totalNull = nullRows?.length ?? 0;
  for (const [v, count] of [...byVersion.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  prompt_version=${v}: ${count} rows`);
  }
  console.log(`  TOTAL category IS NULL: ${totalNull}`);

  // CHECK (2): rows with category IS NULL AND is_delta IS NULL AND actor IS NULL AND delta_verb IS NULL
  // These would be unexpected/unknown rows — not verb-era data
  console.log("\n=== CHECK (2): category IS NULL with ALL verb fields also NULL ===");
  const { data: unknownRows, error: e2 } = await supabase
    .from("delta_classifications")
    .select("story_id, prompt_version, is_delta, actor, delta_verb, object")
    .is("category", null)
    .is("is_delta", null)
    .is("actor", null)
    .is("delta_verb", null);

  if (e2) { console.error("ERROR:", e2.message); process.exit(1); }

  const unknownCount = unknownRows?.length ?? 0;
  if (unknownCount === 0) {
    console.log("  RESULT: 0 rows — ALL category-NULL rows have verb fields populated.");
    console.log("  SAFE TO DELETE: every category-NULL row is a verb-era row.");
  } else {
    console.log(`  RESULT: ${unknownCount} UNEXPECTED rows with ALL fields NULL — DO NOT DELETE blind.`);
    console.log("  Samples:");
    for (const r of (unknownRows ?? []).slice(0, 5)) {
      console.log(`    ${JSON.stringify(r)}`);
    }
    console.log("  GATE FAILED: investigate these rows before proceeding.");
  }

  // Additional context: total rows and category IS NOT NULL count
  console.log("\n=== CONTEXT: total table size ===");
  const { count: totalCount } = await supabase
    .from("delta_classifications")
    .select("*", { count: "exact", head: true });
  console.log(`  Total rows: ${totalCount}`);

  const { count: notNullCount } = await supabase
    .from("delta_classifications")
    .select("*", { count: "exact", head: true })
    .not("category", "is", null);
  console.log(`  category IS NOT NULL: ${notNullCount} (these will be untouched by DELETE)`);
  console.log(`  category IS NULL: ${totalNull} (these are the purge targets)`);

  // Summary for gate decision
  console.log("\n=== GATE SUMMARY ===");
  if (unknownCount === 0) {
    console.log(`  GATE PASS: ${totalNull} verb-era rows confirmed safe to delete.`);
    console.log(`  Transactional DELETE to run:`);
    console.log(`    BEGIN;`);
    console.log(`    DELETE FROM public.delta_classifications WHERE category IS NULL;`);
    console.log(`    -- Expected affected rows: ${totalNull}`);
    console.log(`    -- If matches: COMMIT; else: ROLLBACK;`);
  } else {
    console.log(`  GATE FAIL: ${unknownCount} unexpected rows found. Do not proceed with DELETE.`);
  }
}

main().catch(console.error);
