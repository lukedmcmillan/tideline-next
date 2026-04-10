import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// OAI-PMH endpoint — works without browser, unlike the search UI
const OAI_BASE = "https://digitallibrary.un.org/oai2d";
const USER_AGENT = "Tideline Library Bot/1.0";
const MAX_PAGES = 50; // ~200 records/page = ~10,000 records scanned

const OCEAN_KEYWORDS = /ocean|marine|sea\b|seas\b|maritime|fisheries|fisher|coral|mangrove|seabed|aquatic|coastal|unclos|marpol|iwc|isa\b|bbnj|whaling|shipping|vessel|port state|deep.sea|continental shelf|exclusive economic zone|high seas|law of the sea|pollution|biodiversity|climate change|sustainable development|small island|pacific island|arctic|antarctic|tuna|salmon|fishing|piracy|naval|harbour|harbor|blue economy|wetland|estuar|atoll|reef|desalin|tsunami|flood|erosion.*coast/i;
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

    records.push({ title, docSymbol, subjects, pdfUrls });
  }
  return records;
}

function extractResumptionToken(xml: string): string | null {
  const match = xml.match(/<resumptionToken[^>]*>([^<]+)<\/resumptionToken>/);
  return match ? match[1] : null;
}

function isOceanRelevant(record: ParsedRecord): boolean {
  if (record.pdfUrls.length === 0) return false;
  const text = [...record.subjects, record.title].join(" ");
  return OCEAN_KEYWORDS.test(text);
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
  console.log("=== Tideline UN Digital Library Scraper (OAI-PMH) ===\n");

  // Harvest records from last 365 days
  const since = new Date();
  since.setDate(since.getDate() - 365);
  const fromDate = since.toISOString().split("T")[0];

  let url = `${OAI_BASE}?verb=ListRecords&metadataPrefix=marcxml&from=${fromDate}`;
  let totalQueued = 0;
  let totalRecords = 0;
  let totalRelevant = 0;
  let page = 0;

  while (url && page < MAX_PAGES) {
    page++;
    console.log(`  Page ${page}: fetching...`);

    let xml: string;
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) {
        console.log(`  HTTP ${res.status}, stopping`);
        break;
      }
      xml = await res.text();
    } catch (err) {
      console.log(`  Fetch error: ${err}`);
      break;
    }

    const records = parseRecords(xml);
    totalRecords += records.length;
    console.log(`  Page ${page}: ${records.length} records`);

    if (records.length === 0) break;

    let pageQueued = 0;
    for (const record of records) {
      if (!isOceanRelevant(record)) continue;
      totalRelevant++;

      for (const pdfUrl of record.pdfUrls) {
        const queued = await queuePdf(pdfUrl, record.docSymbol);
        if (queued) pageQueued++;
      }
    }

    totalQueued += pageQueued;
    console.log(`  Page ${page}: ${pageQueued} ocean-relevant PDFs queued`);

    // Follow resumption token for next page
    const token = extractResumptionToken(xml);
    if (token) {
      url = `${OAI_BASE}?verb=ListRecords&resumptionToken=${encodeURIComponent(token)}`;
    } else {
      url = "";
    }

    await sleep(1000); // polite delay
  }

  console.log(`\n=== Complete ===`);
  console.log(`  Records scanned: ${totalRecords}`);
  console.log(`  Ocean-relevant: ${totalRelevant}`);
  console.log(`  New PDFs queued: ${totalQueued}`);
}

main().catch(console.error);
