/**
 * whyItMatters() — rule-based "Why it matters" generator for the welcome page.
 * Priority order: first match wins.
 * Null-pulse overrides run before scoring rules.
 */

export interface WhyItMattersInput {
  entity: { id: string; name: string; tracker_tag: string | null };
  pulseScore: number | null;
  mentions30d: number;
  nextEvent: { title: string; starts_at: string } | null;
}

function daysBetween(from: Date, isoDate: string): number {
  const to = new Date(isoDate);
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function whyItMatters(input: WhyItMattersInput, now: Date = new Date()): string {
  const { pulseScore, mentions30d, nextEvent } = input;

  // ── Null-pulse overrides (no velocity_scores row for this tracker) ─────────
  if (pulseScore === null) {
    if (mentions30d >= 10) {
      return `${mentions30d} mentions in 30 days. Tracker data refreshing.`;
    }
    return `${mentions30d} mentions in 30 days.`;
  }

  // ── Scoring rules (first match wins) ──────────────────────────────────────

  // Rule 1: HIGH score AND upcoming session within 30 days
  if (
    pulseScore >= 7.0 &&
    nextEvent !== null &&
    daysBetween(now, nextEvent.starts_at) <= 30
  ) {
    return `${nextEvent.title} on ${formatDate(nextEvent.starts_at)}. Tracker score in HIGH band.`;
  }

  // Rule 2: HIGH score, with optional event clause
  if (pulseScore >= 7.0) {
    const base = `HIGH activity (${pulseScore.toFixed(1)}). ${mentions30d} mentions in 30 days.`;
    if (nextEvent) {
      const days = daysBetween(now, nextEvent.starts_at);
      return `${base} ${nextEvent.title} sits ${days} days out.`;
    }
    return base;
  }

  // Rule 3: Entity-tracker divergence
  if (mentions30d >= 10 && pulseScore < 4.0) {
    return `${mentions30d} mentions in 30 days, but tracker score is LOW. Entity-level discussion outpacing formal activity.`;
  }

  // Rule 4: ELEVATED tracker score, with optional event clause
  if (pulseScore >= 5.0 && pulseScore < 7.0) {
    const base = `ELEVATED activity (${pulseScore.toFixed(1)}). ${mentions30d} mentions in 30 days.`;
    if (nextEvent) {
      const days = daysBetween(now, nextEvent.starts_at);
      return `${base} ${nextEvent.title} sits ${days} days out.`;
    }
    return base;
  }

  // Rule 5: Quiet tracker but entity is being discussed
  if (pulseScore < 5.0 && mentions30d >= 5) {
    return `Quiet tracker, but the entity itself is being discussed. ${mentions30d} mentions in 30 days.`;
  }

  // Rule 6: Fallback
  return `${mentions30d} mentions in 30 days.`;
}
