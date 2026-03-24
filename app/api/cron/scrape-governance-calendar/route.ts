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

// ─── Jina helper ──────────────────────────────────────────────────────────────

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
  return crypto
    .createHash("sha256")
    .update(`${body}:${title}:${date}`)
    .digest("hex")
    .slice(0, 20);
}

// Date parsing helper — tries multiple formats
function parseDate(text: string): string | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  try {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch { /* fall through */ }
  return null;
}

// ─── Individual body scrapers ─────────────────────────────────────────────────

async function scrapeIMO(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina(
    "https://www.imo.org/en/MediaCentre/MeetingSummaries/Pages/default.aspx"
  );
  if (!md) return [];

  const events: ScrapedEvent[] = [];
  // IMO meeting summaries list meetings with titles and dates
  // Pattern: [Title](url) followed by date info
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const linkMatch = lines[i].match(
      /\[([^\]]+)\]\((https?:\/\/www\.imo\.org[^)]+)\)/
    );
    if (!linkMatch) continue;

    const title = linkMatch[1].trim();
    if (title.length < 10 || title.includes("Menu") || title.includes("submenu")) continue;

    // Look for date in current and next lines
    const dateText = (lines[i] + " " + (lines[i + 1] || "")).match(
      /(\d{1,2}\s+\w+\s+\d{4})/
    );

    // Determine body from title
    let topics = ["shipping"];
    if (/MEPC/i.test(title)) topics = ["shipping", "marine_pollution", "emissions"];
    if (/MSC/i.test(title)) topics = ["shipping", "maritime_safety"];
    if (/LEG/i.test(title)) topics = ["shipping", "unclos"];
    if (/FAL/i.test(title)) topics = ["shipping", "facilitation"];

    events.push({
      bodyAbbreviation: "IMO",
      title,
      eventType: "meeting",
      startsAt: dateText ? parseDate(dateText[1]) || new Date().toISOString() : new Date().toISOString(),
      location: "London, UK",
      isVirtual: false,
      agendaUrl: linkMatch[2],
      sourceId: makeSourceId("IMO", title, dateText?.[1] || title),
      topics,
    });
  }
  return events.slice(0, 20);
}

async function scrapeISA(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.isa.org.jm/sessions");
  if (!md) return [];

  const events: ScrapedEvent[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;

    const title = linkMatch[1].trim();
    if (title.length < 10 || title.includes("Menu")) continue;
    if (!/session|council|assembly|commission/i.test(title)) continue;

    const dateMatch = line.match(/(\d{1,2}\s+\w+\s*[-–]\s*\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{4})/);

    const topics = ["deep_sea_mining"];
    if (/mining code|exploitation/i.test(title)) topics.push("mining_code");
    if (/council/i.test(title)) topics.push("isa_council");

    events.push({
      bodyAbbreviation: "ISA",
      title,
      eventType: "session",
      startsAt: dateMatch ? parseDate(dateMatch[1]) || new Date().toISOString() : new Date().toISOString(),
      location: "Kingston, Jamaica",
      isVirtual: false,
      agendaUrl: linkMatch[2],
      sourceId: makeSourceId("ISA", title, dateMatch?.[1] || title),
      topics,
    });
  }
  return events.slice(0, 15);
}

async function scrapeIWC(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://iwc.int/en/meetings");
  if (!md) return [];

  const events: ScrapedEvent[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;

    const title = linkMatch[1].trim();
    if (title.length < 10 || !/commission|committee|meeting|session/i.test(title)) continue;

    const dateMatch = line.match(/(\d{1,2}\s+\w+\s+\d{4})/);

    const topics = ["whaling", "cetacean_conservation"];
    if (/scientific/i.test(title)) topics.push("science");
    if (/conservation/i.test(title)) topics.push("conservation");

    events.push({
      bodyAbbreviation: "IWC",
      title,
      eventType: "meeting",
      startsAt: dateMatch ? parseDate(dateMatch[1]) || new Date().toISOString() : new Date().toISOString(),
      isVirtual: false,
      sourceId: makeSourceId("IWC", title, dateMatch?.[1] || title),
      topics,
    });
  }
  return events.slice(0, 10);
}

