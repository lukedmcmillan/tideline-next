# ASK TIDELINE — BUILD GUIDE
## Step-by-step, with every SuperClaude prompt, in order
*Tideline Ocean Intelligence · v2 · May 2026*
*Companion to RESEARCH-RAG-SPEC.md (the engineering source of truth, commit 6b07f23). This is the operator's runbook: paste each block into Claude Code in sequence. Follows SUPERCLAUDE-COMMANDS.md conventions. Every prompt is pasteable without edits.*

---

## HOW TO USE THIS GUIDE

- Work top to bottom. Do not skip a step; later steps assume earlier ones ran.
- Each numbered step has: **what it does**, **the prompt to paste**, and **how to verify it worked** (CLAUDE-RULES.md Rule 4 — never mark done without proof).
- Steps that write to `documents`, `document_chunks`, `story_chunks`, or `research_queries` are **plan-mode zones** (CLAUDE-RULES.md). The prompts already say "propose the plan first." Read the plan before you approve it.
- Phase 3 is a migration, not a replacement. Each caller goes through its own verify-then-cut cycle. No big-bang switchover.
- Sessions, not days. Phase 3 (migration) imposes 24–48h verification gates between Steps 6–9. Phase 4 (new surfaces) is greenfield frontend work that can run in parallel after Step 5 passes. Plan sessions around what's unblocked, not phase numbers.
- This is more than one session of work. Use `/sc:save` at the end of every session and the wrap-up prompt so context survives.

**Decisions already locked (do not reopen):**
- **Embeddings: Jina `jina-embeddings-v2-base-en`, 768-d** — matches existing columns and RPCs, "do not change" flag in PROJECT_INDEX.md.
- Reliability: all five mechanisms ship together in v1. Closed-book grounding, mandatory per-claim citation, citation verification, faithfulness check, abstention gate.
- UI: dedicated two-column layout, source-tier toggle + date + scope filters only. No tracker filter.
- Copy: "We don't search the internet. We search the library we built." Live counter, growing-nightly delta.
- PRIMARY_BOOST thresholds: 0.65 / top-15 (full library), 0.62 / top-10 (primary-only) — brief-reply production values, locked until retrieval quality data supports a change.

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

Spec is on main (commit `6b07f23`) and matches real infrastructure: approximately 7,500 documents embedded (live counter on the Research page is the source of truth), `document_chunks` populated with ~368K chunks, Jina 768-d locked, source classification columns added. Skip to Phase 0.5.

---

# PHASE 0.5 — EXISTING IMPLEMENTATION AUDIT

**Read this before touching any Phase 2 or 3 work.**

### Current state of retrieval callers

There are **three live production callers** of retrieval logic, plus one orphaned endpoint to delete immediately:

| File | Status | Notes |
|---|---|---|
| `app/api/workspace/ask/route.ts` | **PRODUCTION** | 338 lines. Called by workspace page at 2 call sites. Full RAG with `expandQuery`, multi-strategy parallel search, `scoreChunk`, `deduplicateChunks`. Uses `jina-embeddings-v2-base-en` (correct model). No citation verification, no faithfulness check, no `projectContext`. |
| `app/lib/brief-reply.ts` | **PRODUCTION** | Duplicates workspace/ask retrieval logic via copy-pasted types. Uses `match_primary_chunks` + `match_document_chunks` dual-query — this is the PRIMARY_BOOST pattern. Called by the morning brief reply system. |
| `app/api/research/inline/route.ts` | **ORPHAN — DELETE NOW** | 127 lines. Zero callers. Uses `jina-embeddings-v3` (wrong model — incompatible with 768-d columns). Safe to delete immediately. |
| `app/platform/(shell)/workspace/page.tsx` | **PRODUCTION** | Two copy-pasted `ask` handler functions at approximately lines 491 and 1017. Both call `/api/workspace/ask`. |

### Migration strategy

**Phase 2 is a migration, not greenfield.** The new engine is built alongside the existing endpoint. Callers are migrated one at a time in Phase 3. The old endpoint is deleted only after 48 hours of stable operation across all migrated callers.

