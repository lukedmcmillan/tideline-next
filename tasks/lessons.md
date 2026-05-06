# Lessons Learned

## 2026-05-05

### Fonts

- **DM Mono removed 2026-04-30.** Never reference it in any spec, including email templates. Use DM Sans with `font-variant-numeric: tabular-nums` inline for numerals (scores, dates, counts).

### AI-generated content caching

- **Cache keys for AI-generated content must be the triggering event's stable identifier, not a tuple of attributes.** Keying interpretation cache on `(tracker_slug, band_from, band_to)` over a 7-day window reuses one interpretation across multiple distinct crossings that happen to share the same transition. Use the specific row's timestamp or primary key (`velocity_calculated_at` here) so each unique event gets its own generation.

### Haiku prompt hygiene

- **Map internal type codes to plain English before injecting into prompts.** Injecting `"Type 2 (Mixed architecture)"` into a "no jargon" prompt results in the jargon being parroted or silently preserved. Maintain a `PLAIN_INST_TYPE` map and transform at the call site — never let schema/type identifiers enter prompt text directly.

### Sparkline y-axis

- **Hardcode the y-axis to the data's known range, not the input min/max.** Auto-scaling to the input range makes a flat tracker (6.0–6.2) look as dramatic as a ramping one (3.2→7.4). For Pulse Scores the range is always 0–10. Hardcoded range preserves visual truthfulness across trackers with different activity levels.

### Direction arrow colours

- **Direction arrows should use direction-appropriate colour (red for down, teal for up), independent of the destination band's colour.** The crossing direction is the alarming signal. A HIGH→ELEVATED downward crossing should show a red ▼ even though the ELEVATED band colour is teal.

### Test email recipient

- **Always confirm the actual recipient before chasing "email not arriving" as a code bug.** A hardcoded address in a test script that the developer doesn't actively monitor causes wasted diagnosis time. The Resend API returned `last_event: suppressed` for `luke@thetideline.co` — the address was suppressed, not a code failure. Check the Resend status first, and verify the `to:` field in the payload before reading logs.

## 2026-04-27

### Library / Document Pipeline

- **document_queue is a manual-only pipeline** — `scripts/processor-agent.ts` drains the queue. No Vercel cron equivalent exists. Items stuck in `processing` after an interrupted run must be manually reset: `UPDATE document_queue SET status = 'pending' WHERE status = 'processing';`
- **embed-documents cron has a silent window bug** — Only fetches the 100 most-recently-created approved docs. Once those are embedded it processes 0 forever with no error. Fix: use `NOT IN (SELECT document_id FROM document_chunks)` with pagination instead of a recency cap.
- **Supabase REST API max 1,000 rows regardless of limit** — `.limit(5000)` in a Node script still returns at most 1,000 rows. Use paginated `.range()` calls for full-table diagnostics.

### Prompt Caching

- **1024-token minimum for caching to activate** — `cache_control: { type: "ephemeral" }` on a block shorter than 1,024 tokens does nothing (2,048 for Haiku 4.5). Add markers as forward-proofing but do not count on savings until prompts grow.
- **Prioritise by volume x prompt size** — A high-frequency route with a short prompt saves less than a medium-frequency route with a 2,000-token stable prompt. Multiply calls/hour by stable token count to rank candidates.

### Production Diagnostics

- **Node script + .env.local is sufficient for DB diagnostics** — No Docker or Supabase CLI needed. `npx @dotenvx/dotenvx run -f .env.local -- node -e "..."` gives a live DB read in seconds.

### Entity Type Data Quality

- **entity_type column has architectural debt** — At least 15 distinct values across three casing conventions (lowercase, UPPERCASE, mixed). Both `organization` and `organisation` exist as separate values. Future cleanup pass needed: normalise to lowercase singular, merge spelling variants, add CHECK constraint. Today's label mapper (`app/lib/entity-type-label.ts`) is a display-layer fix only — it does not address the underlying data inconsistency.

