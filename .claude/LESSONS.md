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

## Process

- **Dev server bypass and API 401s**: middleware dev-bypass on `/platform/*` lets pages render without auth, but API routes still enforce session. Toggle always renders null for unauthenticated viewers. Not a bug, just a consequence of the bypass.
- **Next.js route registration on Windows**: new API route folders sometimes need `.next` cache cleared + dev server restart to register. `rm -rf .next` fixes stale route manifests.
- **Agent hallucination risk**: agents will confidently cite specific file names, line numbers, and architectural conventions that don't exist. Always require real grep output or real SQL query results before accepting architectural claims. The `story_comments` incident: agent read a migration file, assumed the table existed, built FK and RLS reasoning on it — table was never created in the database.
