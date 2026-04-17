// Hardcoded governance events seed for Sprint 1.
// Replace with real data from governance_events table in Sprint 2.

export interface GovernanceEventSeed {
  title: string;
  body_name: string;
  date: string; // ISO date
  significance: "critical" | "important" | "routine";
  description: string;
}

export const GOVERNANCE_EVENTS: GovernanceEventSeed[] = [
  {
    title: "MEPC 84",
    body_name: "IMO",
    date: "2026-05-03",
    significance: "critical",
    description: "Marine Environment Protection Committee session 84. Net-zero framework vote expected. Key outcome for GHG strategy.",
  },
  {
    title: "ISA Council resumes",
    body_name: "ISA",
    date: "2026-05-08",
    significance: "critical",
    description: "ISA Council resumption session. Exploitation regulations and contractor oversight on the agenda.",
  },
  {
    title: "CITES AC33",
    body_name: "CITES",
    date: "2026-05-13",
    significance: "important",
    description: "Animals Committee 33rd meeting in Geneva. Review of marine species trade data and implementation of CoP20 listings.",
  },
];

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function eventsWithinDays(days: number): (GovernanceEventSeed & { days_until: number })[] {
  return GOVERNANCE_EVENTS
    .map(e => ({ ...e, days_until: daysUntil(e.date) }))
    .filter(e => e.days_until <= days && e.days_until >= 0)
    .sort((a, b) => a.days_until - b.days_until);
}
