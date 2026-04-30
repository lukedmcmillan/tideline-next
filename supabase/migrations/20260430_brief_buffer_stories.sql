-- Add stories JSONB column to brief_buffer for send-time topic personalisation.
-- Stores the passing story list (id, title, source_name, source_type, topic, brief_summary)
-- so send-brief can filter by user.topics without re-querying the stories table.

ALTER TABLE brief_buffer ADD COLUMN IF NOT EXISTS stories JSONB DEFAULT '[]'::jsonb;
