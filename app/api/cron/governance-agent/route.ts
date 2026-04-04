import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const VALID_SLUGS = new Set(["bbnj", "isa", "iuu", "30x30", "imo_shipping", "whaling", "msp", "arctic"]);
const VALID_TYPES = new Set(["milestone", "setback", "update"]);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];
  let storiesProcessed = 0;
  let eventsCreated = 0;

  try {
    const h48 = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: stories, error: fetchError } = await supabase
      .from("stories")
      .select("id, title, short_summary, source_name, link, source_type, significance_score")
      .in("source_type", ["gov", "reg"])
      .not("short_summary", "is", null)
      .gte("published_at", h48)
      .order("significance_score", { ascending: false })
      .limit(10);

    if (fetchError) {
      errors.push(`Fetch error: ${fetchError.message}`);
      await logRun(0, 0, errors.join("; "));
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!stories || stories.length === 0) {
      console.log("[Governance Agent] No stories to process");
      await logRun(0, 0, null);
      return NextResponse.json({ stories_processed: 0, events_created: 0 });
    }

    for (const story of stories) {
      storiesProcessed++;
      try {
        const message = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
          system: [{ type: "text", text: "You are an ocean governance analyst extracting structured intelligence. Return JSON only. No markdown.", cache_control: { type: "ephemeral" } }],
          messages: [{
            role: "user",
            content: `Story: ${story.title}. ${story.short_summary}. Source: ${story.source_name}. Does this story represent a governance event for any of these trackers: bbnj, isa, iuu, 30x30, imo_shipping, whaling, msp, arctic? If yes return array of event objects. If no governance events, return empty array. Each object must have: { "tracker_slug": string, "event_type": "milestone" or "setback" or "update", "event_title": "max 12 words", "event_summary": "max 40 words", "significance_score": 0-100, "source_url": "${story.link}", "source_name": "${story.source_name}" }`,
          }],
        });

        const text = message.content[0].type === "text" ? message.content[0].text : "";
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        const events = Array.isArray(parsed) ? parsed : [];

        for (const evt of events) {
          if (!VALID_SLUGS.has(evt.tracker_slug) || !VALID_TYPES.has(evt.event_type)) continue;

          // Dedup: check if source_url + tracker_slug already exists
          const { data: existing } = await supabase
            .from("tracker_events")
            .select("id")
            .eq("source_url", story.link)
            .eq("tracker_slug", evt.tracker_slug)
            .limit(1);

          if (existing && existing.length > 0) continue;

          const { error: insertError } = await supabase
            .from("tracker_events")
            .insert({
              tracker_slug: evt.tracker_slug,
              event_date: new Date().toISOString().split("T")[0],
              title: (evt.event_title || "").slice(0, 200),
              summary: (evt.event_summary || "").slice(0, 500),
              source_url: story.link,
              event_type: evt.event_type,
            });

          if (insertError) {
            errors.push(`Insert error for ${evt.tracker_slug}: ${insertError.message}`);
            continue;
          }

          eventsCreated++;
          console.log(`[Governance Agent] Created ${evt.event_type} for ${evt.tracker_slug}: ${evt.event_title}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Story "${story.title}": ${msg}`);
        console.error(`[Governance Agent] Error processing "${story.title}":`, msg);
      }
    }

    console.log(`[Governance Agent] Done. Processed: ${storiesProcessed}, Created: ${eventsCreated}`);
    await logRun(storiesProcessed, eventsCreated, errors.length > 0 ? errors.join("; ") : null);

    return NextResponse.json({
      stories_processed: storiesProcessed,
      events_created: eventsCreated,
      errors: errors.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    console.error("[Governance Agent] Fatal error:", msg);
    await logRun(storiesProcessed, eventsCreated, errors.join("; "));
    return NextResponse.json({ error: "Governance agent failed" }, { status: 500 });
  }
}

async function logRun(storiesProcessed: number, eventsCreated: number, errorText: string | null) {
  await supabase.from("cron_log").insert({
    agent_name: "governance-agent",
    stories_processed: storiesProcessed,
    events_created: eventsCreated,
    errors: errorText,
  });
}
