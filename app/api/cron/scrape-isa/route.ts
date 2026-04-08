import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// STUB cron. Hardcoded recent ISA events, retained as first-deploy fallback.
// Live GDELT scraper runs after the seed block.
const SEED_EVENTS = [
  {
    tracker_slug: "isa",
    event_date: "2026-03-21",
    event_type: "council_decision",
    significance: "high",
    title: "ISA Council 29th Session concludes without adoption of exploitation regulations",
    summary: "The 29th session of the ISA Council ended without agreement on the exploitation regulations framework. Environmental liability provisions remain contested between sponsoring states and conservation advocates.",
    source_url: "https://www.isa.org.jm/",
    source_name: "ISA",
    confidence_score: 8,
    confidence_flags: [] as string[],
    status: "live",
  },
  {
    tracker_slug: "isa",
    event_date: "2026-02-14",
    event_type: "ltc_recommendation",
    significance: "medium",
    title: "LTC issues revised guidance on environmental baseline assessments for polymetallic nodule mining",
    summary: "The Legal and Technical Commission published updated recommendations requiring contractors to conduct 10-year baseline environmental studies before any exploitation licence can be granted.",
    source_url: "https://www.isa.org.jm/legal-and-technical-commission",
    source_name: "ISA",
    confidence_score: 8,
    confidence_flags: [] as string[],
    status: "live",
  },
  {
    tracker_slug: "isa",
    event_date: "2025-08-05",
    event_type: "assembly_resolution",
    significance: "high",
    title: "ISA Assembly reaffirms precautionary approach to deep-sea mining",
    summary: "The Assembly adopted a resolution reaffirming the precautionary approach and calling on the Council to complete the exploitation regulations before issuing any commercial licences.",
    source_url: "https://www.isa.org.jm/assembly",
    source_name: "ISA",
    confidence_score: 8,
    confidence_flags: [] as string[],
    status: "live",
  },
];

// Allowlist built from RSS_SOURCES in app/api/cron/fetch-feeds/route.ts plus
// additional primary sources approved for the ISA tracker.
const ALLOWED_DOMAINS = new Set<string>([
  // From RSS_SOURCES (hostnames, stripped of www.)
  "fisheries.noaa.gov", "oceanservice.noaa.gov", "noaa.gov", "epa.gov",
  "eea.europa.eu", "gov.uk", "fao.org", "isa.org.jm", "imo.org", "cites.org",
  "iwc.int", "iucnredlist.org", "worldwildlife.org", "oceana.org",
  "oceanconservancy.org", "seashepherd.org", "sharktrust.org", "newsroom.wcs.org",
  "plasticsoupfoundation.org", "conserveturtles.org", "reefcheck.org",
  "savethehighseas.org", "bluemarinefoundation.com", "mission-blue.org",
  "clientearth.org", "edf.org", "5gyres.org", "oceanfdn.org", "surfrider.org",
  "globalfishingwatch.org", "msc.org", "mcsuk.org", "highseasalliance.org",
  "nature.com", "science.org", "scripps.ucsd.edu", "whoi.edu", "mbari.org",
  "ocean.si.edu", "journals.plos.org", "bas.ac.uk", "noc.ac.uk", "pml.ac.uk",
  "news.mongabay.com", "mongabay.com", "theguardian.com", "hakaimagazine.com",
  "thefishsite.com", "undercurrentnews.com", "intrafish.com", "bbci.co.uk",
  "bbc.co.uk", "bbc.com", "sciencealert.com", "nationalgeographic.com",
  "newscientist.com", "nhm.ac.uk", "oceanographicmagazine.com", "phys.org",
  "carbonbrief.org", "bloomberg.com", "greenbiz.com", "oecd.org", "cbd.int",
  "ipcc.ch",
  // Spec additions
  "un.org", "reuters.com", "apnews.com",
]);

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function isAllowedDomain(url: string): boolean {
  const host = hostOf(url);
  if (!host) return false;
  if (ALLOWED_DOMAINS.has(host)) return true;
  // Any .gov TLD (e.g. whitehouse.gov) or .gov.* (e.g. gov.uk already listed)
  if (/\.gov$/.test(host) || /\.gov\.[a-z]{2,}$/.test(host)) return true;
  // Match subdomains of allowlisted hosts
  for (const allowed of ALLOWED_DOMAINS) {
    if (host.endsWith(`.${allowed}`)) return true;
  }
  return false;
}

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  domain: string;
}

