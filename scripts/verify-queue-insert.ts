/**
 * Verify InforMEA document_queue inserts — show 3 CITES and 3 IWC rows
 * Usage: npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/verify-queue-insert.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Count by source_domain + source_format
  const { data: counts } = await supabase
    .from("document_queue")
    .select("source_domain, source_format, status")
    .eq("status", "pending")
    .in("source_domain", ["cites.org", "icrw.org", "iwcoffice.org", "cbd.int", "ascobans.org", "bcasp.es"])
    .order("created_at", { ascending: false });

  const byDomain: Record<string, number> = {};
  for (const row of counts || []) {
    const key = `${row.source_domain} (${row.source_format})`;
    byDomain[key] = (byDomain[key] || 0) + 1;
  }

  console.log("\n=== document_queue — pending InforMEA rows by domain ===");
  Object.entries(byDomain).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => {
    console.log(`  ${String(n).padStart(4)}  ${k}`);
  });

  // Fetch 3 CITES rows
  const { data: cites } = await supabase
    .from("document_queue")
    .select("id, file_url, source_url, source_domain, file_name, is_primary_source, status, source_format, created_at")
    .eq("source_domain", "cites.org")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(3);

  console.log("\n=== CITES sample rows (3) ===");
  (cites || []).forEach((row, i) => {
    console.log(`\n[${i + 1}]`);
    console.log(`  id             : ${row.id}`);
    console.log(`  file_url       : ${row.file_url}`);
    console.log(`  source_url     : ${row.source_url}`);
    console.log(`  source_domain  : ${row.source_domain}`);
    console.log(`  file_name      : ${row.file_name}`);
    console.log(`  is_primary_src : ${row.is_primary_source}`);
    console.log(`  status         : ${row.status}`);
    console.log(`  source_format  : ${row.source_format}`);
    console.log(`  created_at     : ${row.created_at}`);
  });

  // Fetch 3 IWC rows
  const { data: iwc } = await supabase
    .from("document_queue")
    .select("id, file_url, source_url, source_domain, file_name, is_primary_source, status, source_format, created_at")
    .eq("status", "pending")
    .ilike("file_name", "IWC_%")
    .order("created_at", { ascending: false })
    .limit(3);

  console.log("\n=== IWC sample rows (3) ===");
  (iwc || []).forEach((row, i) => {
    console.log(`\n[${i + 1}]`);
    console.log(`  id             : ${row.id}`);
    console.log(`  file_url       : ${row.file_url}`);
    console.log(`  source_url     : ${row.source_url}`);
    console.log(`  source_domain  : ${row.source_domain}`);
    console.log(`  file_name      : ${row.file_name}`);
    console.log(`  status         : ${row.status}`);
    console.log(`  source_format  : ${row.source_format}`);
  });

  // Any source_format nulls?
  const { count: nullCount } = await supabase
    .from("document_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .is("source_format", null)
    .in("source_domain", ["cites.org", "icrw.org", "iwcoffice.org", "cbd.int"]);

  console.log(`\n=== source_format nulls in pending InforMEA rows: ${nullCount ?? 0} ===\n`);
}

main().catch(console.error);
