# Tideline — Open Tickets

---

## BUG (PRIORITY 1 — next session): Workspace creation modal does not persist

**Priority:** P1
**Discovered:** 2026-05-06

### Problem
New workspace creation flow did not persist any project. No 'auth-test' row in `projects` table; most recent row is 'weh' from 2026-05-05 under gmail user_id `c652fd7f-20eb-4ab6-9841-aa7908057dea`.

### Reproduction
1. Open New Workspace modal from workspace page
2. Fill in title and entities
3. Submit
4. Observe: no row created in `projects` table

### Diagnostic steps
1. Browser DevTools Network tab — does `POST /api/projects` fire? What status does it return?
2. Check that the title field captures typed text (controlled input wiring)
3. Check that the submit button onClick is wired to the POST handler
4. Note: most recent projects under `c652fd7f-...` are all from April or earlier ('weh' from 2026-05-05)

---

## TICKET: End-to-end test active project watcher (blocked on modal fix)

**Priority:** P2 (after modal fix)
**Discovered:** 2026-05-06

### Work needed
1. Fix workspace creation modal (see BUG above)
2. Create workspace with 2 entities via modal
3. Confirm 2 rows written to `project_entities` for `c652fd7f-...`
4. Trigger `fetch-feeds` cron with ISA or BBNJ story
5. Confirm `project_auto_entries` row is auto-inserted via entity-matching auto-attach hook

---

## TICKET: Investigate 'weh' workspace — isa/bbnj chips visible but topic_tags=[] in DB

**Priority:** Low
**Discovered:** 2026-05-06

### Problem
The 'weh' workspace shows isa and bbnj entity chips in the UI but `projects.topic_tags = []` in the DB. Either the chips are rendered from `project_entities` (not `topic_tags`), or there is a stale cache.

### Work needed
- Confirm which field drives the entity chips in `workspace/page.tsx`
- If `project_entities` table — expected behaviour, `topic_tags` is not the source of truth
- If stale cache — identify the cache key and invalidation point

---

## TICKET: Clean up untracked junk files in repo root

**Priority:** Low
**Discovered:** 2026-05-06

### Problem
Untracked files with clearly corrupt names exist in the repo root (paste artifacts from terminal cross-contamination):
- `1`, `10)`, `20%`, `console.error(e))`

### Work needed
```bash
git clean -n   # preview — confirm only junk files listed
git clean -f   # delete
```

---

## TICKET: Remove debug console.log lines in app/api/documents/route.ts

**Priority:** Low
**Discovered:** 2026-05-05

Two debug `console.log` lines remain in the POST handler:
- `console.log("[documents POST] Looking up email:", email);`
- `console.log("[documents POST] User found:", user?.id || "NOT FOUND");`

These log PII (email, user ID) to Vercel logs. Remove both.

---

## TICKET: Disable next-auth debug mode in production

**Priority:** Medium
**Discovered:** 2026-05-06

### Work needed
- Confirm `NEXTAUTH_DEBUG` is not set in Vercel production env vars
- Confirm `debug: false` (or absent) in `app/api/auth/[...nextauth]/route.ts` NextAuth config
- Check Vercel logs — if `[next-auth]` debug lines appear in production, find and remove the debug flag

---

## TICKET: Link Supabase CLI to project

**Priority:** Low
**Discovered:** 2026-05-06

### Work needed
1. `supabase link --project-ref [ref]` (get ref from Supabase dashboard → project settings)
2. Add `DATABASE_URL` to `.env.local`
3. Verify `supabase gen types typescript --local > app/lib/types/supabase.ts` produces current schema
4. Note: types may be stale (entities.embedding was vector(1536), now vector(768); project_entities and touch_project_viewed are new)

---

## TICKET: Batch-insert optimisation in entity-matching.ts auto-attach loop

**Priority:** Low
**Discovered:** 2026-05-06

### Problem
`lib/entity-matching.ts` auto-attach loop runs a sequential upsert per project. With many projects this is O(n) round trips to Supabase.

### Work needed
- Replace sequential upsert loop with a single `supabase.from("project_auto_entries").upsert([...rows])` batch call
- Verify `ignoreDuplicates: true` handles the unique constraint correctly at batch scale

---

## TICKET: Decide fate of hotmail users row

**Priority:** Low
**Discovered:** 2026-05-06

