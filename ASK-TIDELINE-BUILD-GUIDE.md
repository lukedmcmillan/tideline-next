# ASK TIDELINE — BUILD GUIDE
## Step-by-step, with every SuperClaude prompt, in order
*Tideline Ocean Intelligence · v1 · May 2026*
*Companion to RESEARCH-RAG-SPEC.md (the engineering source of truth, commit 00a4cd0). This is the operator's runbook: paste each block into Claude Code in sequence. Follows SUPERCLAUDE-COMMANDS.md conventions. Every prompt is pasteable without edits.*

---

## HOW TO USE THIS GUIDE

- Work top to bottom. Do not skip a step; later steps assume earlier ones ran.
- Each numbered step has: **what it does**, **the prompt to paste**, and **how to verify it worked** (CLAUDE-RULES.md Rule 4 — never mark done without proof).
- Steps that write to `documents`, `document_chunks`, or add crons are **plan-mode zones** (CLAUDE-RULES.md). The prompts already say "propose the plan first." Read the plan before you approve it.
- The front end is already built and locked (`ask-tideline.html`). It is the contract. The backend must produce the fields it renders. Step 5 ports it to React; Step 6 wires it to the live API.
- This is more than one session of work. Use `/sc:save` at the end of every session and the wrap-up prompt so context survives.

**Decisions already locked (do not reopen):**
- **Embeddings: Jina `jina-embeddings-v2-base-en`, 768-d** — matches existing columns and RPCs, "do not change" flag in PROJECT_INDEX.md, deliberate past quality/cost choice confirmed. OpenAI is a deferred post-launch optimisation, not a v1 dependency.
- Tagging: domain allowlist first, Haiku for unknowns; confidence < 0.7 flags for manual review.
- Reliability: full faithfulness pass in v1. All five mechanisms ship together — closed-book grounding, mandatory per-claim citation, citation verification, faithfulness check, abstention gate.
- UI: dedicated two-column, source-type multi-select + date + scope filters only. No tracker filter.
- Copy: "We don't search the internet. We search the library we built." Live counter, growing-nightly delta. No "actually read."
- Library size: 7,698 documents at point of writing, growing nightly. Live counter is the source of truth, not this number.

---

## SESSION OPENER (paste at the start of EVERY session)

```
Read CLAUDE.md, SUPERCLAUDE-COMMANDS.md, CLAUDE-RULES.md, and
RESEARCH-RAG-SPEC.md only. Run: git log --oneline -5. Tell me the last task
completed and which build step we are on. Do not read any other files. Do not
write any code. Wait for instructions.
```

Then, first command of every session:

```
/sc:index-repo
```

---

# PHASE 0 — DONE

Spec is on main (commit `00a4cd0`) and matches real infrastructure: 7,698 docs, `chunk_text` column, Jina 768-d locked, no migration needed. Read-only schema check done. Skip to Phase 1.

---

# PHASE 1 — DATA FOUNDATION

This phase makes the library searchable. It is the heaviest lifting and the prerequisite for everything. Two backfills, run once.

### Step 1 — Source classification (primary vs secondary)

**What it does:** adds source_type / source_tier / source_domain / needs_review columns, then tags every document — allowlist first, Haiku for the unknowns. This is what powers the source-type filter.

Plan-mode zone (writes to documents):

```
/sc:task "Source classification backfill across all 7,698 documents. Spec:
RESEARCH-RAG-SPEC.md Section 3 and 4.1. Step A: migration adding
source_type, source_tier, source_domain, classified_at, classify_confidence,
needs_review to documents (idempotent, IF NOT EXISTS). Step B: deterministic
pass — derive source_domain from each doc's canonical_url (existing column),
map via a maintained allowlist (isa.org.jm, imo.org, un.org,
eur-lex.europa.eu, fao.org, ospar.org, cbd.int, wto.org, *.gov =
PRIMARY/GOVERNMENT; reuters.com, apnews.com, bloomberg.com and known press
= SECONDARY/PRESS). Step C: Haiku pass for any domain not on the allowlist,
returning {source_type, source_tier, confidence}; confidence < 0.7 sets
needs_review = true (Section 3 normative threshold). Resumable, idempotent,
progress every 100 docs. Print a running cost estimate. This writes to
documents — PROPOSE THE PLAN AND THE COMPLETE ALLOWLIST FIRST, wait for
approval before running."
```

