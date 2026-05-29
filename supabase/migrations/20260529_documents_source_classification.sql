-- Source classification columns per RESEARCH-RAG-SPEC.md Section 4.1.
-- source_tier  = user-facing retrieval filter (PRIMARY / SECONDARY).
--               Derived from is_primary_source (already fully populated, 0 NULLs).
-- source_type  = display metadata on source cards only (not a retrieval filter).
--               Populated deterministically where unambiguous; NULL is acceptable.
-- rule_applied = audit trail: which rule set source_type.
-- needs_review = true when source_type could not be determined.
-- classify_confidence = reserved for a future Haiku pass; not populated here.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS source_type         text
    CHECK (source_type IN ('GOVERNMENT', 'NGO', 'ACADEMIC', 'PRESS')),
  ADD COLUMN IF NOT EXISTS source_tier         text
    CHECK (source_tier IN ('PRIMARY', 'SECONDARY')),
  ADD COLUMN IF NOT EXISTS source_domain       text,
  ADD COLUMN IF NOT EXISTS classified_at       timestamptz,
  ADD COLUMN IF NOT EXISTS classify_confidence numeric(3,2),
  ADD COLUMN IF NOT EXISTS needs_review        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rule_applied        text;

-- Retrieval pre-filter index (WHERE source_tier = ANY(...))
CREATE INDEX IF NOT EXISTS idx_documents_source_tier
  ON documents(source_tier);

-- Display metadata index (hover citations, source card filtering)
CREATE INDEX IF NOT EXISTS idx_documents_source_type
  ON documents(source_type);

-- Backfill resumability (skip docs where classified_at IS NOT NULL)
CREATE INDEX IF NOT EXISTS idx_documents_classified_at
  ON documents(classified_at)
  WHERE classified_at IS NULL;

COMMENT ON COLUMN documents.source_tier IS
  'User-facing retrieval filter: PRIMARY | SECONDARY. Derived from is_primary_source.';
COMMENT ON COLUMN documents.source_type IS
  'Display metadata on source cards: GOVERNMENT | NGO | ACADEMIC | PRESS. NULL = not determined. Not a retrieval filter.';
COMMENT ON COLUMN documents.source_domain IS
  'Extracted from canonical_url or file_url (http only). NULL for PDFs in storage.';
COMMENT ON COLUMN documents.needs_review IS
  'true when source_type could not be determined by deterministic rules.';
COMMENT ON COLUMN documents.rule_applied IS
  'Audit: classification rule used (e.g. "is_primary_source", "org:CCAMLR", "doctype:scientific_paper", "NULL—no match").';
