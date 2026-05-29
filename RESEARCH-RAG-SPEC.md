# TIDELINE RESEARCH — RAG & RELIABILITY SPECIFICATION
## Cited answers over the document library
*Tideline Ocean Intelligence · v1 · May 2026*
*This document is the source of truth for the Research engine: retrieval, generation, citation, verification, and source-type filtering. Implementation must match this spec. Deviations require updating this file first. Cross-references: TIDELINE-CONTEXT.md (Priority 3), DIVERGENCE_DETECTION_SPEC.md (source_type, non-adjudication principle), BRIEF-LEAD-SPEC.md (verification-over-trust principle), CLAUDE-RULES.md (plan-mode zones).*

---

## 0. THE GOVERNING PRINCIPLE (READ FIRST)

This is the same lesson `BRIEF-LEAD-SPEC.md` already proved: **every fix that relied on the model choosing the right thing drifted; every fix that made the wrong thing structurally impossible held.**

Applied to Research: we do not make the answer reliable by trusting Claude to be accurate. We make it reliable by constraining what the model is allowed to use as input, requiring a citation for every claim, and verifying every claim against its cited source after generation. Accuracy is a property of the pipeline, not the model.

A wrong cited answer is fatal to a £99/month professional tool. A "the library does not cover this" answer is not. **Abstention is always preferable to fabrication.**

---

## 1. WHAT RESEARCH IS

A closed-book retrieval-augmented question-answering system over Tideline's curated document library (7,698 primary and secondary sources as of 2026-05-28; the live counter at `/api/research/library-stats` is the source of truth as the library grows nightly). A subscriber asks a question; the system retrieves the most relevant passages from the library, and Claude writes a cited answer drawn ONLY from those passages.

**What it is NOT:**
- Not open-web search. It answers only from documents Tideline has ingested and embedded.
- Not a chatbot that reasons from training knowledge. The model's own knowledge is forbidden as a source.
- Not an adjudicator. Where sources disagree, it reports the disagreement and cites both (same principle as Divergence Detection). It does not decide who is right.

**The locked promise (UI subline):**
> "We don't search the internet. We search the library we built."

---

## 2. THE FIVE RELIABILITY MECHANISMS

These are layered. Each removes a specific failure mode. None is optional in v1.

| # | Mechanism | Failure mode it removes |
|---|---|---|
| 1 | Closed-book grounding | Model invents facts from training knowledge |
| 2 | Mandatory per-claim citation | Unattributed (and likely fabricated) claims |
| 3 | Citation verification (deterministic) | Citations pointing to chunks that were never retrieved |
| 4 | Faithfulness check (Haiku pass) | Real citation, but answer misstates what the source says |
| 5 | Abstention gate | Answer generated when grounding is too weak to support one |

### Mechanism 1 — Closed-book grounding
The synthesis system prompt forbids outside knowledge. Permitted input is the retrieved passage set only. If the passages do not contain the answer, the model must say so. (Exact prompt in Section 6.)

### Mechanism 2 — Mandatory per-claim citation
Every factual sentence in the answer must end with one or more citation markers `[n]` referencing a retrieved chunk by its retrieval-set index. Sentences that state no fact (framing, transitions) are exempt. The model is instructed that any factual claim it cannot cite must be omitted, not written.

### Mechanism 3 — Citation verification (deterministic, zero-model)
After generation, parse every `[n]` marker. Assert each `n` exists in the retrieval set actually sent to the model. Any marker referencing an out-of-range or non-existent index → the claim is stripped and logged. This is a pure code check, same spirit as the brief's pre-send equality check. The system structurally cannot ship a citation to a source it did not retrieve.

### Mechanism 4 — Faithfulness check (one Haiku call per answer)
Send each cited claim plus its cited chunk text to Haiku: "Does this source passage support this claim? Answer SUPPORTED / PARTIAL / UNSUPPORTED." Claims scored UNSUPPORTED are stripped. PARTIAL claims are kept but flagged for the reliability log. This catches the subtle, dangerous case where a genuine source is cited but the answer overstates or distorts it. Cost: ~1 cheap call per answer (batched), acceptable for the reliability gain.

