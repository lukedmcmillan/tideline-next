-- Add matched_entity_id to project_auto_entries so entity-matched rows
-- can surface which entity caused the auto-attach (used in Sources tab badge).
-- Nullable: only set on entry_type = 'entity_match' rows.
ALTER TABLE project_auto_entries
  ADD COLUMN IF NOT EXISTS matched_entity_id uuid REFERENCES entities(id) ON DELETE SET NULL;
