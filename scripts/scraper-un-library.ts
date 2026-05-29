import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { fetchAsTideline, RobotsBlocked } from "../app/lib/http-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// OAI-PMH endpoint — machine-harvest interface exposed by the UN Digital Library.
// NOT blocked by robots.txt (only /rss and /search are disallowed).
// robots.txt specifies Crawl-Delay: 5 — honored automatically by fetchAsTideline.
const OAI_BASE = "https://digitallibrary.un.org/oai2d";
const MAX_PAGES = 50; // ~200 records/page = ~10,000 records scanned

// UNBIS Thesaurus controlled vocabulary anchors (all-caps per UNBIS convention).
// These are the subject headings stored in MARC 650 $a by the UN Digital Library.
// A record passes the subject filter if ANY of its 650 $a values contains one of
// these strings (case-insensitive partial match). This is the primary filter.
//
// Partial match is intentional: "FISHERIES POLICY", "FISHERIES MANAGEMENT",
// "MARINE POLLUTION" all pass via their anchor term.
const UNBIS_ANCHORS = [
  "LAW OF THE SEA",
  "MARINE",
  "OCEAN",
  "FISHERIES",
  "MARITIME LAW",
  "SEABED",
  "HIGH SEAS",
  "EXCLUSIVE ECONOMIC ZONE",
  "CONTINENTAL SHELF",
  "BBNJ",
  "UNCLOS",
];

// Hard ocean terms — secondary filter applied to title + subjects if UNBIS primary misses.
// Defense-in-depth against catalog-added-date noise.
const HARD_OCEAN = /ocean|marine|sea\b|seas\b|maritime|fisheries|seabed|coral|unclos|bbnj|aquaculture|coastal|A\/CONF\.232|high seas|areas beyond national jurisdiction|biological diversity beyond/i;
// Exclusion subjects — skip records about these even if they match an anchor incidentally
const EXCLUDE_SUBJECTS = /decolonization|colonial|apartheid|sanctions|terrorism|yugoslavia|libya\b|iraq\b/i;
// Procedural filename patterns to skip
const PROCEDURAL_FILE = /_PV\.|_SR\.|_PV-|_SR-/i;
const NON_EN_PDF = /-AR\.pdf|-FR\.pdf|-ES\.pdf|-RU\.pdf|-ZH\.pdf|_AR\.|_FR\.|_ES\.|_RU\.|_ZH\./i;

// --- MARC XML parsing (namespace-aware: marc:datafield, marc:subfield) ---

function extractMarcFields(recordXml: string, tag: string, subfieldCode: string): string[] {
  // Match both marc:datafield and datafield variants
  const tagRegex = new RegExp(
    `<(?:marc:)?datafield[^>]+tag=["']${tag}["'][^>]*>([\\s\\S]*?)</(?:marc:)?datafield>`,
    "gi"
  );
  const results: string[] = [];
  let match;
  while ((match = tagRegex.exec(recordXml)) !== null) {
    const sfRegex = new RegExp(
      `<(?:marc:)?subfield[^>]+code=["']${subfieldCode}["'][^>]*>([^<]*)</(?:marc:)?subfield>`,
      "gi"
    );
    let sfMatch;
    while ((sfMatch = sfRegex.exec(match[1])) !== null) {
      const val = sfMatch[1].trim();
      if (val) results.push(val);
    }
  }
  return results;
}

function extractFirstMarcField(recordXml: string, tag: string, subfieldCode: string): string {
  const vals = extractMarcFields(recordXml, tag, subfieldCode);
  return vals[0] || "";
}

interface ParsedRecord {
  title: string;
  docSymbol: string;
  date: string;
  subjects: string[];
  pdfUrls: string[];
}

function parseRecords(xml: string): ParsedRecord[] {
  const recordRegex = /<record>([\s\S]*?)<\/record>/gi;
  const records: ParsedRecord[] = [];
  let match;
  while ((match = recordRegex.exec(xml)) !== null) {
    const rec = match[1];
    const title = extractFirstMarcField(rec, "245", "a");
    const docSymbol = extractFirstMarcField(rec, "191", "a") || extractFirstMarcField(rec, "099", "a");
    const date = extractFirstMarcField(rec, "269", "a") || extractFirstMarcField(rec, "260", "c");
    const subjects = extractMarcFields(rec, "650", "a");

    // Get all 856$u URLs, filter to English PDFs only
    const allUrls = extractMarcFields(rec, "856", "u");
    const pdfUrls = allUrls.filter(u =>
      /\.pdf/i.test(u) && !NON_EN_PDF.test(u) && /-EN\.pdf/i.test(u)
    );
    // If no explicit EN PDF, try any English-looking PDF (no language suffix = likely English)
    if (pdfUrls.length === 0) {
      const fallback = allUrls.filter(u =>
        /\.pdf/i.test(u) && !NON_EN_PDF.test(u) && !/-[A-Z]{2}\.pdf/i.test(u)
      );
      pdfUrls.push(...fallback);
    }

    records.push({ title, docSymbol, date, subjects, pdfUrls });
  }
  return records;
}