### Mechanism 5 — Abstention gate
Before generation, check retrieval quality:
- If top chunk similarity < `ABSTAIN_THRESHOLD` (start 0.72, tune), OR
- Fewer than `MIN_CHUNKS` (start 3) chunks above `RETRIEVE_THRESHOLD` (start 0.78)

→ Do not generate a synthesised answer. Return the abstention response: "The library does not contain enough on this to answer reliably," plus the nearest few documents found, so the user can judge for themselves. Never pad a thin answer.

---

## 3. SOURCE CLASSIFICATION — PRIMARY VS SECONDARY

Every document carries a `source_tier` (PRIMARY / SECONDARY) and an optional `source_type` metadata tag (GOVERNMENT / NGO / ACADEMIC / PRESS).

**`source_tier` is the user-facing retrieval filter.** Derived directly from `is_primary_source` (fully populated across all 7,698 documents): `true → PRIMARY`, `false → SECONDARY`. This matches how legal and ESG users think: primary record vs reporting layer.

**`source_type` is display metadata only** — shown on source cards and hover citations. It is NOT a retrieval filter. Populated deterministically where unambiguous via an org/domain allowlist (maintained in `scripts/classify-documents.ts`). `NULL` is acceptable for any document not matched by a deterministic rule. No Haiku pass; ambiguous sources remain `NULL` and are flagged `needs_review = true` for future editorial review.

### Classification method
1. **`source_tier`:** `is_primary_source ? 'PRIMARY' : 'SECONDARY'`. No other logic.
2. **`source_type`:** Domain allowlist → org exact set → org keyword patterns → NULL.
   Priority: `doctype:scientific_paper` → domain allowlist → NGO exact → GOVERNMENT exact → GOVERNMENT keyword patterns → ACADEMIC exact → NULL.
   Rule applied is recorded in `documents.rule_applied` for audit. No confidence threshold — no model inference in this pipeline.

### The edge case experts will notice
An NGO *position statement* is a PRIMARY source for that NGO's stated view, even though the NGO is a SECONDARY source on the underlying event. v1 uses a fixed document-level `source_tier` from `is_primary_source`. v2 may add query-relative tiering. Document this limitation on the Research page the same way Pulse Score failure modes are documented — honesty is the brand.

### Filtering behaviour
- The `source_tier` filter constrains retrieval BEFORE the vector search (a SQL `WHERE source_tier = ANY(...)` on the joined `documents` row), so relevance scores are computed only within the chosen scope.
- Default: both tiers selected. Narrowing to PRIMARY only is the user's deliberate act.
- When a filter starves retrieval (triggers the abstention gate), say so explicitly: "Primary sources only: 3 passages found, below the reliability threshold. Widen the source filter or broaden the question."
- The retrieval transparency strip always shows scope honestly: "412 of 847 documents match your source filter."

---

## 4. DATA MODEL

### 4.0 Two-pool retrieval architecture

| Pool | Table | Contents | RPCs |
|---|---|---|---|
| Library | `document_chunks` | All ingested documents (7,698+) | `match_document_chunks` (unfiltered), `match_primary_chunks` (primary filter) |
| Stories | `story_chunks` | RSS/scraped article chunks | `match_story_chunks` |

**Primary/secondary is a JOIN filter, not a separate pool.**
`match_primary_chunks` is a convenience RPC over the same `document_chunks`
data with a JOIN on `documents.is_primary_source = true`. No separate
primary-only table exists.

**RPCs return minimal columns** (`chunk_index`, `chunk_text`, `document_id`,
`similarity`). Metadata hydration (title, source_organisation, url,
source_type, source_tier, tracker_tag) is a separate `SELECT` on `documents`
after the RPC call. This is the correct pattern — matches `brief-reply`.

