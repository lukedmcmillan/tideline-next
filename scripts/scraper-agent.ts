import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Source {
  name: string;
  domain: string;
  defaultOrg: string;
  defaultType: string;
  is_primary_source: boolean;
  urls: string[];
}

const SOURCES: Source[] = [
  {
    name: "International Seabed Authority",
    domain: "isa.org.jm",
    defaultOrg: "International Seabed Authority",
    defaultType: "resolution",
    is_primary_source: true,
    urls: [
      "https://www.isa.org.jm/publications",
      "https://www.isa.org.jm/satya-n-nandan-library",
      "https://www.isa.org.jm/selected-decisions",
      "https://www.isa.org.jm/technical-studies",
      "https://www.isa.org.jm/annual-reports",
    ],
  },
  {
    name: "DOALOS", domain: "un.org",
    defaultOrg: "United Nations Division for Ocean Affairs and the Law of the Sea",
    defaultType: "government_document",
    is_primary_source: true,
    urls: [
      "https://www.un.org/depts/los",
      "https://www.un.org/depts/los/general_assembly/general_assembly_resolutions.htm",
      "https://www.un.org/depts/los/convention_agreements/convention_agreements.htm",
      "https://www.un.org/depts/los/clcs_new/clcs_home.htm",
      "https://www.un.org/depts/los/reference_files/status2010.pdf",
    ],
  },
  {
    name: "OSPAR Commission",
    domain: "ospar.org",
    defaultOrg: "OSPAR Commission",
    defaultType: "regulation",
    is_primary_source: true,
    urls: [
      "https://www.ospar.org/site/assets/files/1169/ospar_convention.pdf",
      "https://www.ospar.org/site/assets/files/1210/list_of_decs_and_recs_agreements_2025-1.pdf",
      "https://www.ospar.org/site/assets/files/36552/vigo_declaration_2025-1.pdf",
      "https://www.ospar.org/site/assets/files/44218/98-152e_agreement.pdf",
    ],
  },
  {
    name: "International Maritime Organization",
    domain: "imo.org",
    defaultOrg: "International Maritime Organization",
    defaultType: "resolution",
    is_primary_source: true,
    urls: [
      "https://wwwcdn.imo.org/localresources/en/publications/Documents/Supplements/English/QQF520E_supplement_May2024_PQ.pdf",
      "https://wwwcdn.imo.org/localresources/en/OurWork/Environment/Documents/Fifth%20IMO%20GHG%20Study%202023%20Full%20report.pdf",
      "https://wwwcdn.imo.org/localresources/en/OurWork/Environment/Documents/Air%20pollution/Sulphur%202020%20-%20Consistent%20implementation%20of%20regulation%2014.1.3%20of%20MARPOL%20Annex%20VI.pdf",
    ],
  },
  {
    name: "CCAMLR",
    domain: "ccamlr.org",
    defaultOrg: "Commission for the Conservation of Antarctic Marine Living Resources",
    defaultType: "regulation",
    is_primary_source: true,
    urls: [
      "https://www.ccamlr.org/en/publications/conservation-measures",
      "https://www.ccamlr.org/en/publications/schedule-conservation-measures",
      "https://www.ccamlr.org/en/organisation/camlr-convention-text",
      "https://www.ccamlr.org/en/publications/science-publications",
    ],
  },
  {
    name: "Food and Agriculture Organization",
    domain: "fao.org",
    defaultOrg: "Food and Agriculture Organization of the United Nations",
    defaultType: "report",
    is_primary_source: true,
    urls: [
      "https://www.fao.org/3/v9878e/v9878e.pdf",
      "https://www.fao.org/3/i9540en/i9540en.pdf",
    ],
  },
  {
    name: "International Whaling Commission",
    domain: "iwc.int",
    defaultOrg: "International Whaling Commission",
    defaultType: "resolution",
    is_primary_source: true,
    urls: [
      "https://iwc.int/api/downloads/documents/86/download",
      "https://iwc.int/api/downloads/documents/87/download",
    ],
  },
];

const USER_AGENT = "Tideline Library Bot/1.0";
const MAX_DEPTH = 5;

function extractPdfLinks(html: string, baseUrl: string): string[] {
  const regex = /href=["']([^"']*\.pdf[^"']*)/gi;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const absolute = new URL(match[1], baseUrl).href;
      links.push(absolute);
    } catch {
      // skip malformed URLs
    }
  }
  return [...new Set(links)];
}

