import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapedEvent {
  bodyAbbreviation: string;
  title: string;
  eventType: "meeting" | "deadline" | "consultation" | "conference" | "session";
  startsAt: string;
  endsAt?: string;
  location?: string;
  isVirtual: boolean;
  agendaUrl?: string;
  description?: string;
  sourceId: string;
  topics: string[];
}

interface ScrapeResult {
  body: string;
  newEvents: number;
  updatedEvents: number;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchViaJina(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        Accept: "text/plain",
        "X-Return-Format": "markdown",
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

function makeSourceId(body: string, title: string, date: string): string {
  return crypto.createHash("sha256").update(`${body}:${title}:${date}`).digest("hex").slice(0, 20);
}

// Strict date parser — returns null if date is not a real parseable date
function parseDate(text: string): string | null {
  if (!text || text.length < 6) return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  try {
    const d = new Date(cleaned);
    if (isNaN(d.getTime())) return null;
    // Reject dates before 2020 or after 2030 as likely garbage
    if (d.getFullYear() < 2020 || d.getFullYear() > 2030) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

// Reject nav items, page elements, and other non-meeting content
const NAV_JUNK = /^(menu|contact|career|history|procurement|membership|about|home|faq|sitemap|copyright|privacy|login|sign in|subscribe|search|close|open|back|next|prev|language|english|french|español|skip to|cookie|accept|footer|header|logo|image|icon|download|pdf|print|share|email|social|facebook|twitter|linkedin|youtube)/i;

function isJunkTitle(title: string): boolean {
  if (title.length < 15) return true;
  if (NAV_JUNK.test(title.trim())) return true;
  if (!/meeting|session|committee|commission|conference|cop|assembly|council|workshop|seminar|forum|deadline|consultation|review|summit|preparatory/i.test(title)) return true;
  return false;
}

// ─── Claude-powered scraper ───────────────────────────────────────────────────
// Instead of fragile regex, we send the page content to Claude and ask it to
// extract structured meeting data. This handles arbitrary page layouts.

async function extractMeetingsWithClaude(
  bodyAbbreviation: string,
  bodyName: string,
  pageContent: string,
  topics: string[]
): Promise<ScrapedEvent[]> {
  try {
    // Truncate to avoid token limits
    const content = pageContent.slice(0, 12000);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: [
        { type: "text", text: `You are extracting upcoming meetings and sessions from an official intergovernmental organisation webpage.

STRICT RULES:
- Only extract actual meetings, sessions, conferences, consultations, or deadlines
- Do NOT extract navigation links, page headings, menu items, "about" pages, careers, contact info, or general website content
- Every extracted meeting MUST have a specific date (day, month, year). If no date is found, skip it entirely.
- Only include meetings from 2025 onwards
- If you cannot find any real meetings with dates, return an empty array
- Do NOT invent or guess meetings. Only extract what is explicitly on the page.

Return JSON array only, no markdown:
[{"title":"Meeting title","starts_at":"YYYY-MM-DD","ends_at":"YYYY-MM-DD or null","location":"City, Country or Virtual","event_type":"meeting|session|conference|deadline|consultation","description":"One sentence description if available, null otherwise"}]

If no valid meetings are found, return: []`, cache_control: { type: "ephemeral" } },
        { type: "text", text: `Organisation: ${bodyName} (${bodyAbbreviation})\n\nPAGE CONTENT:\n${content}` },
      ] }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((m: any) => m.title && m.starts_at && !isJunkTitle(m.title))
      .map((m: any) => ({
        bodyAbbreviation,
        title: m.title,
        eventType: m.event_type || "meeting",
        startsAt: parseDate(m.starts_at) || new Date(m.starts_at).toISOString(),
        endsAt: m.ends_at ? parseDate(m.ends_at) || undefined : undefined,
        location: m.location || undefined,
        isVirtual: m.location?.toLowerCase().includes("virtual") || false,
        description: m.description || undefined,
        sourceId: makeSourceId(bodyAbbreviation, m.title, m.starts_at),
        topics,
      }))
      .filter((e: ScrapedEvent) => {
        // Final validation: must have a real future-ish date (within past month to 2 years out)
        const d = new Date(e.startsAt);
        const now = Date.now();
        return d.getTime() > now - 30 * 24 * 60 * 60 * 1000 && d.getTime() < now + 730 * 24 * 60 * 60 * 1000;
      });
  } catch (err) {
    console.error(`[Gov Calendar] Claude extraction error for ${bodyAbbreviation}:`, err);
    return [];
  }
}

// ─── Individual body scrapers ─────────────────────────────────────────────────

async function scrapeIMO(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.imo.org/en/MediaCentre/MeetingSummaries/Pages/default.aspx");
  if (!md) return [];
  return extractMeetingsWithClaude("IMO", "International Maritime Organization", md, ["shipping", "maritime_safety", "marine_pollution", "emissions"]);
}

async function scrapeISA(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.isa.org.jm/sessions");
  if (!md) return [];
  return extractMeetingsWithClaude("ISA", "International Seabed Authority", md, ["deep_sea_mining", "mining_code"]);
}

async function scrapeIWC(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://iwc.int/en/meetings");
  if (!md) return [];
  return extractMeetingsWithClaude("IWC", "International Whaling Commission", md, ["whaling", "cetacean_conservation"]);
}

async function scrapeCBD(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.cbd.int/meetings");
  if (!md) return [];
  return extractMeetingsWithClaude("CBD", "Convention on Biological Diversity", md, ["biodiversity", "30x30", "marine_biodiversity"]);
}

async function scrapeOSPAR(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.ospar.org/about/intersessional-correspondence-groups/meetings");
  if (!md) return [];
  return extractMeetingsWithClaude("OSPAR", "OSPAR Commission", md, ["north_east_atlantic", "mpa", "biodiversity"]);
}

async function scrapeCCAMLR(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.ccamlr.org/en/meetings");
  if (!md) return [];
  return extractMeetingsWithClaude("CCAMLR", "Commission for the Conservation of Antarctic Marine Living Resources", md, ["southern_ocean", "antarctic", "mpa"]);
}

async function scrapeICCAT(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.iccat.int/en/Meetings.asp");
  if (!md) return [];
  return extractMeetingsWithClaude("ICCAT", "International Commission for the Conservation of Atlantic Tunas", md, ["fisheries", "tuna", "atlantic"]);
}

async function scrapeCITES(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://cites.org/eng/news/meetings.php");
  if (!md) return [];
  return extractMeetingsWithClaude("CITES", "Convention on International Trade in Endangered Species", md, ["cites", "species_trade", "marine_species"]);
}

async function scrapeUNOC(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.un.org/oceansconference");
  if (!md) return [];
  return extractMeetingsWithClaude("UNOC", "UN Ocean Conference", md, ["ocean_governance", "sdg14"]);
}

async function scrapeWTOFish(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.wto.org/english/tratop_e/fish_e/fish_e.htm");
  if (!md) return [];
  return extractMeetingsWithClaude("WTO-Fish", "WTO Fisheries Subsidies", md, ["fisheries_subsidies", "trade", "iuu_fishing"]);
}

// ─── Claude significance classifier ──────────────────────────────────────────
// Only runs on validated meeting events, not nav junk

async function classifySignificance(
  event: ScrapedEvent,
  eventId: string,
  bodyName: string
): Promise<void> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: [
        { type: "text", text: `You are assessing the significance of an ocean governance meeting for professional subscribers — NGO policy officers, corporate ESG analysts, blue finance investors, shipping compliance teams, fisheries managers.

Classify significance as EXACTLY one of:
- critical: A decision-making session where binding votes, quota adoptions, treaty amendments, or major policy shifts are expected. Examples: ISA Council voting on mining code, CCAMLR Commission annual meeting, ICCAT annual meeting with quota decisions, MEPC session adopting emissions regulations.
- important: A substantive meeting with real policy discussion but where binding decisions are unlikely at this specific session. Examples: Scientific committee sessions, preparatory meetings, technical workshops with policy implications.
- routine: Administrative, procedural, or early-stage meetings with no imminent decisions. Examples: Working group format discussions, paper submission deadlines, administrative sessions.

STRICT RULES FOR PREDICTIONS:
- Do NOT predict outcomes you cannot substantiate. If you don't know what's on the agenda, say "Agenda not yet published" rather than guessing.
- For expected_outcome, only use "contested" if there is genuine documented disagreement (e.g. deep-sea mining regulations at ISA, Southern Ocean MPAs at CCAMLR). Otherwise use "unknown".
- Never say "adoption_likely" unless there is strong public evidence of consensus.
- If the meeting hasn't published an agenda yet, expected_decisions should be empty.

Return JSON only:
{"significance":"critical|important|routine","significance_reason":"One factual sentence explaining classification. No hedging.","audience_tags":["ngos","corporate_esg","blue_finance","shipping_compliance","fisheries_industry","researchers"],"expected_decisions":[{"description":"what","type":"vote|adoption|review|deadline","expected_outcome":"adoption_likely|contested|likely_deferred|unknown"}]}`, cache_control: { type: "ephemeral" } },
        { type: "text", text: `Meeting: ${event.title}\nBody: ${bodyName} (${event.bodyAbbreviation})\nDate: ${event.startsAt}\nLocation: ${event.location || "Unknown"}\nDescription: ${event.description || "Not available"}\nTopics: ${event.topics.join(", ")}` },
      ] }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    await supabase
      .from("governance_events")
      .update({
        significance: parsed.significance,
        significance_reason: parsed.significance_reason,
      })
      .eq("id", eventId);

    if (parsed.expected_decisions?.length > 0) {
      await supabase.from("expected_decisions").insert(
        parsed.expected_decisions.map((d: any) => ({
          event_id: eventId,
          decision_description: d.description,
          decision_type: d.type,
          expected_outcome: d.expected_outcome,
          significance: parsed.significance,
          audience_tags: parsed.audience_tags,
        }))
      );
    }
  } catch (err) {
    console.error(`[Gov Calendar] Classification error for ${event.title}:`, err);
  }
}

