import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SEARCH_QUERIES = [
  "ocean governance",
  "marine environment protection",
  "law of the sea",
  "deep sea mining seabed",
  "marine biodiversity conservation",
  "fisheries management",
  "maritime pollution MARPOL",
  "coral reef protection",
  "blue carbon ocean",
  "marine protected areas",
  "BBNJ high seas treaty",
  "ocean climate change",
  "illegal unreported fishing IUU",
  "whaling moratorium IWC",
  "UNCLOS convention sea",
];

const BASE_URL = "https://digitallibrary.un.org/search";
const RESULTS_PER_PAGE = 100;
const MAX_RECORDS_PER_QUERY = 500;
const USER_AGENT = "Tideline Library Bot/1.0";

const OCEAN_KEYWORDS = /ocean|marine|sea|maritime|fisheries|coral|mangrove|seabed|aquatic|coastal|unclos|marpol|iwc|isa|bbnj|whaling/i;
const NON_EN_URL = /\/arabic\/|\/french\/|\/spanish\/|\/russian\/|\/chinese\/|_A_|_F_|_S_|_R_|_C_|-ar-|-fr-|-es-/i;
const NON_EN_FILE = /_chi\.pdf$|_rus\.pdf$|_ar\.pdf$|_fr\.pdf$|_es\.pdf$|-fr\.pdf$|-es\.pdf$|-ar\.pdf$|-ch\.pdf$|_FR_|_ES_|_AR_|_ZH_|_RU_/i;

// --- MARC XML parsing helpers (regex, no XML dependency) ---

function extractMarcField(xml: string, tag: string, subfieldCode?: string): string {
  const tagRegex = new RegExp(
    `<datafield[^>]+tag=["']${tag}["'][^>]*>([\\s\\S]*?)</datafield>`,
    "gi"
  );
  const match = tagRegex.exec(xml);
  if (!match) return "";

  if (subfieldCode) {
    const sfRegex = new RegExp(
      `<subfield[^>]+code=["']${subfieldCode}["'][^>]*>([^<]*)</subfield>`,
      "i"
    );
    const sfMatch = sfRegex.exec(match[1]);
    return sfMatch ? sfMatch[1].trim() : "";
  }

  const allSf = [...match[1].matchAll(/<subfield[^>]*>([^<]*)<\/subfield>/gi)];
  return allSf.map(m => m[1].trim()).join(" ");
}

function extractAllMarcFields(xml: string, tag: string, subfieldCode?: string): string[] {
  const tagRegex = new RegExp(
    `<datafield[^>]+tag=["']${tag}["'][^>]*>([\\s\\S]*?)</datafield>`,
    "gi"
  );
  const results: string[] = [];
  let match;
  while ((match = tagRegex.exec(xml)) !== null) {
    if (subfieldCode) {
      const sfRegex = new RegExp(
        `<subfield[^>]+code=["']${subfieldCode}["'][^>]*>([^<]*)</subfield>`,
        "i"
      );
      const sfMatch = sfRegex.exec(match[1]);
      if (sfMatch) results.push(sfMatch[1].trim());
    } else {
      const allSf = [...match[1].matchAll(/<subfield[^>]*>([^<]*)<\/subfield>/gi)];
      results.push(allSf.map(m => m[1].trim()).join(" "));
    }
  }
  return results;
}

function extractPdfUrls(xml: string): string[] {
  const urls = extractAllMarcFields(xml, "856", "u");
  return urls.filter(u => /\.pdf/i.test(u) && !NON_EN_URL.test(u) && !NON_EN_FILE.test(u));
}

interface ParsedRecord {
  title: string;
  date: string;
  subjects: string[];
  pdfUrls: string[];
  docSymbol: string;
  issuingBody: string;
}