function extractPaginationLinks(html: string, baseUrl: string, domain: string): string[] {
  const regex = /href=["']([^"']*)/gi;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], baseUrl);
      if (url.hostname.includes(domain) &&
          (url.searchParams.has("page") || /[?&]p=|\/page\/\d|offset=/.test(url.href))) {
        links.push(url.href);
      }
    } catch {
      // skip
    }
  }
  return [...new Set(links)];
}

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

async function queuePdf(pdfUrl: string, source: Source): Promise<boolean> {
  const exists = await isAlreadyQueued(pdfUrl);
  if (exists) return false;

  const { error } = await supabase.from("document_queue").insert({
    source_url: pdfUrl,
    source_domain: source.domain,
    file_url: pdfUrl,
    file_name: fileNameFromUrl(pdfUrl),
    is_primary_source: source.is_primary_source,
    status: "pending",
  });

  if (error && !error.message.includes("duplicate")) {
    console.log(`  [${source.name}] Insert error: ${error.message}`);
    return false;
  }
  return !error;
}

async function scrapePage(
  url: string,
  source: Source,
  visited: Set<string>,
  depth: number
): Promise<number> {
  if (visited.has(url) || depth > MAX_DEPTH) return 0;
  visited.add(url);

  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    if (!res.ok) {
      console.log(`  [${source.name}] HTTP ${res.status} for ${url}`);
      return 0;
    }
    html = await res.text();
  } catch (err) {
    console.log(`  [${source.name}] Fetch error for ${url}: ${err}`);
    return 0;
  }

  const pdfLinks = extractPdfLinks(html, url);
  console.log(`  [${source.name}] Found ${pdfLinks.length} PDF links on ${url}`);

  const NON_EN = /_chi\.pdf$|_rus\.pdf$|_ar\.pdf$|_fr\.pdf$|_es\.pdf$|-fr\.pdf$|-es\.pdf$|-ar\.pdf$|-ch\.pdf$|_FR_|_ES_|_AR_|_ZH_|_RU_/i;
  let inserted = 0;
  for (const pdfUrl of pdfLinks) {
    if (NON_EN.test(pdfUrl)) continue;
    const exists = await isAlreadyQueued(pdfUrl);
    if (exists) continue;

    const { error } = await supabase.from("document_queue").insert({
      source_url: url,
      source_domain: source.domain,
      file_url: pdfUrl,
      file_name: fileNameFromUrl(pdfUrl),
      is_primary_source: source.is_primary_source,
      status: "pending",
    });

    if (!error) {
      inserted++;
    } else if (!error.message.includes("duplicate")) {
      console.log(`  [${source.name}] Insert error: ${error.message}`);
    }
  }

  if (inserted > 0) {
    console.log(`  [${source.name}] Queued ${inserted} new PDFs from ${url}`);
  }

  // Follow pagination if we found new PDFs
  if (inserted === 0 && pdfLinks.length === 0) return inserted;

  const currentBase = url.split("#")[0];
  const nextPages = extractPaginationLinks(html, url, source.domain);
  for (const nextUrl of nextPages) {
    const nextBase = nextUrl.split("#")[0];
    if (currentBase === nextBase) continue;
    inserted += await scrapePage(nextUrl, source, visited, depth + 1);
  }

  return inserted;
}

async function main() {
  console.log("=== Tideline Library Scraper Agent ===");
  console.log(`Processing ${SOURCES.length} sources\n`);

  let totalQueued = 0;

  for (const source of SOURCES) {
    console.log(`[${source.name}] Starting (${source.urls.length} URLs)`);
    const visited = new Set<string>();

    for (const url of source.urls) {
      if (url.toLowerCase().endsWith(".pdf") || /\/downloads?\/documents?\/\d+\/download$/i.test(url)) {
        const queued = await queuePdf(url, source);
        if (queued) {
          totalQueued++;
          console.log(`  [${source.name}] Queued direct PDF: ${fileNameFromUrl(url)}`);
        }
        continue;
      }
      const count = await scrapePage(url, source, visited, 0);
      totalQueued += count;
    }

    console.log(`[${source.name}] Done\n`);
  }

  console.log(`=== Complete. ${totalQueued} new PDFs queued. ===`);
}

main().catch(console.error);