### 4.1 Columns to add/confirm on `documents`
```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_type text;   -- GOVERNMENT|NGO|ACADEMIC|PRESS
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_tier text;   -- PRIMARY|SECONDARY
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_domain text; -- for allowlist matching
ALTER TABLE documents ADD COLUMN IF NOT EXISTS classified_at timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS classify_confidence numeric(3,2);
-- embedding vector(768) — Jina jina-embeddings-v2-base-en. No migration needed.
```

### 4.2 `document_chunks` (table exists, currently empty — populate)
```sql
-- Confirm shape; spec assumes:
-- id uuid pk, document_id uuid fk -> documents(id),
-- id uuid pk, document_id uuid fk -> documents(id),
-- chunk_index int, chunk_text text,
-- embedding vector(768), created_at timestamptz default now()
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_id);
```
*Note: `ivfflat` needs `ANALYZE` after backfill. For <100k chunks, `hnsw` is the better index if available — confirm pgvector version in Supabase before choosing.*

### 4.3 `research_queries` (new — history + audit + Mechanism 5 logging)
```sql
CREATE TABLE IF NOT EXISTS research_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  query text NOT NULL,
  source_surface text NOT NULL DEFAULT 'standalone_research',
                              -- 'brief_reply' | 'workspace_ask' | 'standalone_research' | 'projects_ask'
  project_id uuid,            -- nullable; populated when source_surface = 'projects_ask'
  source_types text[],            -- filter applied (GOVERNMENT|NGO|ACADEMIC|PRESS)
  date_from date, date_to date,   -- filter applied
  scope text,                     -- 'all_library' | 'my_uploads'
  chunks_retrieved int,
  chunks_cited int,
  abstained boolean DEFAULT false,
  faithfulness_stripped int DEFAULT 0,  -- claims removed by Mechanism 4
  answer text,
  cited_chunk_ids uuid[],
  latency_ms int,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_research_user ON research_queries(user_id, created_at DESC);
```
This table powers the "Recent research" UI and the audit trail.
`source_surface` enables per-surface analytics (abstention rates,
faithfulness-strip counts broken down by surface). `project_id` links
to the `projects` table for workspace project query history.

*Note: `tracker_tag` is intentionally absent from this table. Tracker tags are source-level metadata displayed on cited source cards; they are not a retrieval filter. The three active filters are `source_types`, `date_from`/`date_to`, and `scope`.*

---

## 5. PIPELINE — END TO END

```
query + filters
  │
  ├─1 EMBED query (Jina jina-embeddings-v2-base-en, 768-d)
  │
  ├─2 RETRIEVE (three modes, controlled by `primaryFilter` parameter):
  │
  │     ALL — match_document_chunks (unfiltered) + optionally match_story_chunks.
  │           Pre-filter: date range, scope. Top-K=25.
  │           Default for: workspace_ask, projects_ask.
  │
  │     PRIMARY_ONLY — match_document_chunks JOIN documents.is_primary_source = true.
  │                    Same date/scope pre-filter. Top-K=25.
  │                    Default for: standalone_research. User-toggleable to ALL.
  │
  │     PRIMARY_BOOST — dual query (brief-reply production values):
  │                     (a) full library at retrieval threshold 0.65, top-K=15
  │                     (b) primary-only at retrieval threshold 0.62, top-K=10
  │                     Merge + deduplicate by chunk_id. Chunks appearing
  │                     only in pass (b) receive a rank boost.
  │                     Default for: brief_reply.
  │
  │     All modes: return up to K=25 merged chunks with similarity scores.
  │     Metadata hydration (title, source_organisation, url, source_type,
  │     source_tier, tracker_tag) via separate JOIN on documents after RPC.
  │     source_type and tracker_tag are display metadata only — not filters.
  │
  ├─3 ABSTENTION GATE (Mechanism 5):
  │     if best_sim < 0.72 or chunks_above_0.78 < 3 → return abstention. STOP.
  │
  ├─4 RERANK (optional v1.1): keep top-N (N=10) after a cheaper rerank pass.
  │
  ├─5 SYNTHESISE (Sonnet, closed-book prompt, Mechanisms 1+2):
  │     answer with mandatory [n] citations, n = retrieval-set index.
  │
  ├─6 CITATION VERIFY (Mechanism 3, deterministic):
  │     strip any [n] not in retrieval set; log.
  │
  ├─7 FAITHFULNESS (Mechanism 4, one batched Haiku call):
  │     per cited claim vs its chunk → SUPPORTED/PARTIAL/UNSUPPORTED.
  │     strip UNSUPPORTED; flag PARTIAL.
  │
  ├─8 DIVERGENCE OVERLAY: if cited sources include a known active
  │     divergence pair (join to divergences table), surface the
  │     honesty banner. Report the conflict; do not resolve it.
  │
  └─9 RETURN: answer, cited sources (with type/tier/date/tracker_tag/similarity),
        retrieval funnel numbers, abstention/strip counts.
        Persist to research_queries.
```

