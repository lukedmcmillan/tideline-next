-- =============================================================
-- Brief v2 Phase 1: schema additions
-- Applied: 2026-07-10 via Supabase SQL Editor (manual)
-- Committed: for repo parity only; already applied in prod
-- ALL additive, no destructive changes
-- =============================================================

-- 1. stakeholder_type on users
-- Controls brief personalisation (4 cached variants).
-- Distinct from job_type which controls onboarding entity starter sets.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stakeholder_type text
  CHECK (stakeholder_type IN (
    'esg_finance', 'legal', 'compliance_shipping', 'ngo_policy'
  ));

COMMENT ON COLUMN public.users.stakeholder_type IS
  'Brief personalisation slot: controls stakes-sentence variant and For {stakeholder}: label. Derived from job_type at onboarding, default esg_finance.';

-- Backfill existing users from job_type
UPDATE public.users
SET stakeholder_type = CASE
  WHEN job_type = 'esg_analyst'         THEN 'esg_finance'
  WHEN job_type = 'blue_finance'        THEN 'esg_finance'
  WHEN job_type = 'marine_lawyer'       THEN 'legal'
  WHEN job_type = 'shipping_compliance' THEN 'compliance_shipping'
  WHEN job_type = 'ngo_campaigner'      THEN 'ngo_policy'
  ELSE 'esg_finance'
END
WHERE stakeholder_type IS NULL;

-- 2. brief_sends: v2 columns
ALTER TABLE public.brief_sends
  ADD COLUMN IF NOT EXISTS variant text
    CHECK (variant IN ('A', 'B')),
  ADD COLUMN IF NOT EXISTS story_ids uuid[],
  ADD COLUMN IF NOT EXISTS divergence_ids uuid[],
  ADD COLUMN IF NOT EXISTS synthesis_line text,
  ADD COLUMN IF NOT EXISTS resend_message_id text;

COMMENT ON COLUMN public.brief_sends.variant IS
  'A = active day, B = quiet day. Deterministic at send time.';
COMMENT ON COLUMN public.brief_sends.story_ids IS
  'All story IDs included in this brief send. Powers freshness markers.';
COMMENT ON COLUMN public.brief_sends.divergence_ids IS
  'Divergence IDs included in this brief. Powers per-user conflict state-change detection.';
COMMENT ON COLUMN public.brief_sends.resend_message_id IS
  'Resend API message ID for open-rate tracking (priority 6 prerequisite).';

CREATE INDEX IF NOT EXISTS idx_brief_sends_user_sent
  ON public.brief_sends (user_id, sent_at DESC);

-- 3. divergences: resolution columns
-- Per SCREENER-OUTPUT-SPEC.md Part B.1 — must land before divergence detection cron
ALTER TABLE public.divergences
  ADD COLUMN IF NOT EXISTS resolved_outcome text
    CHECK (resolved_outcome IN (
      'source_a', 'source_b', 'mixed', 'neither', 'unresolved_expired'
    )),
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

COMMENT ON COLUMN public.divergences.resolved_outcome IS
  'Which source claim matched the actual outcome. Set on resolution.';
COMMENT ON COLUMN public.divergences.resolved_at IS
  'When the divergence was resolved. NULL while active.';

-- 4. governance_sessions reference table
-- "What to Watch" data source for brief Section 8.
-- NOT the NextAuth sessions table (that stores auth tokens).
CREATE TABLE IF NOT EXISTS public.governance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_name text NOT NULL,
  body text NOT NULL,
  location text,
  start_date date NOT NULL,
  end_date date,
  tracker_tag text NOT NULL,
  description text,
  significance text CHECK (significance IN ('critical', 'important', 'routine')),
  source_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- NOTE: No partial index predicate. CURRENT_DATE and now() are STABLE,
-- not IMMUTABLE — PostgreSQL rejects them in index WHERE clauses.
-- A plain index on start_date is sufficient; the planner will use it
-- for range scans (WHERE start_date >= '2026-07-10') regardless.
CREATE INDEX IF NOT EXISTS idx_governance_sessions_upcoming
  ON public.governance_sessions (start_date);

CREATE INDEX IF NOT EXISTS idx_governance_sessions_tracker
  ON public.governance_sessions (tracker_tag);

COMMENT ON TABLE public.governance_sessions IS
  'Reference table for "What to Watch" in the morning brief. Upcoming governance meetings, deadlines, and sessions.';

ALTER TABLE public.governance_sessions ENABLE ROW LEVEL SECURITY;
