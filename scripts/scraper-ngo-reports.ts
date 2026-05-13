import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { fetchAsTideline, RobotsBlocked } from "../app/lib/http-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JINA_KEY = process.env.JINA_API_KEY || "";

// Ocean relevance filter for mixed-content sources
const OCEAN_TERMS = /ocean|marine|sea\b|seas\b|maritime|fisheries|seabed|coral|unclos|bbnj|aquaculture|coastal|cetacean|whale|dolphin|shark|plastic.*(poll|treaty)|mpa|shipping|deep.?sea|offshore|mangrove|blue.?(carbon|finance|economy)|iwc|bycatch|cites.*marine|marpol|imo\b|iuu/i;

interface Source {
  name: string;
  slug: string;
  reports_url: string;
  ocean_filter: boolean; // true = must pass OCEAN_TERMS check
}

const SOURCES: Source[] = [
  { name: "Environmental Investigation Agency", slug: "eia", reports_url: "https://eia-international.org/about-us/reports/", ocean_filter: false },
  { name: "Whale and Dolphin Conservation", slug: "wdc", reports_url: "https://uk.whales.org/whales-dolphins/wdc-publications-and-reports/", ocean_filter: false },
  { name: "Oceana", slug: "oceana", reports_url: "https://oceana.org/reports/", ocean_filter: false },
  { name: "OceanCare", slug: "oceancare", reports_url: "https://www.oceancare.org/en/stories-and-news/", ocean_filter: false },
  { name: "Surfers Against Sewage", slug: "sas", reports_url: "https://www.sas.org.uk/about-us/work-and-impact/resources/", ocean_filter: false },
  { name: "WWF", slug: "wwf", reports_url: "https://www.wwf.org.uk/search?type=publication&topic=oceans", ocean_filter: true },
  { name: "IUCN", slug: "iucn", reports_url: "https://www.iucn.org/resources/issues-briefs", ocean_filter: true },
  { name: "Animal Welfare Institute", slug: "awi", reports_url: "https://awionline.org/content/marine-wildlife", ocean_filter: false },
  { name: "ClientEarth", slug: "clientearth", reports_url: "https://www.clientearth.org/latest/reports/", ocean_filter: true },
  { name: "Pew Charitable Trusts", slug: "pew", reports_url: "https://www.pewtrusts.org/en/research-and-analysis/reports?topic=oceans", ocean_filter: false },
];

interface Report {
  title: string;
  source_url: string;
  publication_date: string;
  organisation: string;
  topic_tags: string[];
  has_pdf: boolean;
  landing_page: string;
}

// --- Jina Reader ---

