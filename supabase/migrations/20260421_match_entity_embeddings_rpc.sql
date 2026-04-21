-- RPC for semantic entity matching via pgvector cosine similarity
-- Used by lib/entity-matching.ts Pass 2

CREATE OR REPLACE FUNCTION match_entity_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.75,
  match_count int DEFAULT 10
)
RETURNS TABLE(id uuid, name text, entity_type text, similarity float) AS $$
  SELECT
    e.id,
    e.name,
    e.entity_type,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM entities e
  WHERE e.embedding IS NOT NULL
    AND 1 - (e.embedding <=> query_embedding) >= match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
