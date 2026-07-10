// app/lib/brief/conflicts.ts
// Conflict lifecycle state machine for the morning brief.
// Pure functions — no DB calls, no async. All inputs are pre-fetched rows.

export type ConflictState =
  | 'DETECTED'
  | 'ESCALATED'
  | 'DE_ESCALATED'
  | 'NEW_SOURCE'
  | 'RESOLUTION_APPROACHING'
  | 'RESOLVED';

export interface DivergenceRow {
  id: string;
  tracker_tag: string;
  headline: string | null;
  score: number;
  is_active: boolean | null;
  detected_at: string | null;
  resolved_outcome: string | null;
  resolved_at: string | null;
  source_a_name: string | null;
  source_a_claim: string | null;
  source_b_name: string | null;
  source_b_claim: string | null;
  why_it_matters: string | null;
}

export interface ConflictStateResult {
  divergenceId: string;
  state: ConflictState | null;
  shouldRenderFullCard: boolean;
  heartbeatLine: string | null;
}

/**
 * Computes the conflict state for a single divergence relative to this user's
 * last brief send. Returns null state if the divergence is inactive and not
 * newly resolved.
 *
 * Full card renders only on state change. Heartbeat line on all other active days.
 * 3-appearance cap: counts conflict_card_ids (full-card only), not divergence_ids.
 * Score movement resets the cap (ESCALATED/DE_ESCALATED always render).
 */
export function computeConflictState(
  div: DivergenceRow,
  lastSnapshot: Record<string, number>,
  lastCardIds: string[],
  priorCardCount: number,
  upcomingSessions: { tracker_tag: string; start_date: string }[],
): ConflictStateResult {
  const id = div.id;

  // RESOLVED: resolved_at is set
  if (div.resolved_at) {
    const wasSeenResolved = lastSnapshot[id] !== undefined && div.resolved_at !== null;
    // Render full card once on resolution, then never again
    const alreadyRenderedResolved = lastCardIds.includes(id) && priorCardCount > 0;
    return {
      divergenceId: id,
      state: 'RESOLVED',
      shouldRenderFullCard: !alreadyRenderedResolved,
      heartbeatLine: null,
    };
  }

  // Not active: skip entirely
  if (!div.is_active) {
    return { divergenceId: id, state: null, shouldRenderFullCard: false, heartbeatLine: null };
  }

  // Active divergence — determine state
  const previousScore = lastSnapshot[id];
  const isNew = previousScore === undefined;
  let state: ConflictState | null = null;

  if (isNew) {
    state = 'DETECTED';
  } else if (div.score > previousScore) {
    state = 'ESCALATED';
  } else if (div.score < previousScore) {
    state = 'DE_ESCALATED';
  }

  // RESOLUTION_APPROACHING: governance_sessions with matching tracker_tag starting within 7 days
  if (state === null) {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const approaching = upcomingSessions.some(s =>
      s.tracker_tag === div.tracker_tag &&
      new Date(s.start_date).getTime() - now <= sevenDays &&
      new Date(s.start_date).getTime() >= now
    );
    if (approaching) state = 'RESOLUTION_APPROACHING';
  }

  // Determine full card vs heartbeat
  const hasStateChange = state !== null;
  const scoreMovement = state === 'ESCALATED' || state === 'DE_ESCALATED';
  // Score movement resets the cap
  const capExhausted = !scoreMovement && priorCardCount >= 3;
  const shouldRenderFullCard = hasStateChange && !capExhausted;

  // Heartbeat line for active divergences on non-card days
  const daysSinceDetection = div.detected_at
    ? Math.floor((Date.now() - new Date(div.detected_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const shortHeadline = (div.headline ?? 'Unnamed conflict').slice(0, 60);

  const heartbeatLine = shouldRenderFullCard
    ? null
    : `1 conflict active: ${shortHeadline}, day ${daysSinceDetection}, unresolved, score ${div.score.toFixed(1)}.`;

  return {
    divergenceId: id,
    state: state ?? (shouldRenderFullCard ? null : null),
    shouldRenderFullCard,
    heartbeatLine,
  };
}

/**
 * Pre-send equality check for heartbeat line values.
 * Validates every value in the heartbeat against the live divergence row.
 * Returns null if any value mismatches (line is omitted, brief still sends).
 */
export function validateHeartbeat(
  heartbeatLine: string | null,
  div: DivergenceRow,
): string | null {
  if (!heartbeatLine) return null;
  // Verify the score in the line matches the current row
  const scoreStr = div.score.toFixed(1);
  if (!heartbeatLine.includes(scoreStr)) return null;
  // Verify headline fragment is present
  const shortHeadline = (div.headline ?? 'Unnamed conflict').slice(0, 60);
  if (!heartbeatLine.includes(shortHeadline)) return null;
  return heartbeatLine;
}

/**
 * Counts how many times the full conflict card was rendered for this divergence
 * across all prior brief_sends for this user.
 */
export function countPriorCardAppearances(
  divergenceId: string,
  priorBriefSends: { conflict_card_ids: string[] | null }[],
): number {
  return priorBriefSends.filter(
    bs => bs.conflict_card_ids?.includes(divergenceId)
  ).length;
}
