# RAG / Embedding Pipeline — Diagnosis (May 2026)

## Status
Partially working. Two specific bugs identified. Fix path is clear but multi-session.

## What's working
- pgvector installed and operational
- Three vector tables (document_chunks, story_chunks, entities) all 768-dim, ivfflat indexed
- Three matching RPCs (match_document_chunks, match_story_chunks, match_entity_embeddings)
- /api/cron/embed-documents runs daily at 3am, completing successfully
- All chunks that exist have embeddings (100% coverage on what's chunked)
- /api/workspace/ask exists at 338 lines, calls match_document_chunks + match_story_chunks, deduplicates and scores results, streams Claude response with citations
- app/lib/query-expansion.ts provides query expansion, chunk scoring, deduplication
- 1,691 of 4,402 approved documents (38%) have chunks
- 2,316 of 2,619 stories (88%) have chunks
- 942 of 942 entities have embeddings

## What's broken

### Bug 1 — Duplicate chunk insertion
Of 85,947 total chunk rows, 28,337 are duplicates (33%). Maximum duplication factor is 10x for a single chunk. The cron's idempotency check is failing for some documents — they get re-chunked and re-inserted on subsequent runs.

Fix scope:
- Identify and patch the idempotency check in app/api/cron/embed-documents/route.ts
- Run a one-time DELETE to dedupe existing chunk_text collisions, keeping one row per (document_id, chunk_index, chunk_text) triple
- Estimated effort: 1-2 hours

Sample dedup query for the fix session (do not run today):
```sql
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY document_id, chunk_index, chunk_text
    ORDER BY created_at ASC
  ) AS rn
  FROM document_chunks
)
DELETE FROM document_chunks WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
```

### Bug 2 — Tiny-PDF silent failure
2,711 of 4,402 approved documents have no chunks. Distribution shows tiny PDFs (<100KB) fail at 73%, suggesting image-only/scanned PDFs that unpdf cannot extract text from. Currently the cron silently skips these without marking the failure.

Fix scope:
- Add chunking_status column to documents: pending | success | failed_no_text | failed_error
- Update embed-documents cron to mark each document after attempting extraction
- Update workspace/ask to filter on chunking_status = 'success' for clarity (optional)
- Backfill chunking_status for the 2,711 currently-missing-chunks documents (mark as 'failed_no_text' or 'pending' depending on retry strategy)
- Estimated effort: 2-3 hours

### Bug 3 (cleanup) — Stale generate-embeddings cron
/api/cron/generate-embeddings runs daily at 1am, queries the dropped 'embeddings' table, fails silently. Delete route file and remove from vercel.json.
- Estimated effort: 5 minutes

### Bug 4 (cleanup) — Duplicate ask endpoints
app/api/ask/route.ts (61 lines) coexists with app/api/workspace/ask/route.ts (338 lines). Investigate callers, likely delete the short one.
- Estimated effort: 15 minutes

## What's missing (not bugs, just unbuilt)

### Workspace UI integration
The /api/workspace/ask endpoint exists but isn't wired into the workspace page. Users can't currently invoke RAG from the UI. The "Ask" panel exists in the FloatingDock but doesn't route to /api/workspace/ask.

Fix scope:
- Wire FloatingDock 'ask' panel to POST to /api/workspace/ask
- Render streamed response with citations in workspace
- Integrate citations into the existing buildCitationBlock pattern (so RAG citations land in the editor the same way drawer citations do)
- Estimated effort: 3-4 hours, but blocked by Bug 1 + Bug 2 fixes — shipping integration on top of duplicate-chunk data would degrade citation quality

### Entity embeddings unused
entities.embedding is populated (942/942) but workspace/ask never calls match_entity_embeddings. This is a v2 enhancement — entity-level context could improve answers like "what has X been doing recently?"

## Recommended sequence

1. Bug 3 + Bug 4 (cleanup, 20 min) — these are no-cost wins
2. Bug 1 (duplicates, 1-2 hrs) — needed before any quality-sensitive UX
3. Bug 2 (tiny PDFs, 2-3 hrs) — needed for library completeness
4. Workspace UI integration (3-4 hrs) — only after 1 and 2
5. Entity embedding integration (v2)

Total path to shippable workspace RAG: roughly 7-10 hours of focused work across 2-3 sessions.

## Data state at audit (2026-05-08)

| Metric | Value |
|---|---|
| total_documents | 4402 |
| approved_documents | 4402 |
| documents_with_embedding | 0 (column unused) |
| total_doc_chunks | 85,947 |
| embedded_doc_chunks | 85,947 |
| unique_chunk_signatures | 57,610 |
| duplicate_chunks | 6,024 (28,337 wasted rows) |
| approved_docs_no_chunks | 2,711 |
| total_story_chunks | 2,316 |
| embedded_story_chunks | 2,316 |
| total_stories | 2,619 |
| total_entities | 942 |
| embedded_entities | 942 |
| newest_chunk_created | 2026-05-08 03:02 |
| oldest_chunk_created | 2026-04-10 14:12 |

## Document chunking by file size
- Tiny (<100KB): 327 chunked / 861 not chunked (27% success)
- Small (100KB-1MB): 1161 / 1636 (41%)
- Medium (1-10MB): 191 / 195 (49%)
- Large (10-50MB): 12 / 19 (39%)
