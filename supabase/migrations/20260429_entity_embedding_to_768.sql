-- Change entities.embedding from vector(1536) to vector(768) to match Jina v2
-- The original column was added in 20260418_entity_tracking_v2.sql
-- The RPC was defined in 20260421_match_entity_embeddings_rpc.sql
-- story_chunks.embedding was already changed to vector(768) in 20260331_alter_embedding_dimension.sql
-- This brings entities into alignment with the rest of the codebase.

-- 1. Drop the existing ivfflat index (references the column, must go first)
DROP INDEX IF EXISTS idx_entities_embedding;

-- 2. Drop and re-add the column at 768 dims
--    (Postgres cannot change vector dimensions in-place)
ALTER TABLE entities DROP COLUMN IF EXISTS embedding;
ALTER TABLE entities ADD COLUMN embedding vector(768);

-- 3. Recreate ivfflat index
--    lists = 31 ≈ sqrt(942) — appropriate for current scale.
--    Re-evaluate when entity count exceeds ~5000 rows.
CREATE INDEX idx_entities_embedding
  ON entities
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 31);

-- 4. Update the RPC — only query_embedding type changes (1536 → 768)
--    Return signature and query body are preserved exactly.
CREATE OR REPLACE FUNCTION match_entity_embeddings(
  query_embedding vector(768),
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
