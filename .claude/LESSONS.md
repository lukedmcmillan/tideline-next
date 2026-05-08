# Lessons Learned

## TODOs (carry forward)

- **EarlyAccessModal vs /start audit**: both exist and do similar jobs. When landing page rebuild stabilises, audit whether they are redundant and consolidate into one conversion flow. Decision made April 2026 to keep EarlyAccessModal wired to landing CTAs; /start routing was out of scope for the v5 rebuild.

## Workflow patterns

- **Plan-first /sc:workflow**: surfaced 4 missing files (mockup path, 3 spec files) before any code was written. Saved an entire rework cycle.
- **Verification checklist before "ship it"**: caught 5 issues that would have shipped: badge colour mismatch, untracked backup file, missing sidebar logo, 2 reduced-motion gaps.
- **ui-ux-pro-max skill integration**: locked design tokens override works when explicitly fenced in the prompt with "CRITICAL OVERRIDES" section. Without fencing, the skill's own palettes leak in.

## Database patterns (2026-05-05 additions)

- **Supabase SQL Editor closes transactions silently between query submissions**: BEGIN/COMMIT must be in a single paste submission — do not pause between BEGIN and COMMIT to run a verification SELECT. That SELECT runs outside the transaction and the transaction is silently discarded. Pattern: submit all DML inside BEGIN/COMMIT as one paste; run verification SELECT as a separate submission after COMMIT; write forward corrections if verification shows residual rows (data is already committed, no rollback available).

## Auth patterns (2026-05-05)

- **NextAuth `getToken()` cookie name mismatch on Vercel serverless**: middleware runs on Vercel Edge where `req.url` is the real HTTPS URL. Serverless API routes get an internal `http://` URL. `getToken()` auto-detects cookie name from URL scheme: HTTPS → `__Secure-next-auth.session-token`, HTTP → `next-auth.session-token`. The cookie was set with the Secure prefix, so API routes return null. Fix: pass `secureCookie: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false` explicitly to `getToken`.
- **Hardcoded email fallbacks are a security bug, not a dev convenience**: any API route with `if (!email) email = "owner@example.com"` will silently execute writes under the owner's account for any unauthenticated request. These should be treated as security vulnerabilities. The correct pattern is `if (!email) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })`.
- **Staged auth fix deployment**: when fixing auth that previously had fallbacks, always deploy the cookie-fix first with fallbacks still in place, verify authenticated requests resolve correctly in Vercel logs, then deploy the fallback removal as a second commit. Never bundle the two changes.

## Technical patterns

- **Next.js 16 dark-mode-on-one-page**: set background on the page component, not the layout. Keeps other /platform routes untouched.
- **localStorage key for daily-dismissable UI**: `tideline_<feature>_dismissed_YYYY-MM-DD`. Check on mount, set on dismiss. No server round-trip needed.
- **Ticker seamless scroll**: duplicate the items array, `translateX(-50%)` over 60s. The duplicate creates the illusion of infinite scroll.
- **prefers-reduced-motion in inline-style codebases**: add a `<style>` tag with `@media (prefers-reduced-motion: reduce)` alongside the keyframes. Avoids needing CSS-in-JS or matchMedia hooks.
- **Supabase velocity_scores delta query**: fetch latest score + score where `calculated_at <= 7daysAgo` to compute week-over-week delta. No aggregate function needed.
- **Round-robin interleaving needs per-bucket pre-caps**: without pre-caps, one flooded bucket dominates the back half when others run dry.
- **Source de-duplication (max N per publisher)**: critical for headline aggregation to avoid single-outlet dominance on breaking news days.
- **Discriminated union types (MixedTickerItem)**: render N item layouts from one API array by switching on `type` field. Scales to adding types 6, 7, 8 without touching existing handlers.
- **Next.js `revalidate = 120` on route handlers**: works cleanly for dashboard widgets aggregating 5+ queries where 2-minute staleness is acceptable.

## Architecture (verified)