**Verify:**
```
SELECT source_tier, count(*) FROM documents GROUP BY source_tier;
SELECT source_type, count(*) FROM documents GROUP BY source_type;
SELECT count(*) FROM documents WHERE needs_review = true;
SELECT count(*) FROM documents WHERE source_tier IS NULL;  -- should be 0
```
Confirm totals add up to 7,698 and the splits look sane — you should see a substantial GOVERNMENT/PRIMARY block (ISA, IMO, UN, OSPAR, FAO scrapers feed this).

---

### Step 2 — Chunk and embed the whole library (Jina 768-d)

**What it does:** splits every document into passages and generates the vectors retrieval searches over. Reuses the existing Jina infrastructure — no new API key, no new provider, no column changes.

Confirm the existing Jina setup is reachable first (read-only):

```
/sc:troubleshoot "Confirm the existing Jina embedding setup is reachable
and working. Run a single test call against jina-embeddings-v2-base-en
using whatever credentials lib/embed-documents.ts / the embed-documents
cron already uses. Report dimension returned (expect 768) and that the
call succeeded. Do not embed anything else yet."
```

Then the backfill (plan-mode zone — writes to document_chunks):

```
/sc:task "Embedding + chunking backfill across all 7,698 documents. Spec:
RESEARCH-RAG-SPEC.md Section 4.2 and 5. Reuse the existing Jina embedding
infrastructure (lib/embed-documents.ts pattern, jina-embeddings-v2-base-en,
768-d). For every document with extractable text: chunk into 500-800 token
passages with ~80 token overlap, store in document_chunks (document_id,
chunk_index, chunk_text, embedding vector(768), created_at). The embedding
column is ALREADY vector(768) — no migration needed. Confirm the existing
pgvector index on document_chunks is healthy, or create ivfflat with
lists=100 + ANALYZE if absent. Must be RESUMABLE (skip docs already
chunked) and idempotent. Batch the Jina calls efficiently. Progress every
100 docs, running cost estimate, ETA. This writes to document_chunks —
PROPOSE THE PLAN FIRST including chunk-size rationale and expected total
chunk count, wait for approval."
```

**Verify:**
```
SELECT count(*) FROM document_chunks;                          -- tens of thousands expected
SELECT count(DISTINCT document_id) FROM document_chunks;       -- ~= 7,698
SELECT count(*) FROM document_chunks WHERE embedding IS NULL;  -- must be 0
```
Then a smoke test of similarity search:
```
/sc:troubleshoot "Run one test using the existing match_document_chunks
RPC: embed the string 'deep sea mining exploitation regulations' with
Jina and return the top 5 document_chunks by cosine similarity with their
similarity scores and parent document source_organisation. Confirm scores
are sensible (top result clearly on-topic). Read-only."
```

If the smoke test's top result isn't on-topic, **stop and diagnose before going further** — retrieval quality is the whole product.

---

# PHASE 2 — THE RELIABILITY ENGINE

This is the part that makes answers trustworthy. Build the library, then the endpoint. Do not shortcut the abstention gate, citation verification, or faithfulness pass — they are the product.

### Step 3 — The retrieval + reliability library

**What it does:** the whole pipeline as testable functions — retrieve, gate, synthesise closed-book, verify citations, faithfulness-check.

```
/sc:workflow "Plan lib/research.ts before building. Spec: RESEARCH-RAG-SPEC.md
Sections 5, 6, 7. Functions: embedQuery (uses Jina jina-embeddings-v2-base-en
768-d, reusing existing infrastructure — do NOT introduce OpenAI);
retrieveChunks(query, {sourceTypes, dateFrom, dateTo, scope}) with
source-type/date/scope pre-filter applied in SQL before vector search via the
existing match_document_chunks RPC (or a new RPC if pre-filtering requires
it); abstentionGate (Section 2 Mechanism 5: top sim < 0.72 OR < 3 chunks
above 0.78 → abstain); synthesise (closed-book prompt Section 6, mandatory
[n] citations); verifyCitations (deterministic — strip any [n] not in the
retrieval set); checkFaithfulness (one batched Haiku call, Section 7, strip
UNSUPPORTED, flag PARTIAL); assembleResponse (returns answer, cited sources
with full metadata, funnel counts, abstained flag, faithfulness_stripped
count, nearestDocs when abstained). Return the plan and the type signatures.
Do not write code yet."
```

After you approve the plan:

