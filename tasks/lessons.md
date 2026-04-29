# Lessons Learned

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