### Problem
`lukedmcmillan@hotmail.com` users row (`05f3...`) is no longer the canonical user. The gmail row (`c652fd7f-...`) is canonical. The hotmail row still exists with 6 orphaned projects and legacy data.

### Options
1. Archive: set `subscription_status = 'cancelled'`, add `archived_at` timestamp
2. Delete: cascade delete all hotmail-owned rows (high blast radius, irreversible)
3. Leave: harmless, no new writes to this row after user_id migration

Recommended: Option 1 (archive). Decide before any billing or compliance audit.

---

## TICKET: Remove user_topics dead code path

**Priority:** Medium
**Discovered:** 2026-04-23 during dashboard signals diagnosis

### Problem
`getUserTrackedDomains()` in `app/lib/user-preferences.ts` queries a
`user_topics` table that does not exist in the database (`public.user_topics`
is absent from the schema cache). The function errors silently and falls back
to ALL_SLUGS. `/api/user/topics` (GET + PUT) also writes to this phantom table.
Topics are actually stored in `users.topics` (jsonb array column).

### Work needed
- Delete `getUserTrackedDomains()` from `app/lib/user-preferences.ts`
- Delete `app/api/user/topics/route.ts`
- Audit all callers of `getUserTrackedDomains` — replace with direct read of
  `users.topics` jsonb column
- Verify no other route references `user_topics` table
- Check onboarding flow: does it write to `users.topics` or `user_topics`?
- Add migration guard: `DROP TABLE IF EXISTS user_topics;` to clean up if the
  table was ever created in any environment

### Risk
Low — current behaviour already falls back to ALL_SLUGS, so removal is
a no-op from the user's perspective until callers are updated.

---

## TICKET: Fix mojibake in generateBandCrossingSignals

**Priority:** Medium
**Discovered:** 2026-04-23 during signal_events audit

### Problem
The live cron (`fetch-feeds` every 2h, calling `runSignalGeneration()`) writes
band-crossing headlines with corrupted arrow characters:

- Written by cron: `Deep-Sea Mining â†' ELEVATED`
- Written by migration seed: `Deep-Sea Mining → ELEVATED`

The source string in `app/lib/signal-generation.ts:99` is:
```ts
headline: `${trackerName} → ${currentBand}`,
```

The `→` (U+2192) is correct in source. The corruption suggests a double-encoding
or charset mismatch between the Node.js runtime string and the Supabase client
at insert time on Vercel edge.

### Work needed
- Investigate whether Vercel edge runtime has a different charset handling
  path vs local Node.js (migration ran fine locally / in Supabase dashboard)
- Check `@supabase/supabase-js` version — any known charset regressions
- Try replacing the `→` literal with `\u2192` (explicit Unicode escape) as a
  workaround to isolate whether the issue is in source encoding vs wire encoding
- Clean up existing mojibake rows in signal_events once root cause confirmed

### Risk
Low — cosmetic only, signals display correctly otherwise.

---

## TICKET: Commit PULSE_SCORE_METHODOLOGY.md to repo root

**Priority:** Low
**Discovered:** 2026-05-05

### Problem
`PULSE_SCORE_METHODOLOGY.md` is referenced in multiple specs and the Haiku
prompt for alert interpretations but has never been committed to the repo
root. It only exists in `.claude/` or chat context.

### Work needed
- Commit `PULSE_SCORE_METHODOLOGY.md` to repo root
- Verify all spec cross-references use the correct path

---

## TICKET: Upgrade alert preheader to show real session date

**Priority:** Low
**Discovered:** 2026-05-05

### Problem
Alert email preheader currently shows only `"Score moved from X to Y."` —
the spec called for `"N days to next known session."` but this was deferred
because no live session date data is wired into the alert pipeline.

### Work needed
- Wire governance_events lookup into `getOrCreateInterpretation` or the
  cron pre-loop to find the next event for the tracker's governing body
- Add `days_to_next_session` to the preheader when a future event exists
  within 90 days; fall back to current plain text when none found

---

## TICKET: Confirm test-alert-email.tsx recipient before wider test traffic

**Priority:** Medium
**Discovered:** 2026-05-05

### Problem
`scripts/test-alert-email.tsx` has `to: "lukedmcmillan@gmail.com"` hardcoded.
This is fine for dev testing but must not be used as a template for any
production send path or load test.

