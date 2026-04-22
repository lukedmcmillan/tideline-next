-- Signal Events table for the Fruit Machine mobile feed.
-- Stores precomputed signals ranked by decay × importance.
-- Populated by app/lib/signal-generation.ts at the end of each scraper run.

CREATE TABLE IF NOT EXISTS signal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type text NOT NULL CHECK (signal_type IN ('band_crossing', 'countdown_threshold', 'convergence_spike', 'high_sig_story')),
  tracker_slug text NOT NULL,
  headline text NOT NULL,
  body text NOT NULL,
  importance numeric(3,1) NOT NULL CHECK (importance BETWEEN 0 AND 10),
  action_label text,
  action_url text,
  source_story_id uuid,
  source_event_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_signal_events_created_at ON signal_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_events_tracker ON signal_events(tracker_slug);
CREATE INDEX IF NOT EXISTS idx_signal_events_importance ON signal_events(importance DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_events_type ON signal_events(signal_type, created_at DESC);

ALTER TABLE signal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signal_events_read" ON signal_events FOR SELECT USING (true);

-- ─── Seed data for Phase 5 UI development ────────────────────────────────────
-- 12 rows: realistic mix of types and ages so decay ranking has something to do.
-- Ages: <30min, <1h, ~2h, ~4h, ~6h, ~8h, ~12h, ~16h, ~20h, ~24h spread.

INSERT INTO signal_events (signal_type, tracker_slug, headline, body, importance, action_label, action_url, metadata, created_at, expires_at) VALUES

-- ── band_crossing × 4 ─────────────────────────────────────────────────────

-- Very recent (22 minutes ago) — will rank high after decay
('band_crossing', 'isa',
 'Deep-Sea Mining → ELEVATED',
 '7.4 (was 6.1) · accelerating · largest weekly jump since ISA Council Part 2',
 9.0, 'View tracker', '/platform/tracker/isa',
 '{"from_score": 6.1, "to_score": 7.4, "from_band": "WATCH", "to_band": "ELEVATED", "momentum": "accelerating"}'::jsonb,
 now() - interval '22 minutes',
 now() + interval '48 hours'),

-- ~4 hours ago — mid-decay
('band_crossing', 'bbnj',
 'BBNJ → ELEVATED',
 '8.1 (was 7.0) · accelerating · Fiji ratification pushes treaty past 60th instrument',
 9.0, 'View tracker', '/platform/tracker/bbnj',
 '{"from_score": 7.0, "to_score": 8.1, "from_band": "ELEVATED", "to_band": "ELEVATED", "momentum": "accelerating"}'::jsonb,
 now() - interval '4 hours',
 now() + interval '44 hours'),

-- ~10 hours ago — visible but lower in rankings
('band_crossing', 'offshore-wind',
 'Offshore Wind → LOW',
 '3.2 (was 5.1) · decelerating · EU permitting pause cited by 7 outlets',
 9.0, 'View tracker', '/platform/tracker/offshore-wind',
 '{"from_score": 5.1, "to_score": 3.2, "from_band": "WATCH", "to_band": "LOW", "momentum": "decelerating"}'::jsonb,
 now() - interval '10 hours',
 now() + interval '38 hours'),

-- ~20 hours ago — near expiry, low display_score
('band_crossing', 'plastics',
 'Plastics Treaty → WATCH',
 '4.8 (was 3.9) · stabilising · INC-6 chair signals June session',
 9.0, 'View tracker', '/platform/tracker/plastics',
 '{"from_score": 3.9, "to_score": 4.8, "from_band": "LOW", "to_band": "WATCH", "momentum": "stabilising"}'::jsonb,
 now() - interval '20 hours',
 now() + interval '28 hours'),

-- ── countdown_threshold × 4 ───────────────────────────────────────────────

-- Very recent (18 minutes ago) — 3-day threshold, max importance
('countdown_threshold', 'imo-shipping',
 'MEPC 84 now 3 days away',
 '7 May · London · GHG reduction targets and CII amendments expected',
 9.5, 'View event', '/platform/tracker/imo-shipping',
 '{"threshold": 3, "days_until": 3, "event_name": "MEPC 84"}'::jsonb,
 now() - interval '18 minutes',
 now() + interval '12 hours'),

-- ~6 hours ago — 7-day threshold
('countdown_threshold', 'bbnj',
 'BBNJ Ratification Ceremony now 7 days away',
 '29 Apr · New York · UN Treaty Collection ceremony. 63 parties expected to deposit.',
 9.0, 'View event', '/platform/tracker/bbnj',
 '{"threshold": 7, "days_until": 7, "event_name": "BBNJ Ratification Ceremony"}'::jsonb,
 now() - interval '6 hours',
 now() + interval '6 hours'),

-- ~8 hours ago — 14-day threshold
('countdown_threshold', 'wto-fisheries',
 'WTO Compliance Deadline now 14 days away',
 '6 May · Geneva · Members must notify subsidy programmes or face dispute settlement',
 8.0, 'View tracker', '/platform/tracker/wto-fisheries',
 '{"threshold": 14, "days_until": 14, "event_name": "WTO Fish Subsidies Compliance Deadline"}'::jsonb,
 now() - interval '8 hours',
 now() + interval '4 hours'),

-- ~16 hours ago — 30-day threshold, lowest importance in this type
('countdown_threshold', 'iuu',
 'EU CATCH Compliance Review now 30 days away',
 '22 May · Brussels · First comprehensive assessment of CATCH mandatory regime',
 7.0, 'View tracker', '/platform/tracker/iuu',
 '{"threshold": 30, "days_until": 30, "event_name": "EU CATCH Compliance Review"}'::jsonb,
 now() - interval '16 hours',
 now() + interval '8 hours'),

-- ── convergence_spike × 3 ─────────────────────────────────────────────────

-- ~45 minutes ago — high outlet count
('convergence_spike', 'bbnj',
 '14 outlets covering BBNJ ratification',
 'Tideline sees this: 14 sources in last 6 hours. Reuters led by 3 hours. Science coverage spiking.',
 8.0, 'Read stories', '/platform/feed',
 '{"outlet_count": 14, "previous_count": 4, "window_hours": 6, "lead_source": "Reuters"}'::jsonb,
 now() - interval '45 minutes',
 now() + interval '6 hours'),

-- ~3 hours ago — moderate outlet count
('convergence_spike', 'isa',
 '9 outlets covering deep-sea mining moratorium',
 'Tideline sees this: 9 sources in last 6 hours. The Guardian led by 2 hours.',
 7.2, 'Read stories', '/platform/feed',
 '{"outlet_count": 9, "previous_count": 2, "window_hours": 6, "lead_source": "The Guardian"}'::jsonb,
 now() - interval '3 hours',
 now() + interval '3 hours'),

-- ~12 hours ago — lower count, older
('convergence_spike', 'offshore-wind',
 '6 outlets covering EU permitting pause',
 'Tideline sees this: 6 sources in last 6 hours. Bloomberg Energy led.',
 6.8, 'Read stories', '/platform/feed',
 '{"outlet_count": 6, "previous_count": 1, "window_hours": 6, "lead_source": "Bloomberg Energy"}'::jsonb,
 now() - interval '12 hours',
 now() + interval '0 hours'),

-- ── high_sig_story × 3 ────────────────────────────────────────────────────

-- ~2 hours ago — near-perfect significance score
('high_sig_story', 'bbnj',
 'High Seas Treaty passes 60th ratification — entry into force confirmed',
 'Fiji deposits instrument at UN. Entry into force date confirmed for 1 January 2027. IUCN calls it the most significant ocean governance milestone since UNCLOS.',
 9.2, 'Read story', '/platform/feed',
 '{"significance_score": 9.2, "source": "Reuters"}'::jsonb,
 now() - interval '2 hours',
 now() + interval '22 hours'),

-- ~7 hours ago — ISA tracker
('high_sig_story', 'isa',
 'ISA Council adopts draft financial model for deep-sea mining royalties',
 'Council Part 2 agrees royalty rate framework. 2% gross revenue benchmark for first 10 years. Decision non-binding pending full adoption.',
 8.6, 'Read story', '/platform/feed',
 '{"significance_score": 8.6, "source": "ISA Secretariat"}'::jsonb,
 now() - interval '7 hours',
 now() + interval '17 hours'),

-- ~18 hours ago — IUU tracker, lower significance
('high_sig_story', 'iuu',
 'EU red-cards Cambodia over IUU fishing failures — seafood import ban takes effect',
 'EU Commission issues formal red card after Cambodia fails to address yellow card from 2023. Estimated €180m annual seafood trade affected.',
 8.1, 'Read story', '/platform/feed',
 '{"significance_score": 8.1, "source": "European Commission"}'::jsonb,
 now() - interval '18 hours',
 now() + interval '6 hours');