The strategy protects production at every step:
1. Delete orphan now (Step 0.5.2)
2. Build new engine alongside old one (Phase 2) — old endpoint untouched, production unaffected
3. Verify new engine with explicit pass criteria (Step 5) — gate for Phase 3
4. Migrate callers one at a time (Phase 3, Steps 6–8) — each verified before the next starts
5. Delete old endpoint only after 48h gate (Step 9)

---

### Step 0.5.2 — Delete research/inline immediately

**What it does:** removes the orphaned endpoint with the wrong model before it causes confusion in later steps.

```
/sc:troubleshoot "Confirm app/api/research/inline/route.ts has zero callers
anywhere in the codebase. Run git grep for every import, fetch call, or
string reference to 'research/inline'. If confirmed zero callers, delete the
file and verify the build is clean. Report: callers found (expect 0), file
deleted, build status."
```

**Verify:**
```bash
git grep "research/inline"   # must return 0 results
npm run build                # must pass clean
```

---

# PHASE 1 — DATA FOUNDATION

### Step 1 — Source classification backfill ✓ COMPLETE (2026-05-29)

Migration `supabase/migrations/20260529_documents_source_classification.sql` is applied. `source_tier`, `source_type`, `source_domain`, `needs_review` columns are populated across all approved documents via `scripts/classify-documents.ts`.

**Verify (read-only check):**
```sql
SELECT source_tier, count(*) FROM documents GROUP BY source_tier;
SELECT count(*) FROM documents WHERE source_tier IS NULL;  -- must be 0
```
If any `NULL` source_tier rows appear, re-run `scripts/classify-documents.ts` (idempotent).

---

### Step 2 — Story chunks backfill (document_chunks ✓ DONE — story_chunks remaining)

**Status:** `document_chunks` backfill is complete — approximately 7,500 documents embedded, ~368K chunks (live counter is the source of truth). This step covers stories only.

**What it does:** audits `scripts/embed-stories.ts` for the same three bugs fixed in `embed-documents.ts`, applies fixes, runs the story backfill, and wires stories into the nightly ingest.

The three known bugs to check for:
1. **Pagination cap** — PostgREST `max_rows` bypass requires explicit `.limit(PAGE)` alongside `.range()`.
2. **Text sanitization** — null bytes from content extraction break Postgres inserts; requires `sanitizeText()` stripping `\u0000` and `[\x00-\x08\x0B\x0C\x0E-\x1F]`.
3. **Success-counting** — `embedded_at` must only be set when `inserted === chunks.length`, not on partial or zero success.

```
/sc:troubleshoot "Audit scripts/embed-stories.ts for three specific bugs:
(1) Pagination: does the fetch loop use both .limit(PAGE) and .range(offset,
offset+PAGE-1)? If only .range() without .limit(), PostgREST caps at max_rows
(typically 1000) silently. (2) Text sanitization: is there a sanitizeText()
call stripping \\u0000 null bytes and control chars [\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]
before any Postgres insert? (3) Success counting: does embedded_at update only
fire when inserted === chunks.length, not on partial or zero success? Show the
relevant code sections for each check. Report: present or absent. Do not fix yet."
```

After audit (expect all three bugs present):

```
/sc:implement "Fix the three bugs in scripts/embed-stories.ts identified in
the audit: (1) add explicit .limit(PAGE) alongside .range(); (2) add
sanitizeText() stripping \\u0000, \\\\u0000, and [\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]
before any text is inserted; (3) make success logging three-way — set
embedded_at only when inserted === chunks.length, log PARTIAL when inserted > 0,
log FAILED when inserted = 0. Match the pattern in scripts/embed-documents.ts
exactly. Do not change chunking logic or embedding calls."
```

Run sample before full backfill (plan-mode zone — writes to `story_chunks`):

```
/sc:task "Run scripts/embed-stories.ts --sample=50 in foreground. Show output
including per-page fetch counts, any sanitization events, and OK/PARTIAL/FAILED
summary per story. Confirm the three bugs are fixed before proceeding to full
backfill. Do not run the full backfill yet."
```