### 5.1 `lib/research.ts` function contract

```typescript
type PrimaryFilter = 'all' | 'primary-only' | 'primary-boost';

interface ResearchOptions {
  query: string;
  primaryFilter?: PrimaryFilter;      // default: 'primary-only'
  dateFrom?: string;
  dateTo?: string;
  scope?: 'all_library' | 'my_uploads';
  sourceSurface: 'brief_reply' | 'workspace_ask' | 'standalone_research' | 'projects_ask';
  projectContext?: {
    projectId: string;
    trackerTags?: string[];
    // attachedDocumentIds: deferred — depends on project_documents schema not yet designed
  };
}
```

`projectContext` is optional. When present (`projects_ask` surface), chunks
whose parent document has a `tracker_tag` matching any value in
`projectContext.trackerTags` have their similarity score **multiplied by 1.2**
before sorting and the abstention gate. The embedding search is unchanged.

`attachedDocumentIds` is intentionally absent. It depends on a
`project_documents` join table schema not yet designed. The contract will be
extended in a separate spec update when that schema is built.

---

## 6. THE SYNTHESIS PROMPT (closed-book, citation-forced)

```
You are Tideline Research. You answer ONLY from the numbered source passages
provided below. You may not use any knowledge outside these passages.

RULES:
- Every factual claim must end with a citation [n] referencing the source
  passage number that supports it. Multiple: [2][5].
- If a claim cannot be supported by a provided passage, DO NOT write it.
- If the passages do not answer the question, say exactly: "The provided
  sources do not contain enough information to answer this reliably."
- When passages disagree, present both positions and cite each. Do not decide
  which is correct. State that the sources diverge.
- No outside facts. No dates, numbers, names, or events not in the passages.
- British English. No em dashes (use a colon or full stop). Plain, precise,
  professional register. No hedging filler.

SOURCE PASSAGES:
[1] {source_name} ({source_type}, {date}): {chunk_text}
[2] ...

QUESTION: {query}

Write the answer now. Citations are mandatory on every factual sentence.
```

The delta-verb/constraint discipline from BRIEF-LEAD-SPEC applies in spirit: the constraint (cite or omit) makes the unsupported claim structurally hard to write, rather than relying on the model's goodwill.

---

## 7. FAITHFULNESS PROMPT (Haiku, batched)

```
For each claim, decide whether the SOURCE supports it.
Return JSON array only: [{"id":1,"verdict":"SUPPORTED|PARTIAL|UNSUPPORTED"}]

CLAIM 1: "{claim_text}"  SOURCE: "{cited_chunk_text}"
CLAIM 2: ...
```
SUPPORTED → keep. PARTIAL → keep, increment `faithfulness_stripped` is NOT incremented (it is flagged only). UNSUPPORTED → strip the claim, increment counter, log chunk + claim for review.

---

## 8. UI CONTRACT (what the frontend renders, already prototyped)

### Per-surface defaults

| Surface | `primaryFilter` default | User-toggleable? | `projectContext`? |
|---|---|---|---|
| `brief_reply` | `'primary-boost'` | No (pipeline fixed) | No |
| `workspace_ask` | `'all'` | No | No |
| `standalone_research` | `'primary-only'` | Yes → `'all'` | No |
| `projects_ask` | `'all'` | No | Yes |

