/**
 * entity-brief.ts v6
 * Per-user entity-based morning brief pipeline — premium redesign.
 *
 * Exports:
 *   getUserEntityFeed        -- query DB + generate AI sentences for all entities
 *   qualityGate              -- 'pass' | 'reject'
 *   composeEntityBriefHtml   -- v6 inline-style HTML email
 *   generateEntitySubjectLine -- deterministic 3-case subject line
 *
 * Brief structure (v6):
 *   1. Masthead
 *   2. Opening (firstName, dynamic subline)
 *   3. Your N Today (all tracked entities, dot status)
 *   4. Pulse Tracker Card (single rotating card with sparkline)
 *   5. Editor's Call (mint card, Haiku-generated)
 *   6. Across the Sector (top stories, if >=4)
 *   7. The Week Ahead (upcoming governance events)
 *   8. Sign-off
 *   9. Footer (outside main card)
 *
 * Model: claude-haiku-4-5-20251001 for all AI generation (per CLAUDE_RULES).
 * Significance thresholds: Material >= 25, Watch 10-24.
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { TRACKER_DESCRIPTIONS } from "./tracker-descriptions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export const MATERIAL_THRESHOLD = 25;
export const WATCH_THRESHOLD = 10;
const MAX_PER_SECTION = 5;
const BASE_URL = "https://www.thetideline.co";

// v6 colour palette
const F = "'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif";
const BG_PAGE      = "#F7F7F5";
const TEXT_PRIMARY = "#0B1628";
const TEXT_SECONDARY = "#5A7290";
const TEXT_MUTED   = "#8BA0BC";
const TEXT_LIGHT   = "#A8B5C7";
const TEAL         = "#1D9E75";
const MINT_BG      = "#F4FBF7";
const AMBER        = "#EF9F27";
const RED_COL      = "#E24B4A";
const PULSE_BG     = "#FAFAF8";
const PULSE_BORDER = "#EDEDEA";
const DOT_QUIET    = "#D4DDE8";

const TRACKER_DISPLAY_NAMES: Record<string, string> = {
  "isa":           "ISA",
  "bbnj":          "BBNJ",
  "iuu":           "IUU",
  "30x30":         "30x30",
  "blue-finance":  "Blue Finance",
  "imo-shipping":  "IMO",
  "offshore-wind": "Offshore Wind",
  "cites-marine":  "CITES",
  "wto-fisheries": "WTO Fisheries",
  "plastics":      "Plastics",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EntityStatusItem {
  entityId: string;
  entityName: string;
  trackerTag: string | null;
  moved: boolean;
  statusSentence: string;
  bestStoryId: string | null;
  bestStoryLink: string | null;
}

export interface PulseCardData {
  trackerSlug: string;
  displayName: string;
  description: string;
  score: number;
  band: "LOW" | "WATCH" | "ELEVATED" | "HIGH";
  weekOverWeek: number | null;
  interpretation: string;
  sparklineValues: number[];
}

export interface WeekAheadItem {
  dayLabel: string;
  description: string;
}

export interface BriefStoryItem {
  entityId: string;
  entityName: string;
  storyId: string;
  title: string;
  sourceName: string;
  sourceType: string;
  significanceScore: number;
  shortSummary: string | null;
  link: string;
  fetchedAt: string;
}

export interface TopStoryItem {
  storyId: string;
  title: string;
  sourceName: string;
  sourceType: string;
  significanceScore: number;
  shortSummary: string | null;
  link: string;
  fetchedAt: string;
  topic: string;
}

export interface PulseItem {
  trackerSlug: string;
  score: number;
  band: "LOW" | "WATCH" | "ELEVATED" | "HIGH";
  direction: string;
  weekOverWeek: number | null;
  interpretation: string;
}

export interface EntityBriefFeed {
  firstName: string | null;
  material: BriefStoryItem[];
  watch: BriefStoryItem[];
  allEntities: EntityStatusItem[];
  topStories: TopStoryItem[];
  quietCount: number;
  totalTracked: number;
  pulseScores: PulseItem[];
  selectedPulseCard: PulseCardData | null;
  weekAheadItems: WeekAheadItem[];
  editorsCallText: string;
}

export type QualityGateResult = "pass" | "reject";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreToBand(score: number): PulseItem["band"] {
  if (score >= 8) return "HIGH";
  if (score >= 7) return "ELEVATED";
  if (score >= 4) return "WATCH";
  return "LOW";
}

function bandTextColor(band: PulseItem["band"]): string {
  switch (band) {
    case "HIGH":     return "#9B1C1C";
    case "ELEVATED": return "#1D9E75";
    case "WATCH":    return "#92400E";
    default:         return "#6B7280";
  }
}

export function trackerLabel(slug: string): string {
  return TRACKER_DISPLAY_NAMES[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

const NUMBER_WORDS: Record<number, string> = {
  1: "ONE", 2: "TWO", 3: "THREE", 4: "FOUR", 5: "FIVE",
  6: "SIX", 7: "SEVEN", 8: "EIGHT", 9: "NINE", 10: "TEN",
};

function nLabel(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

function buildSparklineSvg(values: number[]): string {
  if (values.length < 2) return "";
  const W = 260, H = 60, PAD = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const normalize = (v: number) => (range === 0 ? 0.5 : (v - min) / range);

  const pts = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
    const y = (H - PAD) - normalize(v) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = pts[pts.length - 1].split(",");
  const lx = parseFloat(last[0]);
  const ly = parseFloat(last[1]);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" ` +
    `viewBox="0 0 ${W} ${H}" style="display:block;">` +
    `<polyline fill="none" stroke="${TEAL}" stroke-width="2.5" ` +
    `stroke-linejoin="round" stroke-linecap="round" points="${pts.join(" ")}"/>` +
    `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="8" fill="${TEAL}" opacity="0.2"/>` +
    `<circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4" fill="${TEAL}"/>` +
    `</svg>`
  );
}

// ─── AI Generation ────────────────────────────────────────────────────────────

// Deterministic quiet sentence — no LLM. Uses last_seen date from entity_mentions.
function quietEntitySentence(lastSeen: Date | null): string {
  if (!lastSeen) return "No recent coverage.";
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 14) {
    // "D Month" format, e.g. "8 April"
    const formatted = lastSeen.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
    return `Quiet since ${formatted}.`;
  }
  return `No new developments in the last ${daysDiff} days.`;
}

// Haiku call for moving entities only — we have real story context to pass.
async function generateMovedEntitySentence(
  entityName: string,
  trackerTag: string | null,
  story: { title: string; shortSummary: string | null }
): Promise<string> {
  const trackerName = trackerTag ? (TRACKER_DISPLAY_NAMES[trackerTag] ?? trackerTag) : null;
  const fallback = "Active in the last 24 hours.";

  try {
    const prompt =
      `Entity: ${entityName}${trackerName ? ` (${trackerName} tracker)` : ""}.\n` +
      `Story: "${story.title}"\n` +
      `${story.shortSummary ? `Context: ${story.shortSummary.slice(0, 200)}` : ""}\n\n` +
      `In one to two sentences, state what this entity did in the last 24 hours and why it matters this week or this quarter. Name specific dates, numbers, or consequences. Neutral tone. Do not use: signals, suggests, reshapes, marks, underscores, highlights.`;

    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      system: [
        {
          type: "text",
          text: "You write concise entity status sentences for an ocean intelligence newsletter. One to two sentences maximum. Never use em dashes. Never use hype words like signals, suggests, reshapes, marks, underscores. Be factual and specific.",
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    return text.length > 4 ? text : fallback;
  } catch {
    return fallback;
  }
}

async function generateOrFetchInterpretation(
  trackerSlug: string,
  score: number,
  band: string,
  weekOverWeek: number | null,
  direction: string,
  calculatedAt: string,
  existingInterpretation: string | null
): Promise<string> {
  if (existingInterpretation) return existingInterpretation;

  const displayName = TRACKER_DISPLAY_NAMES[trackerSlug] ?? trackerSlug;
  const fallback = `${displayName} at ${band}.`;

  try {
    const wowStr = weekOverWeek != null
      ? `${weekOverWeek >= 0 ? "+" : ""}${weekOverWeek.toFixed(1)} this week`
      : "no week-over-week data";

    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      system: [
        {
          type: "text",
          text: "You write one-sentence tracker condition summaries for an ocean intelligence newsletter. Be specific and factual. Name a next known decision point if possible. No hype words. No em dashes.",
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{
        role: "user",
        content: `Tracker: ${displayName}. Score: ${score.toFixed(1)}, Band: ${band}, WoW: ${wowStr}, Direction: ${direction}. Write one sentence describing current condition and naming the next known decision point if you know it.`,
      }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    if (text.length > 4) {
      // Cache to velocity_scores for future runs
      await supabase
        .from("velocity_scores")
        .update({ interpretation: text })
        .eq("tracker_slug", trackerSlug)
        .eq("calculated_at", calculatedAt);
      return text;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

async function generateEditorsCall(
  allEntities: EntityStatusItem[],
  topStories: TopStoryItem[]
): Promise<string> {
  const moved = allEntities.filter(e => e.moved);
  if (moved.length === 0 && topStories.length === 0) return "";

  const entityContext = moved.length > 0
    ? `Moving entities:\n${moved.map(e => `- ${e.entityName}: ${e.statusSentence}`).join("\n")}`
    : "";
  const storyContext = topStories.length > 0
    ? `Top stories:\n${topStories.slice(0, 3).map(s => `- ${s.title}`).join("\n")}`
    : "";
  const context = [entityContext, storyContext].filter(Boolean).join("\n\n");

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      system: [
        {
          type: "text",
          text: "You write brief editorial judgement for an ocean intelligence newsletter. 2-3 sentences. Name the single most important thing to watch this week and why. End with a concrete action suggestion. No hype words. No em dashes. Example tone: ISA is the one to watch this week. Council session opens Wednesday and Nauru's trigger is on the agenda. If you're drafting a client note, start there.",
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: context }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    return text.length > 10 ? text : "";
  } catch {
    return "";
  }
}

// ─── Pulse Card Selection ─────────────────────────────────────────────────────

type VelocityRow = {
  tracker_slug: string;
  score: number;
  previous_score: number | null;
  momentum_direction: string | null;
  interpretation: string | null;
  calculated_at: string;
};

async function selectPulseCard(
  userId: string,
  entityTrackerSlugs: string[],
  velocityRows: VelocityRow[]
): Promise<PulseCardData | null> {
  if (entityTrackerSlugs.length === 0 || velocityRows.length === 0) return null;

  // Latest row per tracker (velocityRows already ordered DESC)
  const latestBySlug = new Map<string, VelocityRow>();
  for (const row of velocityRows) {
    if (!latestBySlug.has(row.tracker_slug)) latestBySlug.set(row.tracker_slug, row);
  }

  // Only consider trackers that have user entities
  const candidateSlugs = entityTrackerSlugs.filter(s => latestBySlug.has(s));
  if (candidateSlugs.length === 0) return null;

  let selectedSlug: string | null = null;

  // Priority a: band crossed in latest row
  for (const slug of candidateSlugs) {
    const row = latestBySlug.get(slug)!;
    if (row.previous_score != null && scoreToBand(row.score) !== scoreToBand(row.previous_score)) {
      selectedSlug = slug;
      break;
    }
  }

  // Priority b: largest absolute WoW change
  if (!selectedSlug) {
    let maxWow = -1;
    for (const slug of candidateSlugs) {
      const row = latestBySlug.get(slug)!;
      if (row.previous_score != null) {
        const wow = Math.abs(row.score - row.previous_score);
        if (wow > maxWow) { maxWow = wow; selectedSlug = slug; }
      }
    }
  }

  // Priority c: least recently featured for this user
  if (!selectedSlug) {
    const { data: historyRows } = await supabase
      .from("brief_pulse_history")
      .select("tracker_slug, featured_at")
      .eq("user_id", userId)
      .in("tracker_slug", candidateSlugs)
      .order("featured_at", { ascending: false })
      .limit(50);

    const lastFeatured = new Map<string, Date>();
    for (const h of historyRows || []) {
      if (!lastFeatured.has(h.tracker_slug)) {
        lastFeatured.set(h.tracker_slug, new Date(h.featured_at));
      }
    }

    // Never featured: pick first such tracker
    const neverFeatured = candidateSlugs.find(s => !lastFeatured.has(s));
    if (neverFeatured) {
      selectedSlug = neverFeatured;
    } else {
      // Pick the one featured longest ago
      let oldestDate = new Date();
      for (const slug of candidateSlugs) {
        const d = lastFeatured.get(slug)!;
        if (d < oldestDate) { oldestDate = d; selectedSlug = slug; }
      }
    }
  }

  // Priority d: day-of-week rotation fallback
  if (!selectedSlug) {
    selectedSlug = candidateSlugs[new Date().getDay() % candidateSlugs.length];
  }

  if (!selectedSlug) return null;

  const latestRow = latestBySlug.get(selectedSlug)!;

  // Sparkline: 12 most recent weekly scores for selected tracker
  const { data: sparkRows } = await supabase
    .from("velocity_scores")
    .select("score")
    .eq("tracker_slug", selectedSlug)
    .order("calculated_at", { ascending: false })
    .limit(12);
  const sparklineValues = (sparkRows || []).map((r: { score: number }) => r.score).reverse();

  // Interpretation: load cached or generate + cache
  const wow = latestRow.previous_score != null
    ? Math.round((latestRow.score - latestRow.previous_score) * 10) / 10
    : null;
  const interpretation = await generateOrFetchInterpretation(
    selectedSlug,
    latestRow.score,
    scoreToBand(latestRow.score),
    wow,
    latestRow.momentum_direction ?? "stable",
    latestRow.calculated_at,
    latestRow.interpretation ?? null
  );

  // Record in brief_pulse_history (non-fatal)
  void supabase.from("brief_pulse_history").insert({
    user_id: userId,
    tracker_slug: selectedSlug,
  });

  return {
    trackerSlug: selectedSlug,
    displayName: TRACKER_DISPLAY_NAMES[selectedSlug] ?? selectedSlug,
    description: TRACKER_DESCRIPTIONS[selectedSlug] ?? "",
    score: latestRow.score,
    band: scoreToBand(latestRow.score),
    weekOverWeek: wow,
    interpretation,
    sparklineValues,
  };
}

// ─── Week Ahead ───────────────────────────────────────────────────────────────

async function fetchWeekAheadItems(): Promise<WeekAheadItem[]> {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Try 7-day window first, fall back to 30 days
  for (const days of [7, 30]) {
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const { data } = await supabase
      .from("governance_events")
      .select("title, start_date")
      .gte("start_date", todayStr)
      .lte("start_date", cutoff.toISOString().slice(0, 10))
      .order("start_date", { ascending: true })
      .limit(3);

    if (data && data.length > 0) {
      return data.map((row: { title: string; start_date: string }) => ({
        dayLabel: new Date(row.start_date + "T12:00:00Z")
          .toLocaleDateString("en-US", { weekday: "short" })
          .toUpperCase()
          .slice(0, 3),
        description: row.title,
      }));
    }
  }
  return [];
}

// ─── getUserEntityFeed ────────────────────────────────────────────────────────

export async function getUserEntityFeed(userId: string): Promise<EntityBriefFeed> {
  const window24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1. First name
  const { data: userRow } = await supabase
    .from("users")
    .select("first_name")
    .eq("id", userId)
    .maybeSingle();
  const firstName: string | null = userRow?.first_name ?? null;

  // 2. Tracked entities
  const { data: userEntities, error: ueErr } = await supabase
    .from("user_entities")
    .select("entity_id, entities(id, name, entity_type, tracker_tag)")
    .eq("user_id", userId);

  type EntityRow = { id: string; name: string; entity_type: string; tracker_tag: string | null };
  const entities: EntityRow[] = (userEntities ?? [])
    .map(ue => ue.entities as unknown as EntityRow | null)
    .filter((e): e is EntityRow => e !== null);

  const entityIds = entities.map(e => e.id);
  const totalTracked = entityIds.length;

  let material: BriefStoryItem[] = [];
  let watch: BriefStoryItem[] = [];
  let quietCount = 0;
  const pulseScores: PulseItem[] = [];
  let allEntities: EntityStatusItem[] = [];
  let selectedPulseCard: PulseCardData | null = null;
  let weekAheadItems: WeekAheadItem[] = [];
  let editorsCallText = "";

  if (!ueErr && entityIds.length > 0) {
    // 3. Entity mentions (any significance, 24h, live stories)
    const { data: mentions } = await supabase
      .from("entity_mentions")
      .select(`
        entity_id,
        stories!inner(
          id, title, link, source_name, source_type,
          significance_score, short_summary, fetched_at
        )
      `)
      .in("entity_id", entityIds)
      .gte("stories.fetched_at", window24h)
      .eq("stories.status", "live")
      .order("significance_score", { ascending: false, foreignTable: "stories" });

    // 4. Best story per entity
    const bestPerEntity = new Map<string, BriefStoryItem>();
    for (const mention of mentions || []) {
      const story = mention.stories as unknown as {
        id: string; title: string; link: string; source_name: string;
        source_type: string; significance_score: number;
        short_summary: string | null; fetched_at: string;
      } | null;
      if (!story) continue;
      const entity = entities.find(e => e.id === mention.entity_id);
      if (!entity) continue;
      const existing = bestPerEntity.get(mention.entity_id);
      if (!existing || story.significance_score > existing.significanceScore) {
        bestPerEntity.set(mention.entity_id, {
          entityId: mention.entity_id,
          entityName: entity.name,
          storyId: story.id,
          title: story.title,
          sourceName: story.source_name,
          sourceType: story.source_type,
          significanceScore: story.significance_score,
          shortSummary: story.short_summary,
          link: story.link,
          fetchedAt: story.fetched_at,
        });
      }
    }

    // 5. Bucket into material / watch
    for (const item of bestPerEntity.values()) {
      if (item.significanceScore >= MATERIAL_THRESHOLD) material.push(item);
      else if (item.significanceScore >= WATCH_THRESHOLD) watch.push(item);
    }
    material.sort((a, b) => b.significanceScore - a.significanceScore);
    watch.sort((a, b) => b.significanceScore - a.significanceScore);

    const activeEntityIds = new Set(bestPerEntity.keys());
    quietCount = entityIds.filter(id => !activeEntityIds.has(id)).length;

    // 5b. Batch query last_seen for quiet entities (deterministic template, no LLM)
    const quietEntityIds = entityIds.filter(id => !activeEntityIds.has(id));
    const lastSeenByEntity = new Map<string, Date | null>();
    if (quietEntityIds.length > 0) {
      const window90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: quietMentions } = await supabase
        .from("entity_mentions")
        .select("entity_id, stories!inner(fetched_at)")
        .in("entity_id", quietEntityIds)
        .gte("stories.fetched_at", window90d);

      // Find MAX(fetched_at) per entity in-app
      for (const m of quietMentions || []) {
        const fa = (m.stories as unknown as { fetched_at: string } | null)?.fetched_at;
        if (!fa) continue;
        const d = new Date(fa);
        const existing = lastSeenByEntity.get(m.entity_id);
        if (!existing || d > existing) lastSeenByEntity.set(m.entity_id, d);
      }
      // Entities with no mentions in 90d stay as null
      for (const id of quietEntityIds) {
        if (!lastSeenByEntity.has(id)) lastSeenByEntity.set(id, null);
      }
    }

    // 6. Velocity scores for user's trackers
    const userTrackerSlugs = [...new Set(
      entities.map(e => e.tracker_tag).filter((t): t is string => t !== null)
    )];

    let velocityRows: VelocityRow[] = [];
    if (userTrackerSlugs.length > 0) {
      const { data: vRows } = await supabase
        .from("velocity_scores")
        .select("tracker_slug, score, previous_score, momentum_direction, interpretation, calculated_at")
        .in("tracker_slug", userTrackerSlugs)
        .order("calculated_at", { ascending: false })
        .limit(userTrackerSlugs.length * 5);

      velocityRows = (vRows ?? []) as VelocityRow[];

      // Build legacy pulseScores (latest per tracker, for compat)
      const seen = new Set<string>();
      for (const row of velocityRows) {
        if (seen.has(row.tracker_slug)) continue;
        seen.add(row.tracker_slug);
        const wow = row.previous_score != null
          ? Math.round((row.score - row.previous_score) * 10) / 10 : null;
        pulseScores.push({
          trackerSlug: row.tracker_slug,
          score: row.score,
          band: scoreToBand(row.score),
          direction: row.momentum_direction ?? "stable",
          weekOverWeek: wow,
          interpretation: row.interpretation ?? "",
        });
      }
      pulseScores.sort((a, b) => b.score - a.score);
    }

    // 7. Parallel: entity sentences + pulse card + week ahead
    const [sentenceResults, pulseCard, weekAhead] = await Promise.all([
      Promise.all(
        entities.map(async entity => {
          const moved = activeEntityIds.has(entity.id);
          const bestStory = bestPerEntity.get(entity.id);
          let sentence: string;
          if (moved && bestStory) {
            // Haiku: we have real story context
            sentence = await generateMovedEntitySentence(
              entity.name,
              entity.tracker_tag,
              { title: bestStory.title, shortSummary: bestStory.shortSummary }
            );
          } else {
            // Deterministic template: use last_seen from entity_mentions
            const lastSeen = lastSeenByEntity.get(entity.id) ?? null;
            sentence = quietEntitySentence(lastSeen);
          }
          return {
            entityId: entity.id,
            entityName: entity.name,
            trackerTag: entity.tracker_tag,
            moved,
            statusSentence: sentence,
            bestStoryId: bestStory?.storyId ?? null,
            bestStoryLink: bestStory?.link ?? null,
          } as EntityStatusItem;
        })
      ),
      selectPulseCard(userId, userTrackerSlugs, velocityRows),
      fetchWeekAheadItems(),
    ]);

    // Sort: moved entities first, quiet after
    allEntities = sentenceResults.sort((a, b) => {
      if (a.moved === b.moved) return 0;
      return a.moved ? -1 : 1;
    });

    selectedPulseCard = pulseCard;
    weekAheadItems = weekAhead;
  }

  // 8. Top stories (general, deduped from entity matches)
  // Progressive threshold fallback: try 25 → 15 → 10 → 5 → 0 until we find at least 4 stories
  const matchedStoryIds = new Set([...material, ...watch].map(i => i.storyId));
  let topStories: TopStoryItem[] = [];
  for (const threshold of [MATERIAL_THRESHOLD, 15, 10, 5, 0]) {
    const { data: topRows } = await supabase
      .from("stories")
      .select("id, title, link, source_name, source_type, significance_score, short_summary, fetched_at, topic")
      .eq("status", "live")
      .gte("fetched_at", window24h)
      .gte("significance_score", threshold)
      .order("significance_score", { ascending: false })
      .limit(10);

    topStories = (topRows ?? [])
      .filter(s => !matchedStoryIds.has(s.id))
      .slice(0, MAX_PER_SECTION)
      .map(s => ({
        storyId: s.id,
        title: s.title,
        sourceName: s.source_name,
        sourceType: s.source_type,
        significanceScore: s.significance_score,
        shortSummary: s.short_summary,
        link: s.link,
        fetchedAt: s.fetched_at,
        topic: s.topic ?? "",
      }));

    if (topStories.length >= 4) break;
  }

  // 9. Editor's call (needs entity sentences + top stories)
  if (allEntities.length > 0 || topStories.length > 0) {
    editorsCallText = await generateEditorsCall(allEntities, topStories);
  }

  return {
    firstName,
    material: material.slice(0, MAX_PER_SECTION),
    watch: watch.slice(0, MAX_PER_SECTION),
    allEntities,
    topStories,
    quietCount,
    totalTracked,
    pulseScores,
    selectedPulseCard,
    weekAheadItems,
    editorsCallText,
  };
}

// ─── qualityGate ─────────────────────────────────────────────────────────────

export function qualityGate(feed: EntityBriefFeed): QualityGateResult {
  if (feed.totalTracked === 0 && feed.topStories.length === 0 && feed.pulseScores.length === 0) {
    return "reject";
  }
  return "pass";
}

// ─── composeEntityBriefHtml ───────────────────────────────────────────────────

export function composeEntityBriefHtml(feed: EntityBriefFeed, dateStr: string): string {
  const { firstName, allEntities, topStories, selectedPulseCard, weekAheadItems, editorsCallText } = feed;

  // ── Masthead ────────────────────────────────────────────────────────────────
  const masthead = `
    <tr><td style="padding:22px 28px 18px;border-bottom:1px solid ${PULSE_BORDER};">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="32" style="vertical-align:middle;">
          <div style="width:32px;height:32px;background:${TEAL};border-radius:7px;text-align:center;line-height:32px;">
            <span style="font-family:${F};font-size:18px;font-weight:800;color:#FFFFFF;line-height:32px;">T</span>
          </div>
        </td>
        <td style="vertical-align:middle;padding-left:12px;">
          <div style="font-family:${F};font-size:16px;font-weight:700;color:${TEXT_PRIMARY};letter-spacing:-0.01em;line-height:1.1;">Tideline</div>
          <div style="font-family:${F};font-size:10px;font-weight:600;color:${TEAL};letter-spacing:0.18em;text-transform:uppercase;margin-top:2px;line-height:1;">OCEAN INTELLIGENCE</div>
        </td>
        <td style="text-align:right;vertical-align:middle;">
          <span style="font-family:${F};font-size:12px;color:${TEXT_MUTED};">${dateStr}</span>
        </td>
      </tr></table>
    </td></tr>`;

  // ── Opening ─────────────────────────────────────────────────────────────────
  const greeting = firstName ? `Good morning, ${firstName}.` : "Good morning.";
  const movedCount = allEntities.filter(e => e.moved).length;
  const total = feed.totalTracked;

  let subLine: string;
  if (total === 0) {
    subLine = "Here's what moved across Tideline sources today.";
  } else if (movedCount === 0) {
    subLine = `All ${total} of your tracked ${total === 1 ? "entity" : "entities"} were quiet yesterday. Here's where each stands.`;
  } else if (movedCount === total) {
    subLine = `All ${total} of your tracked ${total === 1 ? "entity" : "entities"} moved yesterday. Here's where each stands.`;
  } else {
    subLine = `${movedCount} of your ${total} tracked ${total === 1 ? "entity" : "entities"} moved yesterday. Here's where each stands.`;
  }

  const opening = `
    <tr><td style="padding:28px 28px 20px;">
      <div style="font-family:${F};font-size:22px;font-weight:600;color:${TEXT_PRIMARY};margin-bottom:8px;letter-spacing:-0.01em;">${greeting}</div>
      <div style="font-family:${F};font-size:15px;font-weight:400;color:${TEXT_SECONDARY};line-height:1.55;">${subLine}</div>
    </td></tr>`;

  // ── Your N Today ─────────────────────────────────────────────────────────────
  let yourNToday = "";
  if (allEntities.length > 0) {
    const sectionLabel = `YOUR ${nLabel(allEntities.length)} TODAY`;
    let entityRows = "";
    for (const entity of allEntities) {
      const dotColor = entity.moved ? AMBER : DOT_QUIET;
      const sentenceColor = entity.moved ? TEXT_SECONDARY : TEXT_MUTED;
      entityRows += `
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:14px;">
          <tr>
            <td width="14" style="vertical-align:top;padding-top:5px;">
              <div style="width:6px;height:6px;border-radius:50%;background:${dotColor};"></div>
            </td>
            <td style="vertical-align:top;padding-left:4px;">
              <div style="font-family:${F};font-size:15px;font-weight:600;color:${TEXT_PRIMARY};line-height:1.4;">${entity.entityName}</div>
              <div style="font-family:${F};font-size:14px;font-weight:400;color:${sentenceColor};line-height:1.55;margin-top:3px;">${entity.statusSentence}</div>
            </td>
          </tr>
        </table>`;
    }
    yourNToday = `
      <tr><td style="padding:0 28px 24px;">
        <div style="font-family:${F};font-size:11px;font-weight:600;color:${TEXT_MUTED};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px;">${sectionLabel}</div>
        ${entityRows}
      </td></tr>`;
  }

  // ── Pulse Tracker Card ───────────────────────────────────────────────────────
  let pulseCard = "";
  if (selectedPulseCard) {
    const p = selectedPulseCard;
    const trackerUrl = `${BASE_URL}/tracker/${p.trackerSlug}`;

    const wowColor = p.weekOverWeek == null ? TEXT_MUTED : p.weekOverWeek > 0 ? AMBER : p.weekOverWeek < 0 ? RED_COL : TEXT_MUTED;
    const wowText = p.weekOverWeek == null
      ? `<span style="font-family:${F};font-size:12px;font-weight:600;color:${TEXT_MUTED};">no change</span>`
      : `<span style="font-family:${F};font-size:12px;font-weight:600;color:${wowColor};">${p.weekOverWeek > 0 ? "+" : ""}${p.weekOverWeek.toFixed(1)} this week</span>`;

    const sparkSvg = buildSparklineSvg(p.sparklineValues);
    const bandCol = bandTextColor(p.band);

    pulseCard = `
      <tr><td style="padding:0 28px 24px;">
        <a href="${trackerUrl}" style="text-decoration:none;display:block;">
          <div style="background:${PULSE_BG};border:1px solid ${PULSE_BORDER};border-radius:10px;padding:20px 22px;">
            <!-- Header row -->
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="vertical-align:top;">
                  <div style="font-family:${F};font-size:11px;font-weight:600;color:${TEXT_MUTED};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">PULSE</div>
                  <div style="font-family:${F};font-size:16px;font-weight:600;color:${TEXT_PRIMARY};line-height:1.2;">${p.displayName}</div>
                  <div style="font-family:${F};font-size:13px;font-weight:500;color:${TEXT_SECONDARY};margin-top:3px;">${p.description}</div>
                </td>
                <td style="vertical-align:top;text-align:right;white-space:nowrap;padding-left:12px;">
                  ${wowText}
                </td>
              </tr>
            </table>
            <!-- Main row: score + sparkline -->
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:18px;">
              <tr>
                <td width="110" style="vertical-align:middle;">
                  <div style="font-family:${F};font-size:36px;font-weight:700;color:${TEXT_PRIMARY};letter-spacing:-0.02em;line-height:1;">${p.score.toFixed(1)}</div>
                  <div style="font-family:${F};font-size:11px;font-weight:600;color:${bandCol};letter-spacing:0.10em;text-transform:uppercase;margin-top:5px;">${p.band}</div>
                </td>
                <td style="vertical-align:middle;">
                  ${sparkSvg}
                  <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:4px;">
                    <tr>
                      <td style="font-family:${F};font-size:10px;color:${TEXT_LIGHT};">12 weeks ago</td>
                      <td style="font-family:${F};font-size:10px;color:${TEXT_LIGHT};text-align:right;">Today</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- Footer: interpretation -->
            <div style="border-top:1px solid ${PULSE_BORDER};margin-top:14px;padding-top:12px;">
              <div style="font-family:${F};font-size:13px;font-weight:400;color:${TEXT_SECONDARY};line-height:1.55;">${p.interpretation}</div>
            </div>
          </div>
        </a>
      </td></tr>`;
  }

  // ── Editor's Call ───────────────────────────────────────────────────────────
  let editorsCall = "";
  if (editorsCallText) {
    editorsCall = `
      <tr><td style="padding:0 28px 24px;">
        <div style="background:${MINT_BG};border-radius:8px;padding:16px 20px;">
          <div style="font-family:${F};font-size:11px;font-weight:600;color:${TEAL};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">EDITOR'S CALL</div>
          <div style="font-family:${F};font-size:14px;font-weight:400;color:${TEXT_PRIMARY};line-height:1.6;">${editorsCallText}</div>
        </div>
      </td></tr>`;
  }

  // ── Across the Sector ────────────────────────────────────────────────────────
  let acrossTheSector = "";
  if (topStories.length >= 1) {
    const lead = topStories[0];
    const secondary = topStories.slice(1, 4);

    const leadHtml = `
      <a href="${BASE_URL}/platform/story/${lead.storyId}" style="text-decoration:none;display:block;margin-bottom:6px;">
        <div style="font-family:${F};font-size:17px;font-weight:600;color:${TEXT_PRIMARY};line-height:1.35;">${lead.title}</div>
      </a>
      ${lead.shortSummary ? `<div style="font-family:${F};font-size:14px;font-weight:400;color:${TEXT_SECONDARY};line-height:1.6;margin-bottom:5px;">${lead.shortSummary.slice(0, 240)}</div>` : ""}
      <div style="font-family:${F};font-size:12px;color:${TEXT_MUTED};">${lead.sourceName}</div>`;

    let secondaryHtml = "";
    for (let i = 0; i < secondary.length; i++) {
      const s = secondary[i];
      const borderTop = i > 0 ? `border-top:1px solid ${PULSE_BORDER};padding-top:14px;margin-top:14px;` : "";
      secondaryHtml += `
        <div style="${borderTop}">
          <a href="${BASE_URL}/platform/story/${s.storyId}" style="text-decoration:none;display:block;margin-bottom:4px;">
            <div style="font-family:${F};font-size:15px;font-weight:600;color:${TEXT_PRIMARY};line-height:1.35;">${s.title}</div>
          </a>
          ${s.shortSummary ? `<div style="font-family:${F};font-size:13px;font-weight:400;color:${TEXT_SECONDARY};line-height:1.55;">${s.shortSummary.slice(0, 140)}</div>` : ""}
        </div>`;
    }

    acrossTheSector = `
      <tr><td style="padding:0 28px 24px;border-top:1px solid ${PULSE_BORDER};">
        <div style="font-family:${F};font-size:11px;font-weight:600;color:${TEXT_MUTED};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px;padding-top:20px;">ACROSS THE SECTOR</div>
        ${leadHtml}
        <div style="border-top:1px solid ${PULSE_BORDER};margin-top:18px;padding-top:16px;">
          ${secondaryHtml}
        </div>
      </td></tr>`;
  }

  // ── The Week Ahead ───────────────────────────────────────────────────────────
  let weekAhead = "";
  if (weekAheadItems.length > 0) {
    let rows = "";
    for (const item of weekAheadItems) {
      rows += `
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
          <tr>
            <td width="36" style="vertical-align:top;">
              <span style="font-family:${F};font-size:13px;font-weight:700;color:${TEAL};">${item.dayLabel}</span>
            </td>
            <td style="vertical-align:top;padding-left:4px;">
              <span style="font-family:${F};font-size:14px;font-weight:500;color:${TEXT_PRIMARY};line-height:1.4;">${item.description}</span>
            </td>
          </tr>
        </table>`;
    }
    weekAhead = `
      <tr><td style="padding:0 28px 24px;border-top:1px solid ${PULSE_BORDER};">
        <div style="font-family:${F};font-size:11px;font-weight:600;color:${TEXT_MUTED};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px;padding-top:20px;">THE WEEK AHEAD</div>
        ${rows}
      </td></tr>`;
  }

  // ── Sign-off ─────────────────────────────────────────────────────────────────
  const signOff = `
    <tr><td style="padding:20px 28px 24px;border-top:1px solid ${PULSE_BORDER};">
      <div style="font-family:${F};font-size:15px;font-weight:400;color:${TEXT_PRIMARY};line-height:1.7;">Have a good day.</div>
      <div style="font-family:${F};font-size:15px;font-weight:600;color:${TEXT_PRIMARY};line-height:1.7;">Tideline</div>
    </td></tr>`;

  // ── Footer (outside main card) ───────────────────────────────────────────────
  const footer = `
    <div style="padding:20px 0 0;text-align:center;">
      <div style="margin-bottom:6px;">
        <a href="${BASE_URL}/platform/directory" style="font-family:${F};font-size:12px;font-weight:500;color:${TEXT_MUTED};text-decoration:none;">Manage entities</a>
        <span style="font-family:${F};font-size:12px;color:${TEXT_MUTED};margin:0 8px;">&middot;</span>
        <a href="${BASE_URL}/platform/feed" style="font-family:${F};font-size:12px;font-weight:500;color:${TEXT_MUTED};text-decoration:none;">Open feed</a>
        <span style="font-family:${F};font-size:12px;color:${TEXT_MUTED};margin:0 8px;">&middot;</span>
        <a href="${BASE_URL}/unsubscribe" style="font-family:${F};font-size:12px;font-weight:500;color:${TEXT_MUTED};text-decoration:none;">Unsubscribe</a>
      </div>
      <div style="font-family:${F};font-size:11px;font-weight:400;color:${TEXT_LIGHT};">Tideline Ocean Intelligence &middot; thetideline.co</div>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    a { color: ${TEAL}; }
    @media only screen and (max-width:600px) {
      td { padding-left:16px!important; padding-right:16px!important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${BG_PAGE};font-family:${F};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_PAGE};">
    <tr><td align="center" style="padding:28px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <!-- Main white card -->
        <tr><td style="background:#FFFFFF;border-radius:12px;overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${masthead}
            ${opening}
            ${yourNToday}
            ${pulseCard}
            ${editorsCall}
            ${acrossTheSector}
            ${weekAhead}
            ${signOff}
          </table>
        </td></tr>
        <!-- Footer outside main card -->
        <tr><td>
          ${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── generateEntitySubjectLine ────────────────────────────────────────────────

export async function generateEntitySubjectLine(feed: EntityBriefFeed): Promise<string> {
  const fn = feed.firstName ?? "";
  const prefix = fn ? `${fn}, ` : "";

  // Case 1: any entity moved
  const topMoved = feed.allEntities.find(e => e.moved);
  if (topMoved) {
    return `${prefix}${topMoved.entityName} moved yesterday.`;
  }

  // Case 2: no entities moved but top story exists
  if (feed.topStories.length > 0) {
    const full = feed.topStories[0].title;
    const truncated = full.length <= 60
      ? full
      : full.slice(0, 60).replace(/\s\S*$/, "") + "...";
    return `${prefix}${truncated}`;
  }

  // Case 3: quiet
  return `${prefix}a quiet morning on the ocean.`;
}