After sample passes:

```
/sc:task "Run scripts/embed-stories.ts full backfill in foreground. Progress
every 100 stories. Report final totals: stories processed, chunks inserted,
errors logged to embedding_errors."
```

Wire into nightly ingest (plan-mode zone — modifies cron behaviour):

```
/sc:implement "Extend the appropriate ingestion cron (the one that runs after
story summarisation) to embed newly ingested stories into story_chunks after
summarisation completes. Reuse the embed-stories logic as a shared function —
do not copy-paste inline. Idempotent — skip stories with existing chunks.
PROPOSE THE EXTENSION PLAN FIRST, identifying which cron file to extend and
where the hook should be added. Wait for approval."
```

**Verify:**
```sql
SELECT count(*) FROM story_chunks;
SELECT count(DISTINCT story_id) FROM story_chunks;
SELECT count(*) FROM story_chunks WHERE embedding IS NULL;  -- must be 0
```

---

# PHASE 2 — THE UNIFIED ENGINE

Build the new engine alongside the existing endpoint. Nothing in production changes until Phase 3.

### Step 3 — Build lib/research.ts

**What it does:** implements the full research pipeline as a typed, testable module — the single engine all surfaces will call.

```
/sc:workflow "Plan lib/research.ts before building. Spec: RESEARCH-RAG-SPEC.md
Sections 5, 5.1, 6, 7. Implement the ResearchOptions interface from Section 5.1
exactly: query, primaryFilter, dateFrom, dateTo, scope, sourceSurface,
projectContext (with trackerTags only — no attachedDocumentIds, deferred).

Three retrieval modes (Section 5 step 2):
- ALL: match_document_chunks unfiltered + optionally match_story_chunks.
  Pre-filter: date range, scope. Top-K=25.
- PRIMARY_ONLY: match_document_chunks JOIN documents.is_primary_source = true.
  Same pre-filter. Top-K=25.
- PRIMARY_BOOST: dual query — full library at retrieval threshold 0.65 top-K=15,
  primary-only at retrieval threshold 0.62 top-K=10. Merge + deduplicate by
  chunk_id. Chunks appearing only in the primary-only pass receive a rank boost.
  These are brief-reply production values — do not change them.

projectContext re-ranking: when trackerTags are provided, multiply similarity
score by 1.2 for chunks whose parent document tracker_tag is in trackerTags.
Applied post-retrieval before abstention gate.

Metadata hydration: after each RPC call, run a separate JOIN on documents to
fetch title, source_organisation, url, source_type, source_tier, tracker_tag.
Do not expect these columns from the RPC — it returns chunk_index, chunk_text,
document_id, similarity only.

Five reliability mechanisms in sequence:
- abstentionGate: best_sim < 0.72 OR fewer than 3 chunks above 0.78 → abstain
- synthesise: closed-book prompt Section 6, mandatory [n] citations, Sonnet
- verifyCitations: deterministic — strip any [n] not in retrieval set, log count
- checkFaithfulness: batched Haiku call Section 7, strip UNSUPPORTED, flag PARTIAL
- assembleResponse: returns answer, citedSources[] with full metadata, funnel
  counts, abstained flag, faithfulness_stripped count, nearestDocs[] when abstained

Return the plan and full type signatures. Do not write code yet."
```

After approving the plan:

```
/sc:implement "Build lib/research.ts exactly as the approved plan and
RESEARCH-RAG-SPEC.md Sections 5–7. Do NOT omit the abstention gate, citation
verification, or the faithfulness pass — all three ship in v1. Closed-book
synthesis prompt verbatim from Section 6. PRIMARY_BOOST thresholds locked at
0.65/top-15 and 0.62/top-10. Jina jina-embeddings-v2-base-en for query
embedding. Metadata hydration via separate documents JOIN after RPC. Strongly
typed return. New file only — do not modify workspace/ask or brief-reply."
```

**Verify:**
```
/sc:test
```

Then the four behavioural cases — demand all four, do not skip:

