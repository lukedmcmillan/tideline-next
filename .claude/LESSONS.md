# Lessons Learned

## Workflow patterns

- **Plan-first /sc:workflow**: surfaced 4 missing files (mockup path, 3 spec files) before any code was written. Saved an entire rework cycle.
- **Verification checklist before "ship it"**: caught 5 issues that would have shipped: badge colour mismatch, untracked backup file, missing sidebar logo, 2 reduced-motion gaps.
- **ui-ux-pro-max skill integration**: locked design tokens override works when explicitly fenced in the prompt with "CRITICAL OVERRIDES" section. Without fencing, the skill's own palettes leak in.

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

## Feature retirement

- **Remove feature code AND its dead data flows**: when removing a UI feature (Related Stories), also remove the state variables, API fetch calls, type interfaces, and Promise.all entries that existed solely to feed it. Leaving dead fetches wastes bandwidth on every page load. In the IUU tracker, `Promise.all` went from 4 fetches to 3 after removing the stories fetch.
- **Grep broadly, act narrowly**: `grep -rn 'related'` catches everything, but most matches are incidental text ("ocean-related", "related fields"). Categorize hits into feature code vs. prose before touching anything.

## Feed / source management

- **RSS source config needs periodic auditing**: DG MARE was misconfigured from initial setup, silently polluting the feed with general EC content for months. A source that looks legitimate at setup can drift or was wrong from day one — audit periodically against actual output.
- **OCEAN_DEDICATED_SOURCES fast-lane bypass is a double-edged sword**: misconfigured sources in this list skip the keyword filter safety net entirely. Misconfigured fast-lane sources are more dangerous than misconfigured standard sources.
- **"Built" ≠ "shipped"**: always check `git status` and verify the Vercel deploy SHA matches the latest commit before calling a feature live. A feature in local code that hasn't deployed is not live.

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

## Ops / environment

- **Shell env vars don't persist across PowerShell sessions**: always reload `CRON_SECRET` at session start using `Get-Content`. Don't assume a variable set earlier in the day is still available in a new terminal.
- **SQL goes to Supabase Studio, not PowerShell**: pasting multi-line SQL into PowerShell creates empty garbage files named after the SQL tokens. Always run migrations via Supabase dashboard SQL editor.

## Process

- **Dev server bypass and API 401s**: middleware dev-bypass on `/platform/*` lets pages render without auth, but API routes still enforce session. Toggle always renders null for unauthenticated viewers. Not a bug, just a consequence of the bypass.
- **Next.js route registration on Windows**: new API route folders sometimes need `.next` cache cleared + dev server restart to register. `rm -rf .next` fixes stale route manifests.
- **Agent hallucination risk**: agents will confidently cite specific file names, line numbers, and architectural conventions that don't exist. Always require real grep output or real SQL query results before accepting architectural claims. The `story_comments` incident: agent read a migration file, assumed the table existed, built FK and RLS reasoning on it — table was never created in the database.