// r.jina.ai has 0ms rate-limit override (Jina is a proxy; it manages crawl etiquette
// toward the target domain). Canonical Tideline UA is added automatically.
async function fetchJinaText(url: string): Promise<string | null> {
  if (!JINA_KEY) return null;
  try {
    const res = await fetchAsTideline(`https://r.jina.ai/${url}`, {
      headers: {
        Authorization: `Bearer ${JINA_KEY}`,
        Accept: "text/plain",
        "X-Return-Format": "markdown",
        "X-Timeout": "10",
      },
      timeoutMs: 15000,
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// Direct fallback when Jina is unavailable. fetchAsTideline enforces robots.txt
// compliance + rate limiting + canonical UA. Throws RobotsBlocked — caller handles.
async function fetchPage(url: string): Promise<string | null> {
  const jina = await fetchJinaText(url);
  if (jina && jina.length > 200) return jina;
  // Fallback: direct fetch with canonical Tideline UA
  try {
    const res = await fetchAsTideline(url, { timeoutMs: 15000 });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    if (err instanceof RobotsBlocked) throw err; // re-throw for caller to handle
    return null;
  }
}

// --- Parsing helpers ---

function extractLinks(markdown: string): { text: string; url: string }[] {
  const links: { text: string; url: string }[] = [];
  // Markdown links: [text](url)
  const mdRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = mdRegex.exec(markdown)) !== null) {
    links.push({ text: m[1].trim(), url: m[2].trim() });
  }
  return links;
}

function isPdfUrl(url: string): boolean {
  return /\.pdf($|\?|#)/i.test(url);
}

function extractDateFromContext(text: string): string {
  // Try common date patterns near the text
  const patterns = [
    /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match) {
      try {
        const d = new Date(match[0]);
        if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
      } catch { /* continue */ }
    }
  }
  return "";
}

function extractTopicTags(text: string): string[] {
  const tags: string[] = [];
  const checks: [RegExp, string][] = [
    [/plastic/i, "plastic pollution"],
    [/cetacean|whale|dolphin|porpoise/i, "cetaceans"],
    [/bycatch/i, "bycatch"],
    [/iwc|international whaling/i, "IWC"],
    [/mpa|marine protected|30x30/i, "MPAs"],
    [/fisheries|fishing|iuu/i, "fisheries"],
    [/deep.?sea mining|seabed mining/i, "deep-sea mining"],
    [/bbnj|high seas treaty/i, "BBNJ"],
    [/shipping|imo\b|marpol/i, "shipping"],
    [/coral/i, "coral"],
    [/offshore wind/i, "offshore wind"],
    [/blue carbon|mangrove/i, "blue carbon"],
    [/blue finance|tnfd|debt.for.nature/i, "blue finance"],
    [/noise|acoustic/i, "underwater noise"],
    [/sewage|water quality|bathing water/i, "water quality"],
    [/cites/i, "CITES"],
    [/ocean acidification/i, "ocean acidification"],
  ];
  for (const [re, tag] of checks) {
    if (re.test(text)) tags.push(tag);
  }
  return tags;
}

function isOceanRelevant(title: string, tags: string[]): boolean {
  if (tags.length > 0) return true;
  return OCEAN_TERMS.test(title);
}

// --- Generic report extractor from Jina markdown ---

function extractReportsFromMarkdown(markdown: string, source: Source): Report[] {
  const reports: Report[] = [];
  const links = extractLinks(markdown);
  const seen = new Set<string>();

  // Split markdown into sections/lines for date context
  const lines = markdown.split("\n");

  for (const link of links) {
    const { text, url } = link;
    // Skip navigation, social, footer links
    if (!text || text.length < 10 || text.length > 300) continue;
    if (/^(home|about|contact|donate|sign up|subscribe|menu|nav|search|share|twitter|facebook|linkedin|instagram|email|cookie|privacy|terms)/i.test(text)) continue;
    if (!/^https?:\/\//i.test(url)) continue;

    // For PDF links or report-like landing pages
    const hasPdf = isPdfUrl(url);
    const isReportLink = hasPdf || /report|publication|brief|paper|study|analysis|assessment/i.test(url + " " + text);
    if (!isReportLink) continue;

    // Deduplicate by URL
    const normUrl = url.split("?")[0].split("#")[0].toLowerCase();
    if (seen.has(normUrl)) continue;
    seen.add(normUrl);

    // Find date near this link in the markdown
    const linkLine = lines.findIndex(l => l.includes(text) || l.includes(url));
    const contextWindow = lines.slice(Math.max(0, linkLine - 3), linkLine + 3).join(" ");
    const date = extractDateFromContext(contextWindow);

    const topicTags = extractTopicTags(text + " " + contextWindow);

    // Ocean relevance filter for mixed-content sources
    if (source.ocean_filter && !isOceanRelevant(text, topicTags)) continue;

    reports.push({
      title: text,
      source_url: url,
      publication_date: date,
      organisation: source.name,
      topic_tags: topicTags,
      has_pdf: hasPdf,
      landing_page: hasPdf ? "" : url,
    });
  }

  return reports;
}

// --- Database ---

async function isAlreadyQueued(fileUrl: string, title: string, org: string): Promise<boolean> {
  // Check document_queue by file_url
  const { data: q1 } = await supabase
    .from("document_queue")
    .select("id")
    .eq("file_url", fileUrl)
    .limit(1);
  if (q1 && q1.length > 0) return true;

  // Check documents by file_url
  const { data: d1 } = await supabase
    .from("documents")
    .select("id")
    .eq("file_url", fileUrl)
    .limit(1);
  if (d1 && d1.length > 0) return true;

  // Check document_queue by source_url
  const { data: q2 } = await supabase
    .from("document_queue")
    .select("id")
    .eq("source_url", fileUrl)
    .limit(1);
  if (q2 && q2.length > 0) return true;

  // Check documents by source_url
  const { data: d2 } = await supabase
    .from("documents")
    .select("id")
    .eq("source_url", fileUrl)
    .limit(1);
  if (d2 && d2.length > 0) return true;

  // Secondary dedup: title + org as file_name
  const dedupKey = `${org}_${title}`.slice(0, 200).replace(/[^a-zA-Z0-9]/g, "_");
  const { data: q3 } = await supabase
    .from("document_queue")
    .select("id")
    .eq("file_name", dedupKey)
    .limit(1);
  if (q3 && q3.length > 0) return true;

  return false;
}

async function queueReport(report: Report, source: Source, dryRun: boolean): Promise<boolean> {
  const exists = await isAlreadyQueued(report.source_url, report.title, report.organisation);
  if (exists) return false;

  if (dryRun) return true; // count as would-be queued, no DB write

  const dedupKey = `${report.organisation}_${report.title}`.slice(0, 200).replace(/[^a-zA-Z0-9]/g, "_");

  const { error } = await supabase.from("document_queue").insert({
    source_url: report.source_url,
    source_domain: new URL(source.reports_url).hostname,
    file_url: report.source_url,
    file_name: dedupKey,
    is_primary_source: false,
    status: "pending",
  });

  if (error && !error.message.includes("duplicate")) {
    console.log(`  Insert error for "${report.title.slice(0, 50)}": ${error.message}`);
    return false;
  }
  return !error;
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// --- Main ---

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`=== Tideline NGO Report Scraper${dryRun ? " (DRY RUN — no DB writes)" : ""} ===\n`);

  const breakdown: Record<string, number> = {};
  let totalQueued = 0;
  let sourcesProcessed = 0;

  for (const source of SOURCES) {
    console.log(`\n[${source.slug}] ${source.name}`);
    console.log(`  URL: ${source.reports_url}`);
    breakdown[source.slug] = 0;

    try {
      const markdown = await fetchPage(source.reports_url);
      if (!markdown) {
        console.log(`  SKIP: failed to fetch page`);
        continue;
      }
      console.log(`  Fetched ${markdown.length} chars`);

      const reports = extractReportsFromMarkdown(markdown, source);
      console.log(`  Found ${reports.length} report links`);

      let queued = 0;
      let skipped = 0;

      for (const report of reports) {
        const ok = await queueReport(report, source, dryRun);
        if (ok) {
          queued++;
          totalQueued++;
          breakdown[source.slug]++;
        } else {
          skipped++;
        }
      }

      console.log(`  ${dryRun ? "Would queue" : "Queued"}: ${queued}, Skipped (duplicate): ${skipped}`);
      sourcesProcessed++;
    } catch (err) {
      if (err instanceof RobotsBlocked) {
        console.log(`  RobotsBlocked: domain=${err.domain} rule="${err.rule}" — skipping source`);
        continue;
      }
      console.error(`  ERROR processing ${source.name}:`, err instanceof Error ? err.message : err);
    }

    // Rate limit between sources (fetchAsTideline handles per-domain limits;
    // this extra gap avoids hammering Jina with rapid successive source requests)
    await sleep(500);
  }

  const parts = SOURCES.map(s => `${s.slug.toUpperCase()}:${breakdown[s.slug] || 0}`).join(" ");
  console.log(`\nNGO scraper complete: ${totalQueued} total ${dryRun ? "would be queued" : "queued"} across ${sourcesProcessed} sources. Breakdown: ${parts}`);
  if (dryRun) console.log("  (DRY RUN — no writes made to document_queue)");
}

main().catch(err => {
  console.error("NGO scraper failed:", err);
  process.exit(1);
});