- **Auth is custom magic-link + Google OAuth via NextAuth, not Supabase Auth**: all user FKs reference `public.users(id)`. No RLS on any table. Security enforced at API layer via `getEmailFromSession()` + service-role Supabase client. `auth.uid()` is not usable for RLS policies.
- **Supabase CLI not installed**: migrations applied via Supabase dashboard SQL editor. CLI install is a future task.
- **Migration files ≠ applied migrations**: a `.sql` file in `supabase/migrations/` does not mean the table exists in the database (e.g. `story_comments` migration exists but table was never created). Every migration step requires a verification query against the live database before being marked complete.

## Database patterns

- **pg_trgm short-string similarity**: trigram similarity scores on short entity names (4-8 chars) will be lower than intuitive (0.5-0.7 range on exact match). Threshold 0.4 is correctly tuned for the entities table. Do not raise the threshold above 0.5 without re-testing against short names like "Mowi", "IUCN", "WWF".
- **Verification count mismatches**: when a verification query returns an unexpected count, first check whether the expectation was based on a correct earlier observation. Do not assume migration failure before re-querying raw data with a different diagnostic approach.

## Landing page builds

- **Large section replacements (>100 lines) need Python splice scripts**: Edit tool requires matching the entire old_string verbatim; at 500+ line blocks this is impractical. Write a temp Python script with Write tool, run via Bash, then delete — find start/end byte markers, do `content[:start] + new_content + content[end:]`, write back.
- **Bash heredoc fails for complex Python**: `python3 << 'PYEOF'` with multi-line string assignments containing backticks or special chars causes "unexpected EOF". Always write the Python to a temp file instead.
- **Scoped `<style>` tags for hover/responsive**: inline `style={{}}` can't do `:hover` or `@media`. Add a `<style>{...}</style>` immediately before the section that needs it. Keep keyframe names prefixed (`lp-*`) to avoid collisions.
- **Static marketing components ≠ live data mounts**: `HeroPulseCard` is curated content with CSS animations — not a `VelocityScore` mount. Comment makes this clear and prevents future refactor confusion.
- **Dead code accumulates across phases**: after a major page rebuild, always do a final pass to grep for unused imports, unused state, and unused helper functions. In the v5 rebuild: `roles`, `formatVerifiedDate`, `PulseFallback`, `PulseErrorBoundary`, and 3 dead component imports survived all 8 build phases until a dedicated cleanup step.

## Claude Design handoff workflow

- **Design handoff README is the single source of truth, not the JSX refs**: the JSX files in `design/` are browser prototypes (Babel-standalone, inline styles for fidelity). Don't copy them. Read the README spec precisely — it documents measurements, hex codes, and copy independently of the JSX.
- **Inline styles conflict with Tailwind instruction**: if a handoff prompt specifies Tailwind utilities but the codebase convention is inline styles, the codebase wins. `CLAUDE_RULES.md` is the tie-breaker. Confirm the pattern before writing a single component.
- **Circular import from shared interface**: if component A imports from component B and B imports from A, inline the shared type in B rather than creating a third shared file. For a 6-field interface, a third file is over-engineering.
- **CSS mob-hide/mob-show-block for SSR-safe mobile split**: prefer CSS class toggle at the breakpoint over JS `useEffect`/viewport detection. CSS is applied at parse time — zero CLS on first paint, no hydration gap.
- **Comparison sections rarely translate to mobile**: side-by-side comparison columns depend on horizontal space for their value proposition. At 390px, stacked columns lose the contrast effect. On mobile, promote the closing value statement to a standalone band rather than keeping the full table.
- **Design token reconciliation across files**: before adding new CSS custom properties, check globals.css for existing names at similar hex values. The handoff used `--bg-warm: #FAFAF7` which matched; `--navy: #0B1628` was spelled correctly but globals had a legacy alias `--navy-deep: #0A1628` with a different value — update the conflicting token, don't add a duplicate.
- **`text-wrap: balance` TypeScript workaround**: TypeScript strict mode rejects `textWrap: "balance"` as not in `CSSProperties`. Cast as `as never` — it's a known gap between the TS DOM types and browser support. Do not suppress with `@ts-ignore` which is broader.

