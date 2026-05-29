// Verifies warm-cache behaviour by inspecting classified_at timestamps.
// If all rows were written during Brief #1 (07:00) and none during Briefs #2-4 (14:21-14:39),
// that proves warm-cache zero model calls without needing Vercel log granularity.
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: rows } = await s
    .from("delta_classifications")
    .select("story_id, classified_at")
    .eq("prompt_version", "f6491a2171c78bdf")
    .not("category", "is", null)
    .order("classified_at", { ascending: true });

  if (!rows || rows.length === 0) { console.log("No rows found"); return; }

  // Group by hour:minute bucket
  const buckets = new Map<string, number>();
  for (const r of rows) {
    const dt = new Date(r.classified_at);
    const key = `${dt.toISOString().slice(0, 16)} UTC`; // YYYY-MM-DDTHH:MM
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  console.log(`=== classified_at distribution (${rows.length} rows, prompt_version=f6491a2171c78bdf) ===`);
  for (const [bucket, count] of [...buckets.entries()].sort()) {
    console.log(`  ${bucket}: ${count} rows written`);
  }

  const first = rows[0].classified_at;
  const last  = rows[rows.length - 1].classified_at;
  console.log(`\n  Earliest write: ${first}`);
  console.log(`  Latest write:   ${last}`);
  console.log(`  Total rows:     ${rows.length}`);

  // Were any rows written during the warm runs (14:21, 14:26, 14:39)?
  const warmWindow = rows.filter(r => {
    const h = new Date(r.classified_at).getUTCHours();
    const m = new Date(r.classified_at).getUTCMinutes();
    return h >= 14 && m >= 20; // after 14:20 UTC
  });
  console.log(`\n  Rows written after 14:20 UTC (warm runs): ${warmWindow.length}`);
  if (warmWindow.length === 0) {
    console.log("  ✓ WARM-CACHE VERIFIED — zero model calls on Briefs #2-4");
  } else {
    console.log("  ✗ WARM-CACHE FAIL — new classifications written during warm runs");
    for (const r of warmWindow) console.log(`    ${r.classified_at} | ${r.story_id}`);
  }
}
main().catch(console.error);
