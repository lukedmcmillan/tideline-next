-- Allow null story_id in project_auto_entries for user-created notes
ALTER TABLE project_auto_entries ALTER COLUMN story_id DROP NOT NULL;

-- Drop the unique constraint on (project_id, story_id) since user notes have no story
ALTER TABLE project_auto_entries DROP CONSTRAINT IF EXISTS project_auto_entries_project_id_story_id_key;
