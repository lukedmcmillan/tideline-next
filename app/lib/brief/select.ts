// app/lib/brief/select.ts
// Pure sync content selection functions for the morning brief.
// All 7 selection functions are pure - no DB, no async.
// 3 async DB helpers are co-located for convenience (used by generate-brief).

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type LeadItem,
  type ConditionRow,
  type EvidenceItem,
  type WatchEvent,
  type AcrossSectorItem,
} from './template';
import {
  cleanTitle,
  bandForScore,
  dayLabel,
  TRACKER_TO_TOPICS,
  TRACKER_LABELS,
  TOPIC_LABELS,
  ACTION_SIGNAL_KEYWORDS,
  type Weekday,
} from './utils';

// Re-export TOPIC_LABELS so callers (send-brief, template helpers) import from one place
export { TOPIC_LABELS };
import { selectQuickAsk, type QuickAskContext } from './quick-asks';

// ── Input row types (DB shapes) ───────────────────────────────────────────────

export interface StoryRow {
  id:                string;
  title:             string;
  source_name:       string;
  source_type?:      string;
  topic:             string;
  significance_score:number;
  short_summary?:    string | null;
  description?:      string | null;
  published_at:      string;
  status:            string;
}

export interface TrackerScoreRow {
  tracker_slug:    string;
  score:           number;
  interpretation?: string | null;
  calculated_at:   string;
  sparklineValues: number[]; // pre-fetched 12-week history
}

export interface GovernanceEventRow {
  id:                string;
  title:             string;
  starts_at:         string;
  topics?:           string[] | null;
  significance?:     string | null;
  governance_bodies?:{ name: string } | null;
}

// ── 1. selectLead ─────────────────────────────────────────────────────────────

/**
 * Selects the single lead item for the brief.
 *
 * Three modes (relative significance threshold):
 * a) Story-led    — max significance in user-topic pool >= 50: clean story lead
 * b) Hybrid       — pool not empty but max significance < 50: tracker framing,
 *                   story body (significance scores vary widely by topic)
 * c) State-led    — empty pool: pure state-of-tracker for highest-pulse tracker
 */
export function selectLead(
  stories: StoryRow[],
  trackers: TrackerScoreRow[],
  userTopics: string[],   // tracker slugs, e.g. ['imo-shipping', 'bbnj']
): LeadItem {
  // Derive content topic categories from tracker slugs
  const contentTopics = new Set<string>(
    userTopics.flatMap(t => TRACKER_TO_TOPICS[t] || [t])
  );

  // Sort candidates by significance descending; require short_summary
  const candidates = [...stories]
    .filter(s => contentTopics.has(s.topic) && s.short_summary)
    .sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0));

  const topStory  = candidates[0];
  const maxSig    = topStory?.significance_score ?? 0;

  // Top tracker for hybrid/state framing
  const topTracker = [...trackers]
    .filter(t => userTopics.includes(t.tracker_slug))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

  // Mode a: story-led (significance threshold 35 — any summarised story of moderate relevance)
  if (topStory && maxSig >= 35) {
    return {
      type:           'story',
      headline:       cleanTitle(topStory.title),
      storyId:        topStory.id,
      interpretation: topStory.short_summary ?? topStory.description ?? '',
    };
  }

  // Mode b: hybrid — tracker framing + story content.
  // Guard: only fires when topTracker is WATCH band or above (score >= 4.0 per methodology Section 3).
  // A LOW-band tracker must never headline the brief.
  if (topStory && topTracker && topTracker.score >= 4.0) {
    const trackerPart = `${TRACKER_LABELS[topTracker.tracker_slug] || topTracker.tracker_slug} at Pulse ${topTracker.score.toFixed(1)}`;
    const cleanStoryTitle = cleanTitle(topStory.title);
    return {
      type:            'state',
      headline:        `${trackerPart}. ${cleanStoryTitle}.`,
      subjectHeadline: cleanStoryTitle,   // Bug 1 fix: short title for email subject
      storyId:         topStory.id,       // Bug 2 fix: exclude from evidence
      interpretation:  topStory.short_summary ?? topStory.description ?? '',
    };
  }

  // LOW-band fallback: story exists but no tracker is WATCH+. Present as story-led
  // so a quiet tracker never headlines the brief.
  if (topStory) {
    return {
      type:           'story',
      headline:       cleanTitle(topStory.title),
      storyId:        topStory.id,
      interpretation: topStory.short_summary ?? topStory.description ?? '',
    };
  }

  // Mode c: state-led — pure tracker fallback
  if (topTracker) {
    const label = TRACKER_LABELS[topTracker.tracker_slug] || topTracker.tracker_slug;
    return {
      type:           'state',
      headline:       `${label} at Pulse ${topTracker.score.toFixed(1)}.`,
      interpretation: `Quiet morning across your tracked domains. ${label} remains the primary signal this week.`,
    };
  }

  // Absolute fallback (no stories, no trackers)
  return {
    type:           'state',
    headline:       'Quiet morning across your tracked domains.',
    interpretation: 'No significant developments in your areas in the last 48 hours.',
  };
}

