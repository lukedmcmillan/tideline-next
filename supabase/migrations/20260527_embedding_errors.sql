-- Embedding error log for both library documents and feed stories.
-- embed-documents.ts and embed-stories.ts write here on failure instead of
-- crashing or silently skipping. Allows targeted retry of failed items.

CREATE TABLE IF NOT EXISTS embedding_errors (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  uuid        REFERENCES documents(id) ON DELETE SET NULL,
  story_id     uuid        REFERENCES stories(id) ON DELETE SET NULL,
  error_type   text        NOT NULL
    CHECK (error_type IN (
      'download_failed',
      'extract_failed',
      'embed_failed',
      'insert_failed',
      'text_too_short'
    )),
  error_message text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_embedding_errors_document
  ON embedding_errors(document_id)
  WHERE document_id IS NOT NULL;

CREATE INDEX idx_embedding_errors_story
  ON embedding_errors(story_id)
  WHERE story_id IS NOT NULL;

CREATE INDEX idx_embedding_errors_type
  ON embedding_errors(error_type, created_at DESC);

COMMENT ON TABLE embedding_errors IS
  'Failures from embed-documents.ts and embed-stories.ts. Rows here indicate items that need retry or manual review.';
