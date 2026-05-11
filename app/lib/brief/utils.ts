// app/lib/brief/utils.ts
// Shared utilities for the morning brief pipeline.
// cleanTitle() is the SINGLE place for headline cleaning - do not duplicate.

// ── Tracker maps (canonical source of truth) ──────────────────────────────────
//
// TRACKER_TO_TOPICS: bridges velocity_scores.tracker_slug → stories.topic[].
//   Used to expand user.topics (tracker slugs) into DB-queryable topic values.
//
// TRACKER_LABELS: keyed by velocity_scores.tracker_slug. Used for the
//   CONDITIONS section and tracker framing in leads. Exactly 10 entries
//   matching the 10 active trackers in the velocity_scores cron.
//
// TOPIC_LABELS: keyed by stories.topic. Used for content section display
//   when surfacing topic-tagged stories (Across the Sector, Evidence).
//   Separate concern from tracker slugs — do not conflate.

export const TRACKER_TO_TOPICS: Record<string, string[]> = {
  // Tracker slug → story topic(s)
  'bbnj':          ['governance'],
  'isa':           ['dsm'],
  'imo-shipping':  ['shipping'],
  '30x30':         ['conservation', 'mpa'],
  'iuu':           ['fisheries', 'iuu'], // stories from Sea Shepherd / Global Fishing Watch use topic:'iuu'
  'wto-fisheries': ['fisheries'],
  'cites-marine':  ['conservation', 'science'],
  'blue-finance':  ['bluefinance'],
  'plastics':      ['governance'],
  'offshore-wind': ['climate'],
  // Passthrough entries for users who may have raw topic values in user.topics
  'governance':    ['governance'],
  'fisheries':     ['fisheries'],
  'shipping':      ['shipping'],
  'dsm':           ['dsm'],
  'climate':       ['climate'],
  'science':       ['science'],
  'conservation':  ['conservation'],
  'mpa':           ['mpa'],
  'bluefinance':   ['bluefinance'],
};

// 10 active tracker slugs — exactly matches velocity_scores.tracker_slug values
export const TRACKER_LABELS: Record<string, string> = {
  'bbnj':          'BBNJ Treaty',
  'isa':           'Deep-Sea Mining',
  'imo-shipping':  'IMO Shipping',
  '30x30':         '30x30',
  'iuu':           'IUU Fishing',
  'wto-fisheries': 'Fisheries',
  'cites-marine':  'Marine Species',
  'blue-finance':  'Blue Finance',
  'plastics':      'Plastics Treaty',
  'offshore-wind': 'Offshore Wind',
};

// 10 story topic values — matches stories.topic column
export const TOPIC_LABELS: Record<string, string> = {
  'governance':   'Governance',
  'fisheries':    'Fisheries',
  'dsm':          'Deep-Sea Mining',
  'bluefinance':  'Blue Finance',
  'climate':      'Climate',
  'science':      'Science',
  'shipping':     'Shipping',
  'conservation': '30x30',
  'mpa':          'Marine Protected Areas',
  'iuu':          'IUU Fishing',
};

// ── cleanTitle ────────────────────────────────────────────────────────────────

/**
 * Cleans a raw story title for display in email subjects and brief sections.
 *
 * Rules (applied in order):
 * 1. HTML entity decode (&amp; &#39; &quot;)
 * 2. Pipe-strip: take everything before first ' | ' (removes source suffixes)
 * 3. Colon-prefix strip: when 3+ colon-delimited parts, drop all but the last
 *    (removes patterns like "Policy paper: Fisheries: actual title")
 *    Exception: if the result would be ≤25 chars, keep original
 * 4. Trim and capitalise first letter
 * 5. Strip em dashes (—) and replace with period + space
 */
export function cleanTitle(raw: string): string {
  let s = raw
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\u2014/g, '. ')   // em dash → period space
    .replace(/\u2013/g, '-');   // en dash stays as hyphen

  // Pipe: take everything before first ' | '
  if (s.includes(' | ')) {
    s = s.split(' | ')[0];
  }

  // Colon: strip prefix when 3+ parts (e.g. "Policy paper: Fisheries: title")
  const colonParts = s.split(':');
  if (colonParts.length >= 3) {
    const candidate = colonParts[colonParts.length - 1].trim();
    // Only strip if result is meaningful (>25 chars)
    if (candidate.length > 25) {
      s = candidate;
    }
  }

  s = s.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Band helpers ──────────────────────────────────────────────────────────────

export type BandLabel = 'ELEVATED' | 'WATCH' | 'LOW';

export function bandForScore(score: number): BandLabel {
  if (score >= 5.0) return 'ELEVATED';
  if (score >= 3.0) return 'WATCH';
  return 'LOW';
}

// ── Date/time helpers ─────────────────────────────────────────────────────────

export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

/** Returns the current weekday name, or null if weekend. */
export function currentWeekday(): Weekday | null {
  const day = new Date().getDay(); // 0=Sun … 6=Sat
  const map: Record<number, Weekday> = {
    1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday',
  };
  return map[day] ?? null;
}

/** Format a Date as 'Monday, 5 May 2026'. */
export function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** Returns ISO week number (1-53). */
export function isoWeekNumber(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/** Returns '{DAY_ABBR} {date}' label and whether the date is within 7 days. */
export function dayLabel(dateStr: string): { label: string; isNear: boolean } {
  const d    = new Date(dateStr);
  const now  = new Date();
  const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const label = `${days[d.getDay()]} ${d.getDate()}`;
  return { label, isNear: diff <= 7 };
}

// ── Sign-off ──────────────────────────────────────────────────────────────────

/** Day-aware warm sign-off. Only called on weekdays. */
export function generateSignOff(weekday: Weekday): string {
  switch (weekday) {
    case 'monday':    return "That's it for this morning. Have a good start to the week. I'll see you tomorrow at 7am.";
    case 'tuesday':   return "That's it for this morning. Have a good Tuesday. I'll see you tomorrow at 7am.";
    case 'wednesday': return "That's it for this morning. Have a good Wednesday. I'll see you tomorrow at 7am.";
    case 'thursday':  return "That's it for this morning. Have a good Thursday. I'll see you tomorrow at 7am.";
    case 'friday':    return "That's it for this morning. Have a good weekend. I'll see you Monday morning.";
  }
}

// ── Work-revealed line ────────────────────────────────────────────────────────

/** Static fallback (cron_log has no sources_checked/stories_filtered columns). */
export const STATIC_WORK_REVEALED =
  "Tideline runs nightly across 89 ocean intelligence sources. These are the items that mattered for your domains this morning.";

// ── Action signal keywords ─────────────────────────────────────────────────────
// Matches the Decision Signal component (PULSE_SCORE_METHODOLOGY.md Section 2, Component C).
// action_signal = 1 when a story title contains any of these substrings (case-insensitive).
// Used by selectEvidence to prefer actionable stories over explanatory/background pieces.
export const ACTION_SIGNAL_KEYWORDS: readonly string[] = [
  'ratif', 'adopt', 'enforc', 'sanction', 'decision', 'resolution',
  'agreement', 'signed', 'implement', 'deadline', 'mandate', 'binding',
  'consultation', 'vote',
];