// ── 2. selectConditions ───────────────────────────────────────────────────────

/**
 * Returns 1-2 condition rows from user's trackers.
 * Only ELEVATED (>=5.0) trackers are shown; if all are LOW, show top 1 with quiet framing.
 */
export function selectConditions(
  trackers: TrackerScoreRow[],
  userTopics: string[],
): ConditionRow[] {
  const userTrackers = [...trackers]
    .filter(t => userTopics.includes(t.tracker_slug))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const elevated = userTrackers.filter(t => (t.score ?? 0) >= 5.0);
  const selected = elevated.length > 0 ? elevated.slice(0, 2) : userTrackers.slice(0, 1);

  return selected.map(t => {
    const band = bandForScore(t.score ?? 0);
    let interpretation: string;
    if (t.interpretation && t.interpretation.trim().length > 0) {
      const raw = t.interpretation.trim();
      // Word-boundary truncation: never cut mid-word
      interpretation = raw.length > 80
        ? raw.slice(0, 80).replace(/\s\S+$/, '') + '\u2026'
        : raw;
    } else {
      switch (band) {
        case 'ELEVATED': interpretation = 'Multiple developments tracked in 30 days.'; break;
        case 'WATCH':    interpretation = 'Activity rising. Threshold at 7.0.'; break;
        case 'LOW':      interpretation = 'Quiet.'; break;
      }
    }
    return {
      trackerLabel:    TRACKER_LABELS[t.tracker_slug] || t.tracker_slug,
      score:           t.score ?? 0,
      band,
      sparklineValues: t.sparklineValues.length >= 2
        ? t.sparklineValues
        : [t.score ?? 0, t.score ?? 0],
      interpretation,
    };
  });
}

// ── 3. selectEvidence ────────────────────────────────────────────────────────

/** Evidence color assignment rules:
 * teal  - first item (primary corroborating signal)
 * amber - second item (divergent or complicating signal)
 * grey  - third item (cross-sector or secondary context)
 */
const EVIDENCE_COLORS: Array<'teal' | 'amber' | 'grey'> = ['teal', 'amber', 'grey'];

// Stopwords excluded from headline overlap detection
const DEDUP_STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'in', 'on', 'to', 'and', 'or', 'for',
  'is', 'are', 'was', 'were', 'with', 'at', 'by', 'from', 'as',
  'its', 'it', 'this', 'that', 'be', 'into', 'over', 'after', 'new',
]);

function headlineWords(title: string): Set<string> {
  return new Set(
    cleanTitle(title)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !DEDUP_STOPWORDS.has(w))
  );
}

/**
 * Two stories are near-duplicates if they share 3+ meaningful words,
 * have the same topic, and were published within 7 days of each other.
 */
