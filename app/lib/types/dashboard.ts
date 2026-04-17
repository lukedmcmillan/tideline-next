// Dashboard v2 API response types
// All new dashboard routes return these shapes.

export interface TickerItem {
  slug: string;
  name: string;
  score: number;
  delta: number; // vs 7 days ago, positive = up
}

export interface OvernightData {
  hours: number;
  doc_count: number;
  source_count: number;
  top_mover_line: string;
  divergence_line: string;
  countdown_line: string;
  readiness_pct: number;
}

export interface HeroSignalData {
  type: "divergence" | "band_crossing" | "governance_event" | "top_velocity" | "scanning";
  divergence?: {
    id: string;
    tracker_tag: string;
    score: number;
    headline: string;
    source_a_name: string;
    source_a_type: string;
    source_a_claim: string;
    source_a_date?: string;
    source_b_name: string;
    source_b_type: string;
    source_b_claim: string;
    source_b_date?: string;
    why_it_matters: string;
    detected_at: string;
  };
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
  scanning?: {
    processed_today: number;
    flagged_today: number;
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
  active_divergences: number;
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

export interface Upcoming30dData {
  cells: CalendarCell[];
  events: CalendarEvent[];
}