function extractResumptionToken(xml: string): string | null {
  const match = xml.match(/<resumptionToken[^>]*>([^<]+)<\/resumptionToken>/);
  return match ? match[1] : null;
}

// Primary UNBIS subject filter: check MARC 650 $a values against anchor terms.
function hasUnbisOceanSubject(subjects: string[]): boolean {
  return subjects.some(s =>
    UNBIS_ANCHORS.some(anchor => s.toUpperCase().includes(anchor))
  );
}

function isOceanRelevant(record: ParsedRecord): boolean {
  if (record.pdfUrls.length === 0) return false;

  // Skip documents published before 1994 (UNCLOS entry into force)
  if (record.date) {
    const year = parseInt(record.date.slice(0, 4), 10);
    if (!isNaN(year) && year < 1994) return false;
  }

  const subjectText = record.subjects.join(" ");

  // Exclude known irrelevant topics even if they incidentally contain an anchor
  if (EXCLUDE_SUBJECTS.test(subjectText)) return false;

  // Filter out procedural records (PV, SR)
  record.pdfUrls = record.pdfUrls.filter(url => !PROCEDURAL_FILE.test(url));
  if (record.pdfUrls.length === 0) return false;

  // PRIMARY: UNBIS subject heading match (MARC 650 $a)
  if (hasUnbisOceanSubject(record.subjects)) return true;

  // SECONDARY (defense-in-depth): title keyword match
  if (HARD_OCEAN.test(record.title)) return true;

  // SECONDARY: doc symbol indicates ocean body (A/CONF.62 = UNCLOS, ISBA = ISA)
  if (/CONF\.62|ISBA|BBNJ|IMO|MEPC/i.test(record.docSymbol)) return true;

  return false;
}

// --- Queue helpers ---

function fileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "unknown.pdf");
  } catch {
    return "unknown.pdf";
  }
}

async function isAlreadyQueued(fileUrl: string): Promise<boolean> {
  const { data: q } = await supabase
    .from("document_queue")
    .select("id")
    .eq("file_url", fileUrl)
    .limit(1);
  if (q && q.length > 0) return true;
  const { data: d } = await supabase
    .from("documents")
    .select("id")
    .eq("file_url", fileUrl)
    .limit(1);
  return !!(d && d.length > 0);
}