### Work needed
- Before any wider test traffic: confirm production cron uses each user's
  email from `user_alert_preferences` → `users.email` join, not this script
- Add a comment in the script header: `// DEV ONLY — recipient hardcoded`

---

## TICKET: Verify story auto-attach pipeline end-to-end

**Priority:** P1
**Discovered:** 2026-05-06

### Work needed
1. Trigger `fetch-feeds` cron manually (or wait for next hourly run)
2. Confirm a new ISA or BBNJ story is ingested
3. Confirm `project_auto_entries` row auto-inserted for 'auth-test-2' workspace via entity-matching auto-attach hook
4. If no row: check `lib/entity-matching.ts` auto-attach loop, check `project_entities` rows for auth-test-2, check story `entities_extracted` flag

---

## TICKET: Entity picker — dropdown overflow + acronym search

**Priority:** P2
**Discovered:** 2026-05-06

### Problem
Two UX issues in the NewProjectModal entity picker:
1. Dropdown overflows its container on narrow screens
2. Typing short acronyms (iwc, isa, bbnj) returns no results — the search does not match against `entity_aliases.alias_text`

### Work needed
- Fix: search should query `entity_aliases` in addition to `entities.name`
- Fix: dropdown should have `max-height` + `overflow-y: auto` to stay within modal bounds

---

## TICKET: Apply pending migration 20260505_matched_entity_id.sql

**Priority:** P2
**Discovered:** 2026-05-05

### Work needed
- Open Supabase Studio SQL Editor
- Run `supabase/migrations/20260505_matched_entity_id.sql`
- Verify with a SELECT confirming the new column or index exists

---

## TICKET: WorkspaceBreadcrumb typeof window branch — assess and remove if dead

**Priority:** Low
**Discovered:** 2026-05-06

### Problem
`app/platform/(shell)/layout.tsx` contains a `typeof window !== 'undefined'` branch in `WorkspaceBreadcrumb`. This is a common hydration anti-pattern. The branch may be dead code introduced when routing was server-side.

### Work needed
- Read the branch and determine if the `typeof window` check is necessary
- If dead code: remove
- If live: replace with `useEffect` pattern

---

## TICKET: Tags/Entities design unification — decide on single source of truth

**Priority:** Medium
**Discovered:** 2026-05-06

### Problem
Two overlapping systems exist for associating topics with workspaces:
- `projects.topic_tags` (string array) — set at creation time
- `project_entities` table (FK to entities) — set via entity picker

The 'weh' workspace has entity chips rendered from `project_entities` but `topic_tags = []` in DB.

### Work needed
- Decide: `project_entities` is the source of truth for the workspace entity watcher; `topic_tags` is either deprecated or a separate concept
- If deprecated: stop writing to `topic_tags` on workspace creation; strip from UI
- If separate: document the distinction in CLAUDE.md

---

## TICKET: ISA tracker_tag data audit

**Priority:** Medium
**Discovered:** 2026-05-06

### Problem
ISA entities may not have `tracker_tag = 'isa'` set, which would prevent the auto-attach hook from routing ISA stories to projects watching ISA entities.

### Work needed
- `SELECT name, tracker_tag FROM entities WHERE name ILIKE '%ISA%' OR name ILIKE '%Seabed Authority%'`
- Confirm `tracker_tag` is set correctly for canonical ISA entity
- If missing: `UPDATE entities SET tracker_tag = 'isa' WHERE ...`

---

## TICKET: Reconcile two-band-system conflict

**Priority:** Low
**Discovered:** 2026-05-05 during threshold alert email planning

### Problem
Two incompatible band systems exist in the codebase:
- `bandFor()` in `app/api/cron/threshold-alerts/route.ts` — uses LOW/WATCH/ELEVATED/HIGH with thresholds <4, <7, <=8.5, >8.5
- `alertBand()` in `app/lib/tracker-metadata.ts` — uses QUIET/WATCH/ELEVATED/HIGH with thresholds <3, <5, <7, >=7

