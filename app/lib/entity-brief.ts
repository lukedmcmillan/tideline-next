/**
 * entity-brief.ts
 * Per-user entity-based morning brief pipeline.
 *
 * Exports:
 *   getUserEntityFeed        -- query DB, bucket into material/watch/quiet/pulse
 *   qualityGate              -- 'pass' | 'quiet-dominant' | 'reject'
 *   composeEntityBriefHtml   -- inline-style HTML email
 *   generateEntitySubjectLine -- Haiku (material) or deterministic (quiet)
 *
 * Significance thresholds calibrated to actual distribution (0-92 range):
 *   Material : >= 25  (top ~5%)
 *   Watch    : 10-24  (next ~15%)
 *   Below 10 : not surfaced
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const MATERIAL_THRESHOLD = 25;
const WATCH_THRESHOLD = 10;

const TRACKER_DISPLAY_NAMES: Record<string, string> = {
  "isa": "ISA",
  "bbnj": "BBNJ",
  "iuu": "IUU",
  "30x30": "30x30",
  "blue-finance": "Blue finance",
  "imo-shipping": "IMO",
  "offshore-wind": "Offshore wind",
  "cites-marine": "CITES",
  "wto-fisheries": "WTO fisheries",
  "plastics": "Plastics",
};
const MAX_PER_SECTION = 5;

// --- Types ---

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

export interface PulseItem {
  trackerSlug: string;
  score: number;
  band: "LOW" | "WATCH" | "ELEVATED" | "HIGH";
  direction: string;
  weekOverWeek: number | null;
  interpretation: string;
}

export interface EntityBriefFeed {
  material: BriefStoryItem[];
  watch: BriefStoryItem[];
  quietCount: number;
  totalTracked: number;
  pulseScores: PulseItem[];
}

export type QualityGateResult = "pass" | "quiet-dominant" | "reject";

// --- Helpers ---

function scoreToBand(score: number): PulseItem["band"] {
  if (score >= 8) return "HIGH";
  if (score >= 7) return "ELEVATED";
  if (score >= 4) return "WATCH";
  return "LOW";
}

function bandColor(band: PulseItem["band"]): { text: string; bg: string } {
  switch (band) {
    case "HIGH":     return { text: "#9B1C1C", bg: "#FEE2E2" };
    case "ELEVATED": return { text: "#1D9E75", bg: "#E8F7F2" };
    case "WATCH":    return { text: "#92400E", bg: "#FEF3C7" };
    default:         return { text: "#6B7280", bg: "#F3F4F6" };
  }
}

function trackerLabel(slug: string): string {
  return TRACKER_DISPLAY_NAMES[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// --- getUserEntityFeed ---

export async function getUserEntityFeed(userId: string): Promise<EntityBriefFeed> {
  const window24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1. Fetch user's tracked entities
  const { data: userEntities, error: ueErr } = await supabase
    .from("user_entities")
    .select("entity_id, entities(id, name, entity_type, tracker_tag)")
    .eq("user_id", userId);

  if (ueErr || !userEntities || userEntities.length === 0) {
    return { material: [], watch: [], quietCount: 0, totalTracked: 0, pulseScores: [] };
  }

  type EntityRow = { id: string; name: string; entity_type: string; tracker_tag: string | null };
  const entities: EntityRow[] = userEntities
    .map(ue => ue.entities as unknown as EntityRow | null)
    .filter((e): e is EntityRow => e !== null);

  const entityIds = entities.map(e => e.id);
  const totalTracked = entityIds.length;

  // 2. Fetch entity_mentions joined with stories (24h window, live only)
  //    Use foreignTable option to avoid PostgREST "failed to parse order" error
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

  // 3. Deduplicate: one story per entity (highest significance)
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

  // 4. Bucket into material / watch / quiet
  const material: BriefStoryItem[] = [];
  const watch: BriefStoryItem[] = [];

  for (const item of bestPerEntity.values()) {
    if (item.significanceScore >= MATERIAL_THRESHOLD) {
      material.push(item);
    } else if (item.significanceScore >= WATCH_THRESHOLD) {
      watch.push(item);
    }
    // Below WATCH_THRESHOLD: counted as quiet
  }

  material.sort((a, b) => b.significanceScore - a.significanceScore);
  watch.sort((a, b) => b.significanceScore - a.significanceScore);

  const activeEntityIds = new Set(bestPerEntity.keys());
  const quietCount = entityIds.filter(id => !activeEntityIds.has(id)).length;

  // 5. Pulse scores for user's tracker domains
  const userTrackerSlugs = [...new Set(
    entities.map(e => e.tracker_tag).filter((t): t is string => t !== null)
  )];

  let pulseScores: PulseItem[] = [];

  if (userTrackerSlugs.length > 0) {
    const { data: velocityRows } = await supabase
      .from("velocity_scores")
      .select("tracker_slug, score, previous_score, momentum_direction, interpretation, calculated_at")
      .in("tracker_slug", userTrackerSlugs)
      .order("calculated_at", { ascending: false })
      .limit(userTrackerSlugs.length * 3);

    const seen = new Set<string>();
    for (const row of velocityRows || []) {
      if (seen.has(row.tracker_slug)) continue;
      seen.add(row.tracker_slug);
      const wow = row.previous_score != null
        ? Math.round((row.score - row.previous_score) * 10) / 10
        : null;
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

  return {
    material: material.slice(0, MAX_PER_SECTION),
    watch: watch.slice(0, MAX_PER_SECTION),
    quietCount,
    totalTracked,
    pulseScores,
  };
}

// --- qualityGate ---

export function qualityGate(feed: EntityBriefFeed): QualityGateResult {
  if (feed.totalTracked === 0) return "reject";
  if (feed.material.length + feed.watch.length === 0) return "quiet-dominant";
  return "pass";
}

// --- composeEntityBriefHtml ---

export function composeEntityBriefHtml(
  feed: EntityBriefFeed,
  dateStr: string,
  gate: QualityGateResult
): string {
  const F = "'DM Sans',Arial,sans-serif";
  const NAVY = "#0B1628";
  const TEAL = "#1D9E75";
  const AMBER = "#EF9F27";
  const MUTED = "#8BA0BC";
  const SOFT = "#5A7290";

  const header = `
    <tr><td style="padding:20px 28px 16px;border-bottom:1px solid #EAECEF;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-family:${F};font-size:18px;font-weight:700;color:${NAVY};letter-spacing:-0.02em;">Tideline</div>
            <div style="font-family:${F};font-size:10px;font-weight:600;color:${TEAL};letter-spacing:0.18em;text-transform:uppercase;margin-top:2px;">OCEAN INTELLIGENCE</div>
          </td>
          <td style="text-align:right;vertical-align:top;padding-top:2px;">
            <span style="font-family:${F};font-size:12px;color:${MUTED};">${dateStr}</span>
          </td>
        </tr>
      </table>
    </td></tr>`;

  function pulseTable(scores: PulseItem[], compact: boolean): string {
    if (scores.length === 0) return "";
    const headerLabel = compact ? "PULSE" : "REGULATORY PULSE";
    let html = `
      <tr><td style="padding:${compact ? "12px 28px 6px" : "20px 28px 10px"};">
        <div style="font-family:${F};font-size:10px;font-weight:600;color:${MUTED};letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">${headerLabel}</div>
        <table cellpadding="0" cellspacing="0" width="100%">`;

    for (const p of scores) {
      const col = bandColor(p.band);
      const label = trackerLabel(p.trackerSlug);
      const dirIcon = p.direction === "rising" ? "+" : p.direction === "falling" ? "-" : "~";
      const wowStr = p.weekOverWeek != null
        ? `<span style="font-family:${F};font-size:11px;color:${p.weekOverWeek >= 0 ? TEAL : "#E24B4A"};margin-left:6px;">${p.weekOverWeek >= 0 ? "+" : ""}${p.weekOverWeek.toFixed(1)} wk</span>`
        : "";
      const interp = p.interpretation
        ? `<div style="font-family:${F};font-size:12px;color:${SOFT};line-height:1.5;margin-top:3px;">${p.interpretation.slice(0, 140)}</div>`
        : "";

      html += `
          <tr><td style="padding:8px 0;border-bottom:1px solid #F0F3F7;vertical-align:top;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="vertical-align:middle;padding-right:8px;width:110px;">
                  <span style="font-family:${F};font-size:12px;font-weight:600;color:${NAVY};">${label}</span>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-family:${F};font-size:16px;font-weight:700;color:${NAVY};">${p.score.toFixed(1)}</span>
                  <span style="font-family:${F};font-size:10px;font-weight:600;color:${col.text};background:${col.bg};padding:1px 6px;border-radius:2px;margin-left:6px;letter-spacing:0.08em;">${p.band}</span>
                  <span style="font-family:${F};font-size:11px;color:${MUTED};margin-left:6px;">${dirIcon} ${p.direction}</span>
                  ${wowStr}
                </td>
              </tr>
              <tr><td colspan="2">${interp}</td></tr>
            </table>
          </td></tr>`;
    }

    html += `
        </table>
      </td></tr>`;
    return html;
  }

  function storyCard(item: BriefStoryItem, borderColor: string, isLast: boolean): string {
    const divider = isLast ? "" : "border-bottom:1px solid #F0F3F7;";
    const summary = item.shortSummary
      ? `<p style="font-family:${F};font-size:13px;color:${SOFT};line-height:1.7;margin:5px 0 0;">${item.shortSummary.slice(0, 220)}</p>`
      : "";
    return `
      <tr><td style="padding:14px 28px;${divider}">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="3" style="background:${borderColor};vertical-align:top;border-radius:1px;"></td>
            <td style="padding-left:14px;vertical-align:top;">
              <div style="font-family:${F};font-size:10px;font-weight:600;color:${MUTED};letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">${item.entityName}</div>
              <a href="https://www.thetideline.co/platform/story/${item.storyId}" style="font-family:${F};font-size:14px;font-weight:600;color:${NAVY};text-decoration:none;line-height:1.4;display:block;">${item.title}</a>
              <div style="font-family:${F};font-size:11px;color:${MUTED};margin-top:3px;">${item.sourceName} <span style="color:#C5D0DE;">${item.significanceScore}</span></div>
              ${summary}
            </td>
          </tr>
        </table>
      </td></tr>`;
  }

  function sectionLabel(label: string, color: string): string {
    return `
      <tr><td style="padding:14px 28px 4px;border-top:1px solid #EAECEF;">
        <span style="font-family:${F};font-size:10px;font-weight:600;color:${color};letter-spacing:0.16em;text-transform:uppercase;">${label}</span>
      </td></tr>`;
  }

  let body = "";

  if (gate === "quiet-dominant") {
    // Second line: lead with elevated/high pulse if any, otherwise generic
    const elevatedPulse = feed.pulseScores.find(p => p.band === "HIGH" || p.band === "ELEVATED");
    let secondLine: string;
    if (elevatedPulse) {
      const dir = elevatedPulse.direction === "rising" ? " and accelerating" : elevatedPulse.direction === "falling" ? " and easing" : "";
      secondLine = `${trackerLabel(elevatedPulse.trackerSlug)} is at ${elevatedPulse.score.toFixed(1)}${dir}.`;
    } else {
      secondLine = "The regulatory picture below.";
    }

    body += `
      <tr><td style="padding:24px 28px 16px;">
        <p style="font-family:${F};font-size:15px;font-weight:600;color:${NAVY};margin:0 0 6px;line-height:1.4;">Quiet on all ${feed.totalTracked} of your tracked ${feed.totalTracked === 1 ? "entity" : "entities"} overnight.</p>
        <p style="font-family:${F};font-size:13px;color:${SOFT};line-height:1.7;margin:0;">${secondLine}</p>
      </td></tr>`;

    body += pulseTable(feed.pulseScores, false);

  } else {
    const topName = feed.material[0]?.entityName ?? feed.watch[0]?.entityName ?? "";
    const restCount = feed.material.length + feed.watch.length - 1;
    const openingLine = restCount > 0
      ? `${topName} in the news. ${restCount} other tracked ${restCount === 1 ? "entity" : "entities"} moved overnight.`
      : `${topName} in the news overnight.`;

    body += `
      <tr><td style="padding:18px 28px 4px;">
        <p style="font-family:${F};font-size:14px;font-weight:600;color:${NAVY};margin:0;line-height:1.5;">${openingLine}</p>
      </td></tr>`;

    if (feed.material.length > 0) {
      body += sectionLabel("Material", TEAL);
      feed.material.forEach((item, i) =>
        body += storyCard(item, TEAL, i === feed.material.length - 1)
      );
    }

    if (feed.watch.length > 0) {
      body += sectionLabel("Watch", AMBER);
      feed.watch.forEach((item, i) =>
        body += storyCard(item, AMBER, i === feed.watch.length - 1)
      );
    }

    if (feed.quietCount > 0) {
      body += `
        <tr><td style="padding:10px 28px;background:#F8F9FA;border-top:1px solid #EAECEF;">
          <span style="font-family:${F};font-size:12px;color:${MUTED};">Quiet on ${feed.quietCount} other tracked ${feed.quietCount === 1 ? "entity" : "entities"} overnight.</span>
        </td></tr>`;
    }

    body += pulseTable(feed.pulseScores.slice(0, 2), true);
  }

  const footer = `
    <tr><td style="padding:16px 28px;border-top:1px solid #EAECEF;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-family:${F};font-size:13px;color:#3D4F63;padding-bottom:8px;">Reply to ask about your entities.</td></tr>
        <tr><td>
          <a href="https://www.thetideline.co/platform/directory" style="font-family:${F};font-size:12px;color:${MUTED};text-decoration:none;margin-right:14px;">Manage entities</a>
          <a href="https://www.thetideline.co/platform/feed" style="font-family:${F};font-size:12px;color:${MUTED};text-decoration:none;margin-right:14px;">Open feed</a>
          <a href="https://www.thetideline.co/unsubscribe" style="font-family:${F};font-size:12px;color:${MUTED};text-decoration:none;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>a{color:#1D9E75;}@media only screen and (max-width:600px){td{padding-left:16px!important;padding-right:16px!important;}}</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;">
    <tr><td align="center" style="padding:24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:4px;border:1px solid #EAECEF;">
        ${header}
        ${body}
        ${footer}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// --- generateEntitySubjectLine ---

export async function generateEntitySubjectLine(
  feed: EntityBriefFeed,
  gate: QualityGateResult
): Promise<string> {
  if (gate === "quiet-dominant") {
    if (feed.pulseScores.length > 0) {
      const top = feed.pulseScores[0];
      return `Quiet morning. ${trackerLabel(top.trackerSlug)} tracker at ${top.band}.`;
    }
    return `Quiet morning. Your ${feed.totalTracked} tracked ${feed.totalTracked === 1 ? "entity" : "entities"} unchanged.`;
  }

  const topNames = [...feed.material, ...feed.watch].slice(0, 3).map(i => i.entityName);

  const fallback = topNames.length >= 2
    ? `${topNames[0]} and ${topNames[1]} moved overnight.${feed.quietCount > 0 ? ` ${feed.quietCount} others quiet.` : ""}`
    : `${topNames[0] ?? "Entity"} in the news overnight.`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 40,
      messages: [{
        role: "user",
        content: `Write an email subject line under 10 words. Pattern: "{Entity A} and {Entity B} moved overnight. {N} others quiet." Entities: ${topNames.join(", ")}. Quiet count: ${feed.quietCount}. Return subject line only, no quotes.`,
      }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    return text.length > 4 && text.length < 120 ? text : fallback;
  } catch {
    return fallback;
  }
}
