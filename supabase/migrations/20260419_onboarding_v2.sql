-- Onboarding v2: job_type, brief_time, onboarded_at, morning_brief_queue, entity audit trail
-- Depends on: 20260418_entity_tracking_v2.sql (user_entities, entity_starter_sets)

-- ============================================================
-- 1. Add columns to public.users
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS job_type text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS brief_time time DEFAULT '07:00';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- ============================================================
-- 2. Backfill onboarded_at for v1 users who completed onboarding
--    (have non-empty topics array). Use created_at if it exists,
--    otherwise fall back to now().
-- ============================================================

DO $$
BEGIN
  -- Check if created_at column exists on users table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'created_at'
  ) THEN
    UPDATE users
    SET onboarded_at = created_at
    WHERE onboarded_at IS NULL
      AND topics IS NOT NULL
      AND jsonb_array_length(topics) > 0;
  ELSE
    UPDATE users
    SET onboarded_at = now()
    WHERE onboarded_at IS NULL
      AND topics IS NOT NULL
      AND jsonb_array_length(topics) > 0;
  END IF;
END $$;

-- ============================================================
-- 3. Add created_by to entities for user-generated entity audit
-- ============================================================

ALTER TABLE entities ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);

-- ============================================================
-- 4. Create morning_brief_queue
-- ============================================================

CREATE TABLE IF NOT EXISTS morning_brief_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_for timestamptz NOT NULL,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_morning_brief_queue_pending
  ON morning_brief_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_morning_brief_queue_user
  ON morning_brief_queue(user_id);

-- ============================================================
-- 5. Fuzzy match RPCs for custom entity search (pg_trgm)
-- ============================================================

CREATE OR REPLACE FUNCTION match_entities_by_name(
  search_text text,
  match_threshold numeric DEFAULT 0.4,
  match_limit int DEFAULT 2
)
RETURNS TABLE(id uuid, name text, entity_type text, similarity numeric) AS $$
  SELECT e.id, e.name, e.entity_type,
         similarity(e.name, search_text)::numeric AS similarity
  FROM entities e
  WHERE similarity(e.name, search_text) >= match_threshold
  ORDER BY similarity DESC
  LIMIT match_limit;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION match_entities_by_alias(
  search_text text,
  match_threshold numeric DEFAULT 0.4,
  match_limit int DEFAULT 2
)
RETURNS TABLE(id uuid, name text, entity_type text, similarity numeric) AS $$
  SELECT e.id, e.name, e.entity_type,
         similarity(a.alias_text, search_text)::numeric AS similarity
  FROM entity_aliases a
  JOIN entities e ON e.id = a.entity_id
  WHERE similarity(a.alias_text, search_text) >= match_threshold
  ORDER BY similarity DESC
  LIMIT match_limit;
$$ LANGUAGE sql STABLE;
