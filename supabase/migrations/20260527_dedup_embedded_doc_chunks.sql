-- Chunk-level dedup for the 109 documents already marked embedded_at IS NOT NULL.
-- These docs have 2x duplicate chunk rows (same document_id + chunk_index, different id).
-- Keeps earliest-inserted row per (document_id, chunk_index) via DISTINCT ON.
-- Does NOT touch the documents table.
-- Run before full backfill so the already-embedded set is clean.

BEGIN;

-- PRE-DEDUP counts
SELECT 'PRE-DEDUP' AS phase,
       COUNT(*) AS total_chunks,
       COUNT(DISTINCT (document_id, chunk_index)) AS expected_chunks
FROM document_chunks
WHERE document_id IN (SELECT id FROM documents WHERE embedded_at IS NOT NULL);

-- Delete duplicate chunks: keep earliest (created_at, id) per (document_id, chunk_index)
WITH chunks_to_keep AS (
  SELECT DISTINCT ON (document_id, chunk_index) id AS keep_id
  FROM document_chunks
  WHERE document_id IN (SELECT id FROM documents WHERE embedded_at IS NOT NULL)
  ORDER BY document_id, chunk_index, created_at, id
)
DELETE FROM document_chunks
WHERE document_id IN (SELECT id FROM documents WHERE embedded_at IS NOT NULL)
  AND id NOT IN (SELECT keep_id FROM chunks_to_keep);

-- POST-DEDUP counts (total_chunks should now equal expected_chunks)
SELECT 'POST-DEDUP' AS phase,
       COUNT(*) AS total_chunks,
       COUNT(DISTINCT (document_id, chunk_index)) AS expected_chunks
FROM document_chunks
WHERE document_id IN (SELECT id FROM documents WHERE embedded_at IS NOT NULL);

-- Verification: must return ZERO rows before proceeding to backfill
-- Any rows here = docs that still have duplicate chunk_index values
SELECT document_id, COUNT(*) AS total, COUNT(DISTINCT chunk_index) AS distinct_idx
FROM document_chunks
WHERE document_id IN (SELECT id FROM documents WHERE embedded_at IS NOT NULL)
GROUP BY document_id
HAVING COUNT(*) != COUNT(DISTINCT chunk_index);

COMMIT;
