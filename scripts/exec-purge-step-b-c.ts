// Step B: DELETE verb-era rows (category IS NULL)
// Step C: post-purge verification counts
// GATE: deleted count must be exactly 663. If not, script exits without Step C.

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXPECTED_COUNT = 663;

async function main() {
  // Pre-delete count sanity check (re-confirm state hasn't changed since Step A)
  console.log("=== PRE-DELETE SANITY CHECK ===");
  const { count: preCount, error: preErr } = await supabase
    .from("delta_classifications")
    .select("*", { count: "exact", head: true })
    .is("category", null);

  if (preErr) { console.error("ERROR:", preErr.message); process.exit(1); }
  console.log(`  category IS NULL rows before DELETE: ${preCount}`);

  if (preCount !== EXPECTED_COUNT) {
    console.error(`\nGATE FAILED: expected ${EXPECTED_COUNT} rows, found ${preCount}.`);
    console.error("Data state has changed since Step A. Do not proceed. Investigate.");
    process.exit(1);
  }
  console.log(`  Matches expected ${EXPECTED_COUNT}. Proceeding with DELETE.`);

  // Step B: DELETE
  console.log("\n=== STEP B: DELETE ===");
  const { count: deletedCount, error: deleteErr } = await supabase
    .from("delta_classifications")
    .delete({ count: "exact" })
    .is("category", null);

  if (deleteErr) { console.error("DELETE ERROR:", deleteErr.message); process.exit(1); }
  console.log(`  Rows deleted: ${deletedCount}`);

  if (deletedCount !== EXPECTED_COUNT) {
    console.error(`\nGATE FAILED: expected to delete ${EXPECTED_COUNT}, actually deleted ${deletedCount}.`);
    console.error("STOP. Do not proceed to Step D. Paste this output and investigate.");
    process.exit(1);
  }
  console.log(`  GATE PASS: deleted exactly ${EXPECTED_COUNT} rows.`);

  // Step C: post-purge verification
  console.log("\n=== STEP C: POST-PURGE VERIFICATION ===");

  const { count: nullCount, error: e1 } = await supabase
    .from("delta_classifications")
    .select("*", { count: "exact", head: true })
    .is("category", null);

  if (e1) { console.error("ERROR:", e1.message); process.exit(1); }
  console.log(`  SELECT COUNT(*) WHERE category IS NULL: ${nullCount} (expected: 0)`);

  const { count: totalCount, error: e2 } = await supabase
    .from("delta_classifications")
    .select("*", { count: "exact", head: true });

  if (e2) { console.error("ERROR:", e2.message); process.exit(1); }
  console.log(`  SELECT COUNT(*) total: ${totalCount} (expected: 0)`);

  if (nullCount === 0 && totalCount === 0) {
    console.log("\n  GATE PASS: table is empty. Verb-era rows purged.");
    console.log("  Proceed to Step D: apply the ignoreDuplicates code change.");
  } else {
    console.error(`\n  GATE FAILED: unexpected post-purge state. nullCount=${nullCount}, totalCount=${totalCount}`);
    process.exit(1);
  }
}

main().catch(console.error);
