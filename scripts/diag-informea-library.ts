import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// InforMEA file_name slugs start with treaty prefix: IWC_DEC_, CITES_DEC_, CBD_DEC_, etc.
// Extract treaty prefix from slug e.g. "IWC_DEC_2024_2" -> "IWC"
function treaty(slug: string | null): string {
  if (!slug) return "(unknown)";
  const m = slug.match(/^([A-Z0-9]+)_DEC_/);
  return m?.[1] ?? slug.split("_")[0] ?? "(unknown)";
}

async function main() {
  // ── Q1: All InforMEA items in document_queue, full status breakdown by treaty ──
  console.log("=== (1) document_queue — InforMEA items by treaty and status ===");
  const { data: allQ } = await s
    .from("document_queue")
    .select("file_name, status, created_at, processed_at, error_message")
    .ilike("source_url", "%informea%");

  const matrix: Record<string, Record<string, number>> = {};
  const allStatuses = new Set<string>();
  for (const r of allQ ?? []) {
    const t = treaty(r.file_name);
    const st = r.status ?? "null";
    allStatuses.add(st);
    if (!matrix[t]) matrix[t] = {};
    matrix[t][st] = (matrix[t][st] ?? 0) + 1;
  }
  const statuses = [...allStatuses].sort();
  console.log(`  Total InforMEA queue items: ${(allQ ?? []).length}`);
  console.log(`  ${"Treaty".padEnd(14)} | ${statuses.map(s => s.padEnd(12)).join(" | ")}`);
  console.log(`  ${"-".repeat(14)}-+-${statuses.map(() => "-".repeat(12)).join("-+-")}`);
  for (const [t, counts] of Object.entries(matrix).sort()) {
    console.log(`  ${t.padEnd(14)} | ${statuses.map(st => String(counts[st] ?? 0).padEnd(12)).join(" | ")}`);
  }

  // ── Q2: Completed items → try to match against documents via canonical_url or source_organisation ──
  console.log("\n=== (2) Documents in library — source_organisation breakdown for MEA bodies ===");
  // InforMEA covers: IWC, CITES, CBD, Barcelona Convention, ASCOBANS, CMS, Ramsar, etc.
  const meaOrgs = ["IWC", "CITES", "CBD", "Barcelona", "ASCOBANS", "CMS", "Ramsar", "OSPAR", "HELCOM"];
  const { data: docs } = await s
    .from("documents")
    .select("id, source_organisation, published_date, canonical_url, source_format")
    .or(meaOrgs.map(o => `source_organisation.ilike.%${o}%`).join(","));

  const byOrg: Record<string, { count: number; earliest: string; latest: string }> = {};
  for (const d of docs ?? []) {
    const org = d.source_organisation ?? "(unknown)";
    const date = d.published_date ?? "";
    if (!byOrg[org]) byOrg[org] = { count: 0, earliest: date, latest: date };
    byOrg[org].count++;
    if (date && date < byOrg[org].earliest) byOrg[org].earliest = date;
    if (date && date > byOrg[org].latest)   byOrg[org].latest   = date;
  }
  if (Object.keys(byOrg).length === 0) {
    console.log("  No documents found for MEA organisations.");
  } else {
    for (const [org, { count, earliest, latest }] of Object.entries(byOrg).sort((a,b) => b[1].count - a[1].count))
      console.log(`  ${org.slice(0,40).padEnd(40)} | ${count} docs | ${earliest} → ${latest}`);
    console.log(`  TOTAL: ${docs?.length ?? 0}`);
  }

  // Also check canonical_url for informea.org hits
  const { data: byUrl } = await s
    .from("documents")
    .select("id, title, source_organisation, canonical_url")
    .ilike("canonical_url", "%informea%")
    .limit(5);
  if (byUrl && byUrl.length > 0) {
    console.log(`\n  (also found ${byUrl.length} docs with canonical_url containing 'informea'):`);
    for (const d of byUrl)
      console.log(`    ${d.source_organisation} | ${d.canonical_url?.slice(0,80)}`);
  }

  // ── Q3: Failed items — error breakdown ──
  console.log("\n=== (3) Failed InforMEA queue items — error summary ===");
  const failed = (allQ ?? []).filter(r => r.status === "failed");
  const errBuckets: Record<string, number> = {};
  for (const r of failed) {
    const err = (r.error_message ?? "no message").slice(0, 60);
    errBuckets[err] = (errBuckets[err] ?? 0) + 1;
  }
  console.log(`  Total failed: ${failed.length}`);
  for (const [err, count] of Object.entries(errBuckets).sort((a,b) => b[1]-a[1]))
    console.log(`  ×${count} — ${err}`);

  // ── Q4: Pending/processing items (resumable) ──
  const pending = (allQ ?? []).filter(r => r.status === "pending" || r.status === "processing");
  console.log(`\n=== (4) Resumable (pending/processing): ${pending.length} items ===`);
  if (pending.length > 0) {
    const byT: Record<string,number> = {};
    for (const r of pending) { const t = treaty(r.file_name); byT[t] = (byT[t]??0)+1; }
    for (const [t, c] of Object.entries(byT).sort()) console.log(`  ${t}: ${c}`);
  }

  // ── Summary: completed count by treaty ──
  const completed = (allQ ?? []).filter(r => r.status === "completed" || r.status === "processed");
  console.log(`\n=== (5) Completed (processed into library): ${completed.length} items ===`);
  const compByT: Record<string,number> = {};
  for (const r of completed) { const t = treaty(r.file_name); compByT[t] = (compByT[t]??0)+1; }
  for (const [t, c] of Object.entries(compByT).sort()) console.log(`  ${t}: ${c}`);
}
main().catch(console.error);
