import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapedSource {
  name: string;
  sourceType: string;
  urls: string[];
  linkPattern: RegExp;
  baseUrl: string;
  topic: string;
  storySourceType: string;
}

interface ScrapeResult {
  source: string;
  status: "success" | "partial" | "error";
  documents_found: number;
  documents_new: number;
  error_message: string | null;
}

// ─── Source definitions ───────────────────────────────────────────────────────

const SOURCES: ScrapedSource[] = [
  {
    name: "IMO",
    sourceType: "imo",
    urls: [
      "https://www.imo.org/en/MediaCentre/HotTopics/Pages/Default.aspx",
    ],
    linkPattern:
      /href="((?:https:\/\/www\.imo\.org)?\/en\/[Mm]edia[Cc]entre\/[Hh]ot[Tt]opics\/[Pp]ages\/[^"]+\.aspx)"/gi,
    baseUrl: "https://www.imo.org",
    topic: "shipping",
    storySourceType: "reg",
  },
  {
    name: "ISA",
    sourceType: "isa",
    urls: ["https://www.isa.org.jm/news"],
    linkPattern:
      /href="((?:https:\/\/isa\.org\.jm)?\/news\/[^"]+)"/gi,
    baseUrl: "https://isa.org.jm",
    topic: "dsm",
    storySourceType: "reg",
  },
  {
    name: "FAO Fisheries",
    sourceType: "fao",
    urls: ["https://www.fao.org/fishery/en/publications"],
    linkPattern: /href="(\/fishery\/en\/(?:publications|news)\/[^"]+)"/gi,
    baseUrl: "https://www.fao.org",
    topic: "fisheries",
    storySourceType: "gov",
  },
  {
    name: "IUCN Red List",
    sourceType: "iucn",
    urls: ["https://www.iucnredlist.org/en"],
    linkPattern: /href="(\/en\/[^"]*(?:news|assessment|species)[^"]*)"/gi,
    baseUrl: "https://www.iucnredlist.org",
    topic: "biodiversity",
    storySourceType: "ngo",
  },
  {
    name: "CBD",
    sourceType: "cbd",
    urls: ["https://www.cbd.int/doc/"],
    linkPattern: /href="(\/doc\/[^"]+)"/gi,
    baseUrl: "https://www.cbd.int",
    topic: "governance",
    storySourceType: "reg",
  },
  {
    name: "CITES",
    sourceType: "cites",
    urls: ["https://cites.org/eng/resources/pub/index.php"],
    linkPattern: /href="(\/eng\/(?:resources|news)\/[^"]+)"/gi,
    baseUrl: "https://cites.org",
    topic: "governance",
    storySourceType: "reg",
  },
  {
    name: "UN BBNJ",
    sourceType: "bbnj",
    urls: ["https://www.un.org/bbnj/"],
    linkPattern: /href="(\/bbnj\/[^"]+)"/gi,
    baseUrl: "https://www.un.org",
    topic: "governance",
    storySourceType: "gov",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchViaJina(
  url: string,
  format: "html" | "markdown" = "html"
): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        Accept: format === "html" ? "text/html" : "text/plain",
        "X-Return-Format": format,
        "X-Timeout": "15",
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function contentHash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

// ─── Scrape a single source ───────────────────────────────────────────────────