function isDuplicate(a: StoryRow, b: StoryRow): boolean {
  if (a.topic !== b.topic) return false;
  const dateDiff =
    Math.abs(new Date(a.published_at).getTime() - new Date(b.published_at).getTime()) /
    (1000 * 60 * 60 * 24);
  if (dateDiff > 7) return false;
  const wordsA = headlineWords(a.title);
  const wordsB = headlineWords(b.title);
  let shared = 0;
  for (const w of wordsA) if (wordsB.has(w)) shared++;
  return shared >= 3;
}

/**
 * Dedup a sorted story list. When duplicates are found, keeps the one with
 * higher significance_score; on tie keeps the more recently published.
 */
function dedupStories(stories: StoryRow[]): StoryRow[] {
  const kept: StoryRow[] = [];
  for (const story of stories) {
    const dupIdx = kept.findIndex(k => isDuplicate(k, story));
    if (dupIdx === -1) {
      kept.push(story);
    } else {
      const existing = kept[dupIdx];
      const existSig = existing.significance_score ?? 0;
      const newSig   = story.significance_score ?? 0;
      if (
        newSig > existSig ||
        (newSig === existSig && story.published_at > existing.published_at)
      ) {
        kept[dupIdx] = story;
      }
    }
  }
  return kept;
}

/** Returns 1 if the title contains an action-signal keyword, 0 otherwise. */
function actionSignal(title: string): 0 | 1 {
  const lower = title.toLowerCase();
  return ACTION_SIGNAL_KEYWORDS.some(kw => lower.includes(kw)) ? 1 : 0;
}

// ── Lead-proximity anchor dedup ───────────────────────────────────────────────
// Protects diverging stories covering the same event from different angles.
// Word-overlap alone is too aggressive (would collapse contradicting stories).
// Instead, match on a concrete anchor: dollar figure + same topic + 48h window.

/**
 * Extracts normalised dollar-figure strings from text.
 * Matches: $957.8M, $1.2 billion, CAD 957 million, €2.5bn, etc.
 * Returns "<number>-<scale>" keys, e.g. "957.8-m", "1.2-b".
 */
function extractDollarFigures(text: string): Set<string> {
  const figures = new Set<string>();
  // currency symbol/code (optional) + number + scale word/letter
  const re = /(?:[$€£¥]|USD|CAD|AUD|EUR|GBP|NZD)?\s*(\d[\d, .]*\d|\d)\s*(billion|million|thousand|bn|mn|[BMKbmk])\b/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const num = parseFloat(m[1].replace(/[, ]/g, ''));
    const scaleRaw = m[2].toLowerCase();
    let scale: string;
    if (scaleRaw === 'billion' || scaleRaw === 'bn' || scaleRaw === 'b') scale = 'b';
    else if (scaleRaw === 'million' || scaleRaw === 'mn' || scaleRaw === 'm') scale = 'm';
    else if (scaleRaw === 'thousand' || scaleRaw === 'k') scale = 'k';
    else scale = scaleRaw;
    if (!isNaN(num)) figures.add(`${num}-${scale}`);
  }
  return figures;
}

/**
 * Returns true only when candidate is a near-duplicate of the lead story.
 * All three conditions must hold simultaneously:
 * (a) shared dollar figure anchor (prevents collapsing stories about different amounts)
 * (b) same topic
 * (c) published within 48h
 *
 * Word-overlap alone is intentionally NOT used — divergence detection requires
 * that contradicting stories about the same event survive into Evidence.
 */
function isLeadNearDuplicate(candidate: StoryRow, leadStory: StoryRow): boolean {
  // (b) same topic
  if (candidate.topic !== leadStory.topic) return false;

  // (c) within 48h
  const diffH =
    Math.abs(
      new Date(candidate.published_at).getTime() -
      new Date(leadStory.published_at).getTime()
    ) / (1000 * 60 * 60);
  if (diffH > 48) return false;

  // (a) shared dollar figure anchor
  const leadText = `${leadStory.title} ${leadStory.short_summary ?? ''} ${leadStory.description ?? ''}`;
  const leadFigs = extractDollarFigures(leadText);
  if (leadFigs.size === 0) return false; // no anchor in lead → cannot match

  const candText = `${candidate.title} ${candidate.short_summary ?? ''} ${candidate.description ?? ''}`;
  const candFigs = extractDollarFigures(candText);
  for (const fig of leadFigs) {
    if (candFigs.has(fig)) return true;
  }
  return false;
}

