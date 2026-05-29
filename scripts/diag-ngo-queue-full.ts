import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NGO_DOMAINS = [
  "uk.whales.org", "sas.org.uk", "awionline.org",
  "pewtrusts.org", "oceana.org", "iucn.org",
];

// Reset filter patterns (what the proposed UPDATE would catch)
const RESET_PATTERNS = [
  /403/i,
  /html/i,
  /invalid.?pdf/i,
  /download http/i,
  /empty.*pdf|pdf.*empty|size is zero/i,
];

function matchesResetFilter(msg: string | null): boolean {
  if (!msg) return false;
  return RESET_PATTERNS.some(p => p.test(msg));
}

async function main() {
  // Fetch ALL document_queue rows for these domains (any status)
  const { data: allRows, error } = await (sb as any)
    .from("document_queue")
    .select("id, source_domain, status, error_message, created_at, processed_at")
    .in("source_domain", NGO_DOMAINS);

  if (error) { console.error("Query error:", error.message); process.exit(1); }
  const rows = (allRows || []) as Array<{
    id: string;
    source_domain: string;
    status: string;
    error_message: string | null;
    created_at: string;
    processed_at: string | null;
  }>;

  console.log(`\nTotal rows in document_queue for 6 NGO domains: ${rows.length}`);

  for (const domain of NGO_DOMAINS) {
    const domainRows = rows.filter(r => r.source_domain === domain);
    const total      = domainRows.length;
    const byStatus: Record<string, number> = {};
    for (const r of domainRows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

    const failedRows = domainRows.filter(r => r.status === "failed");
    const wouldReset = failedRows.filter(r => matchesResetFilter(r.error_message));
    const wouldSkip  = failedRows.filter(r => !matchesResetFilter(r.error_message));

    // Unique error messages for would-skip group
    const skipErrors: Record<string, number> = {};
    for (const r of wouldSkip) {
      const key = (r.error_message || "null").slice(0, 120);
      skipErrors[key] = (skipErrors[key] || 0) + 1;
    }
    const topSkipErrors = Object.entries(skipErrors).sort((a, b) => b[1] - a[1]).slice(0, 3);

    console.log(`\n${"─".repeat(55)}`);
    console.log(`${domain}`);
    console.log(`  Total in queue:    ${total}`);
    const statusStr = Object.entries(byStatus).map(([s, n]) => `${s}:${n}`).join("  ");
    console.log(`  By status:         ${statusStr || "none"}`);
    console.log(`  Failed total:      ${failedRows.length}`);
    console.log(`  Matches reset filter: ${wouldReset.length}`);
    console.log(`  Does NOT match:    ${wouldSkip.length}`);

    if (wouldReset.length > 0) {
      // Show sample of errors that WOULD be reset
      const resetErrs: Record<string, number> = {};
      for (const r of wouldReset) {
        const key = (r.error_message || "null").slice(0, 100);
        resetErrs[key] = (resetErrs[key] || 0) + 1;
      }
      console.log(`  Reset-filter errors:`);
      Object.entries(resetErrs).sort((a, b) => b[1] - a[1]).slice(0, 3)
        .forEach(([msg, cnt]) => console.log(`    [${cnt}x] ${msg}`));
    }

    if (topSkipErrors.length > 0) {
      console.log(`  Non-filter errors (would be skipped by current reset):`);
      topSkipErrors.forEach(([msg, cnt]) => console.log(`    [${cnt}x] ${msg}`));
    }
  }

  // Summary table for the proposed reset
  const failedAll    = rows.filter(r => r.status === "failed");
  const wouldResetAll = failedAll.filter(r => matchesResetFilter(r.error_message));
  const wouldSkipAll  = failedAll.filter(r => !matchesResetFilter(r.error_message));

  console.log(`\n${"═".repeat(55)}`);
  console.log(`RESET FILTER SUMMARY`);
  console.log(`  Total failed (6 domains):   ${failedAll.length}`);
  console.log(`  Would be reset:             ${wouldResetAll.length}`);
  console.log(`  Would NOT be reset:         ${wouldSkipAll.length}`);
  console.log(`\nProposed UPDATE SQL (exact count = ${wouldResetAll.length} rows):`);
  console.log(`  UPDATE document_queue`);
  console.log(`  SET status='pending', error_message=NULL, processed_at=NULL`);
  console.log(`  WHERE status='failed'`);
  console.log(`    AND source_domain IN ('${NGO_DOMAINS.join("','")}')`);
  console.log(`    AND (`);
  console.log(`      error_message ILIKE '%403%'`);
  console.log(`      OR error_message ILIKE '%HTML%'`);
  console.log(`      OR error_message ILIKE '%invalid PDF%'`);
  console.log(`      OR error_message ILIKE '%Download HTTP%'`);
  console.log(`      OR error_message ILIKE '%size is zero%'`);
  console.log(`    );`);
}

main().catch(console.error);