```
/sc:troubleshoot "Prove lib/research.ts behaves correctly. Run four cases and
show full output: (1) A well-covered ISA deep-sea mining question returns a
cited answer with at least one [n] citation and non-zero funnel counts;
(2) A nonsense out-of-scope question triggers the abstention gate and returns
abstained:true with no synthesised answer; (3) Inject a fake [99] citation
into a draft answer and confirm verifyCitations strips it and increments the
strip count; (4) Feed a claim unsupported by its cited chunk and confirm
checkFaithfulness marks it UNSUPPORTED and strips it. Read-only on the DB."
```

---

### Step 4 — Build /api/research/ask + research_queries migration

**What it does:** exposes lib/research.ts to callers via a single authenticated endpoint, and adds `source_surface` and `project_id` to research_queries.

Plan-mode zone (schema change to `research_queries`):

```
/sc:implement "Build app/api/research/ask/route.ts. Auth required (Supabase
session). Body: { query, primaryFilter?, dateFrom?, dateTo?, scope?,
sourceSurface, projectContext? }. Calls lib/research.ts. Persists every query
to research_queries (RESEARCH-RAG-SPEC.md Section 4.3) including source_surface,
project_id (from projectContext.projectId if present), funnel counts, abstained,
faithfulness_stripped. Returns the full response object (Section 8): answer,
citedSources[] (name, type, tier, date, tracker_tag, url, similarity), funnel
{inScope, retrieved, cited, latencyMs}, abstained, nearestDocs[] when abstained.
Stream the answer text if feasible; send metadata on completion. New file only
— do not modify workspace/ask.

Also write the migration:
supabase/migrations/YYYYMMDD_research_queries_surface_columns.sql
adding source_surface text NOT NULL DEFAULT 'standalone_research' and
project_id uuid nullable to research_queries. Idempotent (ADD COLUMN IF NOT
EXISTS). PROPOSE THE MIGRATION SQL FIRST, wait for approval before running."
```

**Verify:**
```bash
curl -s http://localhost:3000/api/research/ask \
  -H "Cookie: <test session>" \
  -d '{"query":"deep sea mining ISA regulations","sourceSurface":"standalone_research"}' \
  | jq '{abstained,funnel}'
```
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'research_queries'
  AND column_name IN ('source_surface','project_id');
-- Must return 2 rows
```

---

### Step 5 — Verify new endpoint before any migration (gate for Phase 3)

**What it does:** runs an explicit comparison between the new engine and brief-reply's production behaviour, with named pass/fail criteria.

**Gate: Phase 3 does not start until this step produces a documented pass. Any regressions must be explicitly named and waived before Step 6 begins.**

**Note on factual accuracy:** this gate does not attempt to verify factual accuracy per query — that would require human domain review and is not scalable as a build gate. Factual accuracy is instead enforced *structurally* at runtime by the faithfulness pass (Mechanism 4): every cited claim is checked against its source chunk by Haiku, and unsupported claims are stripped before the answer is returned. The third pass criterion below confirms the faithfulness mechanism fires correctly; that is sufficient. Factual accuracy per claim is a runtime property of the engine, not a build-gate property.

```
/sc:troubleshoot "Run a structured comparison between /api/research/ask
(primaryFilter='primary-boost') and the retrieval brief-reply currently
performs. Select 10 representative questions from recent brief-reply sends
(pull from brief send logs or research_queries if populated).

For each question, run both:
(A) The new endpoint with primaryFilter='primary-boost'
(B) The equivalent match_primary_chunks (threshold 0.62, top-10) +
    match_document_chunks (threshold 0.65, top-15) calls that brief-reply makes

Record for each: citations returned (count + document titles), top similarity
score, abstained true/false, verifyCitations strips, faithfulness strips.

Produce a side-by-side table. Flag any case where (A) returns fewer relevant
citations than (B), or abstains where (B) would have answered.

Pass criteria (all required to proceed to Phase 3):
- 8 of 10 questions: new endpoint at parity or better on citation relevance
- Citation verification fires correctly on at least one injected test
- Faithfulness pass fires and strips at least one unsupported claim in testing
- Any regressions documented in .claude/research-engine-comparison-YYYYMMDD.md