/**
 * Returns up to 3 evidence items.
 * Excludes the lead story. Only stories with short_summary qualify.
 * Sort: significance_score desc; within 10 points, prefers action_signal=1 stories.
 * Pass 1 dedup: story.id exclusion + anchor-based lead-proximity filter (dollar figure + topic + 48h).
 * Pass 2 dedup: near-identical headlines within the evidence pool (same topic, 3+ shared words, <=7 days).
 */
export function selectEvidence(
  stories: StoryRow[],
  lead: LeadItem,
  userTopics: string[],
): EvidenceItem[] {
  // Read storyId from both story-led and state-led (Mode b) leads — prevents lead from
  // appearing again in the Evidence section regardless of lead type.
  const leadId = lead.type === 'story' ? lead.storyId : (lead.storyId ?? null);
  const contentTopics = new Set<string>(
    userTopics.flatMap(t => TRACKER_TO_TOPICS[t] || [t])
  );

  // Pass 1a: id exclusion
  const candidates = stories.filter(
    s => s.id !== leadId && !!s.short_summary && contentTopics.has(s.topic)
  );

  // Pass 1b: anchor-based lead-proximity filter
  // Find the lead story row to extract its dollar-figure anchors.
  const leadStory = leadId ? (stories.find(s => s.id === leadId) ?? null) : null;
  const filtered = leadStory
    ? candidates.filter(s => !isLeadNearDuplicate(s, leadStory))
    : candidates;

  // Sort: significance desc; within 10 points prefer action_signal=1
  filtered.sort((a, b) => {
    const sigA = a.significance_score ?? 0;
    const sigB = b.significance_score ?? 0;
    const sigDiff = sigB - sigA;
    if (Math.abs(sigDiff) > 10) return sigDiff;
    const signalDiff = actionSignal(b.title) - actionSignal(a.title);
    if (signalDiff !== 0) return signalDiff;
    return sigDiff;
  });

  // Pass 2 dedup: near-identical headlines within evidence pool, then take top 3
  const deduped = dedupStories(filtered).slice(0, 3);

  return deduped.map((s, i) => ({
    headline: cleanTitle(s.title),
    body:     s.short_summary ?? '',
    color:    EVIDENCE_COLORS[i],
    storyId:  s.id,
  }));
}

// ── 4. selectWhatToWatch ──────────────────────────────────────────────────────

/**
 * Returns up to 3 upcoming governance events relevant to user topics.
 * Events with no topic array set are included (unclassified = potentially relevant).
 */
export function selectWhatToWatch(
  events: GovernanceEventRow[],
  userTopics: string[],
  days: number = 14,
): WatchEvent[] {
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  return events
    .filter(e => e.starts_at <= cutoff)
    .filter(e => {
      if (!Array.isArray(e.topics) || e.topics.length === 0) return true;
      return e.topics.some((t: string) =>
        userTopics.some(ut => ut === t || (TRACKER_TO_TOPICS[ut] || []).includes(t))
      );
    })
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 3)
    .map(e => {
      const { label, isNear } = dayLabel(e.starts_at);
      const bodyName = e.governance_bodies?.name || '';
      return {
        dayLabel:    label,
        description: bodyName ? `${bodyName} - ${e.title}` : e.title,
        isNear,
      };
    });
}

// ── 5. selectAcrossSector ─────────────────────────────────────────────────────

/**
 * Returns one story NOT in user's topics (cross-sector signal).
 * Must have short_summary. Returns null if nothing qualifies.
 */
