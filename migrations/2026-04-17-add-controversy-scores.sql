-- Add controversy scoring columns to stories table.
-- Run manually in Supabase SQL Editor.

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS controversy_score numeric(3,1),
  ADD COLUMN IF NOT EXISTS controversy_label text,
  ADD COLUMN IF NOT EXISTS controversy_reason text;

CREATE INDEX IF NOT EXISTS idx_stories_controversy
  ON stories(controversy_score DESC)
  WHERE controversy_score >= 6.0;
