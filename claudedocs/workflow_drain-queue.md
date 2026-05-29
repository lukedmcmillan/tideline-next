# Workflow: Drain Document Processor Queue

**Created:** 2026-05-13
**Status:** Ready for /sc:implement
**Goal:** Clear 10,146 pending records from `document_queue` via pre-flight cleanup + sustained processor loop
**Constraint:** No BATCH_LIMIT change, no parallelism change, no cron change. Existing processor logic only.

---

## Context

- Queue depth: ~10,146 pending records
- Processor: `scripts/processor-agent.ts`, BATCH_LIMIT=500, DELAY_MS=2000ms between items
- Run time per batch: ~500 items × 2s = ~17 minutes
- AWI/WDC Phase 2B test records at ~queue position 5,400
- Blocker for: FAOLEX import, partnership outreach, library breadth work

---

## PHASE 0 — Pre-flight COUNT queries (read-only, run first)

Run all three COUNT queries before any DELETE. Show results to user.

### Cleanup 1 — OpenAlex DOI / source_format NULL

```sql
SELECT COUNT(*) FROM document_queue
WHERE status = 'pending'
  AND source_domain LIKE '%openalex%'
  AND source_format IS NULL;
```

Expected: ~855 records.
Reason: processor defaults to PDF path; DOI landing pages (doi.org/10.5281/zenodo.*) are HTML, not PDFs. These will fail at `extractText()`. Logged in lessons.md 2026-05-11. Known not-applicable, not failures.
Proposed action: **DELETE** (not mark failed — these are structurally unprocessable with current processor).
**GATE: Await approval before executing.**

> Note: lessons.md 2026-05-11 says 5,607 OpenAlex rows had source_format=NULL before the backfill-source-format.ts run. After backfill set all NULL→'pdf', OpenAlex records are now format='pdf' but DOI URLs are still HTML. The cleanup (1) query targets NULL — if backfill already set them to 'pdf', actual count may be lower than expected. Real count will tell.

### Cleanup 2 — RFMO ephemeral working documents

```sql
SELECT COUNT(*), source_domain FROM document_queue
WHERE status = 'pending'
  AND created_at < now() - interval '60 days'
  AND (file_url LIKE '%Prop%'
       OR file_url LIKE '%agenda%'
       OR file_url LIKE '%draft%')
  AND source_domain IN ('iotc.org', 'iccat.int', 'wcpfc.int',
                        'iattc.org', 'ccamlr.org', 'neafc.org')
GROUP BY source_domain
ORDER BY count DESC;
```

Reason: IOTC session proposals, ICCAT meeting drafts are published pre-session and removed post-session (~20% RFMO 404 rate documented in lessons.md 2026-05-12). Records >60 days old with ephemeral URL patterns are almost certainly dead links.
Proposed action: **DELETE** if patterns match expected domains. Surface count by domain — if any domain has an unexpectedly high count (>200), flag before deleting.
**GATE: Await approval before executing.**

### Cleanup 3 — Malformed URLs

```sql
SELECT COUNT(*) FROM document_queue
WHERE status = 'pending'
  AND (file_url IS NULL
       OR length(file_url) < 12
       OR file_url NOT LIKE 'http%');
```

Reason: Records with NULL, empty, too-short, or non-http URLs cannot be fetched. Processor will fail them immediately with `Download HTTP error`. Deleting them is cleaner than running them through to guaranteed failure.
Proposed action: **DELETE**.
**GATE: Await approval before executing.**

---

## PHASE 1 — Execute approved cleanups

For each cleanup approved by user, execute DELETE and log count.

```sql
-- Cleanup 1 (if approved)
DELETE FROM document_queue
WHERE status = 'pending'
  AND source_domain LIKE '%openalex%'
  AND source_format IS NULL;

-- Cleanup 2 (if approved)
DELETE FROM document_queue
WHERE status = 'pending'
  AND created_at < now() - interval '60 days'
  AND (file_url LIKE '%Prop%'
       OR file_url LIKE '%agenda%'
       OR file_url LIKE '%draft%')
  AND source_domain IN ('iotc.org', 'iccat.int', 'wcpfc.int',
                        'iattc.org', 'ccamlr.org', 'neafc.org');

-- Cleanup 3 (if approved)
DELETE FROM document_queue
WHERE status = 'pending'
  AND (file_url IS NULL
       OR length(file_url) < 12
       OR file_url NOT LIKE 'http%');
```

After cleanups, show new queue depth:

```sql
SELECT COUNT(*) FROM document_queue WHERE status = 'pending';
```

---

## PHASE 2 — Cost estimate (before running drain)

### Haiku call analysis (from processor-agent.ts)

Each record makes up to 3 Haiku calls:
1. **Relevance check**: system ~150 tok + 1000 chars user ~250 tok input → ~50 tok output
2. **Metadata extract**: system ~200 tok + 6000 chars user ~1500 tok input → ~200 tok output
3. **Metadata verify**: system ~150 tok + JSON user ~200 tok input → ~200 tok output

Records that fail at relevance (most common) only consume call 1.

### Pricing (claude-haiku-4-5-20251001)
- Input: $0.80 per million tokens
- Output: $4.00 per million tokens