## 2026-04-28

### Onboarding Deploy

- **`/start` is legacy — v2 onboarding replaces it** — New users flow through `EarlyAccessModal` → NextAuth → `/onboarding`. The `/start` route and its API endpoint (`/api/trial-signup`) are kept live but receive no new traffic. After 30 days post-launch with no meaningful traffic to `/start`, delete both. Check Vercel analytics before deleting.
- **`onboarding_completed` column does not exist in migration** — `20260419_onboarding_v2.sql` only added `onboarded_at`, `job_type`, `brief_time`. Do not set `onboarding_completed` in the onboarding API route — it will cause a silent Supabase error. Use `onboarded_at` (timestamp) as the sole completion signal.
- **Middleware `undefined` vs `null` distinction for JWT fields** — Middleware reads the JWT cookie directly (bypasses the JWT callback). Existing users' tokens have `onboarded_at === undefined` (field not yet set). New unonboarded users have `onboarded_at === null`. Use strict `=== null` in the middleware gate, not `!token.onboarded_at`, to avoid false redirects during rollout.
- **`shouldRefresh` pattern for adding new JWT fields without re-auth** — Adding `token.onboarded_at === undefined` to the `shouldRefresh` condition in `auth.ts` triggers a one-time DB re-fetch on the user's next request, backfilling the new field into their existing token. Zero disruption, no re-auth required.

### Design System Violations (BLUE constant)

