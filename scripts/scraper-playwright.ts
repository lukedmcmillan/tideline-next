import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PlaywrightSource {
  name: string;
  domain: string;
  defaultOrg: string;
  defaultType: string;
  is_primary_source: boolean;
  url: string;
  waitFor: string;
  scrollToBottom: boolean;
}

const SOURCES: PlaywrightSource[] = [
  {
    name: "OSPAR Publications",
    domain: "ospar.org",
    defaultOrg: "OSPAR Commission",
    defaultType: "regulation",
    is_primary_source: true,
    url: "https://www.ospar.org/about/publications?q=&y=2026",
    waitFor: ".publication, .item, a[href*='.pdf']",
    scrollToBottom: true,
  },
  {
    name: "OSPAR Publications 2025",
    domain: "ospar.org",
    defaultOrg: "OSPAR Commission",
    defaultType: "regulation",
    is_primary_source: true,
    url: "https://www.ospar.org/about/publications?q=&y=2025",
    waitFor: ".publication, .item, a[href*='.pdf']",
    scrollToBottom: true,
  },
  {
    name: "IMO Circulars",
    domain: "imo.org",
    defaultOrg: "International Maritime Organization",
    defaultType: "resolution",
    is_primary_source: true,
    url: "https://www.imo.org/en/MediaCentre/MeetingSummaries",
    waitFor: ".sfContentBlock, article, a[href*='.pdf']",
    scrollToBottom: true,
  },
  {
    name: "IWC Conservation",
    domain: "iwc.int",
    defaultOrg: "International Whaling Commission",
    defaultType: "resolution",
    is_primary_source: true,
    url: "https://iwc.int/en/conservation",
    waitFor: "a[href*='.pdf'], .card, article",
    scrollToBottom: true,
  },
  {
    name: "FAO SOFIA Reports",
    domain: "fao.org",
    defaultOrg: "Food and Agriculture Organization of the United Nations",
    defaultType: "report",
    is_primary_source: true,
    url: "https://www.fao.org/fishery/en/publications/search?page=1&size=50&sort=date_desc",
    waitFor: ".search-result, .list-group-item, a[href*='.pdf']",
    scrollToBottom: true,
  },
  {
    name: "UNFCCC Ocean Documents",
    domain: "unfccc.int",
    defaultOrg: "United Nations Framework Convention on Climate Change",
    defaultType: "report",
    is_primary_source: true,
    url: "https://unfccc.int/topics/ocean-and-water/resources",
    waitFor: "a[href*='.pdf'], .node, article",
    scrollToBottom: true,
  },
];

const NON_EN = /_chi\.pdf$|_rus\.pdf$|_ar\.pdf$|_fr\.pdf$|_es\.pdf$|-fr\.pdf$|-es\.pdf$|-ar\.pdf$|-ch\.pdf$|_FR_|_ES_|_AR_|_ZH_|_RU_/i;

function extractPdfLinks(html: string, baseUrl: string): string[] {
  // Match .pdf links in href, data-href, src, and data-url attributes
  const regex = /(?:href|data-href|src|data-url)=["']([^"']*\.pdf[^"']*)/gi;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const absolute = new URL(match[1], baseUrl).href;
      if (!NON_EN.test(absolute)) {
        links.push(absolute);
      }
    } catch {
      // skip malformed
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

async function queuePdf(
  pdfUrl: string,
  sourceUrl: string,
  source: PlaywrightSource
): Promise<boolean> {
  const exists = await isAlreadyQueued(pdfUrl);
  if (exists) return false;

  const { error } = await supabase.from("document_queue").insert({
    source_url: sourceUrl,
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

async function scrapeSource(source: PlaywrightSource): Promise<number> {
  console.log(`[${source.name}] Launching browser for ${source.url}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: "Tideline Library Bot/1.0",
  });
  const page = await context.newPage();

  try {
    await page.goto(source.url, { waitUntil: "networkidle", timeout: 45000 });

    // Wait for content selector or timeout
    try {
      await page.waitForSelector(source.waitFor, { timeout: 15000 });
    } catch {
      console.log(`  [${source.name}] waitFor selector not found, proceeding with current content`);
    }

    // Scroll to bottom in multiple passes for lazy-loaded content
    if (source.scrollToBottom) {
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1500);
      }
    }

    const html = await page.content();

    // Also extract PDF links via Playwright in-page evaluation (catches JS-generated links)
    const jsLinks = await page.$$eval("a[href]", (anchors) =>
      anchors.map((a) => a.href).filter((h) => /\.pdf/i.test(h))
    );

    const htmlPdfLinks = extractPdfLinks(html, source.url);
    const allPdfLinks = [...new Set([...htmlPdfLinks, ...jsLinks])].filter(
      (l) => !NON_EN.test(l)
    );
    console.log(`  [${source.name}] Found ${allPdfLinks.length} PDF links (${htmlPdfLinks.length} html + ${jsLinks.length} js)`);

    let inserted = 0;
    for (const pdfUrl of allPdfLinks) {
      const queued = await queuePdf(pdfUrl, source.url, source);
      if (queued) inserted++;
    }

    if (inserted > 0) {
      console.log(`  [${source.name}] Queued ${inserted} new PDFs`);
    } else {
      console.log(`  [${source.name}] No new PDFs to queue`);
    }

    return inserted;
  } catch (err) {
    console.log(`  [${source.name}] Error: ${err}`);
    return 0;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log("=== Tideline Playwright Scraper ===");
  console.log(`Processing ${SOURCES.length} JS-rendered sources\n`);

  let totalQueued = 0;

  for (const source of SOURCES) {
    const count = await scrapeSource(source);
    totalQueued += count;
    console.log(`[${source.name}] Done\n`);
  }

  console.log(`=== Complete. ${totalQueued} new PDFs queued. ===`);
}

main().catch(console.error);
