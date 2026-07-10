// app/lib/brief/select.ts
// Content selection functions for the morning brief.
// selectLead and helpers are pure sync (no DB, no async).
// 3 async DB helpers are co-located for convenience (used by generate-brief).
//
// selectLead implements the C+D tiered selection from BRIEF-LEAD-SPEC.md:
//   Gate 1 (major): significance >= 70 AND tracker ELEVATED or band crossing
//   Gate 2 (edge):  delta-eligible stories ranked by inverse source ubiquity
//   Fallback:       old hybrid logic when no delta-eligible stories exist (logged loudly)
//
// Delta classification (Haiku) is pre-computed in send-brief as classifyDeltaCandidates()
// and passed here as deltaMap. actor/delta_verb/object from the classification are
// reused by Stage 2 Model A/C headline generation — no second Haiku call needed.

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
  sparklineValues: number[];   // scores only, for sparkline rendering
  // sparklineHistory includes timestamps for accurate band-crossing detection.
  // Velocity cron runs every ~4 days (schedule: "0 6 */4 * *"), NOT weekly —
  // array positions cannot define "this week". Always use calculated_at for windows.
  sparklineHistory?: { score: number; calculated_at: string }[];
}

export interface GovernanceEventRow {
  id:                string;
  title:             string;
  starts_at:         string;
  topics?:           string[] | null;
  significance?:     string | null;
  governance_bodies?:{ name: string } | null;
}

// ── Category classification result (Haiku, pre-computed in send-brief) ────────

/**
 * Result of categoryCandidates() Haiku call.
 * category is the primary news angle of the story (phrasing-invariant by design).
 * governance_significance is an advisory 0-100 score — NEVER used for gating or ordering.
 * See brief-category-gate-redesign.md §3.1 for the Q5 reversal rationale.
 *
 * governance_significance permissible uses:
 *   (a) type definition — this interface
 *   (b) cache write — INSERT into delta_classifications.governance_significance
 *   (c) logging/diagnostics — Checkpoint 1 response only
 * governance_significance MUST NOT appear in: sort comparators, gate conditions,
 * floor checks, eligibility filters, or any code that influences lead selection.
 * The 43% fragility finding (brief-category-gate-redesign.md §3.2) makes any
 * accidental gov_sig reference in selection logic a silent rebuild of the fragile axis.
 */
export interface CategoryClassification {
  category: 'GOVERNANCE_CHANGE' | 'ANALYSIS_OR_FINDING' | 'COMMERCIAL_BUSINESS' | 'EXPLAINER_OR_DISCUSSION' | 'OTHER';
  governance_significance: number;  // 0-100, ADVISORY ONLY — see comment above
}

/**
 * @deprecated Verb-era classification (Delta Test, replaced by CategoryClassification).
 * Old DB rows under prior prompt_versions still have these fields. Kept for rollback
 * reference — one stable production week, then dropped with old columns.
 */
export interface DeltaClassification {
  is_delta:   boolean;
  actor:      string | null;
  delta_verb: string | null;
  object:     string | null;
}

// DELTA_VERB_ALLOWLIST removed — Delta Test abolished. See brief-category-gate-redesign.md.

// ── 1. selectLead ─────────────────────────────────────────────────────────────

/** Full result from selectLead, includes diagnostics for Checkpoint 1 logging. */
export interface SelectLeadResult {
  lead:                   LeadItem;
  gate:                   'gate1' | 'gate2' | 'fallback';
  leadStory:              StoryRow | null;   // null only on pure state fallback with no stories
  categoryClassification: CategoryClassification | null;  // for Stage 2 Model A/C; null on fallback
  diagnostics: {
    totalCandidates:    number;   // stories matching user topics + has summary + not recently led
    govChangeCount:     number;   // GOVERNANCE_CHANGE stories above SIG_FLOOR
    oldTopStory:        StoryRow | null;  // what old significance-only logic would have chosen
    gate1Count:         number;   // stories that cleared Gate 1 threshold
    gate2Pool:          { storyId: string; title: string; ubiquity: number }[];
    rejected:           { storyId: string; title: string; reason: string }[];
  };
}