## Design system rules need user verification before treating as locked

- **"Locked" design rules can be wrong**: the italic-on-accent-word pattern was documented as locked (per README handoff spec and prior sessions) but turned out to be wrong — italics were removed site-wide in a later pass. A rule documented in a spec is not ground truth; it reflects the designer's thinking at the time. Always verify with the user before treating a visual rule as immutable across multiple build sessions.
- **Desktop vs mobile italic inconsistency**: mobile file had `fontStyle: "italic"` throughout; desktop had already used `fontStyle: "normal"` everywhere. A single replace_all on mobile was sufficient — desktop needed no italic changes. Always grep both files before assuming symmetry.
- **DM Mono vs DM Sans split**: the rule is clean — DM Mono stays for eyebrow labels (uppercase section labels, UI pills, tracker tags) and goes everywhere else (trust lines, sub-lines, inline body copy). When in doubt: if it reads like body copy to the user, it should be DM Sans.

## Feature retirement

- **Remove feature code AND its dead data flows**: when removing a UI feature (Related Stories), also remove the state variables, API fetch calls, type interfaces, and Promise.all entries that existed solely to feed it. Leaving dead fetches wastes bandwidth on every page load. In the IUU tracker, `Promise.all` went from 4 fetches to 3 after removing the stories fetch.
- **Grep broadly, act narrowly**: `grep -rn 'related'` catches everything, but most matches are incidental text ("ocean-related", "related fields"). Categorize hits into feature code vs. prose before touching anything.

## Feed / source management

- **RSS source config needs periodic auditing**: DG MARE was misconfigured from initial setup, silently polluting the feed with general EC content for months. A source that looks legitimate at setup can drift or was wrong from day one — audit periodically against actual output.
- **OCEAN_DEDICATED_SOURCES fast-lane bypass is a double-edged sword**: misconfigured sources in this list skip the keyword filter safety net entirely. Misconfigured fast-lane sources are more dangerous than misconfigured standard sources.
- **"Built" ≠ "shipped"**: always check `git status` and verify the Vercel deploy SHA matches the latest commit before calling a feature live. A feature in local code that hasn't deployed is not live.

## Onboarding / Entity data quality

- **Lloyd's Register apostrophe inconsistency**: DB canonical name is `"Lloyds Register"` (no apostrophe). Alias `"Lloyd's Register"` was backfilled. Future cleanup: normalise canonical name to include apostrophe and update alias accordingly. Low priority but will cause silent mismatch if code does exact name comparisons.
- **BLUE constant in /start page is legacy debt**: `/start` is v1 and receives no new traffic since EarlyAccessModal replaced it. The BLUE violation auto-resolves when `/start` is deleted. Check Vercel analytics after 30 days — if zero traffic, delete `/start` route and `/api/trial-signup` endpoint together.
- **Onboarding starter set: verify by canonical name AND alias before declaring entities missing**: `starter-sets.ts` config names are matched against `entities.name` (exact). If a config name is an alias rather than the canonical name, the entity is silently skipped. Diagnosis must check both `entities.name` and `entity_aliases.alias_text` before concluding an entity doesn't exist in the DB.
- **ngo_campaigner starter set revision pending**: 10-entity list finalised in chat (2026-04-29) but NOT applied to `starter-sets.ts`. Do not touch that file until the list is pasted in explicitly next session. See conversation transcript for the 10 entities.

## Entity dedup

