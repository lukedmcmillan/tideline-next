-- ============================================================
-- Project entity tracking + workspace auto-attach infrastructure
-- 2026-05-05
-- ============================================================

-- 1. project_entities — which entities each project tracks
CREATE TABLE IF NOT EXISTS project_entities (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_id  uuid        NOT NULL REFERENCES entities(id)  ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_project_entities_project ON project_entities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_entities_entity  ON project_entities(entity_id);

-- 2. projects.last_viewed_at — used for "N new since last visit" badge
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz;

-- 3. Make project_auto_entries.content nullable
--    entity_match rows carry no content — story_id is the reference
ALTER TABLE project_auto_entries ALTER COLUMN content DROP NOT NULL;

-- 4. Partial unique index on (project_id, story_id) for non-null story rows.
--    The original full UNIQUE was dropped in 20260403 to allow null-story user
--    notes. This restores dedup protection for story-backed entries only.
--    Verified 0 duplicate pairs in production before applying.
CREATE UNIQUE INDEX IF NOT EXISTS project_auto_entries_project_story_unique
  ON project_auto_entries(project_id, story_id)
  WHERE story_id IS NOT NULL;

-- 5. Atomic touch function — reads old last_viewed_at then writes now().
--    COALESCE ensures first-ever visit returns -infinity so all entries
--    compare as "new".  FOR UPDATE locks the row to prevent race conditions.
CREATE OR REPLACE FUNCTION touch_project_viewed(p_project_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE prev_ts timestamptz;
BEGIN
  SELECT last_viewed_at INTO prev_ts
  FROM projects
  WHERE id = p_project_id
  FOR UPDATE;

  UPDATE projects
  SET last_viewed_at = now()
  WHERE id = p_project_id;

  RETURN COALESCE(prev_ts, '-infinity'::timestamptz);
END;
$$;