They disagree on band names, thresholds, and offshore-wind score shifting. `bandColor()` in tracker-metadata.ts maps to alertBand values (not the cron's LOW band).

### Work needed
- Decide which system is canonical
- Migrate the other to match
- Update `bandColor()` to handle whichever band names are canonical
- Audit all callers of both functions

### Risk
Medium — existing alert sends use the threshold-alerts cron's system. Changing thresholds could suppress or trigger alerts for users already enrolled.

---

## DESIGN (HIGHEST PRIORITY — blocks further workspace work): Workspace product theory

Auto-attach is shipped and produces real artefacts but the workspace UI gives users no mode-specific affordances for what to *do* with attached stories. Before building more workspace features, articulate: who uses workspaces, for what end deliverable, what's the smallest set of actions that turns attached stories into that deliverable. 2-3 user conversations recommended before designing.

---

## BUG (low): StoryDrawer fetch race

Add AbortController keyed to storyId for fast-click scenarios. Currently clicking story A then quickly story B could race and show wrong content. Acceptable for v1 — add `AbortController` in the `useEffect` cleanup in `StoryDrawer`.

---

## BUG (tomorrow): Auto-attached stories not clickable

**Priority:** P1
**Discovered:** 2026-05-07

Auto-attached stories in the workspace view have no link or detail modal. Founder hit this within 30 seconds of seeing the feature work. Need story-detail modal/side-panel or link to `/platform/story/[id]`.

---

## FEATURE: Dismiss button on auto-attached stories

PATCH `project_auto_entries.dismissed = true`, hide from default workspace view. Lets users prune irrelevant auto-attaches without deleting the row.

---

## BUG (high): Entity picker search does not match acronyms

Typing `iwc`, `isa`, `bbnj` in the entity picker returns no results. The search queries `entities.name` only; it does not query `entity_aliases`. Fix:
- Add alias-aware search to `/api/entities/search` (join `entity_aliases` on `alias_text ILIKE %query%`)
- Update picker component to use the updated endpoint
The matcher and the picker share this limitation — fixing aliases benefits both.

---

## DATA (medium): ISA Secretariat tracker_tag = null

ISA Secretariat (id `c14591bb-b23a-4f5d-873c-08e9174f9245`) has `tracker_tag = null`. Audit all canonical entities and backfill `tracker_tag` where appropriate. May affect auto-attach routing for ISA stories.

SQL to check:
```sql
SELECT id, name, tracker_tag FROM entities
WHERE name ILIKE '%Seabed Authority%' OR name ILIKE '%ISA%';
```

---

## DESIGN (multi-session): Unify Tags and Tracked Entities

Two parallel systems running:
- Tag-driven via `project-populate` cron (reads `projects.topic_tags`)
- Entity-driven via `matchEntitiesToStory` (reads `project_entities`)

Plan: verify entity path stable for ~1 week, migrate writers (processor-agent, scrapers, admin upload) to also write entities, retire `project-populate` cron, remove `topic_tags` from workspace UI. Library may need to keep `topic_tags` as a separate concept.

---

## DESIGN (medium): One-row-per-(project,story) auto-attach attribution

Currently a story matching N tracked entities produces 1 auto-entry attributed to whichever entity matched first. Decide: keep as-is (simple, avoids duplicate rows) or change unique constraint to `(project_id, story_id, matched_entity_id)` for richer multi-entity attribution. Product question, not code question.

---

## INVESTIGATE: WorkspaceBreadcrumb typeof window branch

`app/platform/(shell)/layout.tsx` around line 813 — `typeof window` branch reads `window.location.search`. Possibly dead code introduced when routing was server-side. Grep callers; if dead, remove; if live, replace with `useEffect` pattern.

---

## Carried over from prior sessions

- Remove debug `console.log` lines in `app/api/documents/route.ts` (logs PII: email + user_id)
- Disable next-auth debug mode in production (`debug: false` in NextAuth config — currently logging `[next-auth][warn][DEBUG_ENABLED]`)
- Reconcile `alertBand()` vs `bandColor()` in `tracker-metadata.ts` (two incompatible band systems)
- Commit `PULSE_SCORE_METHODOLOGY.md` to repo root
- Update `TIDELINE-CONTEXT.md` priority list
- Threshold alert preheader upgrade when session date data wired
- Link Supabase CLI (`supabase link --project-ref [ref]`) and add `DATABASE_URL` to `.env.local`
- `test-alert-email.ts` hardcoded recipient — confirm before wider testing
- Sequential upsert loop in `entity-matching.ts` auto-attach could be batch insert
- Run `supabase gen types typescript` (types may be stale: `project_entities`, `matched_entity_id` are new)
- Directory entity detail page does not exist
- Decide fate of hotmail users row (no longer used by code)
- `git clean -n` preview then `git clean -f` for repo root junk files
- Investigate 'weh' workspace shows isa/bbnj chips in UI but `topic_tags=[]` in DB
- Update `supabase/migrations/20260505_matched_entity_id.sql` to include `ON DELETE SET NULL` on the FK (production has it; migration file lacks it)
- Cleanup test workspaces: aa, ss, zz, cc, Test (clutter under `c652fd7f-...` user)

---

## 2026-05-07 additions

### USER RESEARCH (highest priority — blocks further design)

Workspace product theory validation. Take `.claude/DESIGN-WORKSPACE-COLUMN.md` to 2 marine lawyers + 1 ESG analyst from the survey respondent pool. 30-min calls with screen share.

Three questions:
1. Walk me through your last regulatory tracking task
2. Would you trust an AI summary that gave you 5 paragraphs with linked sources?
3. What word do you use for what we call a "project"?

Don't show demo first — let them describe their flow before reacting to ours.

---

### BUG (low): StoryDrawer fetch race

Fast clicks on different stories can race; drawer may show wrong content. Add `AbortController` keyed to `storyId` in the `useEffect` fetch inside `StoryDrawer`.

---

### FEATURE (next session): Entity picker acronym search

Add `entities.aliases text[]` with GIN index. Populate aliases for canonical entities: ISA, BBNJ, IMO, IWC, IUCN, FAO, NOAA, UNCLOS, CITES, OSPAR. Update picker search to match `name` OR `aliases`. Same fix benefits the matcher (helps ISA Secretariat match better) and the picker.

---

### FEATURE (next session): Per-entity dossier page

Click any entity card from anywhere in the platform → consistent dossier view. Layout differs by `entity_type`:
- Person: role/affiliations/statements timeline
- Organisation: sub-bodies/mandate
- Treaty: articles/ratifications/status

---

### DESIGN DECISION (defer): Drop Intel from right column

Per `.claude/DESIGN-WORKSPACE-COLUMN.md` the recommendation is drop. Confirm during user research round and ship the decision after.

---

### DATA: ISA Secretariat tracker_tag = null

ISA Secretariat (id `c14591bb-b23a-4f5d-873c-08e9174f9245`) has `tracker_tag = null`. Audit canonical entities and backfill `tracker_tag`.

---

### DESIGN (multi-session migration): Unify Tags and Tracked Entities

Two parallel systems — tag-driven via `project-populate` cron, entity-driven via `matchEntitiesToStory`. Plan: verify entity path stable for ~1 week, migrate writers to also write entities, retire `project-populate` cron, remove `topic_tags` from workspace UI. Library may keep `topic_tags` as separate concept.

---

### DESIGN (medium): One-row-per-(project,story) auto-attach attribution

Currently a story matching N entities produces 1 row attributed to whichever matched first. Decide whether to change to `(project, story, matched_entity)` for richer attribution.

---

### INVESTIGATE: WorkspaceBreadcrumb dead code?

`WorkspaceBreadcrumb` in `app/platform/(shell)/layout.tsx:813` — `typeof window` branch reads `window.location.search`. Possibly dead code. Grep callers before removing.

---

### Carried over from previous sessions

- Remove debug `console.log` lines in `app/api/documents/route.ts`
- Disable next-auth debug mode in production
- Reconcile `alertBand()` vs `bandColor()` in `tracker-metadata.ts`
- Commit `PULSE_SCORE_METHODOLOGY.md` to repo root
- Update `TIDELINE-CONTEXT.md` priority list
- Threshold alert preheader upgrade when session date data wired
- Link Supabase CLI and add `DATABASE_URL` to `.env.local`
- `test-alert-email.ts` hardcoded recipient
- Sequential upsert loop in `entity-matching.ts` could be batch insert
- Run `supabase gen types typescript`
- Decide fate of hotmail users row
- `git clean` for repo root junk files
- Update `supabase/migrations/20260505_matched_entity_id.sql` to include `ON DELETE SET NULL` on FK
- Cleanup test workspaces: aa, ss, zz, cc, Test
- Decide whether auth-test-2 workspace is kept as working demo or renamed
- Investigate 'weh' workspace shows isa/bbnj chips in UI — likely from project-populate cron / topic_tags legacy path

---

## 2026-05-08 additions

### DATA AUDIT: Ambiguous short-name entities (matcher noise)

The matcher may be aggregating distinct organisations under generic short tokens. Investigate these entities — they are likely noise rows that should be deleted or merged:

- `3408b742-cb6e-461b-a377-1bb2627a0c10` — "Commission" (mention_count 16) — too generic; multiple distinct commissions rolled into one row
- `dd9dea9c-884d-4d4c-a653-781520de521a` — "ONE" — unclear referent
- `8a8c6043-aa94-4827-8e79-e781cc570459` — "MSC" — could be Marine Stewardship Council or other
- `6c35b125-b4d4-4b5a-bd13-ed90982e6619` — "LA" — likely geographic noise
- `d5a11e50-f67f-4de7-90eb-d53ea7c67a9f` — "PLOS ONE" — journal misclassified as organisation; delete or reclassify as `entity_type = 'publication'`

Work needed: Review each row; delete noise; reclassify mistyped entries. Run `recalc-entity-mention-counts` after cleanup.

---

### DATA AUDIT: Possible duplicate entities for merge

- "Convention on Biological Diversity" (id `20773f15-...`, regulator, 4 mentions) vs "Convention on Biological Diversity Text" (instrument, 0 mentions) — may be same concept stored as both body and document. Investigate and merge if appropriate.
- ISA Council / ISA Secretariat / International Seabed Authority — three distinct rows; correct canonical hierarchy is ISA (the body) with Secretariat and Council as sub-bodies. Currently all three share alias 'isa'. No merge needed now but worth documenting the intended hierarchy.

---

### FUTURE: Matcher acronym support (deferred from 2026-05-08 session)

`lib/entity-matching.ts` not changed in this session. The `aliases` column is now populated but the matcher continues to match on `name` only. Adding alias-aware matching to the matcher requires additional disambiguation logic: when a story mentions "the ISA", which of ISA Council / ISA Secretariat / International Seabed Authority should receive the attribution? Requires a disambiguation strategy (e.g. prefer highest mention_count, or exclude sub-body matches when parent matches) — separate session.

---

## RAG: Duplicate chunks + tiny-PDF failures block workspace integration

**Documented:** 2026-05-08
**Reference:** .claude/DESIGN-RAG-DIAGNOSIS.md

Fix sequence: cleanup (Bug 3+4) → dedupe (Bug 1) → tiny-PDF visibility (Bug 2) → workspace UI integration. 7-10 hours across 2-3 sessions. Do not ship UI integration until Bug 1 + Bug 2 fixed.

- **Bug 3 (5 min):** Delete /api/cron/generate-embeddings route + remove from vercel.json (queries dropped 'embeddings' table, fails nightly)
- **Bug 4 (15 min):** Investigate app/api/ask/route.ts (61 lines) vs app/api/workspace/ask/route.ts (338 lines) — likely delete the short one
- **Bug 1 (1-2 hrs):** Patch idempotency check in embed-documents cron + dedupe 28,337 duplicate chunk rows (33% of 85,947 total)
- **Bug 2 (2-3 hrs):** Add chunking_status column to documents (pending/success/failed_no_text/failed_error), mark failures, backfill 2,711 unchunked docs
- **UI integration (3-4 hrs):** Wire FloatingDock ask panel to /api/workspace/ask, render streamed response + citations, integrate with buildCitationBlock pattern

---

## Post-workspace-cleanup: three items for next session (filed 2026-05-08)

### 1. RAG Bug 3 + Bug 4 cleanup (20 min)
- Delete /api/cron/generate-embeddings route + remove from vercel.json (queries dropped 'embeddings' table, fails nightly)
- Investigate app/api/ask/route.ts (61 lines) vs app/api/workspace/ask/route.ts (338 lines) — likely delete the short one

### 2. project-populate cron: update to only write entity_match rows
The non-entity_match output from this cron became orphaned in commit 'refactor(workspace): drop Intel/Live/People tabs'.
Previously those rows were consumed by IntelTabContent (now deleted). Update the cron to skip or filter rows that would have gone to the Intel tab.
Route: app/api/cron/project-populate/route.ts

### 3. People-as-section question (defer to user research)
The People/PeopleTabContent stub was removed with Intel and Live. Before rebuilding, confirm in the user research round (2 marine lawyers + 1 ESG analyst) whether tracked people deserve a separate section or whether they should live as entities in the Sources column. Do not implement until research is done.