async function scrapeCBD(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.cbd.int/meetings");
  if (!md) return [];

  const events: ScrapedEvent[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;

    const title = linkMatch[1].trim();
    if (title.length < 10 || title.includes("Menu")) continue;
    if (!/cop|sbstta|working group|meeting|session|conference/i.test(title)) continue;

    const dateMatch = line.match(/(\d{1,2}\s+\w+\s+\d{4})/);
    const topics = ["biodiversity", "30x30"];
    if (/ocean|marine/i.test(title)) topics.push("marine_biodiversity");
    if (/sbstta/i.test(title)) topics.push("science");

    events.push({
      bodyAbbreviation: "CBD",
      title,
      eventType: "meeting",
      startsAt: dateMatch ? parseDate(dateMatch[1]) || new Date().toISOString() : new Date().toISOString(),
      isVirtual: false,
      agendaUrl: linkMatch[2],
      sourceId: makeSourceId("CBD", title, dateMatch?.[1] || title),
      topics,
    });
  }
  return events.slice(0, 15);
}

async function scrapeOSPAR(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina(
    "https://www.ospar.org/about/intersessional-correspondence-groups/meetings"
  );
  if (!md) return [];

  const events: ScrapedEvent[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;

    const title = linkMatch[1].trim();
    if (title.length < 10) continue;
    if (!/commission|committee|biodiversity|offshore|meeting/i.test(title)) continue;

    const dateMatch = line.match(/(\d{1,2}\s+\w+\s+\d{4})/);
    const topics = ["north_east_atlantic", "mpa"];
    if (/biodiversity/i.test(title)) topics.push("biodiversity");
    if (/offshore/i.test(title)) topics.push("offshore_industry");

    events.push({
      bodyAbbreviation: "OSPAR",
      title,
      eventType: "meeting",
      startsAt: dateMatch ? parseDate(dateMatch[1]) || new Date().toISOString() : new Date().toISOString(),
      isVirtual: false,
      sourceId: makeSourceId("OSPAR", title, dateMatch?.[1] || title),
      topics,
    });
  }
  return events.slice(0, 10);
}

async function scrapeCCAMLR(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.ccamlr.org/en/meetings");
  if (!md) return [];

  const events: ScrapedEvent[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;

    const title = linkMatch[1].trim();
    if (title.length < 10) continue;
    if (!/commission|committee|meeting|session|scientific/i.test(title)) continue;

    const dateMatch = line.match(/(\d{1,2}\s+\w+\s+\d{4})/);
    const topics = ["southern_ocean", "antarctic", "mpa"];
    if (/scientific/i.test(title)) topics.push("science");

    events.push({
      bodyAbbreviation: "CCAMLR",
      title,
      eventType: "meeting",
      startsAt: dateMatch ? parseDate(dateMatch[1]) || new Date().toISOString() : new Date().toISOString(),
      location: "Hobart, Australia",
      isVirtual: false,
      sourceId: makeSourceId("CCAMLR", title, dateMatch?.[1] || title),
      topics,
    });
  }
  return events.slice(0, 10);
}

async function scrapeICCAT(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.iccat.int/en/Meetings.asp");
  if (!md) return [];

  const events: ScrapedEvent[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;

    const title = linkMatch[1].trim();
    if (title.length < 10) continue;

    const dateMatch = line.match(/(\d{1,2}\s+\w+\s+\d{4})/);
    const topics = ["fisheries", "tuna", "atlantic"];
    if (/quota|bluefin|swordfish/i.test(title)) topics.push("quota");
    if (/shark/i.test(title)) topics.push("sharks");

    events.push({
      bodyAbbreviation: "ICCAT",
      title,
      eventType: "meeting",
      startsAt: dateMatch ? parseDate(dateMatch[1]) || new Date().toISOString() : new Date().toISOString(),
      location: "Madrid, Spain",
      isVirtual: false,
      sourceId: makeSourceId("ICCAT", title, dateMatch?.[1] || title),
      topics,
    });
  }
  return events.slice(0, 10);
}

async function scrapeCITES(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://cites.org/eng/news/meetings.php");
  if (!md) return [];

  const events: ScrapedEvent[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;

    const title = linkMatch[1].trim();
    if (title.length < 10) continue;
    if (!/cop|committee|meeting|session|animals/i.test(title)) continue;

    const dateMatch = line.match(/(\d{1,2}\s+\w+\s+\d{4})/);
    const topics = ["cites", "species_trade"];
    if (/shark|ray|marine/i.test(title)) topics.push("marine_species");

    events.push({
      bodyAbbreviation: "CITES",
      title,
      eventType: "meeting",
      startsAt: dateMatch ? parseDate(dateMatch[1]) || new Date().toISOString() : new Date().toISOString(),
      location: "Geneva, Switzerland",
      isVirtual: false,
      sourceId: makeSourceId("CITES", title, dateMatch?.[1] || title),
      topics,
    });
  }
  return events.slice(0, 10);
}