- **Unique constraint (name, entity_type) blocks setType-before-delete in merges**: When merging entity A (org) ← entity B (ngo) with `setType='ngo'` on A, attempting to set the type before deleting B causes a constraint violation because A-as-ngo duplicates B. Fix: delete FK-dependent children first, then delete B, then setType on A. Always check for `parent_entity_id` FK children before deleting an entity row.
- **Truncated UUIDs in specs cause "not found" failures**: The dedup workflow spec used 8-char UUID prefixes (e.g. `a0e62d32`). Always resolve to full UUIDs via a lookup query before running merge scripts. Scripts should fail loudly on "not found" rather than silently skipping.
- **Entity ID lookup script pattern**: `supabase.from('entities').select('id,name').in('name', [...])` in a one-off tsx file is the fastest way to resolve names to UUIDs before a bulk operation.

## Entity matching

- **extractEntities vs matchEntitiesToStory**: extractEntities (old) discovered new entities via Claude Haiku and wrote mentions without scores. matchEntitiesToStory (new) matches against seeded taxonomy using 3 passes and writes match_score, match_method, confidence. Never mix — one creates entities, one matches them.
- **Entity matching only fires when short_summary is set**: new stories have no summary at feed-fetch time. Guard `if (s.short_summary && !s.entities_extracted)` prevents wasteful passes on empty stories. Backfill script handles historical corpus.
- **Backfill via script, not HTTP endpoint**: matchEntitiesBatch on 50 stories with embedding calls exceeds Vercel's function timeout. Always run bulk backfill via `scripts/backfill-entity-matching.ts` (20 stories/pass, no timeout). The HTTP endpoint is fine for top-ups of 5–10 stories.
- **SQL fragments pasted in wrong terminal create garbage files**: pasting multi-line SQL or code into PowerShell/bash creates files named after the tokens (`,- `, `2`, `MAX_MATCHES_PER_STORY)`, etc.). Always run SQL in Supabase Studio. Delete garbage files before committing.

## Entity brief pipeline

- **Significance score distribution is heavily right-skewed**: median=0, P75=15, P90=42, P95=52 (with 1000 live stories). Thresholds calibrated at Material>=25, Watch 10-24. Do not use intuitive 0-10 scale — the field is 0-92 range.
- **Quiet-dominant is the primary brief template, not the fallback**: given median=0, most users most days will have 0 material/watch stories. Design the quiet template first. Substance comes from velocity_scores pulse data.
- **PostgREST `.order()` on embedded resources fails**: `.order("stories.significance_score", {ascending: false})` throws "failed to parse order". Fix: `.order("significance_score", { ascending: false, foreignTable: "stories" })`.
- **PostgreSQL TIME column returns "HH:MM:SS"** from Supabase JS, not "HH:MM". Always split on ":" and take first two components when comparing to brief_time.
- **morning_brief_queue status constraint**: `pending | sent | failed | skipped` — no 'ready'. Use 'pending' for queued-but-not-sent state.
- **send-brief had wrong column name**: `users.status` does not exist — correct column is `users.subscription_status`. Bug was masked by TEST_EMAIL mode (never hit the query). Always verify column names against migration files before shipping a send cron.
- **Pipeline mutual exclusion via onboarded_at**: `onboarded_at IS NOT NULL` → entity brief. `onboarded_at IS NULL` → legacy topic brief. Users migrate automatically on onboarding completion. Never add both pipeline queries to the same cron.

- **Diagnostic script before cron build**: for data-dependent pipelines (entity feed, brief composer), write a `scripts/test-*.ts` diagnostic first. Run it against real DB to get: distribution stats, test user output, raw query results, rendered HTML. Calibrate thresholds from real data, not assumptions. Caught: wrong significance scale (0-10 vs 0-92), PostgREST order syntax error, and all-quiet user state before writing any cron logic.

## Signal generation

- **Content generators ship with silent filter bugs**: every generator needs a simulation query testing end-to-end before trusting count output. Count-only tests miss wrong column names, missing whitelist values, and dedup false positives. Write a diagnostic script first.
- **stories uses fetched_at, not created_at**: `stories.fetched_at` is the ingestion timestamp. Other tables (signal_events, entity_mentions, etc.) use `created_at`. Column names are not consistent across tables — always verify per table.
- **Tracker slug convention varies by data source**: `cross_tracker_flags` stores underscores (e.g. `imo_shipping`); routes use hyphens (`imo-shipping`). Normalise with `.replace(/_/g, "-")` immediately on read — never compare raw flag values to slug arrays.
- **cross_tracker_flags is the authoritative story→tracker link**: `stories.topic` is a broad category (fisheries, shipping, governance) and must not be used for tracker routing. Only `cross_tracker_flags` maps stories to specific tracker slugs.

