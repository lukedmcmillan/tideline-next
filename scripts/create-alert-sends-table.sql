-- One-time table creation for threshold alert dedup + audit trail.
-- Run in Supabase SQL editor before /api/cron/threshold-alerts fires.
--
-- The cron writes one row per email actually sent. Used to:
--   1. Suppress duplicate alerts within a 7-day window for the same
--      (tracker_slug, band_from, band_to) crossing.
--   2. Provide an audit trail of every alert delivered.

CREATE TABLE IF NOT EXISTS public.alert_sends (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tracker_slug text NOT NULL,            -- long form, e.g. 'isa-deep-sea-mining'
  band_from    text NOT NULL,            -- LOW | WATCH | ELEVATED | HIGH
  band_to      text NOT NULL,
  sent_at      timestamptz NOT NULL DEFAULT now()
);

-- Dedup query: WHERE tracker_slug = ? AND band_from = ? AND band_to = ? AND sent_at > now() - interval '7 days'
CREATE INDEX IF NOT EXISTS alert_sends_dedup_idx
  ON public.alert_sends (tracker_slug, band_from, band_to, sent_at DESC);

-- Per-user history queries
CREATE INDEX IF NOT EXISTS alert_sends_user_idx
  ON public.alert_sends (user_id, sent_at DESC);