async function queuePdf(pdfUrl: string, docSymbol: string): Promise<boolean> {
  const exists = await isAlreadyQueued(pdfUrl);
  if (exists) return false;
  const fileName = docSymbol
    ? `${docSymbol.replace(/\//g, "_")}.pdf`
    : fileNameFromUrl(pdfUrl);
  const { error } = await supabase.from("document_queue").insert({
    source_url: OAI_BASE,
    source_domain: "digitallibrary.un.org",
    file_url: pdfUrl,
    file_name: fileName,
    is_primary_source: true,
    status: "pending",
  });
  if (error && !error.message.includes("duplicate")) {
    console.log(`  Insert error: ${error.message}`);
    return false;
  }
  return !error;
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// --- Main ---

async function main() {
  const dryRun  = process.argv.includes("--dry-run");
  const limitArg = process.argv.find(a => a.startsWith("--limit="));
  const limit   = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;

  console.log(`=== Tideline UN Digital Library Scraper (OAI-PMH + UNBIS filter)${dryRun ? " (DRY RUN — no DB writes)" : ""} ===`);
  console.log(`Endpoint: ${OAI_BASE} (robots.txt-permitted machine harvest interface)`);
  console.log(`Primary filter: MARC 650 $a UNBIS subject anchors`);
  console.log(`Secondary filter: HARD_OCEAN title/symbol regex`);
  console.log(`Crawl-Delay: 5s (enforced by fetchAsTideline via robots-parser)`);

  // Harvest records from last 90 days (bounded from+until — open-ended `from` triggers 503s).
  // 90-day window captures all active UN governance cycles. Full backfill runs quarterly.
  const until = new Date();
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const fromDate  = since.toISOString().split("T")[0];
  const untilDate = until.toISOString().split("T")[0];

  console.log(`Date window: ${fromDate} to ${untilDate}\n`);

  let url = `${OAI_BASE}?verb=ListRecords&metadataPrefix=marcxml&from=${fromDate}&until=${untilDate}`;
  let totalQueued   = 0;
  let totalRecords  = 0;
  let totalRelevant = 0;
  let page = 0;

  // Dry-run diagnostics
  const subjectFreq: Record<string, number> = {};
  const yearFreq:    Record<string, number> = {};
  let   sampleTitles: string[] = [];

  while (url && page < MAX_PAGES && totalQueued < limit) {
    page++;
    console.log(`  Page ${page}: fetching...`);

    let xml: string;
    try {
      const res = await fetchAsTideline(url);
      if (!res.ok) {
        console.log(`  HTTP ${res.status}, stopping`);
        break;
      }
      xml = await res.text();
    } catch (err) {
      if (err instanceof RobotsBlocked) {
        console.log(`  RobotsBlocked: domain=${err.domain} rule="${err.rule}" — stopping`);
        break;
      }
      console.log(`  Fetch error: ${err}`);
      break;
    }

    const records = parseRecords(xml);
    totalRecords += records.length;
    console.log(`  Page ${page}: ${records.length} records`);

    if (records.length === 0) break;

    let pageQueued = 0;
    for (const record of records) {
      // Accumulate diagnostics regardless of relevance (dry-run only, first 200 records)
      if (dryRun && totalRecords <= 200) {
        for (const s of record.subjects) {
          const key = s.toUpperCase().slice(0, 40);
          subjectFreq[key] = (subjectFreq[key] ?? 0) + 1;
        }
        const year = record.date ? record.date.slice(0, 4) : "unknown";
        yearFreq[year] = (yearFreq[year] ?? 0) + 1;
      }

      if (!isOceanRelevant(record)) continue;
      totalRelevant++;

      if (dryRun && sampleTitles.length < 10) {
        sampleTitles.push(`  [${record.docSymbol}] ${record.title.slice(0, 80)}`);
      }

      if (dryRun) {
        pageQueued++;
      } else {
        for (const pdfUrl of record.pdfUrls) {
          const queued = await queuePdf(pdfUrl, record.docSymbol);
          if (queued) pageQueued++;
        }
      }

      if (totalQueued + pageQueued >= limit) break;
    }

    totalQueued += pageQueued;
    console.log(`  Page ${page}: ${pageQueued} ocean-relevant records ${dryRun ? "would be queued" : "queued"}`);

    // Follow resumption token for next page
    const token = extractResumptionToken(xml);
    if (token) {
      url = `${OAI_BASE}?verb=ListRecords&resumptionToken=${encodeURIComponent(token)}`;
    } else {
      url = "";
    }

    // sleep() call is defense-in-depth; fetchAsTideline already enforces Crawl-Delay: 5
    await sleep(200);
  }

  console.log(`\n=== Complete ===`);
  console.log(`  Records scanned:  ${totalRecords}`);
  console.log(`  Ocean-relevant:   ${totalRelevant}`);
  console.log(`  PDFs ${dryRun ? "would be queued" : "queued"}: ${totalQueued}`);

  if (dryRun) {
    console.log(`\n--- Subject frequency (top 20 across scanned records) ---`);
    const topSubjects = Object.entries(subjectFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    for (const [s, n] of topSubjects) console.log(`  ${n.toString().padStart(4)}  ${s}`);

    console.log(`\n--- Year distribution (publication date) ---`);
    const topYears = Object.entries(yearFreq)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 15);
    for (const [y, n] of topYears) console.log(`  ${y}: ${n}`);

    console.log(`\n--- Sample ocean-relevant titles ---`);
    for (const t of sampleTitles) console.log(t);

    console.log(`\n  Ocean-relevant ratio: ${totalRelevant}/${totalRecords} (${totalRecords > 0 ? Math.round(totalRelevant / totalRecords * 100) : 0}%)`);
    console.log(`  (DRY RUN — no writes made to document_queue)`);
  }
}

main().catch(console.error);