## Ops / environment

- **Shell env vars don't persist across PowerShell sessions**: always reload `CRON_SECRET` at session start using `Get-Content`. Don't assume a variable set earlier in the day is still available in a new terminal.
- **SQL goes to Supabase Studio, not PowerShell**: pasting multi-line SQL into PowerShell creates empty garbage files named after the SQL tokens. Always run migrations via Supabase dashboard SQL editor.

## Git / deploy discipline

- **Git status check after every Claude Code "done"**: three times this week local commits weren't pushed to origin, causing "it doesn't work on production" confusion. Always run `git status` + `git log --oneline -3` and confirm the Vercel deploy SHA matches before calling a feature live.
- **Migration files in supabase/migrations/ are not auto-applied**: a `.sql` file in that directory does not mean the table exists in the database. Every migration must be manually run in Supabase Studio and verified with a diagnostic query.
- **Build failures block ALL deploys, not just the broken feature**: a TypeScript error in any file prevents every pending feature from reaching production. Check Vercel build status after every commit — a pushed SHA is not a deployed feature until the build passes.
- **Claude Code can confidently report fixes for files it never committed**: always verify with `git log` + `git status` after a fix claim. The agent may describe a change as done while the file sits modified and unstaged.
- **Never leave modified files across task boundaries**: uncommitted drift (entity-brief sat modified for hours unreviewed) causes changes to be swept into unrelated commits accidentally. Every task boundary: commit what's ready, revert what isn't.

## Dashboard / signals architecture

