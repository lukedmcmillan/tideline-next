-- =============================================================
-- Add quarantine columns to entities table
-- =============================================================
-- Applied: 2026-07-08 via Supabase SQL Editor (manual)
-- Purpose: Flag junk entities extracted from non-ocean stories
-- that leaked through before the ocean relevance gate was active.
-- ~150 entities: medical terms, educational frameworks, non-ocean
-- instruments, generic descriptors.
--
-- Quarantined entities remain queryable. No rows are deleted.
-- Countries are NOT quarantined (reclassified separately).
-- =============================================================

ALTER TABLE public.entities
  ADD COLUMN IF NOT EXISTS quarantined_at timestamptz,
  ADD COLUMN IF NOT EXISTS quarantine_reason text;

-- No UPDATE here — quarantine flags are applied per-entity after
-- manual review of the audit CSV. The column exists for the
-- adjudication pass.