If fewer than 8 pass, report the retrieval gap in lib/research.ts and do not
proceed. Do not start Step 6 until this report is reviewed and approved."
```

---

# PHASE 3 — CALLER MIGRATION

One caller at a time. Each must be verified stable in production before the next migration starts.

### Step 6 — Migrate workspace page handler 1 (line ~491)

**What it does:** switches the first ask handler in the workspace page from `/api/workspace/ask` to `/api/research/ask`.

```
/sc:implement "In app/platform/(shell)/workspace/page.tsx, migrate the ask
handler at approximately line 491 from calling /api/workspace/ask to calling
/api/research/ask. Set sourceSurface='workspace_ask', primaryFilter='all'.
Map the existing request/response fields to the new endpoint contract
(RESEARCH-RAG-SPEC.md Section 8). The second handler at approximately line
1017 is NOT changed in this step — leave it calling the old endpoint. The
workspace page must work end-to-end after this change."
```

**Verify:**
```sql
SELECT source_surface, count(*), max(created_at)
FROM research_queries
WHERE source_surface = 'workspace_ask'
GROUP BY source_surface;
-- Should populate within minutes of first use after deploy
```
Monitor for 24 hours with no errors before proceeding to Step 7.

---

### Step 7 — Migrate workspace page handler 2 (line ~1017)

**What it does:** migrates the second copy-pasted handler — Claude Code proposes whether to create a shared hook or keep as a second distinct migration.

```
/sc:workflow "Plan the migration of the second ask handler in
app/platform/(shell)/workspace/page.tsx (approximately line 1017). First,
identify what UI context this handler serves — is it a different modal, panel,
or component from handler 1 at line 491? Then propose two options:
(A) Migrate as a second distinct call to /api/research/ask with the same
sourceSurface='workspace_ask' and primaryFilter='all'.
(B) Refactor both handlers into a shared React hook or utility that calls
/api/research/ask once and both UI contexts consume it.
Recommend the cleaner approach with rationale. Do not write code yet."
```

After approving the plan:

```
/sc:implement "Migrate the second workspace ask handler per the approved plan.
sourceSurface='workspace_ask', primaryFilter='all'. Workspace page must
function end-to-end with both UI contexts working after this change."
```

**Verify:**
```bash
git grep "/api/workspace/ask"
# Must return 0 results — workspace page has no remaining calls to the old endpoint
```
```sql
SELECT source_surface, count(*) FROM research_queries
WHERE source_surface = 'workspace_ask'
  AND created_at > now() - interval '1 hour'
GROUP BY source_surface;
```

---

### Step 8 — Migrate brief-reply.ts

**What it does:** replaces copy-pasted retrieval logic in brief-reply.ts with an HTTP call to `/api/research/ask`, preserving production behaviour exactly.

This is the highest-risk migration — brief-reply is a production morning send with real subscribers. Dry-run comparison is mandatory before deploy.

```
/sc:workflow "Plan the migration of app/lib/brief-reply.ts from its current
copy-pasted retrieval logic to calling /api/research/ask. The call must use
sourceSurface='brief_reply', primaryFilter='primary-boost' — this maps directly
to brief-reply's current dual-query pattern (match_primary_chunks threshold
0.62 top-10 + match_document_chunks threshold 0.65 top-15). Identify:
(1) Which types, helper functions, and retrieval logic in brief-reply.ts are
copy-pasted from workspace/ask and can be deleted after migration.
(2) The calling convention — internal server-side call or authenticated API call.
(3) How the brief's downstream usage of retrieved chunks (citations in brief
text, story ranking) maps to the new response shape.
Produce the before/after diff and a dry-run test plan that compares old and new
retrieval results on the same input before the change goes live. Do not write
code yet."
```

After approving the plan:

```
/sc:implement "Migrate app/lib/brief-reply.ts per the approved plan. Replace
duplicated retrieval logic with a call to /api/research/ask with
sourceSurface='brief_reply', primaryFilter='primary-boost'. Delete all
copy-pasted workspace/ask types and retrieval helpers from brief-reply.ts.
Write the dry-run test that calls migrated brief-reply with a fixed story set
and confirms retrieved chunks are equivalent to the old implementation."
```

**Verify before deploying:**
```
/sc:troubleshoot "Run the brief-reply dry-run comparison. Same 10 stories
through old retrieval logic vs new /api/research/ask PRIMARY_BOOST call.
Compare: retrieved chunks (document titles, similarity scores, count per story).
Flag any case where new engine returns materially different results. Brief-reply
behaviour must be preserved — if any regression found, do not deploy."
```

After passing dry-run and deploying:
```sql
SELECT source_surface, count(*), max(created_at)
FROM research_queries
WHERE source_surface = 'brief_reply'
GROUP BY source_surface;
-- Populates on next morning brief send
```

---

### Step 9 — Delete workspace/ask (48-hour gate)

**What it does:** removes the old endpoint after all migrated surfaces are confirmed stable.

**All four conditions must be met before deletion:**

**Condition 1 — 48h of stable operation across all surfaces:**
```sql
SELECT
  source_surface,
  count(*) as total_queries,
  count(*) FILTER (WHERE abstained = true) as abstained,
  round(avg(faithfulness_stripped)::numeric, 2) as avg_stripped,
  min(created_at) as first_seen,
  max(created_at) as last_seen