/** Returns all tracker slugs whose TRACKER_TO_TOPICS includes this story topic. */
function topicsToTrackerSlugs(topic: string): string[] {
  return Object.entries(TRACKER_TO_TOPICS)
    .filter(([, topics]) => topics.includes(topic))
    .map(([slug]) => slug);
}

/**
 * Returns tracker slugs where the band changed in the last 7 days.
 * Uses sparklineHistory with actual timestamps — velocity runs every ~4 days,
 * not weekly, so "last 7 days" requires a calendar window, not array indexing.
 * Trackers without sparklineHistory are skipped (treated as no crossing).
 * bandForScore is the canonical function from utils.ts — no local redefinition.
 */
export function computeBandCrossings(trackers: TrackerScoreRow[]): Set<string> {
  const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result      = new Set<string>();
  for (const t of trackers) {
    const hist = (t.sparklineHistory ?? [])
      .slice()
      .sort((a, b) => a.calculated_at.localeCompare(b.calculated_at));
    if (hist.length < 2) continue;
    const beforeWindow = hist.filter(h => new Date(h.calculated_at) < windowStart);
    const inWindow     = hist.filter(h => new Date(h.calculated_at) >= windowStart);
    if (beforeWindow.length === 0 || inWindow.length === 0) continue;
    const bandBefore = bandForScore(beforeWindow[beforeWindow.length - 1].score);
    const bandNow    = bandForScore(inWindow[inWindow.length - 1].score);
    if (bandBefore !== bandNow) result.add(t.tracker_slug);
  }
  return result;
}

/**
 * Counts distinct source organisations covering this story.
 * Lower count = stronger edge signal for Gate 2 (fewer orgs know it).
 * Near-duplicate: same topic + 3+ shared headline words + published within 7 days.
 */
