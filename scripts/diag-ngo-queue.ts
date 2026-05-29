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

type Row = {
  source_domain: string;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
  retry_count?: number;
};

async function main() {
  // Probe for retry_count column by selecting it — error means absent
  const { data: probe } = await (sb as any)
    .from("document_queue")
    .select("id, retry_count")
    .limit(1);
  const hasRetryCount = probe && probe[0] && "retry_count" in probe[0];
  console.log(`retry_count column: ${hasRetryCount ? "EXISTS" : "does not exist"}`);

  const selectCols = ["source_domain", "error_message", "created_at", "processed_at"];
  if (hasRetryCount) selectCols.push("retry_count");

  const { data, error } = await (sb as any)
    .from("document_queue")
    .select(selectCols.join(", "))
    .eq("status", "failed")
    .in("source_domain", NGO_DOMAINS);

  if (error) { console.error("Query error:", error.message); process.exit(1); }
  const rows = (data || []) as Row[];

  if (rows.length === 0) {
    console.log("\nNO FAILED RECORDS found for these NGO domains.");
    return;
  }

  const byDomain: Record<string, {
    count: number;
    errors: Record<string, number>;
    dates: string[];
    retryCounts: number[];
  }> = {};

  for (const row of rows) {
    const d = row.source_domain || "unknown";
    if (!byDomain[d]) byDomain[d] = { count: 0, errors: {}, dates: [], retryCounts: [] };
    byDomain[d].count++;
    const err = (row.error_message || "null").slice(0, 100);
    byDomain[d].errors[err] = (byDomain[d].errors[err] || 0) + 1;
    const dateStr = row.processed_at || row.created_at;
    if (dateStr) byDomain[d].dates.push(dateStr);
    if (hasRetryCount && row.retry_count !== undefined) byDomain[d].retryCounts.push(row.retry_count);
  }

  console.log(`\nTotal failed across NGO domains: ${rows.length}\n`);

  for (const [domain, info] of Object.entries(byDomain).sort()) {
    console.log(`--- ${domain} (${info.count} failed) ---`);
    const topErrors = Object.entries(info.errors).sort((a, b) => b[1] - a[1]).slice(0, 3);
    for (const [msg, cnt] of topErrors) console.log(`  [${cnt}x] ${msg}`);
    if (info.dates.length > 0) {
      const sorted = info.dates.sort();
      console.log(`  Date range: ${sorted[0].slice(0, 10)} → ${sorted[sorted.length - 1].slice(0, 10)}`);
    }
    if (hasRetryCount && info.retryCounts.length > 0) {
      const dist: Record<number, number> = {};
      for (const c of info.retryCounts) dist[c] = (dist[c] || 0) + 1;
      const distStr = Object.entries(dist).sort().map(([k, v]) => `${k}x:${v}`).join("  ");
      console.log(`  Retry distribution: ${distStr}`);
    }
    console.log("");
  }
}

main().catch(console.error);