FROM research_queries
WHERE created_at > now() - interval '48 hours'
GROUP BY source_surface;
-- Must show rows for workspace_ask AND brief_reply
-- Abstention rate should be < 30% for well-covered surfaces
-- avg_stripped should be < 2 per answer
```

**Condition 2 — Spot-check 5 recent queries:**
```
/sc:troubleshoot "Spot-check 5 recent queries from research_queries: 2 from
workspace_ask, 2 from brief_reply, 1 from any surface. For each: confirm
cited_chunk_ids is non-empty, faithfulness_stripped is 0 or low, and abstained
is false for non-edge questions. Flag any query where cited_chunk_ids is empty
or faithfulness_stripped > 3. Report pass/fail per query."
```

**Condition 3 — Zero error reports from either migrated surface.**

**Condition 4 — Zero remaining callers:**
```bash
git grep "/api/workspace/ask"  # must return 0 results
```

After all four pass:

```
/sc:troubleshoot "Delete app/api/workspace/ask/route.ts. Confirm via git grep
that zero files reference this route before deletion. After deletion, run
npm run build and confirm clean. Report: callers found (expect 0), file
deleted, build status."
```

---

# PHASE 4 — NEW SURFACES

Phase 4 can begin as soon as Step 4 is live — it does not require Phase 3 to complete.

### Step 10 — Port the prototype to a React page

**What it does:** ports `ask-tideline.html` into the Next.js app as a working page using mock data — no API wiring yet.

```
/sc:implement "Port ask-tideline.html into the Next.js app as the Research page
at app/platform/(shell)/research/page.tsx plus components. Match the prototype
EXACTLY: light theme, dedicated two-column answer layout, live library counter
(count-up animation), source-tier toggle (PRIMARY ONLY / ALL SOURCES) mapped to
the primaryFilter parameter, date range filter, all-library/my-uploads scope
toggle, staged loading sequence, cited answer with hoverable citation cards
linked to the source rail, honesty banner, and the abstention state with
nearestDocs list. Use locked Tideline tokens (inline styles per CLAUDE.md —
no Tailwind classes in JSX). Keep all copy verbatim ('We don't search the
internet. We search the library we built.'). No tracker filter. Components only,
no API wiring yet — use the prototype's mock data so it renders. Follow existing
platform shell patterns."
```

**Verify:** page renders at `/platform/research`, all four states reachable (idle, loading, answer, abstain), source-tier toggle visible and switches between PRIMARY ONLY and ALL SOURCES, mobile layout intact. Compare side by side with `ask-tideline.html`.

---

### Step 11 — Wire the front end to the live API

**What it does:** connects the Research page to `/api/research/ask` and builds the `/api/research/library-stats` endpoint for the live counter.

Build library-stats first:

```
/sc:implement "Build app/api/research/library-stats/route.ts per
RESEARCH-RAG-SPEC.md Section 13. Auth required. Returns { total, newThisWeek,
searchable } where total = count of approved documents, searchable = count of
distinct document_id in document_chunks, newThisWeek = count of documents with
created_at > now() - interval '7 days'. Cache-Control: max-age=300,
stale-while-revalidate=600. No document contents — numbers only."
```

Then wire the UI:

```
/sc:implement "Wire the Research page to the live endpoints. On submit, POST to
/api/research/ask with sourceSurface='standalone_research' and primaryFilter set
by the toggle state: 'primary-only' when PRIMARY ONLY is selected, 'all' when
ALL SOURCES is selected. Render the staged loading sequence while streaming; on
response populate the cited answer, retrieval funnel (real numbers from response
fields), source rail, and honesty banner. On abstained:true render the abstention
state with real nearestDocs. Fetch /api/research/library-stats on mount to drive
the header counter and new-this-week delta badge. NOTHING hardcoded — every
number is a response field per RESEARCH-RAG-SPEC.md Section 8. Handle loading
and error states gracefully."
```

**Verify:**
```
/sc:troubleshoot "End-to-end check of the Research page against the live API.
Confirm: (1) a covered ISA question returns a real cited answer with working
hover cards; (2) the source-tier toggle changes the in-scope count AND the
retrieved set between requests; (3) an out-of-scope question shows the
abstention state with real nearestDocs populated; (4) the header counter
matches library-stats. Report anything hardcoded that should be a live read."
```

---

### Step 12 — Wire the answer actions

**What it does:** implements the three answer-footer actions on the Research page.

```
/sc:implement "Wire the three answer-footer actions on the Research page.
'Add to workspace' attaches the answer and cited sources to a workspace project
using the existing project attachment pattern — reference the existing attachment
code, do not invent a new pattern. 'Copy with citations' copies the answer text
with a numbered source list appended. 'Export as brief' generates a formatted
markdown download (reuse existing brief/PDF pattern if present, otherwise
markdown). 'Discard' clears the answer state."
```

**Verify:** each button performs the real action; "Add to workspace" produces a visible attachment in a test project.

---

### Step 13 — Workspace projects Ask tab

**What it does:** adds an Ask tab to the workspace project detail page, wired to the new engine with project context.

```
/sc:implement "Add an Ask tab to app/platform/(shell)/projects/[id]/page.tsx.
The Ask tab renders the ask UI pattern (question input, staged loading, cited
answer, source rail, abstention state) and calls /api/research/ask with:
  sourceSurface = 'projects_ask'
  primaryFilter = 'all'
  projectContext = { projectId: params.id, trackerTags: project.topic_tags }
The 1.2x tracker-tag similarity boost is applied server-side in lib/research.ts
(RESEARCH-RAG-SPEC.md Section 5.1) — no UI change needed. Do not include
attachedDocumentIds — that field is deferred until the project_documents schema
is designed. The Ask tab should feel like a natural extension of the project
workspace, not a separate page. Follow existing project page patterns and the
workspace design standard in CLAUDE.md."
```

**Verify:**
```sql
SELECT source_surface, count(*), max(created_at)
FROM research_queries
WHERE source_surface = 'projects_ask'
GROUP BY source_surface;
-- Populates on first use
```

---

# PHASE 5 — NIGHTLY HOOK & POLISH

### Step 14 — Auto-process new documents nightly

**What it does:** extends the nightly pipeline so new scraper documents are classified, chunked, and embedded automatically.

Plan-mode zone (adds a cron, writes to `documents`/`document_chunks`):

```
/sc:implement "Extend the nightly pipeline so new documents are made searchable
automatically. After the existing 02:00 scraper ingestion cron, run: classify
(allowlist then Haiku) and chunk+embed any document with no chunks yet, reusing
the shared classify + embed-documents logic as common functions. Idempotent —
only touches new/unprocessed docs. Add to vercel.json crons at 05:00 UTC.
PROPOSE THE PLAN AND SCHEDULE FIRST, identifying which shared functions to
extract and confirming no duplication with the backfill scripts."
```

**Verify:** run manually against a few freshly scraped docs; confirm they become searchable and library-stats `newThisWeek` rises.

---

### Step 15 — Reliability logging review & final analysis

**What it does:** reviews the reliability data accumulated across all surfaces to confirm the engine is performing as designed and identify any synthesis prompt tuning needed.

```
/sc:analyze lib/research.ts app/api/research/ask/route.ts "Focus on: closed-book
prompt cannot leak outside knowledge; citation verification cannot be bypassed;
abstention gate fires correctly at the thresholds; RLS on research_queries is
correct; no PII or document contents leak via library-stats; Supabase vector
search query efficiency. Flag anything that would embarrass a £99/month
professional tool."
```

```
/sc:troubleshoot "Review research_queries data across all surfaces. Report:
abstention rate per source_surface, average chunks_cited per surface, total
faithfulness_stripped count, and any queries where faithfulness_stripped > 2
(model overreach — show them for synthesis prompt tuning). Break down by
source_surface so surface behaviour can be compared."
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

| Phase | Step | What | Plan-mode? | Prerequisite |
|---|---|---|---|---|
| 0 | — | DONE — spec on main (6b07f23), ~7,500 docs embedded | — | — |
| 0.5 | 0.5.1 | Read existing implementation audit | — | — |
| 0.5 | 0.5.2 | Delete orphan research/inline | No | 0 callers confirmed |
| 1 | 1 | Source classification backfill ✓ COMPLETE | — | — |
| 1 | 2 | Story chunks backfill (audit + fix + run) | YES (writes story_chunks) | — |
| 2 | 3 | lib/research.ts unified engine | No (new file) | Phase 1 |
| 2 | 4 | /api/research/ask + schema migration | YES (schema) | Step 3 |
| 2 | 5 | Verify new endpoint — gate for Phase 3 | No (read-only) | Step 4 |
| 3 | 6 | Migrate workspace handler 1 (line ~491) | No | Step 5 pass |
| 3 | 7 | Migrate workspace handler 2 (line ~1017) | No | Step 6 stable |
| 3 | 8 | Migrate brief-reply.ts | No | Step 7 stable |
| 3 | 9 | Delete workspace/ask (48h gate) | No | Step 8 stable 48h |
| 4 | 10 | Port Research prototype to React | No | Step 4 |
| 4 | 11 | Wire Research page to live API + library-stats | No | Step 4 |
| 4 | 12 | Wire answer actions | No | Step 11 |
| 4 | 13 | Workspace projects Ask tab | No | Step 4 |
| 5 | 14 | Nightly auto-process new docs | YES (cron + writes) | Steps 1–2 |
| 5 | 15 | Reliability logging review | No (read-only) | Phase 3 complete |

**Critical path:** Steps 1–5 (data + engine). Phase 3 (migration) and Phase 4 (new surfaces) can run in parallel once Step 5 passes — they share the same engine, different surfaces. Phase 4 Steps 10–13 can begin as soon as Step 4 is live without waiting for Phase 3 to complete. Phase 3 Steps 6–9 impose 24–48h real-time gates between each step; plan those sessions across multiple days and fill waiting time with Phase 4 work.

---

# THE FOUR THINGS THAT MUST NOT SLIP

1. **The reliability triad ships in v1.** Abstention gate + citation verification + faithfulness pass. Cutting any one turns a trustworthy tool into a plausible-sounding one. This is the whole product.
2. **No number is ever hardcoded.** The counter, the funnel, the in-scope count — all live reads. They are reliability claims, and a wrong one is worse than none.
3. **Abstention is a feature, not a failure.** "The library does not cover this" must always be available and must never embarrass the user. A tool that knows its limits is the one experts trust.
4. **Caller migration is one-at-a-time.** Each migrated caller must be verified in production before the next migration starts. No big-bang switchover.

---

*Companion to RESEARCH-RAG-SPEC.md (commit 6b07f23). Migrate the existing, build the new, then extend.*
*Reliability is the product. The library is the moat. The citation is the proof.*
