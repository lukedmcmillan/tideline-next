-- entity_review_queue: holds near-match candidates for human review.
-- Populated by findOrCreateEntity() when trigram similarity > 0.85
-- but below exact-match confidence. Replaces the fix-X.ts ad-hoc script pattern.
CREATE TABLE IF NOT EXISTS entity_review_queue (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_name   text        NOT NULL,
  proposed_type   text,
  matched_entity_id uuid      REFERENCES entities(id) ON DELETE SET NULL,
  matched_name    text,
  similarity_score numeric(4,3),
  source_context  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,
  resolution      text        -- 'merged' | 'kept_separate' | 'deleted'
);

CREATE INDEX IF NOT EXISTS entity_review_queue_resolved_idx
  ON entity_review_queue (resolved_at)
  WHERE resolved_at IS NULL;