- **Retrieval transparency strip:** documents-in-scope → passages retrieved (with similarity floor) → sources cited → latency. Numbers come from the pipeline, not hardcoded.
- **Filters (locked — three only):**
  1. **Source-tier multi-select:** PRIMARY / SECONDARY. Shows live in-scope count. (`source_type` tag — GOVERNMENT / NGO / ACADEMIC / PRESS — is display metadata on each cited source card, not a filter.)
  2. **Date range:** `date_from` / `date_to` applied as a pre-retrieval SQL filter on `documents.created_at` (or publication date if available).
  3. **Scope toggle:** all library / my uploads only.
  - No other retrieval filters. `tracker_tag` is not a filter; it is display metadata on cited source cards only.
- **Per-claim citations:** hoverable, showing source name, type, tier, date, tracker tag, similarity %, and one-click to the original document.
- **Sources-consulted rail (dedicated mode):** all cited sources, sorted by similarity, with relevance bars.
- **Honesty banner:** fires on divergence overlay. Reports contradiction, does not adjudicate.
- **Abstention state:** clean, non-embarrassing. "The library does not cover this reliably" + nearest documents found.

---

## 9. BUILD SEQUENCE (PASTE INTO CLAUDE CODE)

Session opener first (per SUPERCLAUDE-COMMANDS.md), then:

### Step 1 — Source classification backfill ✓ COMPLETE (2026-05-29)
Migration: `supabase/migrations/20260529_documents_source_classification.sql`
Script: `scripts/classify-documents.ts` (deterministic, zero API cost)
- `source_tier` = `is_primary_source ? 'PRIMARY' : 'SECONDARY'` (all 7,698 docs)
- `source_type` = deterministic allowlist (NULL acceptable; flagged `needs_review`)
- `rule_applied` audit column populated on every row

### Step 2 — Embedding + chunking backfill
```
/sc:task "Chunk and embed all documents into document_chunks per
RESEARCH-RAG-SPEC.md Section 4.2. ~500-800 token chunks with overlap,
Jina jina-embeddings-v2-base-en (768-d) — reuse the existing embed-documents
cron logic and JINA_API_KEY. Confirm Jina embedding endpoint is reachable
before starting. Populate embedding vector(768) column. Create the ivfflat
index per Section 4.2. Backfill script. Progress every 100 docs. Resumable if it
dies partway. Plan-mode: this writes to document_chunks."
```

### Step 3 — Retrieval + reliability library
```
/sc:implement "lib/research.ts implementing the pipeline in
RESEARCH-RAG-SPEC.md Section 5. Functions: embedQuery, retrieveChunks
(with source_type/date/scope pre-filter — no tracker_tag filter),
abstentionGate, synthesise (closed-book prompt Section 6),
verifyCitations (deterministic, Section 5 step 6), checkFaithfulness
(Haiku, Section 7), assembleResponse. Return type includes funnel counts
and strip counts. Do NOT skip the abstention gate or citation verification."
```

### Step 4 — The endpoint
```
/sc:implement "app/api/research/ask/route.ts. Auth required. Calls
lib/research.ts pipeline. Persists to research_queries (Section 4.3).
Returns answer, cited sources with metadata, retrieval funnel, abstention
and faithfulness-strip counts. Streams the answer if feasible; metadata
after. Reference RESEARCH-RAG-SPEC.md."
```

### Step 5 — Library stats endpoint
```
/sc:implement "app/api/research/library-stats/route.ts per
RESEARCH-RAG-SPEC.md Section 13. Auth required. Cache-Control: max-age=300,
stale-while-revalidate=600. Returns {total, new_this_week}."
```

### Step 6 — Wire the prototype UI to the endpoint
```
/sc:implement "Wire the Research page to /api/research/ask and
/api/research/library-stats. Retrieval strip, citations, source-type
multi-select filter, date range, scope toggle, sources rail, honesty
banner, abstention state all driven by real response fields per
RESEARCH-RAG-SPEC.md Section 8. No hardcoded numbers. Three filters only:
source-type, date range, scope. No tracker_tag filter."
```

