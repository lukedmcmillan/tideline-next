-- DEV SEED — DO NOT APPLY TO PRODUCTION
-- Purpose: insert a visible band_crossing signal for dashboard sparkline verification.
-- The real band_crossing signals from yesterday have decayed; this keeps the card
-- variant testable during development.
-- Remove this seed once real signals are consistently present, or after verification.

INSERT INTO signal_events (
  signal_type, tracker_slug, headline, body, importance,
  action_label, action_url, expires_at, metadata
) VALUES (
  'band_crossing',
  'isa',
  'Deep-Sea Mining → ELEVATED',
  '7.4 (was 6.1) · accelerating · largest weekly jump since ISA Council Part 2',
  9,
  'View tracker',
  '/platform/tracker/isa',
  now() + interval '48 hours',
  '{"to_band": "ELEVATED", "from_band": "WATCH", "to_score": 7.4, "from_score": 6.1, "momentum": "accelerating"}'::jsonb
);
