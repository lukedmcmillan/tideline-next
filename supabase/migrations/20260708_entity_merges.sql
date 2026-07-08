-- =============================================================
-- Entity merge infrastructure
-- =============================================================
-- Applied: 2026-07-08 via Supabase SQL Editor (manual)
-- Purpose: Structural merge pattern for duplicate entities.
-- Merge = repoint all links from duplicate to canonical, transfer
-- aliases, record the merge, mark the duplicate as merged. Never
-- delete. Runs as a single transaction.
--
-- Merge transaction pattern (executed per-pair, not in this file):
--   BEGIN;
--   1. Transfer aliases: INSERT INTO entity_aliases (duplicate name
--      + duplicate aliases) as aliases on canonical (deduped)
--   2. UPDATE entity_mentions SET entity_id = canonical
--      WHERE entity_id = duplicate (handle unique conflicts)
--   3. UPDATE user_entities SET entity_id = canonical
--      WHERE entity_id = duplicate (handle unique conflicts)
--   4. UPDATE entities SET status = 'merged' WHERE id = duplicate
--   5. Recalculate canonical mention_count from entity_mentions
--   6. INSERT into entity_merges (audit trail with aliases_transferred)
--   COMMIT;
--
-- TMC is the test case: merge 87dd9bc6 (duplicate "TMC") into
-- 4c1bc1a6 (canonical "The Metals Company").
-- =============================================================

-- Merge audit table
CREATE TABLE IF NOT EXISTS public.entity_merges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  duplicate_id uuid NOT NULL REFERENCES entities(id),
  canonical_id uuid NOT NULL REFERENCES entities(id),
  merged_at timestamptz DEFAULT NOW(),
  reason text,
  mentions_repointed int DEFAULT 0,
  aliases_transferred text[] DEFAULT '{}',
  CONSTRAINT entity_merges_no_self CHECK (duplicate_id <> canonical_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_merges_duplicate ON entity_merges(duplicate_id);
CREATE INDEX IF NOT EXISTS idx_entity_merges_canonical ON entity_merges(canonical_id);

-- Status column on entities (merged entities stay in table, never deleted)
-- Existing rows get 'active' as default.
ALTER TABLE public.entities
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
    CHECK (status IN ('active', 'merged', 'quarantined'));

-- RLS on entity_merges (matches all-tables lockdown)
ALTER TABLE public.entity_merges ENABLE ROW LEVEL SECURITY;

-- No merge operations here — merges are executed per-pair after
-- the dedup scan identifies candidates and operator approves.
-- Each merge runs as a single BEGIN/COMMIT transaction.
