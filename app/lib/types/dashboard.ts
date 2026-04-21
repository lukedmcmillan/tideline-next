// Dashboard v2 API response types
// All new dashboard routes return these shapes.

export interface TickerItem {
  slug: string;
  name: string;
  score: number;
  delta: number; // vs 7 days ago, positive = up
}

export interface RevealData {
  header: string;
  summary: string;
  window: { since: string; until: string; hours: number };
  activity: {
    documents_processed: number;
    new_stories_in_tracked_domains: number;
    score_moves: Array<{ tracker: string; from: number; to: number; direction: string }>;
    band_crossings: Array<{ tracker: string; from_band: string; to_band: string }>;
    countdown_deltas: Array<{ event: string; days_until: number; days_closer: number }>;
  };
  is_quiet: boolean;
}

export interface OvernightData {
  hours: number;
  doc_count: number;
  source_count: number;
  top_mover_line: string;
  countdown_line: string;
  readiness_pct: number;
}

export interface HeroSignalData {
  type: "band_crossing" | "governance_event" | "top_velocity";
  band_crossing?: {
    slug: string;
    name: string;
    score: number;
    band_from: string;
    band_to: string;
    direction: string;
    interpretation: string;
  };
  governance_event?: {
    title: string;
    body_name: string;
    date: string;
    days_until: number;
    significance: string;
    description: string;
  };
  top_velocity?: {
    slug: string;
    name: string;
    score: number;
    direction: string;
    history: number[];
  };
}

export interface ReadinessData {
  event_title: string;
  body_name: string;
  days_until: number;
  readiness_pct: number;
}

export interface ProofOfWorkData {
  last_ingestion_minutes_ago: number;
  docs_today: number;
  sources_monitored: number;
  active_trackers: number;
  next_scan_utc: string;
}

export interface CalendarCell {
  date: string;
  intensity: number; // 0-3
  event_type?: string; // "event" | "big-event"
}

export interface CalendarEvent {
  title: string;
  body_name: string;
  date: string;
  days_until: number;
}

export type MixedTickerItem =
  | { type: "headline"; title: string; source_name: string; time_ago: string }
  | { type: "score_delta"; name: string; score: number; delta: number }
  | { type: "countdown"; event_name: string; days: number }
  | { type: "doc_ingestion"; count: number; source: string; time_ago: string };

export interface Upcoming30dData {
  cells: CalendarCell[];
  events: CalendarEvent[];
}