async function scrapeSource(source: ScrapedSource): Promise<ScrapeResult> {
  let documentsFound = 0;
  let documentsNew = 0;
  const errors: string[] = [];

  for (const indexUrl of source.urls) {
    try {
      const html = await fetchViaJina(indexUrl, "html");
      if (!html) {
        errors.push(`Failed to fetch ${indexUrl}`);
        continue;
      }

      // Extract URLs
      const urls: string[] = [];
      const pattern = new RegExp(source.linkPattern.source, "gi");
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const href = match[1];
        const fullUrl = href.startsWith("http")
          ? href
          : `${source.baseUrl}${href}`;
        // Deduplicate and skip pagination/index links
        if (
          !urls.includes(fullUrl) &&
          !fullUrl.includes("page=") &&
          !fullUrl.includes("/Pages/1") &&
          fullUrl !== indexUrl &&
          fullUrl !== `${source.baseUrl}/news/` &&
          fullUrl !== `${source.baseUrl}/news`
        ) {
          urls.push(fullUrl);
        }
      }

      documentsFound += urls.length;

      // Process up to 15 URLs per index page, batches of 3
      const BATCH_SIZE = 3;
      const MAX_URLS = 15;

      for (let i = 0; i < Math.min(urls.length, MAX_URLS); i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (url) => {
            try {
              // Check if we already have this URL
              const { data: existing } = await supabase
                .from("scraped_sources")
                .select("id")
                .eq("url", url)
                .single();

              if (existing) return;

              // Fetch article content
              const markdown = await fetchViaJina(url, "markdown");
              if (!markdown || markdown.length < 50) return;

              const titleMatch = markdown.match(/^Title:\s*(.+)$/m);
              const title = titleMatch?.[1]?.trim();
              if (!title || title.length < 10) return;

              const hash = contentHash(markdown);

              // Check hash for dedup
              const { data: hashExists } = await supabase
                .from("scraped_sources")
                .select("id")
                .eq("content_hash", hash)
                .single();

              if (hashExists) return;

              // Insert into scraped_sources
              const { error: scrapeErr } = await supabase
                .from("scraped_sources")
                .insert({
                  url,
                  source_name: source.name,
                  source_type: source.sourceType,
                  document_title: title,
                  published_date: new Date().toISOString(),
                  content_hash: hash,
                  ingested_at: new Date().toISOString(),
                  raw_html: markdown.slice(0, 50000),
                });

              if (scrapeErr) {
                errors.push(`scraped_sources insert: ${scrapeErr.message}`);
                return;
              }

              // Also insert into stories for the summary pipeline
              await supabase.from("stories").upsert(
                {
                  title,
                  link: url,
                  source_name: source.name,
                  topic: source.topic,
                  source_type: source.storySourceType,
                  published_at: new Date().toISOString(),
                  description: markdown.slice(0, 500),
                },
                { onConflict: "link", ignoreDuplicates: true }
              );

              documentsNew++;
            } catch (err) {
              errors.push(
                `${url}: ${err instanceof Error ? err.message : "unknown"}`
              );
            }
          })
        );

        if (i + BATCH_SIZE < Math.min(urls.length, MAX_URLS)) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    } catch (err) {
      errors.push(
        `${indexUrl}: ${err instanceof Error ? err.message : "unknown"}`
      );
    }
  }

  return {
    source: source.name,
    status:
      errors.length === 0
        ? "success"
        : documentsNew > 0
          ? "partial"
          : "error",
    documents_found: documentsFound,
    documents_new: documentsNew,
    error_message: errors.length > 0 ? errors.join("; ") : null,
  };
}

// ─── BBNJ Treaty Ratification Tracker ─────────────────────────────────────────
// Parses the official UN Treaty Collection XML which has structured participant data

