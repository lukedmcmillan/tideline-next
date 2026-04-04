CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  entity_type text CHECK (entity_type IN
    ('organisation','individual','instrument','vessel')),
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  mention_count integer DEFAULT 1,
  UNIQUE(name, entity_type)
);

CREATE TABLE IF NOT EXISTS entity_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES entities(id) ON DELETE CASCADE,
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  mentioned_at timestamptz DEFAULT now(),
  context text,
  UNIQUE(entity_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_mentions_story
  ON entity_mentions(story_id);
CREATE INDEX IF NOT EXISTS idx_entities_type
  ON entities(entity_type);

-- RPC to atomically increment mention_count
CREATE OR REPLACE FUNCTION increment_entity_count(entity_id uuid)
RETURNS void AS $$
  UPDATE entities
  SET mention_count = mention_count + 1,
      last_seen_at = now()
  WHERE id = entity_id;
$$ LANGUAGE sql;
