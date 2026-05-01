// app/lib/brief/quick-asks.ts
// Rotating quick-ask copy for the morning brief.
// selectQuickAsk() is pure sync - call from generate-brief when building BriefData.

import { Weekday, isoWeekNumber } from './utils';

// ── Weekday rotation (A/B by week parity) ─────────────────────────────────────

export const WEEKDAY_ASKS: Record<Weekday, { a: string; b: string }> = {
  monday: {
    a: "Working on the week ahead, and wanted to ask: is there a topic area where you feel Tideline is giving you too much noise? A domain where you keep skipping stories? Knowing helps me tune the filter. Just reply with a word or two.",
    b: "Quick one: which of the trackers do you check most often? Knowing helps me know where to dig harder. Reply with a slug or just a name.",
  },
  tuesday: {
    a: "What topic would you want me to go deeper on this week? Not broader - deeper. A specific question, a specific body, a specific process. Reply and I'll pull the thread.",
    b: "Tracking something the news isn't covering yet? If you're watching a process or negotiation that hasn't surfaced in your briefs, tell me. I'll check my sources and see if there's signal I'm missing.",
  },
  wednesday: {
    a: "Quick break from the brief - is there a format thing that's bothering you? Something I'm showing you that you'd rather not see, or something missing that you'd want. Honest answer preferred.",
    b: "Are there any sources you check outside of Tideline that I'm not surfacing? An institutional page, a listserv, a specialist newsletter? I'm always looking to add coverage. Just reply with the URL or name.",
  },
  thursday: {
    a: "What did you do with this week's briefs? Filed for reference? Shared with a colleague? Informed a decision? I ask because it helps me understand which sections are doing real work. Reply with whatever's true.",
    b: "Is there a colleague you share Tideline intel with? If so, are they on Tideline themselves? If not, I could copy them into a specific brief or help you share a snapshot. Just let me know.",
  },
  friday: {
    a: "Any story this week you wish I'd led with - but didn't? Something that mattered more to your work than the significance score implied? That kind of feedback adjusts how I weight future stories for you.",
    b: "Working on something this weekend that Tideline could help with? A report, a proposal, a presentation? If there's a question I can help you get ahead of, reply with it now and I'll have something ready Monday.",
  },
};

// ── Edge-case overrides (take priority over weekday rotation) ─────────────────

export const EDGE_CASE_ASKS = {
  first_brief:
    "Your first Tideline brief. I want it to be useful from day one, so a quick question: what's the one process or negotiation you watch most closely right now? Reply with a name or a tracker slug and I'll prioritise it in your briefs going forward.",
  high_significance_week:
    "Quite a week across your domains. A lot of high-significance signals in the last 48 hours. If you want to go deeper on any of them - background, positions, what to expect next - just reply with the story or tracker name and I'll pull the thread.",
  quiet_week:
    "Quiet week across your domains, which is sometimes the most useful signal. If there's something you were expecting to see and haven't, reply and let me know. Absence of coverage can mean the process has stalled - or that I'm missing a source.",
};

// ── Selector ──────────────────────────────────────────────────────────────────

export interface QuickAskContext {
  isFirstBrief:          boolean;
  recentHighSigCount:    number;   // stories with significance_score >= 7 in last 7 days
  recentLowActivityWeek: boolean;  // true if most user topics had <4 mentions/week
}

/**
 * Returns the correct quick-ask copy string.
 * Pure sync - all context pre-computed by caller.
 *
 * Priority:
 * 1. first_brief edge case
 * 2. high_significance_week (recentHighSigCount >= 3)
 * 3. quiet_week (recentLowActivityWeek)
 * 4. Weekday rotation (A if weekNumber is even, B if odd)
 */
export function selectQuickAsk(
  weekday: Weekday,
  weekNumber: number,
  context: QuickAskContext,
): string {
  if (context.isFirstBrief)          return EDGE_CASE_ASKS.first_brief;
  if (context.recentHighSigCount >= 3) return EDGE_CASE_ASKS.high_significance_week;
  if (context.recentLowActivityWeek) return EDGE_CASE_ASKS.quiet_week;
  const variant = weekNumber % 2 === 0 ? 'a' : 'b';
  return WEEKDAY_ASKS[weekday][variant];
}