export function computeSourceUbiquity(story: StoryRow, pool: StoryRow[]): number {
  const sources    = new Set<string>([story.source_name]);
  const storyWords = headlineWords(story.title);
  for (const other of pool) {
    if (other.id === story.id || other.topic !== story.topic) continue;
    const diffDays =
      Math.abs(new Date(story.published_at).getTime() - new Date(other.published_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (diffDays > 7) continue;
    const otherWords = headlineWords(other.title);
    let shared = 0;
    for (const w of storyWords) if (otherWords.has(w)) shared++;
    if (shared >= 3) sources.add(other.source_name);
  }
  return sources.size;
}

/**
 * Returns true only when the story's topic maps to the given tracker slug.
 * topic='all' always returns false — broad editorial stories have no tracker affinity
 * and must never drive a tracker-branded headline.
 */
function topicMapsToTracker(topic: string, trackerSlug: string): boolean {
  if (topic === 'all') return false;
  return (TRACKER_TO_TOPICS[trackerSlug] ?? []).includes(topic);
}

/**
 * Legacy significance-only lead logic, preserved exactly as the fallback path.
 * Fires when no story passes the Haiku delta classification.
 * Caller (send-brief) logs prominently and records delta_fallback=true in brief_sends.
 */
function selectLeadFallback(
  baseCandidates: StoryRow[],          // pre-filtered + sorted sig desc
  topTracker:     TrackerScoreRow | undefined,
): LeadItem {
  const topStory = baseCandidates[0] ?? null;
  const maxSig   = topStory?.significance_score ?? 0;

  if (topStory && maxSig >= 35) {
    return {
      type:           'story',
      headline:       cleanTitle(topStory.title),
      storyId:        topStory.id,
      interpretation: topStory.short_summary ?? topStory.description ?? '',
    };
  }

  if (topStory && topTracker && topTracker.score >= 4.0
      && topicMapsToTracker(topStory.topic, topTracker.tracker_slug)) {
    const trackerPart     = `${TRACKER_LABELS[topTracker.tracker_slug] || topTracker.tracker_slug} at Pulse ${topTracker.score.toFixed(1)}`;
    const cleanStoryTitle = cleanTitle(topStory.title);
    return {
      type:            'state',
      headline:        `${trackerPart}. ${cleanStoryTitle}.`,
      subjectHeadline: cleanStoryTitle,
      storyId:         topStory.id,
      interpretation:  topStory.short_summary ?? topStory.description ?? '',
    };
  }

  if (topStory) {
    return {
      type:           'story',
      headline:       cleanTitle(topStory.title),
      storyId:        topStory.id,
      interpretation: topStory.short_summary ?? topStory.description ?? '',
    };
  }

  if (topTracker) {
    const label = TRACKER_LABELS[topTracker.tracker_slug] || topTracker.tracker_slug;
    return {
      type:           'state',
      headline:       `${label} at Pulse ${topTracker.score.toFixed(1)}.`,
      interpretation: `Quiet morning across your tracked domains. ${label} remains the primary signal this week.`,
    };
  }

  return {
    type:           'state',
    headline:       'Quiet morning across your tracked domains.',
    interpretation: 'No significant developments in your areas in the last 48 hours.',
  };
}

// Significance floor for THE LEAD slot.
// NOTE: 35 is the starting value, carried over from the verb-era backtest for initial
// implementation only. The 30-day category-gate backtest must report day-by-day leads
// at floors 30 / 35 / 40 against the category-gated pool. The floor is chosen from
// that data — not assumed to transfer from the verb era. Do not treat 35 as finalized.
const SIG_FLOOR = 35;

/**
 * Selects the single lead item per brief-category-gate-redesign.md tiered selection.
 *
 * categoryMap must be pre-computed by categoryCandidates() in send-brief before
 * the subscriber loop. When categoryMap is empty (e.g. unit tests), every story fails
 * the GOVERNANCE_CHANGE filter and the function falls back to THE SIGNAL path,
 * preserving all existing test behaviour.
 *
 * Gate 1: category=GOVERNANCE_CHANGE + sig>=70 + tracker ELEVATED or band crossing
 * Gate 2: category=GOVERNANCE_CHANGE + sig>=SIG_FLOOR, ranked sig desc (ubiquity tiebreaker)
 * THE SIGNAL (fallback): no qualifying GOVERNANCE_CHANGE → best story/tracker any category
 *
 * governance_significance from categoryMap is NEVER used for gating or ordering.
 * It is written to the cache and logged in diagnostics only.
 *
 * Returns SelectLeadResult with full diagnostics for Checkpoint 1 logging.
 */
export function selectLead(
  stories:        StoryRow[],
  trackers:       TrackerScoreRow[],
  userTopics:     string[],
  recentlyLedIds: Set<string>                        = new Set(),
  categoryMap:    Map<string, CategoryClassification> = new Map(),
  bandCrossings:  Set<string>                        = new Set(),
): SelectLeadResult {
  const contentTopics = new Set<string>(
    userTopics.flatMap(t => TRACKER_TO_TOPICS[t] || [t])
  );

  // Base candidates: topic-matched (or topic='all'), summarised, not recently led, sorted sig desc.
  // topic='all' stories come from broad editorial sources (Oceana, Mongabay, Hakai, Oceanographic)
  // and are eligible for all subscribers regardless of their specific topic subscriptions.
  const baseCandidates = [...stories]
    .filter(s => (contentTopics.has(s.topic) || s.topic === 'all') && s.short_summary && !recentlyLedIds.has(s.id))
    .sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0));

  // What the old significance-only logic would have chosen (Checkpoint 1 comparison)
  const oldTopStory = baseCandidates.find(s => (s.significance_score ?? 0) >= SIG_FLOOR) ?? null;

  const topTracker = [...trackers]
    .filter(t => userTopics.includes(t.tracker_slug))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];

  // Filter: GOVERNANCE_CHANGE + sig >= SIG_FLOOR
  // governance_significance is NOT used here — category only, ordered by significance_score.
  const rejected: SelectLeadResult['diagnostics']['rejected'] = [];
  const govChangeEligible = baseCandidates.filter(s => {
    const cls = categoryMap.get(s.id);
    if (!cls || cls.category !== 'GOVERNANCE_CHANGE') {
      rejected.push({ storyId: s.id, title: s.title, reason: `not GOVERNANCE_CHANGE (${cls?.category ?? 'unclassified'})` });
      return false;
    }
    if ((s.significance_score ?? 0) < SIG_FLOOR) {
      rejected.push({ storyId: s.id, title: s.title, reason: `sig ${s.significance_score} < ${SIG_FLOOR} floor` });
      return false;
    }
    return true;
  });

  // Gate 1: sig >= 70 AND (story's tracker at ELEVATED OR band crossed this week)
  const gate1 = govChangeEligible.filter(s => {
    if ((s.significance_score ?? 0) < 70) return false;
    const slugs      = topicsToTrackerSlugs(s.topic);
    const isElevated = slugs.some(slug => {
      const tr = trackers.find(t => t.tracker_slug === slug);
      return tr && bandForScore(tr.score) === 'ELEVATED';
    });
    return isElevated || slugs.some(slug => bandCrossings.has(slug));
  });

  if (gate1.length > 0) {
    const chosen = gate1[0]; // highest sig (already sorted)
    const cls    = categoryMap.get(chosen.id)!;
    gate1.slice(1).forEach(s =>
      rejected.push({ storyId: s.id, title: s.title, reason: `lost Gate 1 ranking (sig: ${s.significance_score})` })
    );
    govChangeEligible
      .filter(s => !gate1.some(g => g.id === s.id))
      .forEach(s =>
        rejected.push({ storyId: s.id, title: s.title, reason: `sig ${s.significance_score} < 70 or tracker not ELEVATED/crossing` })
      );
    return {
      lead: {
        type:           'story',
        headline:       cleanTitle(chosen.title), // Stage 2 replaces with Model C
        storyId:        chosen.id,
        interpretation: chosen.short_summary ?? chosen.description ?? '',
      },
      gate:                   'gate1',
      leadStory:              chosen,
      categoryClassification: cls,
      diagnostics: {
        totalCandidates: baseCandidates.length,
        govChangeCount:  govChangeEligible.length,
        oldTopStory,
        gate1Count:      gate1.length,
        gate2Pool:       [],
        rejected,
      },
    };
  }

  // Gate 2: all govChangeEligible, ranked significance_score desc (ubiquity as tiebreaker only).
  // governance_significance is NOT referenced here.
  if (govChangeEligible.length > 0) {
    const ranked = govChangeEligible
      .map(s => ({ story: s, ubiquity: computeSourceUbiquity(s, stories) }))
      .sort((a, b) =>
        (b.story.significance_score ?? 0) !== (a.story.significance_score ?? 0)
          ? (b.story.significance_score ?? 0) - (a.story.significance_score ?? 0)
          : a.ubiquity - b.ubiquity   // lower ubiquity = stronger edge signal, tiebreaker only
      );
    const chosen = ranked[0].story;
    const cls    = categoryMap.get(chosen.id)!;
    ranked.slice(1).forEach(r =>
      rejected.push({
        storyId: r.story.id,
        title:   r.story.title,
        reason:  `lost Gate 2 ranking (sig: ${r.story.significance_score}, ubiquity: ${r.ubiquity})`,
      })
    );
    return {
      lead: {
        type:           'story',
        headline:       cleanTitle(chosen.title), // Stage 2 replaces with Model A
        storyId:        chosen.id,
        interpretation: chosen.short_summary ?? chosen.description ?? '',
      },
      gate:                   'gate2',
      leadStory:              chosen,
      categoryClassification: cls,
      diagnostics: {
        totalCandidates: baseCandidates.length,
        govChangeCount:  govChangeEligible.length,
        oldTopStory,
        gate1Count:      0,
        gate2Pool:       ranked.map(r => ({
          storyId:  r.story.id,
          title:    r.story.title.slice(0, 70),
          ubiquity: r.ubiquity,
        })),
        rejected,
      },
    };
  }

  // THE SIGNAL (fallback): no GOVERNANCE_CHANGE story at sig>=SIG_FLOOR.
  // Fires selectLeadFallback — highest-sig story any category, or tracker state.
  // Caller logs and records delta_fallback=true in brief_sends.
  return {
    lead:                   selectLeadFallback(baseCandidates, topTracker),
    gate:                   'fallback',
    leadStory:              baseCandidates[0] ?? null,
    categoryClassification: null,
    diagnostics: {
      totalCandidates: baseCandidates.length,
      govChangeCount:  0,
      oldTopStory,
      gate1Count:      0,
      gate2Pool:       [],
      rejected,
    },
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
  // topic='all' included: broad editorial sources are eligible evidence for all subscribers
  const candidates = stories.filter(
    s => s.id !== leadId && !!s.short_summary && (contentTopics.has(s.topic) || s.topic === 'all')
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

  // topic='all' excluded from cross-sector: it is in-scope for all subscribers (not genuinely cross-sector)
  const candidate = [...stories]
    .filter(s => !contentTopics.has(s.topic) && s.topic !== 'all' && !!s.short_summary)
    .sort((a, b) => (b.significance_score ?? 0) - (a.significance_score ?? 0))[0];

  if (!candidate) return null;

  return {
    headline:    cleanTitle(candidate.title),
    storyId:     candidate.id,
    sourceLabel: candidate.source_name,
    body:        candidate.short_summary ?? '',
  };
}

// ── 6. determineVariant ──────────────────────────────────────────────────────

/**
 * Determines brief variant A or B. Pure code, no model judgement.
 * A: lead-eligible GOVERNANCE_CHANGE exists, OR band crossed in last 24h,
 *    OR an active conflict changed state.
 * B: otherwise (quiet day, shorter read).
 */
export function determineVariant(
  leadGate: 'gate1' | 'gate2' | 'fallback',
  bandCrossings: Set<string>,
  userTopics: string[],
  conflictStateChanged: boolean,
): 'A' | 'B' {
  // Gate1 or Gate2 = lead-eligible GOVERNANCE_CHANGE exists
  if (leadGate === 'gate1' || leadGate === 'gate2') return 'A';
  // Band crossing in any of user's tracked domains
  if (userTopics.some(t => bandCrossings.has(t))) return 'A';
  // Active conflict changed state
  if (conflictStateChanged) return 'A';
  return 'B';
}

// ── 7. computeWatchlistHits ─────────────────────────────────────────────────

/**
 * Joins today's brief story IDs against user's tracked entity IDs
 * via the entity_mentions map. Returns count + entity names for the hit-line.
 * All ASSEMBLED, never generated.
 */
export function computeWatchlistHits(
  briefStoryIds: string[],
  userEntityIds: Set<string>,
  entityMentions: { story_id: string; entity_id: string; entity_name: string }[],
): { count: number; names: string[] } | null {
  if (userEntityIds.size === 0 || briefStoryIds.length === 0) return null;
  const briefSet = new Set(briefStoryIds);
  const hitNames = new Set<string>();
  for (const m of entityMentions) {
    if (briefSet.has(m.story_id) && userEntityIds.has(m.entity_id)) {
      hitNames.add(m.entity_name);
    }
  }
  if (hitNames.size === 0) return null;
  return { count: hitNames.size, names: Array.from(hitNames).slice(0, 5) };
}

// ── 8. computeSelectionMath ─────────────────────────────────────────────────

/**
 * Direct reads for the credibility line. No computation beyond counting.
 */
export function computeSelectionMath(
  totalSources: number,
  totalIngested: number,
  userFilteredCount: number,
): { sourcesChecked: number; storiesIngested: number; thresholdPassers: number } {
  return {
    sourcesChecked: totalSources,
    storiesIngested: totalIngested,
    thresholdPassers: userFilteredCount,
  };
}

// ── 9. generateSignOff ───────────────────────────────────────────────────────

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
      const histRows        = hist ?? [];
      const sparklineValues = histRows.map(h => h.score ?? 0);
      const sparklineHistory = histRows.map(h => ({
        score:        h.score ?? 0,
        calculated_at: h.calculated_at,
      }));
      return {
        ...t,
        sparklineValues:   sparklineValues.length >= 2 ? sparklineValues : [t.score, t.score],
        sparklineHistory:  sparklineHistory,
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
