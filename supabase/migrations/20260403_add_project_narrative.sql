-- Add narrative summary columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS narrative_summary text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS narrative_updated_at timestamptz;
