/**
 * Diagnostic: investigate 1,517 source_type NULL documents.
 * Read-only. No writes.
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function main() {
  // Fetch all NULL source_type docs
  type Row = {
    id: string;
    title: string;
    source_organisation: string | null;
    document_type: string | null;
    is_primary_source: boolean;
    canonical_url: string | null;
  };
  const nullDocs: Row[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("documents")
      .select("id, title, source_organisation, document_type, is_primary_source, canonical_url")
      .eq("status", "approved")
      .is("source_type", null)
      .range(offset, offset + PAGE - 1);
    if (error) { console.error(error.message); return; }
    if (!data || data.length === 0) break;
    nullDocs.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  console.log(`\nTotal NULL source_type docs: ${nullDocs.length}\n`);

  // --- 1. Top 30 source_organisations ---
  const orgMap: Record<string, { count: number; primary: boolean }> = {};
  for (const d of nullDocs) {
    const k = d.source_organisation ?? "(null)";
    if (!orgMap[k]) orgMap[k] = { count: 0, primary: d.is_primary_source };
    orgMap[k].count++;
  }
  const topOrgs = Object.entries(orgMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30);

  console.log("=== 1. TOP 30 SOURCE_ORGANISATIONS (NULL source_type) ===");
  console.log("  Count  is_primary  Organisation");
  for (const [org, { count, primary }] of topOrgs) {
    console.log(`  ${String(count).padStart(5)}  ${String(primary).padEnd(9)}   ${org}`);
  }

  // --- 2. Top 10 document_types ---
  const typeMap: Record<string, number> = {};
  for (const d of nullDocs) {
    const k = d.document_type ?? "(null)";
    typeMap[k] = (typeMap[k] || 0) + 1;
  }
  const topTypes = Object.entries(typeMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log("\n=== 2. TOP 10 DOCUMENT_TYPES (NULL source_type) ===");
  for (const [t, c] of topTypes) console.log(`  ${String(c).padStart(5)}  ${t}`);

  // --- 3. Sample 5 titles per top-10 org ---
  const top10Orgs = topOrgs.slice(0, 10).map(([org]) => org);
  const byOrg: Record<string, string[]> = {};
  for (const d of nullDocs) {
    const k = d.source_organisation ?? "(null)";
    if (!byOrg[k]) byOrg[k] = [];
    byOrg[k].push(d.title);
  }
  console.log("\n=== 3. SAMPLE TITLES (5 random per top-10 org) ===");
  for (const org of top10Orgs) {
    const titles = shuffle([...(byOrg[org] || [])]).slice(0, 5);
    console.log(`\n  [${org}] (${byOrg[org]?.length} docs)`);
    for (const t of titles) console.log(`    - ${t}`);
  }

  // --- 4. NGO-ish keyword count ---
  const ngoKeywords = ["NGO", "Foundation", "Society", "Coalition", "Alliance",
    "Trust", "Conservation", "Network", "Council", "Association"];
  const ngoishDocs = nullDocs.filter(d =>
    ngoKeywords.some(k => d.source_organisation?.includes(k))
  );
  const ngoBreakdown: Record<string, number> = {};
  for (const d of ngoishDocs) {
    for (const k of ngoKeywords) {
      if (d.source_organisation?.includes(k)) {
        ngoBreakdown[k] = (ngoBreakdown[k] || 0) + 1;
        break;
      }
    }
  }
  console.log(`\n=== 4. NGO-ISH KEYWORD MATCHES IN NULL SET ===`);
  console.log(`  Total: ${ngoishDocs.length}`);
  for (const [k, c] of Object.entries(ngoBreakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`    "${k}": ${c}`);
  }

  // --- 5. Academic marker count ---
  const academicMarkers = ["paper", "study", "scientific", "journal", "research", "report"];
  const academicDocs = nullDocs.filter(d =>
    academicMarkers.some(k => d.document_type?.toLowerCase().includes(k))
  );
  console.log(`\n=== 5. ACADEMIC DOCUMENT_TYPE MARKERS IN NULL SET ===`);
  console.log(`  Total matching: ${academicDocs.length}`);
  const acTypeMap: Record<string, number> = {};
  for (const d of academicDocs) {
    const k = d.document_type ?? "(null)";
    acTypeMap[k] = (acTypeMap[k] || 0) + 1;
  }
  for (const [t, c] of Object.entries(acTypeMap).sort((a, b) => b[1] - a[1])) {
    console.log(`    "${t}": ${c}`);
  }

  // --- 6. Press domain check across ALL docs ---
  const { data: allDomainDocs } = await supabase
    .from("documents")
    .select("source_organisation, canonical_url, source_type")
    .eq("status", "approved")
    .not("source_organisation", "is", null);

  const pressKeywords = ["reuters", "bbc", "guardian", "bloomberg", "ap news", "apnews",
    "times", "post", "telegraph", "independent", "news", "media", "press",
    "journal", "herald", "tribune", "monitor", "dispatch", "wire"];
  const pressOrgs = (allDomainDocs || []).filter(d =>
    pressKeywords.some(k => d.source_organisation?.toLowerCase().includes(k))
  );
  const pressUrls = (allDomainDocs || []).filter(d =>
    d.canonical_url && pressKeywords.some(k => d.canonical_url!.toLowerCase().includes(k))
  );

  console.log(`\n=== 6. PRESS SIGNAL CHECK (ALL ${allDomainDocs?.length} docs) ===`);
  console.log(`  Docs with press-like source_organisation: ${pressOrgs.length}`);
  if (pressOrgs.length > 0) {
    const pressOrgCounts: Record<string, number> = {};
    for (const d of pressOrgs) {
      pressOrgCounts[d.source_organisation!] = (pressOrgCounts[d.source_organisation!] || 0) + 1;
    }
    for (const [org, c] of Object.entries(pressOrgCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      console.log(`    ${String(c).padStart(4)}  ${org}`);
    }
  }
  console.log(`  Docs with press-like canonical_url: ${pressUrls.length}`);
  if (pressUrls.length > 0) {
    for (const d of pressUrls.slice(0, 5)) console.log(`    ${d.canonical_url}`);
  }
  console.log(`\n  CONCLUSION: PRESS = 0 is ${pressOrgs.length === 0 && pressUrls.length === 0 ? "BY DESIGN — library contains no press/media documents" : "A MISS — see above"}`);
}

main().catch(console.error);