async function fetchGdelt(): Promise<GdeltArticle[]> {
  const query = '"International Seabed Authority" OR "deep-sea mining" OR "ISA Council" OR "The Metals Company" OR "seabed mining" OR "polymetallic nodules" OR "ISA contractor"';
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=50&format=JSON&timespan=24h&sort=DateDesc`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Tideline/1.0 (+https://thetideline.co)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const articles = Array.isArray(json.articles) ? json.articles : [];
    return articles
      .filter((a: unknown): a is Record<string, unknown> =>
        typeof a === "object" && a !== null,
      )
      .map((a: Record<string, unknown>) => ({
        url: typeof a.url === "string" ? a.url : "",
        title: typeof a.title === "string" ? a.title : "",
        seendate: typeof a.seendate === "string" ? a.seendate : "",
        domain: typeof a.domain === "string" ? a.domain : "",
      }))
      .filter((a: GdeltArticle) => a.url && a.title);
  } catch (err) {
    console.error("[scrape-isa] gdelt fetch error:", err);
    return [];
  }
}

async function fetchJinaText(url: string): Promise<string | null> {
  if (!process.env.JINA_API_KEY) return null;
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        "Authorization": `Bearer ${process.env.JINA_API_KEY}`,
        "Accept": "text/plain",
        "X-Return-Format": "markdown",
        "X-Timeout": "8",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    const cleaned = text
      .replace(/^Title:.*\n/m, "")
      .replace(/^URL Source:.*\n/m, "")
      .replace(/^Markdown Content:\n/m, "")
      .trim();
    return cleaned.length > 200 ? cleaned.slice(0, 8000) : null;
  } catch {
    return null;
  }
}

async function summariseArticle(args: {
  title: string;
  sourceName: string;
  text: string;
}): Promise<string | null> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: [{
        type: "text",
        text: "You are an ocean governance analyst. Summarise this article about deep-sea mining or ISA governance in exactly 100 words. Be specific. Include the key decision, actor, and implication. UK English. No em dashes.",
        cache_control: { type: "ephemeral" },
      }],
      messages: [{
        role: "user",
        content: `Title: "${args.title}"\nSource: ${args.sourceName}\n\nARTICLE CONTENT:\n${args.text}`,
      }],
    });
    const out = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = out.replace(/\u2014|\u2013/g, ",").trim();
    return cleaned.length > 20 ? cleaned : null;
  } catch (err) {
    console.error("[scrape-isa] summarise error:", err);
    return null;
  }
}

async function scoreConfidence(args: {
  title: string;
  summary: string;
  sourceName: string;
}): Promise<{ score: number; flags: string[] }> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: [{
        type: "text",
        text: `You are a fact-check reviewer for an ocean governance intelligence platform. Score this summary for accuracy risk 0 to 10.
10 = fully verifiable, specific, dated, grounded in the source.
0 = vague, unverifiable, speculative, or potentially misleading.

Consider:
- Are factual claims specific and checkable?
- Are numbers, dates, entities named explicitly?
- Does the summary avoid hedging, speculation, and advocacy?
- Is the tone professional intelligence, not opinion?

Return JSON only, no markdown, no explanation:
{"score": 0-10 integer, "flags": ["short lower-case flag", ...]}

Common flags: "vague", "unverifiable", "speculative", "advocacy_tone", "missing_date", "missing_source", "hedging", "generic_claim", "no_specifics"`,
        cache_control: { type: "ephemeral" },
      }],
      messages: [{
        role: "user",
        content: `Title: "${args.title}"\nSource: ${args.sourceName}\n\nSummary: ${args.summary}`,
      }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const rawScore = typeof parsed.score === "number" ? parsed.score : 0;
    const score = Math.max(0, Math.min(10, Math.round(rawScore)));
    const flags = Array.isArray(parsed.flags)
      ? parsed.flags.filter((f: unknown): f is string => typeof f === "string").slice(0, 10)
      : [];
    return { score, flags };
  } catch (err) {
    console.error("[scrape-isa] confidence score error:", err);
    return { score: 0, flags: ["scoring_error"] };
  }
}

interface IsaApplicationEvent {
  action: "submitted" | "approved" | "rejected" | "deferred" | "extension_requested" | "extension_approved";
  company: string;
  contract_type: string;
  area: string;
  date: string;
  title: string;
}

async function extractIsaApplications(args: {
  pageUrl: string;
  text: string;
}): Promise<IsaApplicationEvent[]> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: [{
        type: "text",
        text: `You extract structured records about ISA (International Seabed Authority) contractor applications from webpage text.

Return a JSON array. Each item represents ONE distinct application event found in the text. Include:
- New applications submitted for exploration or exploitation contracts
- Applications approved by the LTC or Council
- Applications rejected or deferred
- Extension requests submitted or approved

Each item must have these fields:
{
  "action": "submitted" | "approved" | "rejected" | "deferred" | "extension_requested" | "extension_approved",
  "company": "exact company or contractor name from text",
  "contract_type": "polymetallic nodules" | "polymetallic sulphides" | "cobalt-rich crusts" | "unknown",
  "area": "contract area name from text, or 'unknown'",
  "date": "YYYY-MM-DD if stated, else empty string",
  "title": "one-line human-readable event title following the pattern: [Company] [action] for [contract_type] exploration in [area]"
}

Rules:
- Only extract events EXPLICITLY described in the text. Do not infer.
- Do not include routine contractor annual reports, meetings, or workshops.
- Do not include speculation or commentary.
- If no application events are present, return an empty array [].
- Return JSON only, no markdown, no explanation.`,
        cache_control: { type: "ephemeral" },
      }],
      messages: [{
        role: "user",
        content: `Page URL: ${args.pageUrl}\n\nPAGE TEXT:\n${args.text}`,
      }],
    });
    const out = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(out.replace(/```json|```/g, "").trim());
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e: unknown): e is IsaApplicationEvent => {
      if (!e || typeof e !== "object") return false;
      const o = e as Record<string, unknown>;
      return typeof o.action === "string" &&
        typeof o.company === "string" && o.company.length > 0 &&
        typeof o.title === "string" && o.title.length > 0;
    });
  } catch (err) {
    console.error("[scrape-isa] application extraction error:", err);
    return [];
  }
}

async function refreshTrackerStatus(slug: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const now = new Date().toISOString();
  const { data: existing, error: selectError } = await supabase
    .from("tracker_status")
    .select("id")
    .eq("tracker_slug", slug)
    .maybeSingle();

  if (selectError) {
    return { ok: false, error: selectError.message };
  }
  if (!existing) {
    return { ok: false, error: "no tracker_status row" };
  }

  const { error: updateError } = await supabase
    .from("tracker_status")
    .update({
      trajectory_verified_at: now,
      updated_at: now,
      updated_by: "cron:scrape-isa",
    })
    .eq("tracker_slug", slug);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }
  return { ok: true };
}

const ISA_APPLICATION_PAGES = [
  "https://isa.org.jm/pending-applications",
  "https://isa.org.jm/plans-of-work",
  "https://isa.org.jm/news",
];

async function processIsaApplications(): Promise<{
  pages_fetched: number;
  pages_failed: number;
  events_extracted: number;
  duplicates: number;
  inserted: number;
  errors: string[];
}> {
  const stats = {
    pages_fetched: 0,
    pages_failed: 0,
    events_extracted: 0,
    duplicates: 0,
    inserted: 0,
    errors: [] as string[],
  };

  for (const pageUrl of ISA_APPLICATION_PAGES) {
    try {
      const text = await fetchJinaText(pageUrl);
      if (!text) {
        stats.pages_failed++;
        continue;
      }
      stats.pages_fetched++;

      const events = await extractIsaApplications({ pageUrl, text });
      stats.events_extracted += events.length;

      for (const ev of events) {
        try {
          const { data: existing } = await supabase
            .from("tracker_events")
            .select("id")
            .eq("tracker_slug", "isa")
            .eq("source_url", pageUrl)
            .eq("title", ev.title)
            .maybeSingle();

          if (existing) {
            stats.duplicates++;
            continue;
          }

          const summary = await summariseArticle({
            title: ev.title,
            sourceName: "ISA",
            text: `${ev.title}\n\nAction: ${ev.action}\nCompany: ${ev.company}\nContract type: ${ev.contract_type}\nArea: ${ev.area}\nDate: ${ev.date || "not stated"}\n\nSource page:\n${text.slice(0, 4000)}`,
          });

          if (!summary || !ev.title || !pageUrl) {
            stats.errors.push(`missing required field: ${ev.title}`);
            continue;
          }

          const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(ev.date)
            ? ev.date
            : new Date().toISOString().slice(0, 10);

          const { error } = await supabase.from("tracker_events").insert({
            tracker_slug: "isa",
            event_date: eventDate,
            event_type: "regulation_update",
            significance: "high",
            title: ev.title,
            summary,
            source_url: pageUrl,
            source_name: "ISA",
            confidence_score: 8,
            confidence_flags: [] as string[],
            status: "live",
          });

          if (error) {
            stats.errors.push(`${ev.title}: ${error.message}`);
          } else {
            stats.inserted++;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          stats.errors.push(`${ev.title}: ${msg}`);
        }
      }
    } catch (err) {
      stats.pages_failed++;
      const msg = err instanceof Error ? err.message : String(err);
      stats.errors.push(`${pageUrl}: ${msg}`);
    }
  }

  return stats;
}

function parseGdeltDate(seendate: string): string {
  // GDELT format: YYYYMMDDTHHMMSSZ
  const m = seendate.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return new Date().toISOString().slice(0, 10);
}

async function processGdelt(): Promise<{
  fetched: number;
  domain_filtered: number;
  duplicates: number;
  jina_failed: number;
  summary_failed: number;
  inserted_live: number;
  inserted_pending: number;
  errors: string[];
}> {
  const stats = {
    fetched: 0,
    domain_filtered: 0,
    duplicates: 0,
    jina_failed: 0,
    summary_failed: 0,
    inserted_live: 0,
    inserted_pending: 0,
    errors: [] as string[],
  };

  const articles = await fetchGdelt();
  stats.fetched = articles.length;

  for (const article of articles) {
    try {
      if (!isAllowedDomain(article.url)) {
        stats.domain_filtered++;
        continue;
      }

      const { data: existing } = await supabase
        .from("tracker_events")
        .select("id")
        .eq("tracker_slug", "isa")
        .eq("source_url", article.url)
        .eq("title", article.title)
        .maybeSingle();

      if (existing) {
        stats.duplicates++;
        continue;
      }

      const host = hostOf(article.url) || article.domain || "unknown";
      const text = await fetchJinaText(article.url);
      if (!text) {
        stats.jina_failed++;
        continue;
      }

      const summary = await summariseArticle({
        title: article.title,
        sourceName: host,
        text,
      });
      if (!summary) {
        stats.summary_failed++;
        continue;
      }

      const { score, flags } = await scoreConfidence({
        title: article.title,
        summary,
        sourceName: host,
      });

      // Accuracy rule: never insert without title and summary and source_url
      if (!article.title || !summary || !article.url) {
        stats.errors.push(`missing required field: ${article.url}`);
        continue;
      }

      const status = score >= 7 ? "live" : "pending_review";
      const significance = score >= 9 ? "high" : score >= 7 ? "medium" : "low";

      const { error } = await supabase.from("tracker_events").insert({
        tracker_slug: "isa",
        event_date: parseGdeltDate(article.seendate),
        event_type: "news_mention",
        significance,
        title: article.title,
        summary,
        source_url: article.url,
        source_name: host,
        confidence_score: score,
        confidence_flags: flags,
        status,
      });

      if (error) {
        stats.errors.push(`${article.title}: ${error.message}`);
      } else if (status === "live") {
        stats.inserted_live++;
      } else {
        stats.inserted_pending++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      stats.errors.push(`${article.url}: ${msg}`);
    }
  }

  return stats;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Seeds only run on first deployment: skip entirely if any ISA tracker_events exist.
  let seedInserted = 0;
  let seedSkipped = 0;
  const seedErrors: string[] = [];
  let seedRan = false;

  const { count: isaCount } = await supabase
    .from("tracker_events")
    .select("id", { count: "exact", head: true })
    .eq("tracker_slug", "isa");

  if ((isaCount ?? 0) === 0) {
    seedRan = true;
    for (const event of SEED_EVENTS) {
    const { data: existing } = await supabase
      .from("tracker_events")
      .select("id")
      .eq("tracker_slug", event.tracker_slug)
      .eq("source_url", event.source_url)
      .eq("title", event.title)
      .maybeSingle();

    if (existing) {
      seedSkipped++;
      continue;
    }

      const { error } = await supabase.from("tracker_events").insert(event);
      if (error) {
        seedErrors.push(`${event.title}: ${error.message}`);
        console.error("[scrape-isa] seed insert error:", error);
      } else {
        seedInserted++;
      }
    }
  }

  // Live GDELT scraper
  const gdelt = await processGdelt();

  // ISA applications scraper
  const applications = await processIsaApplications();

  // Refresh tracker_status trajectory verification timestamp
  const trackerStatus = await refreshTrackerStatus("isa");

  return NextResponse.json({
    seeds: {
      ran: seedRan,
      total: SEED_EVENTS.length,
      inserted: seedInserted,
      skipped: seedSkipped,
      errors: seedErrors.length > 0 ? seedErrors : undefined,
    },
    gdelt: {
      fetched: gdelt.fetched,
      domain_filtered: gdelt.domain_filtered,
      duplicates: gdelt.duplicates,
      jina_failed: gdelt.jina_failed,
      summary_failed: gdelt.summary_failed,
      inserted_live: gdelt.inserted_live,
      inserted_pending: gdelt.inserted_pending,
      errors: gdelt.errors.length > 0 ? gdelt.errors : undefined,
    },
    applications: {
      pages_fetched: applications.pages_fetched,
      pages_failed: applications.pages_failed,
      events_extracted: applications.events_extracted,
      duplicates: applications.duplicates,
      inserted: applications.inserted,
      errors: applications.errors.length > 0 ? applications.errors : undefined,
    },
    tracker_status: trackerStatus,
  });
}
