/**
 * Diagnose InforMEA dedup: find pre-existing rows that blocked tonight's scraper.
 * Also probes the isAlreadyQueued logic: checks both document_queue.file_url
 * and documents.file_url for overlap with InforMEA domains.
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INFORMEA_DOMAINS = ["cites.org", "cbd.int", "ascobans.org", "bcasp.es",
  "barcelona-convention.org", "baselconvention.org", "iwc.int", "crm.iwc.int"];

async function main() {
  // 1. document_queue rows by source_domain with informea source_url
  const { data: queueRows } = await sb.from("document_queue")
    .select("source_domain, source_url, created_at")
    .or(`source_url.ilike.%informea%,source_domain.in.(${INFORMEA_DOMAINS.join(",")})`)
    .order("created_at", { ascending: true });

  const byDomain: Record<string, { count: number; first: string; last: string }> = {};
  for (const r of queueRows || []) {
    const d = r.source_domain || "unknown";
    if (!byDomain[d]) byDomain[d] = { count: 0, first: r.created_at, last: r.created_at };
    byDomain[d].count++;
    if (r.created_at < byDomain[d].first) byDomain[d].first = r.created_at;
    if (r.created_at > byDomain[d].last) byDomain[d].last = r.created_at;
  }

  console.log("\n=== document_queue rows matching InforMEA domains or source_url ===");
  console.log("source_domain                  | count | first_inserted       | last_inserted");
  console.log("-------------------------------|-------|----------------------|---------------------");
  Object.entries(byDomain).sort((a,b)=>b[1].count-a[1].count).forEach(([d,v])=>{
    console.log(`${d.padEnd(30)} | ${String(v.count).padStart(5)} | ${v.first.slice(0,19)} | ${v.last.slice(0,19)}`);
  });

  // 2. isAlreadyQueued dedup logic: checks document_queue.file_url
  // Barcelona dedup example — what are the existing barcelona rows?
  const { data: barcelona } = await sb.from("document_queue")
    .select("file_url, source_domain, created_at, status")
    .ilike("source_domain", "%barcelona%")
    .order("created_at", { ascending: true })
    .limit(3);

  console.log("\n=== Sample Barcelona existing rows (explains 121 dups) ===");
  (barcelona||[]).forEach(r => console.log(r.created_at?.slice(0,10), "|", r.status, "|", r.file_url?.slice(0,70)));

  // 3. CBD rows (explains 112 dups)
  const { data: cbd } = await sb.from("document_queue")
    .select("file_url, source_domain, created_at, status")
    .eq("source_domain", "cbd.int")
    .order("created_at", { ascending: true })
    .limit(3);

  console.log("\n=== Sample CBD existing rows (explains 112 dups) ===");
  (cbd||[]).forEach(r => console.log(r.created_at?.slice(0,10), "|", r.status, "|", r.file_url?.slice(0,70)));

  // 4. Check if the OLD scraper (informea.org domain) populated these
  const { count: informeaOrgCount } = await sb.from("document_queue")
    .select("*", { count: "exact", head: true })
    .eq("source_domain", "informea.org");
  const { data: informeaOrgSample } = await sb.from("document_queue")
    .select("file_url, source_url, created_at, status")
    .eq("source_domain", "informea.org")
    .order("created_at", { ascending: true })
    .limit(3);

  console.log(`\n=== Old scraper (source_domain='informea.org') rows: ${informeaOrgCount} ===`);
  (informeaOrgSample||[]).forEach(r => console.log(r.created_at?.slice(0,10), "|", r.status, "|", r.file_url?.slice(0,70)));
}

main().catch(console.error);
