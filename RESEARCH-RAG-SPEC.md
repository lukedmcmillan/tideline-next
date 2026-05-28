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

Every document carries a `source_type` (GOVERNMENT / NGO / ACADEMIC / PRESS, reused from `divergences`) AND a derived `source_tier` (PRIMARY / SECONDARY). The UI filter is multi-select over `source_type`; PRIMARY/SECONDARY is derived from it plus the per-document classification.

### Classification method (both, in order)
1. **Domain allowlist first (deterministic).** Maintained list maps source domain → tier and type.
   - PRIMARY / GOVERNMENT: isa.org.jm, imo.org, un.org, eur-lex.europa.eu, fao.org, ospar.org, cbd.int, wto.org, gov.uk, *.gov, treaty bodies, regulator filings.
   - SECONDARY / PRESS: reuters.com, apnews.com, bloomberg.com, news outlets.
   - NGO / ACADEMIC: tier depends on document role (see edge case below).
2. **Haiku for unknowns.** Any document whose domain is not on the allowlist is classified by a single Haiku call at ingest, returning `{source_type, source_tier, confidence}`. Haiku classifications with confidence < 0.7 are flagged for manual review (reuse the existing library review-queue pattern). This threshold is normative; Section 9 Step 1 references it but does not override it.

### The edge case experts will notice
An NGO *position statement* is a PRIMARY source for that NGO's stated view, even though the NGO is a SECONDARY source on the underlying event. v1 uses a fixed document-level tier (simple, shippable). v2 may add query-relative tiering. Document this limitation on the Research page the same way Pulse Score failure modes are documented — honesty is the brand.

### Filtering behaviour
- The `source_type` multi-select constrains retrieval BEFORE the vector search (a SQL `WHERE source_type = ANY(...)` on the joined `documents` row), so relevance scores are computed only within the chosen scope.
- Default: all types selected. Narrowing is the user's deliberate act.
- When a filter starves retrieval (triggers the abstention gate), say so explicitly: "Primary GOVERNMENT sources only: 3 passages found, below the reliability threshold. Widen the source filter or broaden the question."
- The retrieval transparency strip always shows scope honestly: "412 of 847 documents match your source filter."

---

## 4. DATA MODEL

### 4.1 Columns to add/confirm on `documents`
```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_type text;   -- GOVERNMENT|NGO|ACADEMIC|PRESS
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_tier text;   -- PRIMARY|SECONDARY
ALTER TABLE documents ADD COLUMN IF NOT EXISTS source_domain text; -- for allowlist matching
ALTER TABLE documents ADD COLUMN IF NOT EXISTS classified_at timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS classify_confidence numeric(3,2);
-- embedding column exists but is currently vector(768) (Jina jina-embeddings-v2-base-en).
-- Step 2 must include the approved migration to alter it to vector(1536) to match
-- OpenAI text-embedding-3-small. See Section 10 dimension-migration note.
```

### 4.2 `document_chunks` (table exists, currently empty — populate)
```sql
-- Confirm shape; spec assumes:
-- id uuid pk, document_id uuid fk -> documents(id),
-- chunk_index int, chunk_text text,
-- embedding vector(768) currently → vector(1536) after dimension migration, created_at timestamptz default now()
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
This table also powers the "Recent research" UI and gives you the audit trail to prove reliability later.

*Note: `tracker_tag` is intentionally absent from this table. Tracker tags are source-level metadata displayed on cited source cards; they are not a retrieval filter. The three active filters are `source_types`, `date_from`/`date_to`, and `scope`.*

---

## 5. PIPELINE — END TO END

```
query + filters
  │
  ├─1 EMBED query (text-embedding-3-small, 1536-d)
  │
  ├─2 RETRIEVE: pgvector cosine search on document_chunks,
  │     pre-filtered by source_type[], date range, scope.
  │     Return top-K (K=25) with similarity scores + parent doc metadata
  │     (including tracker_tag as display metadata only, not as filter).
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

- **Retrieval transparency strip:** documents-in-scope → passages retrieved (with similarity floor) → sources cited → latency. Numbers come from the pipeline, not hardcoded.
- **Filters (locked — three only):**
  1. **Source-type multi-select:** GOVERNMENT / NGO / ACADEMIC / PRESS. Shows live in-scope count. PRIMARY/SECONDARY derivable as a quick toggle layered on top.
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

### Step 1 — Source classification backfill
```
/sc:task "Classify source_type and source_tier for every row in documents.
See RESEARCH-RAG-SPEC.md Section 3. Method: domain allowlist first
(deterministic), then a single Haiku call for any domain not on the
allowlist, returning {source_type, source_tier, confidence}. Add columns
per Section 4.1. Low-confidence (<0.7) rows flagged for review queue.
Backfill script, not a cron. Show progress every 100 docs. This writes to
documents — propose the plan before running (CLAUDE-RULES.md plan-mode zone)."
```

### Step 2 — Embedding + chunking backfill
```
/sc:task "Chunk and embed all documents into document_chunks per
RESEARCH-RAG-SPEC.md Section 4.2. ~500-800 token chunks with overlap,
text-embedding-3-small (1536-d). Populate embedding column. Create the
pgvector index (confirm hnsw vs ivfflat against the Supabase pgvector
version first). Backfill script. Progress every 100 docs. Resumable if it
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

**OpenAI `text-embedding-3-small`, 1536 dimensions.** This is the locked choice. No alternatives are in scope.

**Dimension migration required.** The existing `document_chunks.embedding` column is currently `vector(768)` (Jina `jina-embeddings-v2-base-en`, used for story_chunks and previously for document_chunks). Switching to OpenAI 1536-d requires an explicit, approved migration before Step 2:
```sql
-- Run ONLY after backups confirmed and 0 chunks in document_chunks (currently true)
ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(1536);
ALTER TABLE documents ALTER COLUMN embedding TYPE vector(1536);
-- Drop and recreate the ivfflat index (or switch to hnsw if confirmed available)
DROP INDEX IF EXISTS idx_document_chunks_embedding;
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- Rewrite the match_document_chunks and match_library_documents RPCs to use vector(1536)
```
This migration is safe now because `document_chunks` is empty (0 rows) and `documents.embedding` has never been populated (7,698 rows, all NULL). No data loss. The old dimension was 768; the new dimension is 1536.

Confirm the OpenAI API key is present in `.env.local` and budgeted before running Step 2.

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
