-- Ocean-relevance gate: quarantine table for stories rejected by Haiku classifier
-- Shadow mode: stories are logged here AND still inserted into main stories table
-- Blocking mode (future): stories logged here will NOT be inserted into stories

CREATE TABLE IF NOT EXISTS stories_quarantine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  source_name text,
  url text,
  published_at timestamptz,
  raw_content text,
  rejection_reason text DEFAULT 'ocean_relevance_gate',
  haiku_verdict text,
  haiku_raw_response text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_quarantine_reason ON stories_quarantine(rejection_reason);
CREATE INDEX idx_quarantine_created ON stories_quarantine(created_at DESC);