function parseRecords(xmlResponse: string): ParsedRecord[] {
  const recordRegex = /<record>([\s\S]*?)<\/record>/gi;
  const records: ParsedRecord[] = [];
  let match;
  while ((match = recordRegex.exec(xmlResponse)) !== null) {
    const xml = match[1];
    const title = extractMarcField(xml, "245", "a");
    const date = extractMarcField(xml, "269", "a") || extractMarcField(xml, "260", "c");
    const subjects = extractAllMarcFields(xml, "650", "a");
    const pdfUrls = extractPdfUrls(xml);
    const docSymbol = extractMarcField(xml, "191", "a") || extractMarcField(xml, "099", "a");
    const issuingBody = extractMarcField(xml, "110", "a") || extractMarcField(xml, "710", "a");
    records.push({ title, date, subjects, pdfUrls, docSymbol, issuingBody });
  }
  return records;
}

function extractTotalResults(xml: string): number {
  const match = xml.match(/search_nbrecs[^>]*>(\d+)</i) || xml.match(/<!-- Search-Engine-Total-Number-Of-Results: (\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function isRelevant(record: ParsedRecord): boolean {
  if (record.pdfUrls.length === 0) return false;
  const allSubjects = record.subjects.join(" ").toLowerCase();
  const titleLower = record.title.toLowerCase();
  const combined = allSubjects + " " + titleLower;
  return OCEAN_KEYWORDS.test(combined);
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

async function queuePdf(pdfUrl: string, searchUrl: string, fileName: string): Promise<boolean> {
  const exists = await isAlreadyQueued(pdfUrl);
  if (exists) return false;
  const { error } = await supabase.from("document_queue").insert({
    source_url: searchUrl,
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

async function searchQuery(query: string): Promise<number> {
  console.log(`\n  Query: "${query}"`);
  let totalQueued = 0;
  let jrec = 1;
  let totalResults = 0;
  let page = 0;

  while (jrec <= MAX_RECORDS_PER_QUERY) {
    page++;
    const params = new URLSearchParams({
      p: query,
      of: "hx",
      action_search: "Search",
      rg: String(RESULTS_PER_PAGE),
      jrec: String(jrec),
    });
    const searchUrl = `${BASE_URL}?${params}`;

    let xml: string;
    try {
      const res = await fetch(searchUrl, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!res.ok) {
        console.log(`  HTTP ${res.status} for page ${page}`);
        break;
      }
      xml = await res.text();
    } catch (err) {
      console.log(`  Fetch error page ${page}: ${err}`);
      break;
    }

    if (page === 1) {
      totalResults = extractTotalResults(xml);
      console.log(`  Total results: ${totalResults}`);
    }

    const records = parseRecords(xml);
    if (records.length === 0) {
      console.log(`  No records on page ${page}, stopping`);
      break;
    }

    let pageQueued = 0;
    for (const record of records) {
      if (!isRelevant(record)) continue;

      for (const pdfUrl of record.pdfUrls) {
        const fileName = record.docSymbol
          ? `${record.docSymbol.replace(/\//g, "_")}.pdf`
          : fileNameFromUrl(pdfUrl);
        const queued = await queuePdf(pdfUrl, searchUrl, fileName);
        if (queued) pageQueued++;
      }
    }

    totalQueued += pageQueued;
    console.log(`  Page ${page}: ${records.length} records, ${pageQueued} queued`);

    jrec += RESULTS_PER_PAGE;
    if (jrec > totalResults || jrec > MAX_RECORDS_PER_QUERY) break;

    await sleep(1000);
  }

  return totalQueued;
}

async function main() {
  console.log("=== Tideline UN Digital Library Scraper ===");
  console.log(`Running ${SEARCH_QUERIES.length} queries\n`);

  let totalQueued = 0;

  for (const query of SEARCH_QUERIES) {
    const count = await searchQuery(query);
    totalQueued += count;
    await sleep(1000);
  }

  console.log(`\n=== Complete. ${totalQueued} new PDFs queued. ===`);
}

main().catch(console.error);
