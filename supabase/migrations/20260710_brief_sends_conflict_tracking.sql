-- =============================================================
-- Brief v2 Phase 2: conflict lifecycle tracking columns
-- Applied: 2026-07-10 via Supabase SQL Editor (manual)
-- Committed: for repo parity only; already applied in prod
-- ALL additive, no destructive changes
-- =============================================================

ALTER TABLE public.brief_sends
  ADD COLUMN IF NOT EXISTS divergence_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS conflict_card_ids uuid[];

COMMENT ON COLUMN public.brief_sends.divergence_snapshot IS
  'Per-send snapshot {divergence_id: score}. Compared next send to detect ESCALATED/DE_ESCALATED.';
COMMENT ON COLUMN public.brief_sends.conflict_card_ids IS
  'Divergence IDs where full card rendered (not heartbeat). 3-appearance cap counts this column.';
