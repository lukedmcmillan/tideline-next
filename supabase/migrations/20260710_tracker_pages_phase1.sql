-- Tracker Pages Phase 1 Migrations (P-A through P-E)
-- TRACKER-PAGES-SPEC.md Section 4
-- All additive, no renames, no rewrites
-- Apply via Supabase Studio SQL Editor

-- ============================================================
-- P-A: Create trackers table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trackers (
  slug text PRIMARY KEY,
  display_name text NOT NULL,
  tier text NOT NULL DEFAULT 'calibrating',
  institutional_type text,
  failure_mode_copy text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trackers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trackers_read_all" ON public.trackers;
CREATE POLICY "trackers_read_all" ON public.trackers FOR SELECT USING (true);

-- P-A Backfill: 11 live trackers
INSERT INTO public.trackers (slug, display_name, tier, institutional_type, failure_mode_copy) VALUES
  ('isa', 'Deep-Sea Mining', 'active', 'Type 2: Mixed architecture', 'Cannot detect surprise unilateral actions. Nauru''s June 2021 two-year rule trigger occurred at a score of 2.05 and was the most consequential ISA event of the decade.'),
  ('bbnj', 'High Seas Treaty', 'active', 'Type 3: Consensus-dependent', 'Structural veto players present. Score cannot distinguish breakthrough from deadlock.'),
  ('plastics', 'Plastics Treaty', 'active', 'Type 3: Consensus-dependent', 'Petrostate veto dynamics. Score cannot distinguish breakthrough from deadlock.'),
  ('imo-shipping', 'IMO Shipping', 'active', 'Type 2: Mixed architecture', 'Session-driven ramp. Inter-session developments may not register until pre-session document publication.'),
  ('30x30', '30x30 MPA', 'active', 'Type 1: Unilateral decisions', 'Sovereign designation decisions have no reliable lead time estimate.'),
  ('iuu', 'IUU Fishing', 'active', 'Type 1/2: Enforcement actions', 'Enforcement actions can emerge without prior signal elevation.'),
  ('blue-finance', 'Blue Finance', 'active', 'Type 6: Voluntary standard-setting', 'Framework releases follow voluntary timelines with limited structural predictability.'),
  ('offshore-wind', 'Offshore Wind', 'active', 'Type 1: Commercial leasing', 'Commercial planning cycles are long. Score reflects regulatory activity, not market timing.'),
  ('cites-marine', 'CITES Marine', 'active', 'Type 2: Majority vote', 'CoP cycle means inter-session activity is sparse. Score is reliable only in pre-CoP windows.'),
  ('wto-fisheries', 'WTO Fisheries Subsidies', 'active', 'Type 2: Mixed architecture', 'Consensus rule means any member can block. Elevated score may not lead to an outcome.'),
  ('blue-carbon-credits', 'Blue Carbon & Biodiversity Credits', 'calibrating', 'Type 6: Voluntary standard-setting', 'Emerging domain with limited historical validation data. Calibrated thresholds are provisional.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- P-B: Create domain_events table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.domain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_slug text NOT NULL REFERENCES public.trackers(slug),
  name text NOT NULL,
  description text,
  event_date date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('decision_point', 'fixed_obligation')),
  library_document_id uuid,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domain_events_slug ON public.domain_events(tracker_slug);
CREATE INDEX IF NOT EXISTS idx_domain_events_date ON public.domain_events(event_date);

ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "domain_events_read_all" ON public.domain_events;
CREATE POLICY "domain_events_read_all" ON public.domain_events FOR SELECT USING (true);

-- P-B Seed: known 2026-2027 calendar events
INSERT INTO public.domain_events (tracker_slug, name, description, event_date, kind, source_url) VALUES
  -- ISA
  ('isa', 'ISA Legal and Technical Commission', '31st Session, Part I. LTC reviews contractor compliance and environmental assessments.', '2026-06-29', 'decision_point', 'https://isa.org.jm/sessions/31st-session-2026/'),
  ('isa', 'ISA Finance Committee', '31st Session finance review.', '2026-07-07', 'decision_point', 'https://isa.org.jm/sessions/31st-session-2026/'),
  ('isa', 'ISA Council', '31st Session, Part II. Mining code negotiations continue.', '2026-07-13', 'decision_point', 'https://isa.org.jm/sessions/31st-session-2026/'),
  ('isa', 'ISA Assembly', '31st Session. Assembly adopts Council recommendations.', '2026-07-27', 'decision_point', 'https://isa.org.jm/sessions/31st-session-2026/'),
  -- IMO
  ('imo-shipping', 'MEPC 84', 'Marine Environment Protection Committee, 84th session. Net-zero framework, CII review, mid-term GHG measures.', '2026-04-27', 'decision_point', 'https://www.imo.org/en/mediacentre/meetingsummaries/pages/preview-mepc-84.aspx'),
  ('imo-shipping', 'FuelEU Maritime first reporting year', 'EU Regulation 2023/1805. First full compliance year GHG intensity monitoring.', '2025-01-01', 'fixed_obligation', 'https://transport.ec.europa.eu/transport-modes/maritime/decarbonising-maritime-transport-fueleu-maritime_en'),
  ('imo-shipping', 'EU ETS maritime full scope', 'CH4 and N2O emissions fall under EU ETS scope from 1 January 2026, in addition to CO2 (covered since 2024).', '2026-01-01', 'fixed_obligation', 'https://climate.ec.europa.eu/eu-action/transport-decarbonisation/reducing-emissions-shipping-sector_en'),
  ('imo-shipping', 'UK ETS maritime inclusion', 'UK Emissions Trading Scheme extends to maritime transport from 1 July 2026.', '2026-07-01', 'fixed_obligation', 'https://www.skuld.com/topics/environment/air-pollution/europe/uk-emission-trading-scheme-for-maritime-entering-into-force-on-1-july-2026/'),
  -- BBNJ
  ('bbnj', 'BBNJ Agreement entry into force', 'Agreement on the Conservation and Sustainable Use of Marine Biological Diversity of Areas Beyond National Jurisdiction entered into force.', '2026-01-17', 'fixed_obligation', 'https://treaties.un.org/pages/ViewDetails.aspx?src=TREATY&mtdsg_no=XXI-10&chapter=21'),
  ('bbnj', 'BBNJ COP1', 'First Conference of the Parties. Pending formal UN General Assembly approval. Operationalises the Agreement.', '2027-01-11', 'decision_point', 'https://highseasalliance.org/'),
  -- CITES
  ('cites-marine', 'CITES Standing Committee (SC28)', '28th meeting of the Standing Committee.', '2026-07-17', 'decision_point', 'https://cites.org/eng/news/calendar.php'),
  ('cites-marine', 'CITES Standing Committee (SC81)', '81st meeting. Implementation review and compliance matters.', '2026-11-02', 'decision_point', 'https://cites.org/eng/sc/81'),
  -- Plastics
  ('plastics', 'INC-5.3 concluded', 'Third part of the fifth session of the INC concluded in Geneva, February 2026. New chair elected. Next session dates TBD.', '2026-02-07', 'decision_point', 'https://www.ciel.org/news/inc-5-3-reaction/'),
  -- WTO Fisheries
  ('wto-fisheries', 'WTO Rules Negotiating Group on fisheries subsidies', 'Post-MC14 negotiations on second wave disciplines (overcapacity and overfishing subsidies).', '2026-07-08', 'decision_point', 'https://www.wto.org/english/news_e/news26_e/fish_08jul26_449_e.htm')
ON CONFLICT DO NOTHING;

-- ============================================================
-- P-C: Create domain_validation table (empty by design)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.domain_validation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_slug text NOT NULL REFERENCES public.trackers(slug),
  methodology_version text NOT NULL,
  hits integer NOT NULL,
  n integer NOT NULL,
  lt_median_weeks numeric,
  lt_low_weeks numeric,
  lt_high_weeks numeric,
  validated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tracker_slug, methodology_version)
);

ALTER TABLE public.domain_validation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "domain_validation_read_all" ON public.domain_validation;
CREATE POLICY "domain_validation_read_all" ON public.domain_validation FOR SELECT USING (true);

-- ============================================================
-- P-D: Create tracker_state_log table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tracker_state_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_slug text NOT NULL REFERENCES public.trackers(slug),
  band text NOT NULL,
  score numeric NOT NULL,
  entered_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracker_state_log_slug ON public.tracker_state_log(tracker_slug);
CREATE INDEX IF NOT EXISTS idx_tracker_state_log_entered ON public.tracker_state_log(entered_at DESC);

ALTER TABLE public.tracker_state_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tracker_state_log_read_all" ON public.tracker_state_log;
CREATE POLICY "tracker_state_log_read_all" ON public.tracker_state_log FOR SELECT USING (true);

-- ============================================================
-- P-E: Extend user_alert_preferences
-- ============================================================
ALTER TABLE public.user_alert_preferences
  ADD COLUMN IF NOT EXISTS alert_on_state_change boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alert_on_band_crossing boolean NOT NULL DEFAULT true;
