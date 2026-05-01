/**
 * getWelcomeData(userId) — shared data function for /platform/welcome page
 * and GET /api/welcome.
 *
 * Returns the top 3 most-mentioned entities for the user (by 30-day
 * entity_mentions count), enriched with pulse score, upcoming governance event,
 * "why it matters" sentence, and sparkline (12 weekly velocity_scores points).
 */

import { createClient } from "@supabase/supabase-js";
import { WELCOME_TOPIC_MAP } from "./topic-mapping";
import { whyItMatters } from "./rules";
import { weeklyDedupe } from "@/app/lib/velocity";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface WelcomeEntity {
  id: string;
  name: string;
  entity_type: string;
  tracker_tag: string | null;
  pulse_score: number | null;
  pulse_band: "HIGH" | "ELEVATED" | "LOW" | null;
  momentum_direction: "accelerating" | "stable" | "decelerating" | null;
  mentions_30d: number;
  why_it_matters: string;
  next_event: { title: string; starts_at: string } | null;
  sparkline_data: number[];  // up to 12 weekly velocity_scores points, oldest first
}

export interface WelcomeData {
  entities: WelcomeEntity[];
}

function pulseBand(score: number | null): "HIGH" | "ELEVATED" | "LOW" | null {
  if (score === null) return null;
  if (score >= 7.0) return "HIGH";
  if (score >= 5.0) return "ELEVATED";
  return "LOW";
}

export async function getWelcomeData(userId: string): Promise<WelcomeData> {
  const now = new Date();
  const window30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const window60d = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch user's tracked entities (up to 50 to find top 3 by mentions)
  const { data: userEntities } = await supabase
    .from("user_entities")
    .select("entity_id, entities!inner(id, name, entity_type, tracker_tag)")
    .eq("user_id", userId)
    .limit(50);

  if (!userEntities || userEntities.length === 0) {
    return { entities: [] };
  }

  const entityIds = userEntities.map((ue: any) => ue.entity_id);

  // 2. Count entity_mentions in last 30 days for each entity
  const { data: mentions } = await supabase
    .from("entity_mentions")
    .select("entity_id")
    .in("entity_id", entityIds)
    .gte("mentioned_at", window30d);

  // Aggregate counts
  const mentionCounts = new Map<string, number>();
  for (const id of entityIds) mentionCounts.set(id, 0);
  for (const m of mentions || []) {
    mentionCounts.set(m.entity_id, (mentionCounts.get(m.entity_id) ?? 0) + 1);
  }

  // 3. Sort by mention count DESC, take top 3
  const sortedIds = [...mentionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  // Build entity lookup
  const entityMap = new Map<string, any>();
  for (const ue of userEntities) {
    const e = (ue as any).entities;
    if (e) entityMap.set(e.id, e);
  }

  // 4. For each top entity, fetch pulse score + sparkline + next governance event
  const results: WelcomeEntity[] = [];

  for (const entityId of sortedIds) {
    const entity = entityMap.get(entityId);
    if (!entity) continue;

    const mentions_30d = mentionCounts.get(entityId) ?? 0;
    const trackerTag = entity.tracker_tag as string | null;

    // Pulse score: latest velocity_scores row for this tracker_tag
    let pulse_score: number | null = null;
    let momentum_direction: "accelerating" | "stable" | "decelerating" | null = null;
    let sparkline_data: number[] = [];

    if (trackerTag) {
      const { data: vsRows } = await supabase
        .from("velocity_scores")
        .select("score, momentum_direction, calculated_at")
        .eq("tracker_slug", trackerTag)
        .order("calculated_at", { ascending: false })
        .limit(52); // enough history for weeklyDedupe to yield 12

      if (vsRows && vsRows.length > 0) {
        pulse_score = vsRows[0].score;
        momentum_direction = vsRows[0].momentum_direction;

        // Sparkline: 12 weekly points, oldest first
        const weekly = weeklyDedupe(vsRows, 12);
        sparkline_data = weekly.reverse().map((r: any) => r.score);
      }
    }

    // Next governance event within 60 days matching tracker topics
    let next_event: { title: string; starts_at: string } | null = null;
    if (trackerTag) {
      const topics = WELCOME_TOPIC_MAP[trackerTag] ?? [];
      if (topics.length > 0) {
        // Query for events where topics array overlaps our topic list
        // Use OR of contains() calls for each topic
        let evQuery = supabase
          .from("governance_events")
          .select("title, starts_at")
          .gte("starts_at", now.toISOString())
          .lte("starts_at", window60d)
          .order("starts_at", { ascending: true })
          .limit(1);

        // Supabase doesn't support OR across contains() directly in the JS client;
        // use overlaps() (&&) with the full array instead
        evQuery = evQuery.overlaps("topics", topics);

        const { data: events } = await evQuery;
        if (events && events.length > 0) {
          next_event = { title: events[0].title, starts_at: events[0].starts_at };
        }
      }
    }

    const why_it_matters = whyItMatters(
      { entity: { id: entity.id, name: entity.name, tracker_tag: trackerTag }, pulseScore: pulse_score, mentions30d: mentions_30d, nextEvent: next_event },
      now
    );

    results.push({
      id: entity.id,
      name: entity.name,
      entity_type: entity.entity_type,
      tracker_tag: trackerTag,
      pulse_score,
      pulse_band: pulseBand(pulse_score),
      momentum_direction,
      mentions_30d,
      why_it_matters,
      next_event,
      sparkline_data,
    });
  }

  return { entities: results };
}
