/**
 * entity-brief.ts
 * Per-user entity-based morning brief pipeline.
 *
 * Four exports consumed by generate-entity-briefs cron:
 *   getUserEntityFeed   — query DB, bucket into material/watch/quiet/pulse
 *   qualityGate         — 'pass' | 'quiet-dominant' | 'reject'
 *   composeEntityBriefHtml — inline-style HTML email
 *   generateEntitySubjectLine — Haiku call with fallback
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── Types ────────────────────────────────────────────────────────────────────

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
  weekOverWeek: number | null;   // score - previous_score
  interpretation: string;
}

export interface EntityBriefFeed {
  material: BriefStoryItem[];   // significance_score >= 7
  watch: BriefStoryItem[];      // significance_score 4–6
  quietCount: number;            // tracked entities with zero 24h stories
  totalTracked: number;
  pulseScores: PulseItem[];      // velocity scores for user's tracker domains
}

export type QualityGateResult = "pass" | "quiet-dominant" | "reject";

// ─── Score → band ─────────────────────────────────────────────────────────────

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
    default:         return { text: "#374151", bg: "#F3F4F6" };
  }
}

// ─── getUserEntityFeed ────────────────────────────────────────────────────────

export async function getUserEntityFeed(userId: string): Promise<EntityBriefFeed> {
  const window24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // ── 1. Fetch user's tracked entities ────────────────────────────────────────
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

  // ── 2. Fetch entity_mentions for those entities within last 24h ─────────────
  // Join entity_mentions → stories in one query
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
    .order("stories.significance_score", { ascending: false });

  // ── 3. Deduplicate: one story per entity (highest significance) ─────────────
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

  const activeEntityIds = new Set(bestPerEntity.keys());

  // ── 4. Bucket into material / watch / quiet ──────────────────────────────────
  const material: BriefStoryItem[] = [];
  const watch: BriefStoryItem[] = [];

  for (const item of bestPerEntity.values()) {
    if (item.significanceScore >= 7) {
      material.push(item);
    } else if (item.significanceScore >= 4) {
      watch.push(item);
    }
    // Below 4 = treated as quiet (entity "moved" but not enough to surface)
  }

  // Sort each bucket by score desc
  material.sort((a, b) => b.significanceScore - a.significanceScore);
  watch.sort((a, b) => b.significanceScore - a.significanceScore);

  // Cap at 5 each to keep brief scannable
  const materialSlice = material.slice(0, 5);
  const watchSlice = watch.slice(0, 5);

  const quietCount = entityIds.filter(id => !activeEntityIds.has(id)).length;

  // ── 5. Pulse scores for user's tracker domains ───────────────────────────────
  const userTrackerSlugs = [...new Set(
    entities
      .map(e => e.tracker_tag)
      .filter((t): t is string => t !== null)
  )];

  let pulseScores: PulseItem[] = [];

  if (userTrackerSlugs.length > 0) {
    // Get most recent score per tracker for user's domains
    const { data: velocityRows } = await supabase
      .from("velocity_scores")
      .select("tracker_slug, score, previous_score, momentum_direction, interpretation, calculated_at")
      .in("tracker_slug", userTrackerSlugs)
      .order("calculated_at", { ascending: false })
      .limit(userTrackerSlugs.length * 3); // headroom for dedup

    // Dedup: keep most recent per slug
    const seen = new Set<string>();
    for (const row of velocityRows || []) {
      if (seen.has(row.tracker_slug)) continue;
      seen.add(row.tracker_slug);
      const wow = (row.previous_score != null)
        ? Math.round((row.score - row.previous_score) * 10) / 10
        : null;
      pulseScores.push({
        trackerSlug: row.tracker_slug,
        score: row.score,
        band: scoreToBand(row.score),
        direction: row.momentum_direction,
        weekOverWeek: wow,
        interpretation: row.interpretation || "",
      });
    }
    // Sort by score desc
    pulseScores.sort((a, b) => b.score - a.score);
  }

  return {
    material: materialSlice,
    watch: watchSlice,
    quietCount,
    totalTracked,
    pulseScores,
  };
}

// ─── qualityGate ──────────────────────────────────────────────────────────────

export function qualityGate(feed: EntityBriefFeed): QualityGateResult {
  const active = feed.material.length + feed.watch.length;

  // Reject only if user has no tracked entities — brief would be meaningless
  if (active === 0 && feed.quietCount === 0 && feed.totalTracked === 0) {
    return "reject";
  }

  // Quiet-dominant: nothing moved overnight but user has tracked entities
  if (active === 0 && feed.quietCount >= 1) {
    return "quiet-dominant";
  }

  return "pass";
}

// ─── composeEntityBriefHtml ───────────────────────────────────────────────────

export function composeEntityBriefHtml(
  feed: EntityBriefFeed,
  dateStr: string,
  gate: QualityGateResult
): string {
  const F = "'DM Sans',Arial,sans-serif";

  // ── Header (shared) ──────────────────────────────────────────────────────────
  const header = `
    <tr><td style="padding:20px 28px;border-bottom:1px solid #EAECEF;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-family:${F};font-size:18px;font-weight:700;color:#0B1628;letter-spacing:-0.02em;">Tideline</div>
            <div style="font-family:${F};font-size:10px;font-weight:500;color:#1D9E75;letter-spacing:0.18em;text-transform:uppercase;margin-top:3px;">OCEAN INTELLIGENCE</div>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <span style="font-family:${F};font-size:12px;color:#8BA0BC;">${dateStr}</span>
          </td>
        </tr>
      </table>
    </td></tr>`;

  // ── Story card renderer ──────────────────────────────────────────────────────
  function storyCard(item: BriefStoryItem, borderColor: string, isLast: boolean): string {
    const border = isLast ? "" : "border-bottom:1px solid #F0F3F7;";
    const summary = item.shortSummary
      ? `<p style="font-family:${F};font-size:13px;color:#5A7290;line-height:1.7;margin:4px 0 0;">${item.shortSummary.slice(0, 240)}</p>`
      : "";
    return `
      <tr><td style="padding:14px 28px;${border}">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="3" style="background:${borderColor};vertical-align:top;border-radius:1px;"></td>
            <td style="padding-left:14px;">
              <div style="font-family:${F};font-size:10px;font-weight:600;color:#8BA0BC;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">${item.entityName}</div>
              <a href="https://www.thetideline.co/platform/story/${item.storyId}" style="font-family:${F};font-size:14px;font-weight:600;color:#0B1628;text-decoration:none;line-height:1.4;display:block;">${item.title}</a>
              <div style="font-family:${F};font-size:10px;color:#8BA0BC;margin-top:3px;">${item.sourceName}</div>
              ${summary}
            </td>
          </tr>
        </table>
      </td></tr>`;
  }

  // ── Section header ───────────────────────────────────────────────────────────
  function sectionLabel(label: string, color: string): string {
    return `
      <tr><td style="padding:14px 28px 6px;border-top:1px solid #EAECEF;">
        <span style="font-family:${F};font-size:10px;font-weight:600;color:${color};letter-spacing:0.15em;text-transform:uppercase;">${label}</span>
      </td></tr>`;
  }

  let body = "";

  if (gate === "quiet-dominant") {
    // ── Quiet-dominant layout ────────────────────────────────────────────────
    body += `
      <tr><td style="padding:28px 28px 20px;">
        <p style="font-family:${F};font-size:16px;font-weight:600;color:#0B1628;margin:0 0 8px;line-height:1.4;">Quiet on all ${feed.totalTracked} of your tracked entities overnight.</p>
        <p style="font-family:${F};font-size:13px;color:#5A7290;line-height:1.7;margin:0;">No material moves in the last 24 hours.</p>
      </td></tr>`;

    if (feed.pulseScores.length > 0) {
      body += `
        <tr><td style="padding:0 28px 8px;">
          <div style="font-family:${F};font-size:10px;font-weight:600;color:#8BA0BC;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:10px;">REGULATORY PULSE — YOUR DOMAINS</div>
          <table cellpadding="0" cellspacing="0" width="100%">`;
      for (const p of feed.pulseScores) {
        const col = bandColor(p.band);
        const slugLabel = p.trackerSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        const wowStr = p.weekOverWeek != null
          ? ` <span style="font-size:11px;color:${p.weekOverWeek >= 0 ? "#1D9E75" : "#E24B4A"};">${p.weekOverWeek >= 0 ? "▲" : "▼"} ${Math.abs(p.weekOverWeek).toFixed(1)} wk</span>`
          : "";
        body += `
            <tr>
              <td style="padding:6px 0;border-bottom:1px solid #F0F3F7;vertical-align:top;width:130px;">
                <span style="font-family:${F};font-size:12px;font-weight:600;color:#0B1628;">${slugLabel}</span>
              </td>
              <td style="padding:6px 0 6px 12px;border-bottom:1px solid #F0F3F7;vertical-align:top;width:70px;">
                <span style="font-family:${F};font-size:13px;font-weight:700;color:#0B1628;">${p.score.toFixed(1)}</span>
                <span style="font-family:${F};font-size:10px;font-weight:600;color:${col.text};background:${col.bg};padding:1px 6px;border-radius:2px;margin-left:4px;letter-spacing:0.08em;">${p.band}</span>
                ${wowStr}
              </td>
              <td style="padding:6px 0 6px 12px;border-bottom:1px solid #F0F3F7;vertical-align:top;">
                <span style="font-family:${F};font-size:12px;color:#5A7290;line-height:1.5;">${p.interpretation.slice(0, 120)}</span>
              </td>
            </tr>`;
      }
      body += `
          </table>
        </td></tr>`;
    }

  } else {
    // ── Normal layout — material then watch ──────────────────────────────────
    if (feed.material.length > 0) {
      body += sectionLabel("Material", "#1D9E75");
      feed.material.forEach((item, i) =>
        body += storyCard(item, "#1D9E75", i === feed.material.length - 1)
      );
    }

    if (feed.watch.length > 0) {
      body += sectionLabel("Watch", "#EF9F27");
      feed.watch.forEach((item, i) =>
        body += storyCard(item, "#EF9F27", i === feed.watch.length - 1)
      );
    }

    // Quiet note footer (inside normal brief)
    if (feed.quietCount > 0) {
      body += `
        <tr><td style="padding:12px 28px;background:#F8F9FA;border-top:1px solid #EAECEF;">
          <span style="font-family:${F};font-size:12px;color:#8BA0BC;">${feed.quietCount} of your tracked ${feed.quietCount === 1 ? "entity was" : "entities were"} quiet overnight.</span>
        </td></tr>`;
    }

    // Pulse bar (if space — only when material or watch present and user has tracker domains)
    if (feed.pulseScores.length > 0) {
      const topPulse = feed.pulseScores[0];
      const col = bandColor(topPulse.band);
      const slugLabel = topPulse.trackerSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      body += `
        <tr><td style="padding:14px 28px;background:#F8F9FA;border-top:1px solid #EAECEF;">
          <div style="font-family:${F};font-size:10px;font-weight:500;color:#8BA0BC;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:6px;">PULSE</div>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family:${F};font-size:13px;font-weight:500;color:#3D4F63;padding-right:10px;vertical-align:middle;">${slugLabel}</td>
              <td style="font-family:${F};font-size:22px;font-weight:700;color:#1D9E75;padding-right:8px;vertical-align:middle;">${topPulse.score.toFixed(1)}</td>
              <td style="vertical-align:middle;"><span style="font-family:${F};font-size:10px;font-weight:600;color:${col.text};text-transform:uppercase;letter-spacing:0.14em;background:${col.bg};padding:2px 8px;border-radius:2px;">${topPulse.band}</span></td>
            </tr>
          </table>
          <p style="font-family:${F};font-size:12px;color:#8BA0BC;margin:5px 0 0;line-height:1.5;">${topPulse.interpretation.slice(0, 140)}</p>
        </td></tr>`;
    }
  }

  // ── Footer (shared) ──────────────────────────────────────────────────────────
  const footer = `
    <tr><td style="padding:16px 28px;border-top:1px solid #EAECEF;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-family:${F};font-size:13px;color:#3D4F63;">Reply to ask a question about your entities.</td></tr>
        <tr><td style="padding-top:8px;">
          <a href="https://www.thetideline.co/platform/directory" style="font-family:${F};font-size:12px;color:#8BA0BC;text-decoration:none;margin-right:14px;">Manage entities</a>
          <a href="https://www.thetideline.co/platform/feed" style="font-family:${F};font-size:12px;color:#8BA0BC;text-decoration:none;margin-right:14px;">Open feed</a>
          <a href="https://www.thetideline.co/unsubscribe" style="font-family:${F};font-size:12px;color:#8BA0BC;text-decoration:none;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:${F};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        ${header}
        ${body}
        ${footer}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── generateEntitySubjectLine ────────────────────────────────────────────────

export async function generateEntitySubjectLine(
  feed: EntityBriefFeed,
  gate: QualityGateResult
): Promise<string> {
  // Fallback for quiet-dominant
  if (gate === "quiet-dominant") {
    const pulseStr = feed.pulseScores.length > 0
      ? ` ${feed.pulseScores[0].trackerSlug.replace(/-/g, " ")} at ${feed.pulseScores[0].score.toFixed(1)}.`
      : "";
    return `All quiet on your ${feed.totalTracked} tracked entities.${pulseStr}`;
  }

  const topNames = [...feed.material, ...feed.watch]
    .slice(0, 3)
    .map(i => i.entityName);

  if (topNames.length === 0) {
    return `Your Tideline brief — ${new Date().toLocaleDateString("en-GB", { weekday: "long" })}`;
  }

  // Simple fallback (used if Haiku fails)
  const fallback = topNames.length >= 2
    ? `${topNames[0]} and ${topNames[1]} moved overnight. ${feed.quietCount > 0 ? `${feed.quietCount} others quiet.` : ""}`.trim()
    : `${topNames[0]} moved overnight.`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 40,
      messages: [{
        role: "user",
        content: `Write an email subject line under 10 words. Pattern: "{Entity A} and {Entity B} moved overnight. {N} others quiet." Use these entity names: ${topNames.join(", ")}. Quiet count: ${feed.quietCount}. Return the subject line only, no quotes.`,
      }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    return text.length > 0 && text.length < 120 ? text : fallback;
  } catch {
    return fallback;
  }
}
