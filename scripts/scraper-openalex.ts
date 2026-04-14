import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE = "https://api.openalex.org/works";
const USER_AGENT = "Tideline/1.0 (thetideline.co; mailto:luke@thetideline.co)";
const MAX_QUEUED = 200;

// OpenAlex concept IDs for ocean governance topics
const CONCEPT_IDS = [
  "C2778407487", // ocean governance
  "C2780416685", // marine protected areas
  "C144133560",  // fisheries
  "C2776943663", // deep sea mining
];

// Keyword terms for title/abstract search
const KEYWORDS = [
  "BBNJ", "high seas treaty", "MARPOL", "IMO emissions", "IUU fishing",
  "30x30", "blue carbon", "marine biodiversity", "UNFSA", "deep-sea mining",
  "ISA", "seabed mining", "ocean acidification", "coral bleaching",
  "offshore wind", "blue finance", "TNFD", "debt-for-nature",
];

// Reconstruct abstract from OpenAlex inverted index
function reconstructAbstract(invertedIndex: Record<string, number[]> | null): string {
  if (!invertedIndex) return "";
  const pairs: [number, string][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      pairs.push([pos, word]);
    }
  }
  pairs.sort((a, b) => a[0] - b[0]);
  return pairs.map(p => p[1]).join(" ");
}

// Format authors: "Smith J, Jones K"
function formatAuthors(authorships: { author: { display_name: string } }[]): string {
  if (!authorships?.length) return "";
  return authorships
    .slice(0, 10) // cap at 10 authors
    .map(a => a.author?.display_name || "")
    .filter(Boolean)
    .join(", ");
}