```
/sc:implement "Build lib/research.ts exactly as the approved plan and
RESEARCH-RAG-SPEC.md Sections 5-7. Do NOT omit the abstention gate, citation
verification, or the faithfulness pass — all three ship in v1. Closed-book
synthesis prompt verbatim from Section 6. Strongly typed return. No outside
knowledge permitted in the synthesis prompt. Jina for query embedding."
```

**Verify:**
```
/sc:test
```
And the behavioural check — demand it explicitly, do not skip:
```
/sc:troubleshoot "Prove lib/research.ts behaves. Run four cases and show
output: (1) a well-covered ISA question returns a cited answer; (2) a
nonsense out-of-scope question hits the abstention gate and returns no
synthesised answer; (3) inject a fake [99] citation into a draft and confirm
verifyCitations strips it; (4) feed a claim unsupported by its chunk and
confirm faithfulness marks it UNSUPPORTED and strips it. Read-only on the DB."
```

---

### Step 4 — The API endpoints

**What it does:** exposes the pipeline to the front end, plus the lightweight library-stats endpoint for the live counter.

```
/sc:implement "Build app/api/research/ask/route.ts. Auth required (Supabase).
Body: { query, sourceTypes[], dateFrom, dateTo, scope }. Calls lib/research.ts.
Persists every query to research_queries (RESEARCH-RAG-SPEC.md Section 4.3)
including funnel counts, abstained, faithfulness_stripped. Returns the full
response object the front end expects (Section 8): answer, citedSources[]
(name, type, tier, date, tracker_tag, url, similarity), funnel {inScope,
retrieved, cited, latencyMs}, abstained, nearestDocs[] (when abstained).
Stream the answer text if feasible, send metadata on completion. Reference
RESEARCH-RAG-SPEC.md."
```

Then the counter endpoint:

```
/sc:implement "Build app/api/research/library-stats/route.ts per
RESEARCH-RAG-SPEC.md Section 13. Returns { total, newThisWeek, searchable }
where total = count of documents, searchable = count of distinct document_id
in document_chunks (i.e. embedded), newThisWeek = count of documents with
created_at > now() - interval '7 days'. Cache 5 min via Cache-Control.
Public-safe (no document contents). This powers the live header counter —
numbers must be real reads, never hardcoded."
```

**Verify:**
```
/sc:troubleshoot "curl both new endpoints with a test session. For
/api/research/ask send a real ISA question and show the JSON shape matches
the front-end contract in RESEARCH-RAG-SPEC.md Section 8. For library-stats
confirm total/newThisWeek/searchable are real and match SELECT counts.
Read-only."
```

---

# PHASE 3 — THE FRONT END, FOR REAL

The HTML prototype is the design contract. Now port it into the app and wire it to the live endpoints.

### Step 5 — Port the prototype to a React page

```
/sc:implement "Port ask-tideline.html into the Next.js app as the Research
page at app/platform/(shell)/research/page.tsx plus components. Match the
prototype EXACTLY: light theme, dedicated two-column answer layout, live
library counter (count-up animation), source-type multi-select with live
in-scope count, date filter, all-library/my-uploads scope toggle, staged
loading sequence, cited answer with hoverable citation cards linked to the
source rail, honesty banner, and the abstention state. Use the locked
Tideline tokens. Keep all copy verbatim ('We don't search the internet. We
search the library we built.'). No tracker filter. Components only, no API
wiring yet — use the prototype's mock data so it renders. Follow
frontend-design skill and existing platform shell patterns."
```

**Verify:** page renders at `/platform/research`, all four states reachable (idle, loading, answer, abstain), mobile layout intact. Compare side by side with `ask-tideline.html`.

---

### Step 6 — Wire the front end to the live API

```
/sc:implement "Wire the Research page to the live endpoints. On submit, POST
to /api/research/ask with the active filters; render the staged loading
sequence while it runs; on response populate the cited answer, retrieval
funnel (real numbers), source rail, and honesty banner from real fields. On
abstained:true render the abstention state with real nearestDocs. Fetch
/api/research/library-stats on mount to drive the header counter and
new-this-week delta. NOTHING hardcoded — every number is a response field per
RESEARCH-RAG-SPEC.md Section 8. Handle loading and error states gracefully."
```

**Verify:**
```
/sc:troubleshoot "End-to-end check of the Research page against the live API.
Confirm: a covered question returns a real cited answer with working hover
cards; the source filter changes the in-scope count AND the retrieved set;
an out-of-scope question shows the abstention state; the header counter
matches library-stats. Report anything hardcoded that should be live."
```

