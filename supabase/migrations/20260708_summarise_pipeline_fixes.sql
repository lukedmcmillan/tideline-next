-- =============================================================
-- Summarise pipeline fixes: skip-failed columns, score annotations,
-- cron heartbeat table
-- =============================================================
-- Applied: 2026-07-08 via Supabase SQL Editor (manual)
--
-- Three changes:
-- 1. stories: summarise_status + failure tracking columns
-- 2. score_annotations: additive annotation for velocity_scores
--    affected by the April-July 2026 summarise stall
-- 3. cron_runs: heartbeat table so a stall is never silent again
-- =============================================================

-- 1. Stories: summarise failure tracking
-- No sentinel values in content columns (short_summary stays NULL on failure).
-- Dedicated columns: self-describing, queryable, export-safe.
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS summarise_status text DEFAULT 'pending'
    CHECK (summarise_status IN ('pending', 'done', 'failed')),
  ADD COLUMN IF NOT EXISTS failure_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failure_reason text;

-- Backfill existing summarised stories
UPDATE public.stories SET summarise_status = 'done' WHERE short_summary IS NOT NULL;

-- 2. Score annotations: additive, never touches velocity_scores rows
CREATE TABLE IF NOT EXISTS public.score_annotations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tracker_slug text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  annotation_type text NOT NULL
    CHECK (annotation_type IN ('ingestion_incident', 'source_gap', 'methodology_change', 'manual_override')),
  note text NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_annotations_tracker ON score_annotations(tracker_slug, period_start);
ALTER TABLE public.score_annotations ENABLE ROW LEVEL SECURITY;

-- 3. Cron heartbeat table: every cron run writes a row on start and
-- updates on completion. A monitoring query checks for runs that started
-- but never completed (timeout) or runs that haven't started at all
-- (cron not firing).
CREATE TABLE IF NOT EXISTS public.cron_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cron_name text NOT NULL,
  started_at timestamptz DEFAULT NOW(),
  completed_at timestamptz,
  status text DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  items_processed int DEFAULT 0,
  items_failed int DEFAULT 0,
  error_summary text,
  duration_ms int
);

CREATE INDEX IF NOT EXISTS idx_cron_runs_name_started ON cron_runs(cron_name, started_at DESC);
ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;