interface Paper {
  doi: string;
  title: string;
  abstract: string;
  authors: string;
  publication_date: string;
  journal: string;
  pdf_url: string | null;
  landing_page_url: string | null;
  licence: string | null;
  open_access_url: string | null;
  concepts: string[];
  cited_by_count: number;
  source_url: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPaper(work: any): Paper | null {
  const doi = work.doi || null;
  const title = work.title || "";
  if (!title) return null;

  const licence = work.primary_location?.license || null;
  // Hard filter: skip NC licences
  if (licence && licence.toLowerCase().includes("nc")) return null;

  const pdf_url = work.primary_location?.pdf_url || null;
  const landing_page_url = work.primary_location?.landing_page_url || null;
  const open_access_url = work.open_access?.oa_url || null;
  const source_url = pdf_url || open_access_url || landing_page_url;
  if (!source_url) return null;

  const abstract = reconstructAbstract(work.abstract_inverted_index);
  const authors = formatAuthors(work.authorships || []);
  const journal = work.primary_location?.source?.display_name || "";
  const concepts = (work.concepts || [])
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
    .slice(0, 3)
    .map((c: { display_name: string }) => c.display_name);

  return {
    doi,
    title,
    abstract,
    authors,
    publication_date: work.publication_date || "",
    journal,
    pdf_url,
    landing_page_url,
    licence,
    open_access_url,
    concepts,
    cited_by_count: work.cited_by_count || 0,
    source_url,
  };
}

async function isAlreadyQueued(sourceUrl: string, doi: string | null): Promise<boolean> {
  // Check document_queue by source_url
  const { data: q1 } = await supabase
    .from("document_queue")
    .select("id")
    .eq("source_url", sourceUrl)
    .limit(1);
  if (q1 && q1.length > 0) return true;

  // Check documents by source_url
  const { data: d1 } = await supabase
    .from("documents")
    .select("id")
    .eq("source_url", sourceUrl)
    .limit(1);
  if (d1 && d1.length > 0) return true;

  // Check document_queue by file_url (same as source_url for papers)
  const { data: q2 } = await supabase
    .from("document_queue")
    .select("id")
    .eq("file_url", sourceUrl)
    .limit(1);
  if (q2 && q2.length > 0) return true;

  // Check documents by file_url
  const { data: d2 } = await supabase
    .from("documents")
    .select("id")
    .eq("file_url", sourceUrl)
    .limit(1);
  if (d2 && d2.length > 0) return true;

  // Secondary dedup by DOI in file_name (used as identifier)
  if (doi) {
    const doiSlug = doi.replace("https://doi.org/", "").replace(/\//g, "_");
    const { data: q3 } = await supabase
      .from("document_queue")
      .select("id")
      .eq("file_name", `${doiSlug}.pdf`)
      .limit(1);
    if (q3 && q3.length > 0) return true;
  }

  return false;
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

async function fetchPage(url: string): Promise<{ results: Paper[]; nextCursor: string | null; skippedNC: number }> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    console.error(`OpenAlex API error: ${res.status} ${res.statusText}`);
    return { results: [], nextCursor: null, skippedNC: 0 };
  }
  const data = await res.json();
  const papers: Paper[] = [];
  let skippedNC = 0;

  for (const work of data.results || []) {
    const paper = extractPaper(work);
    if (paper === null) {
      // Could be NC licence or no URL
      const licence = work.primary_location?.license || "";
      if (licence.toLowerCase().includes("nc")) skippedNC++;
      continue;
    }
    papers.push(paper);
  }

  const meta = data.meta;
  const nextCursor = meta?.next_cursor || null;
  return { results: papers, nextCursor, skippedNC };
}

async function fetchAllPages(baseUrl: string, label: string): Promise<{ papers: Paper[]; totalNC: number }> {
  const papers: Paper[] = [];
  let totalNC = 0;
  let cursor: string | null = "*";
  let page = 0;

  while (cursor) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${sep}cursor=${encodeURIComponent(cursor)}&per_page=50`;
    console.log(`  [${label}] Page ${++page}: ${url.slice(0, 120)}...`);

    const { results, nextCursor, skippedNC } = await fetchPage(url);
    papers.push(...results);
    totalNC += skippedNC;

    console.log(`  [${label}] Page ${page}: ${results.length} papers extracted`);

    cursor = nextCursor;
    if (!cursor || papers.length >= 500) break; // safety cap per query

    // Rate limit: 100ms between requests
    await new Promise(r => setTimeout(r, 100));
  }

  return { papers, totalNC };
}

async function main() {
  console.log("=== Tideline OpenAlex Academic Scraper ===\n");

  const fromDate = dateNDaysAgo(8);
  const toDate = dateNDaysAgo(0);
  console.log(`Date window: ${fromDate} to ${toDate}\n`);

  // Query 1: By concept IDs
  const conceptFilter = CONCEPT_IDS.map(id => id.replace("C", "")).join("|");
  const conceptUrl = `${BASE}?filter=concepts.id:${conceptFilter},open_access.oa_status:gold|green,from_publication_date:${fromDate},to_publication_date:${toDate},language:en&sort=publication_date:desc`;

  console.log("Query 1: By concept IDs");
  const { papers: conceptPapers, totalNC: ncConcepts } = await fetchAllPages(conceptUrl, "concepts");
  console.log(`  Found ${conceptPapers.length} papers by concept\n`);

  // Query 2: By keywords
  const keywordQuery = KEYWORDS.map(k => `"${k}"`).join(" OR ");
  const keywordUrl = `${BASE}?search=${encodeURIComponent(keywordQuery)}&filter=open_access.oa_status:gold|green,from_publication_date:${fromDate},to_publication_date:${toDate},language:en&sort=publication_date:desc`;

  console.log("Query 2: By keywords");
  const { papers: keywordPapers, totalNC: ncKeywords } = await fetchAllPages(keywordUrl, "keywords");
  console.log(`  Found ${keywordPapers.length} papers by keywords\n`);

  // Deduplicate by DOI across both queries
  const seenDois = new Set<string>();
  const seenUrls = new Set<string>();
  const allPapers: Paper[] = [];

  for (const paper of [...conceptPapers, ...keywordPapers]) {
    const key = paper.doi || paper.source_url;
    if (paper.doi && seenDois.has(paper.doi)) continue;
    if (seenUrls.has(paper.source_url)) continue;
    if (paper.doi) seenDois.add(paper.doi);
    seenUrls.add(paper.source_url);
    allPapers.push(paper);
  }

  const totalFetched = allPapers.length;
  const totalNCSkipped = ncConcepts + ncKeywords;
  console.log(`Deduplicated: ${totalFetched} unique papers (from ${conceptPapers.length + keywordPapers.length} total)\n`);

  // Insert into document_queue
  let queued = 0;
  let skippedDup = 0;

  for (const paper of allPapers) {
    if (queued >= MAX_QUEUED) {
      console.log(`  Safety cap reached: ${MAX_QUEUED} papers queued`);
      break;
    }

    const exists = await isAlreadyQueued(paper.source_url, paper.doi);
    if (exists) {
      skippedDup++;
      continue;
    }

    const doiSlug = paper.doi
      ? paper.doi.replace("https://doi.org/", "").replace(/\//g, "_")
      : paper.title.slice(0, 60).replace(/[^a-zA-Z0-9]/g, "_");

    const { error } = await supabase.from("document_queue").insert({
      source_url: paper.source_url,
      source_domain: "openalex.org",
      file_url: paper.source_url,
      file_name: `${doiSlug}.pdf`,
      is_primary_source: false,
      status: "pending",
    });

    if (error && !error.message.includes("duplicate")) {
      console.log(`  Insert error for "${paper.title.slice(0, 50)}": ${error.message}`);
    } else if (!error) {
      queued++;
      if (queued % 10 === 0) console.log(`  Queued ${queued} papers...`);
    } else {
      skippedDup++;
    }
  }

  console.log(`\nOpenAlex scraper complete: ${totalFetched} fetched, ${queued} queued, ${skippedDup} skipped (duplicate), ${totalNCSkipped} skipped (NC licence)`);
}

main().catch(err => {
  console.error("OpenAlex scraper failed:", err);
  process.exit(1);
});
