-- Add velocity_calculated_at to alert_sends.
-- Stores the calculated_at timestamp of the velocity_scores row that triggered
-- the crossing. Used as the cache key in getOrCreateInterpretation so that
-- one crossing event = one Haiku interpretation, regardless of band pattern.
ALTER TABLE public.alert_sends
  ADD COLUMN IF NOT EXISTS velocity_calculated_at timestamptz;