// ─── Process scraped events ───────────────────────────────────────────────────

async function processEvents(
  bodyAbbreviation: string,
  events: ScrapedEvent[]
): Promise<ScrapeResult> {
  let newEvents = 0;
  let updatedEvents = 0;

  const { data: body } = await supabase
    .from("governance_bodies")
    .select("id, name")
    .eq("abbreviation", bodyAbbreviation)
    .single();

  if (!body) {
    return { body: bodyAbbreviation, newEvents: 0, updatedEvents: 0, error: "Body not found" };
  }

  for (const event of events) {
    const { data: existing } = await supabase
      .from("governance_events")
      .select("id")
      .eq("source_id", event.sourceId)
      .single();

    if (existing) {
      await supabase
        .from("governance_events")
        .update({
          title: event.title,
          agenda_url: event.agendaUrl || undefined,
          description: event.description || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      updatedEvents++;
    } else {
      const { data: inserted, error } = await supabase
        .from("governance_events")
        .insert({
          body_id: body.id,
          title: event.title,
          event_type: event.eventType,
          starts_at: event.startsAt,
          ends_at: event.endsAt || null,
          location: event.location || null,
          is_virtual: event.isVirtual,
          agenda_url: event.agendaUrl || null,
          description: event.description || null,
          topics: event.topics,
          source_id: event.sourceId,
          significance: "routine",
        })
        .select("id")
        .single();

      if (!error && inserted) {
        newEvents++;
        await classifySignificance(event, inserted.id, body.name);
      }
    }
  }

  await supabase
    .from("governance_bodies")
    .update({ last_scraped_at: new Date().toISOString() })
    .eq("id", body.id);

  return { body: bodyAbbreviation, newEvents, updatedEvents, error: null };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  const scrapers: { name: string; fn: () => Promise<ScrapedEvent[]> }[] = [
    { name: "IMO", fn: scrapeIMO },
    { name: "ISA", fn: scrapeISA },
    { name: "IWC", fn: scrapeIWC },
    { name: "CBD", fn: scrapeCBD },
    { name: "OSPAR", fn: scrapeOSPAR },
    { name: "CCAMLR", fn: scrapeCCAMLR },
    { name: "ICCAT", fn: scrapeICCAT },
    { name: "CITES", fn: scrapeCITES },
    { name: "UNOC", fn: scrapeUNOC },
    { name: "WTO-Fish", fn: scrapeWTOFish },
  ];

  const results: ScrapeResult[] = [];

  // Run sequentially to avoid Claude rate limits
  for (const scraper of scrapers) {
    try {
      const events = await scraper.fn();
      const result = await processEvents(scraper.name, events);
      results.push(result);

      await supabase.from("scrape_runs").insert({
        source: `governance:${scraper.name}`,
        status: result.error ? "error" : "success",
        documents_found: events.length,
        documents_new: result.newEvents,
        error_message: result.error,
        ran_at: new Date().toISOString(),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "unknown";
      results.push({ body: scraper.name, newEvents: 0, updatedEvents: 0, error: errorMsg });

      await supabase.from("scrape_runs").insert({
        source: `governance:${scraper.name}`,
        status: "error",
        documents_found: 0,
        documents_new: 0,
        error_message: errorMsg,
        ran_at: new Date().toISOString(),
      });
    }
  }

  const totalNew = results.reduce((acc, r) => acc + r.newEvents, 0);
  const totalUpdated = results.reduce((acc, r) => acc + r.updatedEvents, 0);

  return NextResponse.json({
    success: true,
    bodies_scraped: results.length,
    new_events: totalNew,
    updated_events: totalUpdated,
    per_body: results,
    duration_ms: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });
}