---

### Step 7 — Wire the answer actions

```
/sc:implement "Wire the three answer-footer actions on the Research page.
'Add to workspace' attaches the answer + cited sources to a workspace project
using the existing project attachment pattern. 'Copy with citations' copies
the answer text with numbered source list. 'Export as brief' generates a
formatted output (reuse existing brief/PDF pattern if present, else markdown
download). 'Discard' clears the answer. Reference the existing workspace
attachment code; do not invent a new pattern."
```

**Verify:** each button does the real thing; "Add to workspace" produces a visible attachment in a test project.

---

# PHASE 4 — NIGHTLY HOOK & POLISH

### Step 8 — Auto-process new documents nightly

**What it does:** new scraper documents get classified, chunked, and embedded automatically, so the library (and the counter) grows on its own.

```
/sc:implement "Extend the nightly pipeline so new documents are made
searchable automatically. After the existing scraper ingestion cron, run:
classify (allowlist then Haiku) and chunk+embed any document that has no
chunks yet, reusing the existing Jina infrastructure. Share the backfill
logic from Steps 1-2 as common functions, do not duplicate. Idempotent —
only touches new/unprocessed docs. Add to vercel.json crons AFTER the
02:00 ingestion (e.g. 05:00 UTC). This adds a cron and writes to
documents/document_chunks — PROPOSE THE PLAN AND SCHEDULE FIRST."
```

**Verify:** run it manually once against a few freshly scraped docs; confirm they become searchable and library-stats `newThisWeek` rises.

---

### Step 9 — Reliability logging review & final analysis

```
/sc:analyze lib/research.ts app/api/research/ask/route.ts "Focus on:
closed-book prompt cannot leak outside knowledge; citation verification
cannot be bypassed; abstention gate fires correctly at the thresholds; RLS
on research_queries is correct; no PII or document contents leak via
library-stats; Supabase query efficiency on the vector search. Flag anything
that would embarrass a £99/month professional tool."
```

```
/sc:troubleshoot "Review research_queries data after testing. Report:
abstention rate, average chunks_cited, total faithfulness_stripped count,
and any queries where faithfulness_stripped > 2 (these are answers where
the model overreached — show them so we can tune the synthesis prompt)."
```

---

# END OF EVERY SESSION (mandatory — SUPERCLAUDE-COMMANDS.md)

```
/sc:save
```
```
/sc:implement "Update .claude/SPEC.md with what was completed this session,
new known issues, and the next build step. Update LESSONS.md with anything
new learned. Keep both concise."
```
```
/sc:git "commit and push"
```

---

# BUILD ORDER AT A GLANCE

| Phase | Step | What | Plan-mode? |
|---|---|---|---|
| 0 | — | DONE — spec on main, matches infrastructure | — |
| 1 | 1 | Source classification backfill | YES (writes documents) |
| 1 | 2 | Chunk + embed whole library (Jina 768-d) | YES (writes chunks) |
| 2 | 3 | lib/research.ts reliability engine | no (new file) |
| 2 | 4 | /api/research/ask + library-stats | no (new files) |
| 3 | 5 | Port prototype to React page | no |
| 3 | 6 | Wire front end to live API | no |
| 3 | 7 | Wire answer actions | no |
| 4 | 8 | Nightly auto-process new docs | YES (cron + writes) |
| 4 | 9 | Reliability analysis + tuning | no (read-only) |

**The critical path:** Steps 1 and 2 are the long pole (backfilling 7,698 docs through Jina). Everything else is fast once the library is searchable. Do Phase 1 first and let it run; you can build Phase 2 against partial data while embeddings finish.

---

# THE THREE THINGS THAT MUST NOT SLIP

1. **The reliability triad ships in v1.** Abstention gate + citation verification + faithfulness pass. Cutting any one turns a trustworthy tool into a plausible-sounding one. This is the whole product.
2. **No number is ever hardcoded.** The counter, the funnel, the in-scope count — all live reads. They are reliability claims, and a wrong one is worse than none.
3. **Abstention is a feature, not a failure.** "The library does not cover this" must always be available and must never embarrass the user. A tool that knows its limits is the one experts trust.

---

*Companion to RESEARCH-RAG-SPEC.md (commit 00a4cd0). Build the library, then the engine, then the face.*
*Reliability is the product. The library is the moat. The citation is the proof.*