export function selectAcrossSector(
  stories: StoryRow[],
  userTopics: string[],
): AcrossSectorItem | null {
  const contentTopics = new Set<string>(
    userTopics.flatMap(t => TRACKER_TO_TOPICS[t] || [t])
  );

  const candidate = [...stories]
    .filter(s => !contentTopics.has(s.topic) && !!s.short_summary)
    .sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0))[0];

  if (!candidate) return null;

  return {
    headline:    cleanTitle(candidate.title),
    storyId:     candidate.id,
    sourceLabel: candidate.source_name,
    body:        candidate.short_summary ?? '',
  };
}

// ── 6. selectQuickAsk (re-export with context builder) ───────────────────────

export { selectQuickAsk };

// ── 7. generateSignOff ───────────────────────────────────────────────────────

export { generateSignOff } from './utils';

// ─────────────────────────────────────────────────────────────────────────────
// ASYNC DB HELPERS (used by generate-brief/route.ts)
// These are the only async functions in this module.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches candidate stories from Supabase.
 * Returns stories published in the last `hoursBack` hours, status='live',
 * matching `contentTopics` (already expanded from tracker slugs).
 */
export async function fetchCandidateStories(
  supabase: SupabaseClient,
  contentTopics: string[],
  hoursBack: number = 168, // 7-day window; 48h was too narrow for low-volume topics
): Promise<StoryRow[]> {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, source_name, source_type, topic, significance_score, short_summary, description, published_at, status')
    .eq('status', 'live')
    .in('topic', contentTopics.length > 0 ? contentTopics : ['governance'])
    .gte('published_at', since)
    .order('significance_score', { ascending: false })
    .limit(60);

  if (error) throw new Error(`fetchCandidateStories: ${error.message}`);
  return data ?? [];
}

/**
 * Fetches tracker velocity scores for the given tracker slugs,
 * including 12-week sparkline history for each.
 */
export async function fetchTrackerScores(
  supabase: SupabaseClient,
  trackerSlugs: string[],
): Promise<TrackerScoreRow[]> {
  if (trackerSlugs.length === 0) return [];

  const d7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent, error } = await supabase
    .from('velocity_scores')
    .select('tracker_slug, score, interpretation, calculated_at')
    .in('tracker_slug', trackerSlugs)
    .gte('calculated_at', d7)
    .order('calculated_at', { ascending: false })
    .limit(trackerSlugs.length * 5);

  if (error) throw new Error(`fetchTrackerScores: ${error.message}`);

  // Deduplicate: most recent per tracker
  const seen = new Set<string>();
  const deduped = (recent ?? []).filter(r => {
    if (seen.has(r.tracker_slug)) return false;
    seen.add(r.tracker_slug);
    return true;
  });

  // Fetch 12-week sparklines in parallel
  const d12w = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString();
  const rows: TrackerScoreRow[] = await Promise.all(
    deduped.map(async t => {
      const { data: hist } = await supabase
        .from('velocity_scores')
        .select('score, calculated_at')
        .eq('tracker_slug', t.tracker_slug)
        .gte('calculated_at', d12w)
        .order('calculated_at', { ascending: true })
        .limit(12);
      const sparklineValues = (hist ?? []).map(h => h.score ?? 0);
      return {
        ...t,
        sparklineValues: sparklineValues.length >= 2 ? sparklineValues : [t.score, t.score],
      };
    })
  );

  return rows.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

/**
 * Fetches upcoming governance events within the next `days` days.
 * Returns raw rows; topic filtering is done in selectWhatToWatch().
 */
export async function fetchUpcomingEvents(
  supabase: SupabaseClient,
  days: number = 14,
): Promise<GovernanceEventRow[]> {
  const nowIso  = new Date().toISOString();
  const cutoff  = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('governance_events')
    .select('id, title, starts_at, topics, significance, governance_bodies(name)')
    .gte('starts_at', nowIso)
    .lte('starts_at', cutoff)
    .order('starts_at', { ascending: true })
    .limit(20);

  if (error) throw new Error(`fetchUpcomingEvents: ${error.message}`);
  return (data ?? []) as unknown as GovernanceEventRow[];
}
