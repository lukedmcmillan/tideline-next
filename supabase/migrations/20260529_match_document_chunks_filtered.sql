-- Research RAG: filtered vector search over document_chunks.
-- Applies source_tier and date pre-filters IN SQL before ANN sort.
-- SQL safety: empty source_tiers array = "no filter" (not "filter to nothing").
-- RESEARCH-RAG-SPEC.md Step 3 — Section 5.

CREATE OR REPLACE FUNCTION match_document_chunks_filtered(
  query_embedding    vector(768),
  match_threshold    float,
  match_count        int,
  filter_source_tiers text[] DEFAULT '{}',
  filter_date_from   date    DEFAULT NULL,
  filter_date_to     date    DEFAULT NULL
)
RETURNS TABLE (
  id                 uuid,
  document_id        uuid,
  chunk_text         text,
  chunk_index        int,
  similarity         float,
  title              text,
  source_organisation text,
  source_type        text,
  source_tier        text,
  document_type      text,
  canonical_url      text,
  created_at         timestamptz
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_text,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding)  AS similarity,
    d.title,
    d.source_organisation,
    d.source_type,
    d.source_tier,
    d.document_type,
    d.canonical_url,
    d.created_at
  FROM document_chunks dc
  JOIN documents d ON d.id = dc.document_id
  WHERE d.status = 'approved'
    AND (
      array_length(filter_source_tiers, 1) IS NULL
      OR d.source_tier = ANY(filter_source_tiers)
    )
    AND (filter_date_from IS NULL OR d.created_at::date >= filter_date_from)
    AND (filter_date_to   IS NULL OR d.created_at::date <= filter_date_to)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_document_chunks_filtered TO authenticated;
GRANT EXECUTE ON FUNCTION match_document_chunks_filtered TO service_role;

COMMENT ON FUNCTION match_document_chunks_filtered IS
  'Vector search over document_chunks with source_tier and date pre-filters. '
  'Empty filter_source_tiers means no tier filter (both tiers). '
  'RESEARCH-RAG-SPEC.md Step 3.';