- **`BLUE` (#1d6fa4) used in live platform tracker pages — audit required** — TIDELINE-CONTEXT.md locks "No blue colour" in the design system. `BLUE` is defined as a local constant (not shared tokens) in 7 files. Three are live `/platform` routes needing a cleanup pass:
  - `app/platform/(shell)/tracker/bbnj/page.tsx` — choropleth map (signed status), legend, stat card, source link colour
  - `app/platform/(shell)/tracker/blue-finance/page.tsx` — stat card colour, source link colour
  - `app/platform/(shell)/tracker/governance/page.tsx` — stat card colour, nav `borderBottom` accent
  - `app/workspace/page.tsx` and `app/workspace/[id]/page.tsx` — uses `#185FA5` variant
  - `app/start/page.tsx` and `app/subscribe/page.tsx` — legacy routes, violations auto-resolve on deletion.
  - Replacement: teal (`#1D9E75`) for UI accents; data viz "signed" status needs a design decision (teal or neutral).

### Entity Deduplication

- **Entity dedup principle: full canonical name wins, abbreviation becomes alias** — When merging a full-name entity with its abbreviation, keep the full name as the canonical `entities.name` record regardless of which variant has higher `mention_count`. Abbreviations go into `entity_aliases`. Reasoning: the entity record must be unambiguous; the alias table handles lookup.
- **Trigram similarity (threshold 0.75) misses short-string duplicates** — The highest-impact duplicate in the entities table (U.S. / US, 1,394 combined mentions) scored below 0.75 because trigrams require string length to produce meaningful overlap. Pre-insert dedup helpers must run BOTH checks: trigram similarity > 0.85 AND normalised-key match (`name.toLowerCase().replace(/[^a-z0-9]/g, '')`). One without the other is insufficient.
- **Denormalised `mention_count` column found to be systematically wrong, not stale** — Pattern of identical drift values (~183 across many rows) indicates a write-path bug stamping a constant value (likely stories table row count at entity creation time) rather than a real mention count. `mention_count` cannot be used in any UI, scoring, or decision logic until: (a) the write-path bug is fixed, (b) the table is recalculated from `entity_mentions`, and (c) a trigger keeps them in sync. Any feature spec referencing `mention_count` needs review.

### Onboarding / Entity Matching

- **Starter-set route resolves entities by exact `name` match, not aliases** — `app/api/onboarding/starter-set/route.ts` uses `.in("name", names)`. If the config name drifts from the DB canonical name, the entity is silently skipped. Symptom: G2 check returns "missing" entities that actually exist under a different name with the config name as an alias. Fix applied 2026-04-28: updated `starter-sets.ts` to use canonical DB names.
- **`/onboarding` client-side guard bounces already-onboarded users** — `useEffect` on mount calls `/api/subscription-status` and redirects to `/platform/directory` if `needsOnboarding` is false. This is a client-side guard, not middleware — there is a brief flash of the onboarding page before redirect fires. Low priority for now; middleware guard would be the clean fix (add `token.onboarded_at !== null` check to bounce at edge).
- **FOLLOW-UP (not done):** The starter-set route should fall back to `match_entities_by_alias` when `.in("name", ...)` returns nothing for a given name. This makes the system resilient to future config drift without requiring manual audits. Add after onboarding deploy is proven stable.
- **`Lloyds Register` stored without apostrophe** — DB canonical name is `"Lloyds Register"`, not `"Lloyd's Register"`. Likely a data entry inconsistency. Future cleanup: normalise to `"Lloyd's Register"` in both `entities.name` and any `entity_aliases.alias_text` rows. Low priority.

## 2026-04-29

### Entity Dedup — Denormalised Counter Integrity

- **Idempotency, not just first-call correctness, is the required test for denormalised counters** — Bug 2 in `lib/entity-matching.ts` fired `increment_entity_count` unconditionally after every upsert, even when `ignoreDuplicates: false` returned 0 new rows. The bug hid for the entire feature lifetime because tests only asserted that the first call incremented the counter. New rule: any write path that updates a denormalised counter must have a test that calls the path twice with identical input and asserts the counter is incremented exactly once. First-call correctness is not sufficient.

### Entity Dedup — The fix-X.ts Anti-Pattern

- **Two ad-hoc fix scripts for the same class of problem signals structural debt** — By 2026-04-29 there were four one-off scripts (cleanup-entities, fix-entities, fix-convergence, fix-convergence-alias) each addressing entity false-positive matches from different angles. When you have shipped two fixes for the same class of problem, the next iteration must be structural. The `entity_review_queue` table + `findOrCreateEntity()` helper replaces this pattern by capturing near-matches for review instead of silently inserting duplicates.

### Entity Dedup — Canonical Name vs. Abbreviation

- **Full canonical name wins, abbreviation becomes alias, regardless of mention count** — When deduplicating US / U.S. / United States (combined ~1,400 mentions pre-recalc), the correct keep is "United States" even though the abbreviations had higher raw counts. Entity records must be unambiguous; the alias table handles all lookup paths. Trigram similarity alone misses short-string duplicates — BOTH trigram > 0.85 AND normalised-key match (`name.replace(/[^a-z0-9]/g, '')`) are required for complete dedup coverage.

### Entity Dedup — Read git log Before Scoping

- **`git log --stat` against feature files surfaces scripts and audit docs that aren't in the investigation context** — Before the dedup pass, `git log --stat lib/entity-matching.ts` would have revealed 11 scripts and 2 audit documents added in c351d8c that were not visible from the original issue report. Reading the commit log first prevents re-discovering work that already exists and scoping fixes that are already partially done.

### Entity Dedup — Schema Assumptions

- **Schema drift assumptions waste investigation time** — Use `information_schema.columns` or read the migration file before writing queries against tables not recently inspected. Tideline uses semantic naming (`first_seen_at`, `alias_text`) not ORM defaults (`created_at`, `alias`). A column that "should" exist may have a different name or not exist at all.

### Entity Dedup — Markdown and SQL Safety

- **Markdown auto-linking corrupts dotted identifiers** — SQL fragments and code containing `process.env.NEXT_PUBLIC_X`, `ea.alias_text`, `e.id` etc. are mangled by markdown renderers. Always wrap in fenced code blocks when sharing in chat; always paste through a plain-text intermediate before copying out of chat into an editor.

### Entity Dedup — UUID Test Fixtures

- **UUIDs are hex-only** — Postgres silently rejects test fixture IDs like `'00000000-test-0000-0000-entity-idem'` at insert time, causing tests to run against missing data with misleading downstream errors. Always use `00000000-0000-0000-0000-000000000001`-style fixture IDs or `crypto.randomUUID()`.

### Entity Dedup — Vitest Config

- **Vitest needs explicit path alias config** — Next.js `tsconfig.json` paths are not auto-detected by Vitest. Add `vitest.config.ts` with `resolve.alias: { '@': path.resolve(__dirname, './') }` to use `@/` imports in tests. Without this, all `@/lib/...` imports fail at test runtime.

### Entity Dedup — Unapplied Recommendations

- **Check for unapplied recommendations when re-entering a feature area** — Two audit outputs from April 20 (tier1-second-pass.md RSS sources, three-tier matching SQL from cleanup-entities.ts) sat unapplied for 8 days. Drift between "recommendation made" and "recommendation applied" is hidden debt. At the start of any investigation, grep the feature directory for `.md` audit files and check git log for script output that was never acted on.

### Entity Dedup — LLM Write-Path Call Order

- **LLM-written write paths need causal-order review, not just correctness review** — The Bug 2 root cause was `increment_entity_count` being called before the mention insert it was meant to count: narrative order (count it, then record it) rather than causal order (record it, then count if recorded). This is a repeatable LLM failure mode — narrative coherence overrides causal correctness. When reviewing any LLM-written write path that updates a counter, verify the order of calls against the causal dependency, not just whether each call looks individually correct.

### pgvector Function Signature Verification

- **`pg_get_function_identity_arguments` is unreliable for pgvector functions** — The metadata view displays all pgvector arguments as untyped `vector` regardless of the actual declared dimension (e.g. `vector(768)` vs `vector(1536)`). Chasing this phantom costs multiple debug rounds. Use a **runtime test** instead: `SELECT * FROM match_entity_embeddings(array_fill(0.1::real, ARRAY[768])::vector, 0.5::double precision, 10)` — if it returns 0 rows (not an error), the function accepts `vector(768)`. Trust the runtime, not the metadata view.

### Entity Embeddings — Dimension Mismatch

- **`entities.embedding` was declared `vector(1536)` but the app uses Jina v2 (768 dims)** — `story_chunks.embedding` was explicitly migrated from 1536→768 in `20260331_alter_embedding_dimension.sql`. The entity column and its RPC were added later (`20260418_entity_tracking_v2.sql`, `20260421_match_entity_embeddings_rpc.sql`) and incorrectly copied the original 1536 dim. The matcher's Pass 3 would have thrown a dimension error at runtime for every story, not just returned 0 results. Fix: migration `20260429_entity_embedding_to_768.sql` drops/re-adds column at vector(768) and updates the RPC. Lesson: when adding a new vector column, check the dimension used by the existing embedding infrastructure before declaring.

### Entity Embeddings — Backfill Recovery

- **Baseline unmentioned count was wrong before backfill** — `count-unmentioned.ts` initially fetched `entity_mentions` without pagination and hit the Supabase 1000-row cap. The displayed "458 unmentioned" was an undercount of entity_mentions, producing an inflated unmentioned number. Always paginate diagnostic queries against tables that grow without bound. Fixed in the script using `.range()` loops.
- **Post-embedding + post-backfill result: 265 unmentioned entities (out of 942)** — After running `embed-entities.ts` (942/942 embedded, 0 failed) and draining the backfill queue (182 stories across 11 runs, avg 5.3 matches/story), 677 entities have at least one story mention. Pass 3 (semantic) confirmed live: `[exact, semantic]` fired on first test. The 265 still-unmentioned entities are likely very niche/seeded entities that haven't appeared in story text yet — this is expected and will resolve as the feed runs.
- **backfill-entity-matching.ts caps at 20 stories per run** — Run in a loop (`for i in $(seq 1 N)`) to drain the queue. Queue drains when it prints "No unmatched stories found". It uses `entities_extracted IS NULL or false` to track which stories have been processed.

### Shell Cross-Terminal Paste Corruption

- **Never paste multi-line commands across terminal types (PowerShell → bash)** — Three corrupted files named `ntent scripts<filename>.ts` (~2,822 bytes each) were silently created in the repo when bash interpreted a multi-line PowerShell paste as redirect-to-file operations. They passed linting but caused Vercel build failures on deploy. Lesson: run `git status` after every Claude Code session before committing; anything with a space in the filename or non-alphanumeric prefix is almost certainly a paste artifact. Delete before staging.

## 2026-05-01

### Morning Brief — LLM Prompt Voice

- **LLM-generated copy needs explicit banned phrase lists, not just tone descriptions** — Haiku defaulted to consulting-firm-prose ('face expanded documentation requirements', 'bifurcating compliance requirements') until banned phrases were listed explicitly. The brief needed two prompt revisions: first to remove consultant-voice, second to remove epistemic-hedging tic ('specifics are unclear from the source'). When telling an LLM to be restrained, give it explicit alternative content to write instead — otherwise it narrates its own constraints.

- **Brief content fails in two opposite directions** — Overreach: claiming regulatory change where the source says guidance. Underreach: narrating that the source is thin instead of writing what IS clear. Both undermine trust. The prompt must hold both rails: never escalate (guidance stays guidance), AND never apologise for source brevity (write what is there, stop).

### Morning Brief — Content Selection

- **selectEvidence needs a dedup pass** — Two near-identical stories about the same event made it into the same brief because selection ranked only by significance. Rule: same topic + 3+ overlapping headline words + published within 7 days = duplicate. Keep higher significance.

- **Architecture: pre-summarise once, render per-user** — Haiku cost is O(pool_size) not O(pool × subscribers). Trivial difference at one subscriber, material at scale. Generate-brief summarises and stores JSONB; send-brief reads and renders.

- **48-hour candidate window was too narrow** — At current ingestion volume, 48h produced 0-1 stories for low-volume topics. 7-day window yields ~3x candidate density. Sort by significance desc within the window — most-significant 7-day story beats most-recent empty brief.

### Morning Brief — Architecture

- **Significance is relative within topic, not absolute across topics** — governance averages 13/100, dsm 29.5, iuu 4.5. Absolute thresholds useless. Three-mode selectLead (story-led >=50, hybrid <50, state-led empty) handles this gracefully.

- **TRACKER_LABELS must not conflate tracker slugs with topic values** — A single 19-entry map with both velocity_scores.tracker_slug keys and stories.topic keys does double duty silently. Any *_LABELS or *_LOOKUP map where the same value appears under multiple key types needs splitting. Split into TRACKER_LABELS (10 tracker slugs) and TOPIC_LABELS (9 topic values).

### Morning Brief — Mobile UX

- **Subject line truncation is mobile-critical** — Gmail and iOS Mail truncate at ~77 chars in notification preview. Long titles (100+ char BBNJ treaty names) need word-boundary truncation. Reserve 12-15 chars for the data-point appendix ('· Pulse 6.1'), leaving ~63-65 for headline.

- **Architecture tests do not catch content quality** — vitest passes and API returns 200 does not mean the brief reads well. After every prompt change, run TEST_EMAIL and read it as a paying subscriber: consultant voice, hedge language, factual overreach, repetition. Build content-quality verification into the brief shipping process.

## 2026-05-06

### Auth & Session Cookies

- **next-auth `getToken()` does not auto-detect cookie name — pass `secureCookie` explicitly.** Edge middleware sees the HTTPS request URL; serverless API routes see an HTTP internal URL. Without `secureCookie: true`, `getToken` looks for `next-auth.session-token` but Vercel sets `__Secure-next-auth.session-token`. Fix: derive from `NEXTAUTH_URL?.startsWith("https://")`.
- **Two-stage auth deploys reduce blast radius.** Stage 1: fix the underlying bug WITH the fallback still in place (deploy and verify sessions resolve). Stage 2: remove fallbacks once stage 1 is verified in production. Never remove a safety net in the same deploy that introduces a behavioural change.
- **Hardcoded user-id fallbacks in API routes are auth holes AND mask real bugs.** `if (!email) email = "lukedmcmillan@hotmail.com"` meant authenticated users always got data even when the session resolved wrong. The fallback was the reason the auth bug was invisible for weeks. Fail closed on null session: return 401.
- **Returning empty arrays on auth failure is misleading — return 401.** The frontend can handle session-expired state; returning `{ projects: [] }` when auth fails makes the UI silently show an empty state rather than prompting re-login.
- **'Shipped' = verified in production with a real request, not 'committed and pushed'.** Three times this session a deploy was described as done before verifying in Vercel logs. A commit on origin/main is not a shipped feature.
- **Run `npm run build` LOCALLY before commit/push.** Three failed deploys this session all would have been caught by a local build. The build takes 35s and is mandatory before any push.
- **Reviewing a diff in chat is not the same as verifying it compiles.** A diff shown in chat is a plan. Apply, build, push are three separate verifiable steps. Approving a diff does not mean it has been applied.
- **A diff in chat is not a diff on disk.** After showing diffs and receiving approval, the edits must still be applied with Edit tool calls. Check `git status` to confirm.

### Supabase

- **Every Supabase SQL Editor migration block must end with a verification SELECT.** Without a result set, silent failures are invisible — the statement ran but the data may not have changed.
- **Supabase SQL Editor closes transactions silently between submissions.** `BEGIN` and `COMMIT` must be pasted as one block, not as separate submissions. A partial transaction committed as a COMMIT-less block leaves the DB in an indeterminate state.
- **`SECURITY DEFINER` functions bypass RLS; route handler must do explicit ownership check before calling the RPC.** `touch_project_viewed` is SECURITY DEFINER — it will run against any project_id it's given. The ownership `SELECT` must precede the RPC call, not follow it.
- **404 vs 403 for ownership failures: pick one. 404 is safer.** Returning 404 for "project not found for this user" avoids leaking whether the resource exists at all.
- **Supabase JS `.upsert()` with `ignoreDuplicates` does not throw on conflict — it returns the error in the response object.** Check `data` (rows inserted) to determine if the upsert was a no-op; don't rely on absence of error.
- **Cross-table user_id migrations: probe for unique constraints first, DELETE-then-UPDATE for preference tables, blind UPDATE for activity logs.** A `UPDATE ... SET user_id = X WHERE user_id = Y` against a table with a `UNIQUE(user_id, entity_id)` constraint will fail if the target user already has the same row.

### API Design

- **Fallbacks appropriate for side-effect operations are a bug for primary operations.** A fallback email on auth failure is appropriate for a fire-and-forget notification; it is a security hole for a data-returning API route.
- **Removing one bug can expose adjacent bugs the masking was hiding.** Part B (removing fallbacks) immediately revealed the workspace creation modal flow doesn't persist — the fallback was serving real data and masking the modal's broken POST path.

### Vocabulary & Schema

- **Workspace/project vocabulary split is intentional.** "Workspace" is the UI-facing term; "project" is the DB table name. Never rename one to match the other in code.
- **Project columns are `name` not `title`; entity columns are `name` not `canonical_name`.**

### Development Workflow

- **End-of-session UI debugging is the highest-risk activity in a session — defer to fresh eyes the next day.** Low blood sugar + accumulated context = increased chance of making the problem worse or missing an obvious cause. Stop at a known-good state.
- **NEVER paste secret values in chat; rotate immediately if leaked.** `.mcp.json` is gitignored but Supabase service role keys and NEXTAUTH_SECRET pasted in chat are visible in conversation history. Rotate if exposed.

## 2026-05-06 (continued — hydration diagnosis)

### React Hydration

- **`new Date()` and `Math.random()` at render scope are guaranteed hydration mismatches.** Server (Vercel, UTC) and client (user's TZ) produce different values. Fix pattern: `useState(null)` initialiser + `useEffect(() => { setState(new Date()) }, [])`. SSR renders the `null` fallback (stable, same on server and client); client hydrates without mismatch, then populates after mount.
- **React #418 manifests as silent UI failure, not a visible crash.** The hydration tear-down kills event handlers attached during the mismatched render. Result: buttons do nothing, modals don't open. The symptom (e.g. workspace creation not persisting) looks like a backend bug but is actually a frontend render issue. Always check the browser console for `#418` before chasing API logs.
- **`useId()` is the correct tool for SVG/DOM IDs in React components — never `Math.random()`.** `Math.random()` at render scope produces different values server-side vs client-side → hydration mismatch. `useId()` is stable across server and client renders. Must be called before any early return (Rules of Hooks).
- **Bug masking chains are real and compounding.** This session: hardcoded email fallback → masked auth cookie bug → masked hydration error (killed click handlers) → modal appeared broken → appeared to be a backend/modal POST bug. When the fallback was removed (Part B) the hydration error surfaced; fixing hydration fixed the modal. Never assume the bug is where the symptom appears.
- **Auth API fix ≠ platform shipped.** Browser DevTools / console is load-bearing verification. A clean Vercel log showing `hasEmail: true` does not prove the platform UI works. Open the page, open DevTools, exercise the failing path, confirm console is clean, confirm the network request fires. This is the only valid shipping proof for UI-facing auth fixes.
- **"Tracking 0 everywhere" and silent empty states always mean look upstream of the data layer.** Three sessions of this pattern (signals, workspace modal, entity chips): the data layer is fine; the auth layer, hydration layer, or wire-up between them is broken. When data reads "0" or "nothing", suspect the delivery path (auth → hydration → event handlers), not the data itself.

## 2026-04-30

### RSS Source Verification

- **RSS verification must check both that the feed returns valid XML AND that the items are actually about the expected topic** — The April 20 audit verified DG MARE returned HTTP 200 + valid XML + recent items, but did not verify the items were maritime/fisheries content. They were generic EU Commission press releases — the `?c=Maritime+Affairs+and+Fisheries` parameter is a category tag applied to the press release, not a filter that scopes feed output. Re-verification 9 days later caught this because we sampled actual item titles. Lesson: when adding a new RSS source, check 5 random item titles match the expected domain before committing. URL liveness is necessary but not sufficient.

- **SPEC.md "still unapplied" notes can go stale** — SPEC.md written on 2026-04-29 stated "RSS source maintenance from April 20 still unapplied" but all 4 valid source changes (NOAA parent, UK MMO, HELCOM, DFO Canada) were applied in commits on April 20 itself. At session start, cross-check SPEC.md known follow-ups against `git log --follow` on the relevant file before scoping the work — the changes may already be done.

### Supabase Count Queries

- **Supabase JS client count queries silently cap at 1,000 rows** — A `COUNT(column)` query or `select('*', { count: 'exact' })` without `head: true` on a table with >1,000 rows can return wrong results if the underlying query returns rows rather than the aggregate. Today, a diagnostic script suggested "96.9% of stories missing summaries, pipeline broken for 3 weeks" — the real number was 19.6% missing with a clean explanation (post-RSS-source-addition backlog). The fault was a count query hitting the row cap and producing a meaningless ratio. Lesson: when a count looks suspiciously high or low, verify directly in Supabase Studio (no row limit) before drawing conclusions. For programmatic counts in the JS client, always use `.select('*', { count: 'exact', head: true })` — `head: true` returns only the count, not rows, and bypasses the row cap.
