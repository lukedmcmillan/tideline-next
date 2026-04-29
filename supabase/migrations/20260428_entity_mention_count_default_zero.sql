-- Fix Bug 3: entities.mention_count should default to 0, not 1.
-- A newly inserted entity has no mentions yet; the increment_entity_count
-- RPC is called only when a mention is successfully inserted.
ALTER TABLE entities ALTER COLUMN mention_count SET DEFAULT 0;
