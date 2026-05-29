-- Deduplicate documents table before embedding backfill.
-- Duplicates are byte-identical files ingested more than once.
-- Dedup key: (title, file_size_bytes, published_date, source_organisation)
-- Strategy: keep lowest id per group (canonical), delete the rest.
-- document_chunks has ON DELETE CASCADE so orphaned chunks are removed automatically.
-- Wrapped in a transaction with pre/post counts for verification.

BEGIN;

-- PRE-COUNTS
DO $$
DECLARE
  v_total        int;
  v_dup_groups   int;
  v_dup_docs     int;
  v_embedded     int;
BEGIN
  SELECT COUNT(*) INTO v_total FROM documents WHERE status = 'approved';

  SELECT COUNT(*) INTO v_dup_groups
  FROM (
    SELECT title, file_size_bytes, published_date, source_organisation
    FROM documents
    WHERE status = 'approved'
      AND title IS NOT NULL
      AND file_size_bytes IS NOT NULL
    GROUP BY title, file_size_bytes, published_date, source_organisation
    HAVING COUNT(*) > 1
  ) g;

  SELECT COUNT(*) INTO v_dup_docs
  FROM documents d
  WHERE status = 'approved'
    AND title IS NOT NULL
    AND file_size_bytes IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM documents d2
      WHERE d2.id <> d.id
        AND d2.status = 'approved'
        AND d2.title = d.title
        AND d2.file_size_bytes = d.file_size_bytes
        AND (d2.published_date = d.published_date OR (d2.published_date IS NULL AND d.published_date IS NULL))
        AND (d2.source_organisation = d.source_organisation OR (d2.source_organisation IS NULL AND d.source_organisation IS NULL))
    );

  SELECT COUNT(*) INTO v_embedded
  FROM documents d
  WHERE status = 'approved'
    AND embedded_at IS NOT NULL
    AND title IS NOT NULL
    AND file_size_bytes IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM documents d2
      WHERE d2.id <> d.id
        AND d2.status = 'approved'
        AND d2.title = d.title
        AND d2.file_size_bytes = d.file_size_bytes
        AND (d2.published_date = d.published_date OR (d2.published_date IS NULL AND d.published_date IS NULL))
        AND (d2.source_organisation = d.source_organisation OR (d2.source_organisation IS NULL AND d.source_organisation IS NULL))
    );

  RAISE NOTICE 'PRE-DEDUP: total_approved=%, dup_groups=%, docs_in_dup_sets=%, already_embedded_dups=%',
    v_total, v_dup_groups, v_dup_docs, v_embedded;
END $$;

-- DELETE DUPLICATES: keep MIN(id) per (title, file_size_bytes, published_date, source_organisation)
DELETE FROM documents
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY
          title,
          file_size_bytes,
          published_date,
          source_organisation
        ORDER BY id ASC  -- lowest id = canonical
      ) AS rn
    FROM documents
    WHERE status = 'approved'
      AND title IS NOT NULL
      AND file_size_bytes IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- POST-COUNTS
DO $$
DECLARE
  v_total      int;
  v_remaining  int;
BEGIN
  SELECT COUNT(*) INTO v_total FROM documents WHERE status = 'approved';

  SELECT COUNT(*) INTO v_remaining
  FROM (
    SELECT title, file_size_bytes, published_date, source_organisation
    FROM documents
    WHERE status = 'approved'
      AND title IS NOT NULL
      AND file_size_bytes IS NOT NULL
    GROUP BY title, file_size_bytes, published_date, source_organisation
    HAVING COUNT(*) > 1
  ) g;

  RAISE NOTICE 'POST-DEDUP: total_approved=%, remaining_dup_groups=%', v_total, v_remaining;
  IF v_remaining > 0 THEN
    RAISE NOTICE 'WARNING: % duplicate groups still exist — check for nulls in dedup key columns', v_remaining;
  END IF;
END $$;

COMMIT;