async function scrapeBBNJRatifications(): Promise<ScrapeResult> {
  const xmlUrl =
    "https://treaties.un.org/doc/Publication/MTDSG/Volume%20II/Chapter%20XXI/XXI-10.en.xml";

  try {
    const res = await fetch(xmlUrl, {
      headers: { "User-Agent": "Tideline/1.0 (+https://thetideline.co)" },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return {
        source: "BBNJ Treaty Ratifications",
        status: "error",
        documents_found: 0,
        documents_new: 0,
        error_message: `XML fetch failed: ${res.status}`,
      };
    }

    const xml = await res.text();

    // Parse <Row><Entry>Country</Entry><Entry>Signature</Entry><Entry>Ratification</Entry></Row>
    const rowPattern =
      /<Row><Entry>([^<]+)<\/Entry><Entry>([^<]*)<\/Entry><Entry>([^<]*)<\/Entry><\/Row>/g;
    const rows: {
      country: string;
      status: "ratified" | "signed" | "neither";
      date: string | null;
    }[] = [];

    let match: RegExpExecArray | null;
    while ((match = rowPattern.exec(xml)) !== null) {
      const country = match[1]
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
        .trim();
      const signatureDate = match[2].replace(/[a-zA-Z()]/g, "").trim();
      const ratificationDate = match[3].replace(/[a-zA-Z()]/g, "").trim();

      if (!country || country === "Participant" || country.length < 2) continue;

      let status: "ratified" | "signed" | "neither" = "neither";
      let date: string | null = null;

      if (ratificationDate && ratificationDate.length > 4) {
        status = "ratified";
        date = match[3].trim(); // Keep original text for date parsing
      } else if (signatureDate && signatureDate.length > 4) {
        status = "signed";
        date = match[2].trim();
      }

      rows.push({ country, status, date });
    }

    let newEntries = 0;

    for (const row of rows) {
      const { data: latest } = await supabase
        .from("treaty_ratifications")
        .select("status")
        .eq("treaty_name", "BBNJ Agreement")
        .eq("country_name", row.country)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .single();

      if (!latest || latest.status !== row.status) {
        let statusDate: string | null = null;
        if (row.date) {
          try {
            // Clean date string: remove suffixes like "a", "AA", "A"
            const cleaned = row.date.replace(/\s*[aA]+\s*$/, "").trim();
            const parsed = new Date(cleaned);
            if (!isNaN(parsed.getTime())) statusDate = parsed.toISOString();
          } catch {
            // Leave null
          }
        }

        const { error } = await supabase.from("treaty_ratifications").insert({
          treaty_name: "BBNJ Agreement",
          country_name: row.country,
          status: row.status,
          status_date: statusDate,
          notes: null,
          recorded_at: new Date().toISOString(),
          changed_from: latest?.status ?? null,
        });

        if (!error) newEntries++;
      }
    }

    return {
      source: "BBNJ Treaty Ratifications",
      status: rows.length > 0 ? "success" : "error",
      documents_found: rows.length,
      documents_new: newEntries,
      error_message:
        rows.length === 0 ? "No country rows parsed from XML" : null,
    };
  } catch (err) {
    return {
      source: "BBNJ Treaty Ratifications",
      status: "error",
      documents_found: 0,
      documents_new: 0,
      error_message: err instanceof Error ? err.message : "unknown",
    };
  }
}

// ─── Log scrape run ───────────────────────────────────────────────────────────

async function logScrapeRun(result: ScrapeResult) {
  await supabase.from("scrape_runs").insert({
    source: result.source,
    status: result.status,
    documents_found: result.documents_found,
    documents_new: result.documents_new,
    error_message: result.error_message,
    ran_at: new Date().toISOString(),
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  // Scrape all document sources in parallel
  const sourceResults = await Promise.allSettled(
    SOURCES.map((source) => scrapeSource(source))
  );

  // Scrape BBNJ treaty ratifications (direct XML, no Jina needed)
  const bbnjResult = await scrapeBBNJRatifications();

  const allResults: ScrapeResult[] = sourceResults.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          source: "unknown",
          status: "error" as const,
          documents_found: 0,
          documents_new: 0,
          error_message:
            r.reason instanceof Error ? r.reason.message : "unknown",
        }
  );
  allResults.push(bbnjResult);

  // Log each run
  await Promise.all(allResults.map((r) => logScrapeRun(r)));

  const totalFound = allResults.reduce(
    (acc, r) => acc + r.documents_found,
    0
  );
  const totalNew = allResults.reduce((acc, r) => acc + r.documents_new, 0);

  return NextResponse.json({
    success: true,
    sources_scraped: allResults.length,
    documents_found: totalFound,
    documents_new: totalNew,
    per_source: allResults,
    duration_ms: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });
}
