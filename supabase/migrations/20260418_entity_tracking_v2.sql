-- Entity tracking v2: aliases, user watchlists, scoring, embeddings, starter sets
-- Evolves existing entities + entity_mentions tables, adds 3 new tables

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- pgvector already enabled (used by embeddings table)

-- ============================================================
-- 1. Evolve entities table
-- ============================================================

ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS parent_entity_id uuid REFERENCES entities(id),
  ADD COLUMN IF NOT EXISTS tracker_tag text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Expand entity_type to accept new values alongside existing ones
ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_entity_type_check;
ALTER TABLE entities ADD CONSTRAINT entities_entity_type_check
  CHECK (entity_type IN (
    'organisation','individual','instrument','vessel',
    'company','person','regulator','issue'
  ));

CREATE INDEX IF NOT EXISTS idx_entities_tracker_tag ON entities(tracker_tag);
CREATE INDEX IF NOT EXISTS idx_entities_parent ON entities(parent_entity_id);
CREATE INDEX IF NOT EXISTS idx_entities_embedding
  ON entities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- ============================================================
-- 2. Entity aliases (new table, reference data — no RLS)
-- ============================================================

CREATE TABLE IF NOT EXISTS entity_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  alias_text text NOT NULL,
  alias_type text CHECK (alias_type IN ('common','legal','abbreviation'))
    DEFAULT 'common',
  UNIQUE(entity_id, alias_text)
);

CREATE INDEX IF NOT EXISTS idx_entity_aliases_text
  ON entity_aliases USING gin (alias_text gin_trgm_ops);

-- ============================================================
-- 3. Add scoring columns to existing entity_mentions
-- ============================================================

ALTER TABLE entity_mentions
  ADD COLUMN IF NOT EXISTS match_score numeric,
  ADD COLUMN IF NOT EXISTS match_method text
    CHECK (match_method IN ('exact','semantic','alias'))
    DEFAULT 'exact',
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS significance numeric
    CHECK (significance IS NULL OR (significance >= 0 AND significance <= 1));

-- ============================================================
-- 4. User entity watchlist (new table)
-- ============================================================

-- NOTE: user_entities intentionally has no RLS policy. Every
-- user-scoped table in this codebase (alert_log, alert_sends,
-- brief_sends, user_alert_preferences) follows the same pattern:
-- security is enforced at the API layer via session check +
-- service-role database queries. RLS is a future migration to
-- apply coherently across all user-scoped tables at the same
-- time, ideally alongside any auth refactor. Do not add RLS to
-- this table in isolation.

-- alert_config shape:
--   email: boolean            — send email notifications
--   threshold: string         — any | watch | material | high_only
--   digest: string            — instant | daily | weekly
--   primary_sources_only: bool — filter to tier-1 sources
--   co_mention_alerts: uuid[] — alert when entity appears with these
--   quiet_period_alert: bool  — alert when entity goes silent
--   mute_until: timestamptz   — suppress alerts until this time

CREATE TABLE IF NOT EXISTS user_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  alert_config jsonb DEFAULT '{
    "email": true,
    "threshold": "material",
    "digest": "daily",
    "primary_sources_only": false,
    "co_mention_alerts": [],
    "quiet_period_alert": false,
    "mute_until": null
  }'::jsonb,
  UNIQUE(user_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_user_entities_user ON user_entities(user_id);

-- ============================================================
-- 5. Entity starter sets (reference data — no RLS)
-- ============================================================

CREATE TABLE IF NOT EXISTS entity_starter_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL CHECK (job_type IN (
    'marine_lawyer','esg_analyst','blue_finance',
    'shipping_compliance','ngo_campaigner','generalist'
  )),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  display_order int NOT NULL DEFAULT 0,
  UNIQUE(job_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_starter_sets_job
  ON entity_starter_sets(job_type, display_order);