- **Sliding minimum window pattern for activity feeds**: a fire-and-forget `last_seen = NOW` on every API call is self-defeating — it shrinks the window on every refresh until users only see signals created in the last few seconds. Fix with a floor: `since = min(last_seen, now - 6h)`. Users always see at least 6 hours of activity even on rapid refresh.
- **`last_dashboard_view` should only update on explicit acknowledgment**: updating on every GET request conflates "I looked at the dashboard" with "I read everything up to this point." In v2, add a separate `acknowledged_at` column and only update it when the user takes an action (e.g. dismiss all, mark read).
- **Two-table topic storage was a silent failure**: `users.topics` (jsonb array) and `user_topics` (separate table) co-existed. Code split across both with no warning: `getUserTrackedDomains()` queried the table (which didn't exist), failed silently, and returned ALL_SLUGS. `new-stories` API read the jsonb column correctly. A seed targeting one was invisible to the other. Lesson: pick one source of truth per concept and enforce it with a grep check in code review.
- **Live diagnostic scripts over static code reading**: the signals "all quiet" bug was undiagnosable by reading code alone. A 40-line `scripts/diag-signals.mjs` replicated the exact API query server-side, revealed `since = 14 minutes ago` (not 3 hours), and identified the exact filter cutting all rows. Write a diagnostic before guessing.

## Library / Document Pipeline

- **document_queue is a manual-only pipeline**: `scripts/processor-agent.ts` drains the queue (scraper → documents table). No Vercel cron equivalent exists. If the script exits mid-run, items stay stuck in `processing` status — reset with `UPDATE document_queue SET status = 'pending' WHERE status = 'processing'` before re-running.
- **embed-documents cron has a silent window bug**: fetches 100 most-recently-created approved docs, filters to those without chunks. Once the newest 100 are embedded, it silently processes 0 forever. Fix: use `NOT IN (SELECT document_id FROM document_chunks)` with pagination, not a recency cap.
- **Supabase REST API returns max 1,000 rows regardless of limit**: Node scripts using `supabase.from(...).select(...).limit(5000)` will never get more than 1,000 rows. Use paginated fetches (`.range(0, 999)`, then `.range(1000, 1999)`, etc.) for full-table diagnostics.

## Prompt Caching

- **1024-token minimum for cache activation**: `cache_control: { type: "ephemeral" }` on a system prompt block below 1024 tokens does nothing — Anthropic ignores it. Add markers anyway as forward-proofing, but don't count on savings until prompts grow. Haiku 4.5 minimum is 2048 tokens.
- **Call volume × prompt stability = caching priority**: ocean-relevance-gate (~890 calls/hour) with a ~250 token prompt is lower actual savings than a lower-volume route with a 2000+ token stable system prompt. Always multiply volume × prompt size to estimate real savings.

## NextAuth / session

- **`useSession()` fails at runtime, not compile time**: the error only surfaces when the page loads. Pre-flight check before adding any `useSession` import: `grep -rn "SessionProvider" app/ components/` to confirm a provider is mounted above the target component. In this codebase, `SessionProvider` is scoped to `app/platform/(shell)/layout.tsx` — non-platform routes (`/onboarding`, `/sign-in`, trackers) have no provider and will throw. Fix: create a scoped `layout.tsx` wrapping the target route with `SessionProvider`, rather than adding it to root layout.

## Process

- **Dev server bypass and API 401s**: middleware dev-bypass on `/platform/*` lets pages render without auth, but API routes still enforce session. Toggle always renders null for unauthenticated viewers. Not a bug, just a consequence of the bypass.
- **Next.js route registration on Windows**: new API route folders sometimes need `.next` cache cleared + dev server restart to register. `rm -rf .next` fixes stale route manifests.
- **Agent hallucination risk**: agents will confidently cite specific file names, line numbers, and architectural conventions that don't exist. Always require real grep output or real SQL query results before accepting architectural claims. The `story_comments` incident: agent read a migration file, assumed the table existed, built FK and RLS reasoning on it — table was never created in the database.
- **Claude Code audits can be confidently wrong**: push back with actual queries when audit results don't match observed behaviour. The agent will assert something is broken based on static code reading; a real DB query or curl test is the ground truth.

## Postgres / Supabase patterns (2026-05-08)

- **GIN index supports `@>` (array containment) but NOT `ILIKE` on unnested elements**: for alias exact-match search, store aliases lowercase and use `aliases @> ARRAY[lower(q)]` — this uses the GIN index. `WHERE lower(q) = ANY(aliases)` or ILIKE-on-unnest does not use the index and becomes a seq scan per row. The correct pattern is the `@>` containment operator.
- **Migration UPDATEs should match by canonical name, never by UUID**: UUIDs are instance-specific. Name-based UPDATEs are portable and idempotent (no-op if entity doesn't exist on the instance). If a canonical name changes, the migration must be updated in the same commit.
- **supabase gen types exits 1 on stderr noise**: `npx supabase gen types typescript --linked > file.ts` returns exit code 1 when the CLI emits "Initialising login role..." to stderr, even on success. Workaround: redirect stdout only (`> /tmp/sb_types.ts`), verify line count, then `cp` to target.

## Codebase archaeology patterns (2026-05-08)

- **Read migrations before assuming schema state**: the live schema may have diverged significantly from the CLAUDE.md table list. Three tables in CLAUDE.md were dropped or replaced by the time of the RAG audit. Always read the migration sequence (sorted by date) to reconstruct current schema state.
- **Broken crons can be invisible**: `/api/cron/generate-embeddings` was querying a dropped table and failing nightly at 1am with no visible symptom in Vercel dashboard unless you look at cron_log. When auditing, always cross-reference cron handlers against current schema.
- **Watch for Jina model version divergence**: `jina-embeddings-v2-base-en` (768-dim) and `jina-embeddings-v3` are different models producing incompatible vectors. If different crons or scripts use different model versions, embeddings written by one cannot be matched against those written by the other. Confirm all writers use the same model string before trusting similarity scores.
