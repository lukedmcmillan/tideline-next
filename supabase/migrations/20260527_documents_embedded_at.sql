-- Add embedded_at timestamp to documents table for embedding resumability.
-- embed-documents.ts skips any document where embedded_at IS NOT NULL.
-- Set by the script after all chunks for a document are successfully inserted.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS embedded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_documents_embedded_at
  ON documents(embedded_at)
  WHERE embedded_at IS NULL;

COMMENT ON COLUMN documents.embedded_at IS
  'Set by embed-documents.ts after all chunks inserted. NULL = not yet embedded.';