async function scrapeUNOC(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina("https://www.un.org/oceansconference");
  if (!md) return [];

  const events: ScrapedEvent[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;

    const title = linkMatch[1].trim();
    if (title.length < 10 || title.includes("Menu")) continue;
    if (!/conference|preparatory|commitment|session/i.test(title)) continue;

    const dateMatch = line.match(/(\d{1,2}\s+\w+\s+\d{4})/);

    events.push({
      bodyAbbreviation: "UNOC",
      title,
      eventType: "conference",
      startsAt: dateMatch ? parseDate(dateMatch[1]) || new Date().toISOString() : new Date().toISOString(),
      isVirtual: false,
      sourceId: makeSourceId("UNOC", title, dateMatch?.[1] || title),
      topics: ["ocean_governance", "sdg14", "voluntary_commitments"],
    });
  }
  return events.slice(0, 10);
}

async function scrapeWTOFish(): Promise<ScrapedEvent[]> {
  const md = await fetchViaJina(
    "https://www.wto.org/english/tratop_e/fish_e/fish_e.htm"
  );
  if (!md) return [];

  const events: ScrapedEvent[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (!linkMatch) continue;

    const title = linkMatch[1].trim();
    if (title.length < 10) continue;
    if (!/meeting|session|committee|subsidies|fisheries|deadline/i.test(title)) continue;

    const dateMatch = line.match(/(\d{1,2}\s+\w+\s+\d{4})/);

    events.push({
      bodyAbbreviation: "WTO-Fish",
      title,
      eventType: "meeting",
      startsAt: dateMatch ? parseDate(dateMatch[1]) || new Date().toISOString() : new Date().toISOString(),
      location: "Geneva, Switzerland",
      isVirtual: false,
      sourceId: makeSourceId("WTO-Fish", title, dateMatch?.[1] || title),
      topics: ["fisheries_subsidies", "trade", "iuu_fishing"],
    });
  }
  return events.slice(0, 10);
}

// ─── Claude significance classifier ──────────────────────────────────────────

async function classifySignificance(
  event: ScrapedEvent,
  eventId: string,
  bodyName: string
): Promise<void> {
  try {
    const prompt = `You are assessing the significance of an ocean governance meeting for professional subscribers — NGO policy officers, corporate ESG analysts, blue finance investors, shipping compliance teams.

Meeting: ${event.title}
Body: ${bodyName} (${event.bodyAbbreviation})
Date: ${event.startsAt}
Description: ${event.description || "Not available"}
Topics: ${event.topics.join(", ")}

Classify significance as one of:
- critical: Major decisions expected that will directly affect ocean governance, policy, or commercial operations. Subscribers need to know well in advance.
- important: Significant meeting with real outcomes but not immediately commercially or legally consequential.
- routine: Regular meeting, procedural, or early-stage consultation with no imminent decisions.

Also identify which audience tags apply: ngos, corporate_esg, blue_finance, shipping_compliance, fisheries_industry, researchers

Return JSON only:
{"significance":"critical|important|routine","significance_reason":"one sentence","audience_tags":["tag1"],"expected_decisions":[{"description":"what","type":"vote|adoption|review|deadline","expected_outcome":"adoption_likely|contested|likely_deferred|unknown"}]}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
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

// ─── Master orchestrator ──────────────────────────────────────────────────────

async function processEvents(
  bodyAbbreviation: string,
  events: ScrapedEvent[]
): Promise<ScrapeResult> {
  let newEvents = 0;
  let updatedEvents = 0;

  // Look up body_id
  const { data: body } = await supabase
    .from("governance_bodies")
    .select("id, name")
    .eq("abbreviation", bodyAbbreviation)
    .single();

  if (!body) {
    return { body: bodyAbbreviation, newEvents: 0, updatedEvents: 0, error: "Body not found in database" };
  }

  for (const event of events) {
    // Check if event already exists
    const { data: existing } = await supabase
      .from("governance_events")
      .select("id")
      .eq("source_id", event.sourceId)
      .single();

    if (existing) {
      // Update if we have new info
      await supabase
        .from("governance_events")
        .update({
          title: event.title,
          agenda_url: event.agendaUrl || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      updatedEvents++;
    } else {
      // Insert new event
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
          significance: "routine", // default, will be classified
        })
        .select("id")
        .single();

      if (!error && inserted) {
        newEvents++;
        // Classify significance with Claude (don't block on failure)
        await classifySignificance(event, inserted.id, body.name);
      }
    }
  }

  // Update last_scraped_at
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

  for (const scraper of scrapers) {
    try {
      const events = await scraper.fn();
      const result = await processEvents(scraper.name, events);
      results.push(result);

      // Log to scrape_runs
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