### Per-record cost
- Full 3-call success path: ~2,450 input + ~450 output = **~$0.00376/record**
- Relevance-fail path (most failures): ~400 input + ~50 output = **~$0.00052/record**

### Estimate for post-cleanup queue (~9,000 records)

Historical pass rate from SPEC.md: ~57% success on HTML batch (but structural CITES blocks skew this low). Conservative estimate: 40-60% pass relevance + full pipeline.

| Scenario | Success rate | Estimated cost |
|---|---|---|
| Conservative | 40% | ~$15 |
| Midpoint | 55% | ~$19 |
| Optimistic | 70% | ~$25 |

**Estimate: $15–25. Well under $50 threshold. Proceed automatically.**

If actual queue depth after cleanup is >13,000 (unexpected), re-run estimate before proceeding.

---

## PHASE 3 — Create scripts/drain-queue.ts

### Spec

The drain script wraps `processor-agent.ts` invocation in a controlled loop:

```
scripts/drain-queue.ts
```

**Behaviour:**
- Each iteration: spawn `npx tsx scripts/processor-agent.ts --limit=500` as a subprocess
- After subprocess exits: query Supabase for new pending count + new failed count
- Log progress batch to `scripts/drain-progress.json` (append to `batches` array)
- Pause 30 seconds between batches
- Continue until:
  - (a) remaining pending count = 0, OR
  - (b) 6 consecutive batches where pending count didn't decrease (records are stuck/unprocessable), OR
  - (c) subprocess exits with non-zero code indicating rate-limit error

**Progress log schema (drain-progress.json):**
```json
{
  "started_at": "ISO timestamp",
  "starting_queue_depth": 9000,
  "deleted_preflight": { "openalex": 855, "rfmo": 42, "malformed": 18 },
  "batches": [
    {
      "batch_num": 1,
      "started_at": "ISO timestamp",
      "completed_at": "ISO timestamp",
      "pending_before": 9000,
      "pending_after": 8510,
      "records_processed_this_batch": 490,
      "new_failures_this_batch": 47,
      "elapsed_seconds": 1020,
      "cost_estimate_usd_to_date": 1.76
    }
  ],
  "status": "running|completed|stopped_stuck|stopped_rate_limit",
  "final_pending": null,
  "completed_at": null
}
```

**Stuck-detection:** Track `pending_after` across last 6 batches. If no decrease, stop and report.

**Cost tracking:** Estimate cost-to-date based on records processed (use midpoint $0.0019/record avg).

**AWI/WDC flag:** When queue depth passes through ~4,746 (10,146 − 5,400 = depth when AWI/WDC records are being processed), log a marker: `"awi_wdc_window_entered": true`. After queue drops below ~4,200, log `"awi_wdc_window_exited": true`. Surface AWI/WDC results separately in final report.

---

## PHASE 4 — Run drain

```
npx tsx scripts/drain-queue.ts
```

Monitor via `scripts/drain-progress.json` — can be checked mid-run, drained paused and resumed by killing and restarting (progress JSON persists state).

To resume a paused drain: script reads existing drain-progress.json on startup and continues from where it left off.

---

## PHASE 5 — Post-drain report

Generate final report covering:
- Starting queue depth
- Records deleted in pre-flight (by cleanup type)
- Total records processed during drain
- Records succeeded
- Records failed (with breakdown by `error_message` category):
  - RobotsBlocked
  - Not relevant
  - Download HTTP 4xx/5xx
  - PDF parse error
  - Jina fetch error
  - Validation failed
  - Other
- AWI/WDC specific results (8 AWI HTTP 403 records, 78 WDC pending records)
- Total wall time
- Total estimated API cost
- Library size before and after (`SELECT COUNT(*) FROM documents`)

---

## PHASE 6 — Update tasks/lessons.md

Add drain run entry with:
- Date
- Starting depth / records deleted in cleanup
- Records processed / succeeded / failed
- Elapsed time and cost
- Findings (failure patterns, AWI/WDC outcome)
- Operational recommendation (frequency/BATCH_LIMIT/weekly drain)

---

## Implementation sequence for /sc:implement

1. Run Phase 0 COUNT queries — show results
2. Await approval for each cleanup (gate)
3. Execute approved DELETEs (Phase 1) — show new queue depth
4. Display Phase 2 cost estimate — proceed if under $50
5. Create `scripts/drain-queue.ts` (Phase 3)
6. Run `npx tsx scripts/drain-queue.ts` (Phase 4)
7. Generate post-drain report (Phase 5)
8. Update `tasks/lessons.md` (Phase 6)

---

## Files affected

| File | Action |
|---|---|
| `scripts/drain-queue.ts` | CREATE |
| `scripts/drain-progress.json` | CREATE (runtime, gitignore) |
| `tasks/lessons.md` | UPDATE (post-drain entry) |
| `.claude/SPEC.md` | UPDATE (post-drain status) |
| `document_queue` rows | DELETE (cleanups, guarded) |
| `document_queue` rows | UPDATE via processor (status changes) |
| `documents` rows | INSERT via processor |

---

## Guarded zones

Per CLAUDE-RULES.md:
- `document_queue` DELETE — **show count first, await approval per cleanup**
- `document_queue` UPDATE via processor — same as normal processor run, no additional gate
- `documents` INSERT via processor — same as normal processor run, no additional gate