### Step 7 — Verify (CLAUDE-RULES.md Rule 4)
```
/sc:analyze lib/research.ts app/api/research/ask/route.ts
/sc:test
```
Prove: (a) a question with strong coverage returns a cited answer; (b) a
nonsense/out-of-scope question abstains; (c) a citation to a non-retrieved
chunk is stripped; (d) an unsupported claim is stripped by faithfulness;
(e) source filter changes the in-scope count and the retrieved set.

---

## 10. EMBEDDINGS PROVIDER (LOCKED)

**Jina `jina-embeddings-v2-base-en`, 768 dimensions.** This is the locked choice for v1. Reasons:

- Matches the existing `vector(768)` columns on both `documents` and `document_chunks` — no migration needed.
- All `match_*` RPC functions (`match_document_chunks`, `match_library_documents`, `match_primary_chunks`, `match_story_chunks`) already declare `query_embedding vector(768)`.
- The `embed-documents` cron and `scripts/embed-documents.ts` already use this model and the `JINA_API_KEY` is in production.
- `PROJECT_INDEX.md` flags this model with "do not change" — a deliberate past decision on quality and cost grounds, confirmed.

OpenAI `text-embedding-3-small` (1536-d) is a deferred future optimisation, reconsidered post-launch with retention data, requiring a full re-embed and column/RPC migration — not a v1 dependency.

Confirm the existing Jina embedding setup is reachable (`JINA_API_KEY` in `.env.local`) before running Step 2.

---

## 11. COST AND LATENCY ENVELOPE (rough, per query)

- 1 embedding call (query) — negligible.
- 1 Sonnet synthesis call — the main cost.
- 1 Haiku faithfulness call (batched) — cheap.
- pgvector search — single-digit ms at this corpus size.
Target end-to-end: 2-4s. The faithfulness pass adds ~0.5-1s and is worth it.
Backfill (Steps 1-2) is a one-time cost: 7,698 docs of embeddings + classification.

---

## 12. THINGS TO NEVER DO ON THIS FEATURE

- Never let the model answer from training knowledge. Closed-book only.
- Never ship a claim without a verified citation.
- Never pad a thin retrieval into a confident answer. Abstain instead.
- Never adjudicate a source conflict. Report it, cite both (Divergence principle).
- Never hardcode the funnel numbers in the UI. They are reliability claims.
- Never hide the source filter's effect. Show in-scope counts honestly.
- Never add `tracker_tag` as a retrieval filter. It is display metadata only.
- No em dashes, no blue, no solid badges (standard Tideline rules).

---

## 13. LIVE LIBRARY COUNTER

A lightweight stats endpoint provides the live document count shown on the Research landing page and anywhere a "library size" figure appears in the UI.

### Endpoint: `GET /api/research/library-stats`
- Auth: required
- Cache: `Cache-Control: max-age=300, stale-while-revalidate=600` (5-min fresh, 10-min stale)
- Response shape:
```json
{ "total": 2043, "new_this_week": 17 }
```

### Query:
```sql
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') AS new_this_week
FROM documents
WHERE status = 'approved';
```

### UI usage:
- "2,043 documents" — live count, rendered from this endpoint, never hardcoded.
- "+17 this week" delta badge (omit badge if `new_this_week = 0`).
- These are reliability claims subject to Section 12: never hardcode them.

### Build note:
This is Step 5 in the build sequence (Section 9). It is a standalone, zero-dependency endpoint — build it first if the landing page or Research header needs the counter before the full pipeline is live.

---

*Reliability is the product. The library is the moat. The citation is the proof.*
*Build after the UI is locked. Cross-references: TIDELINE-CONTEXT.md Priority 3,*
*DIVERGENCE_DETECTION_SPEC.md, BRIEF-LEAD-SPEC.md, CLAUDE-RULES.md.*
