# Tideline — Live Project Status

## Last session: 2026-05-07 — Auto-attach pipeline verified end-to-end

WHAT SHIPPED (2026-05-07):

- **`supabase/migrations/20260505_matched_entity_id.sql` applied to production** — `matched_entity_id uuid REFERENCES entities(id)` column added to `project_auto_entries`. Verified with `information_schema.columns` SELECT inside transaction.
- **`lib/entity-matching.ts` ON CONFLICT bug fixed** (commit `f34a1cb`) — Replaced `.upsert(..., { onConflict: "project_id,story_id" })` with plain `.insert()` + `error.code === "23505"` catch. Root cause: partial unique index (`WHERE story_id IS NOT NULL`) cannot be resolved by Supabase JS `onConflict` syntax.
- **Auto-attach pipeline VERIFIED end-to-end** — Synthetic test: PASS (story `1e86bce2` → `project_auto_entries` row for auth-test-2, `matched_entity_id = BBNJ Agreement`). Real-data replay: 4 stories auto-attached to auth-test-2 (2× BBNJ Agreement, 2× International Whaling Commission).
- **Entity picker dropdown overflow fix** (commit `3b0818e`) — `overflow: hidden` → `maxHeight: 280, overflowY: "auto"` in `NewProjectModal` results container.

WHAT WAS ALREADY SHIPPED (2026-05-06):
- **React hydration fix** (commit e5dc826) — 4 mismatch sources resolved: `SidebarDatetime`, `greeting()`, `Sparkline` gradient ID, workspace placeholder. Console clean on all `/platform/*` routes; no #418 errors.
- **Auth fix Part A** — `getToken()` passes `secureCookie` derived from `NEXTAUTH_URL`. VERIFIED.
- **Auth fix Part B** — 6 hardcoded email fallbacks removed; all routes return 401 on null session. VERIFIED.
- **Threshold alert email upgrade** — React Email template shipped.
- **Active project watcher** (Phases A-E) — `project_entities` migration, route handlers, entity-matching auto-attach hook, workspace UI (entity chips, new-item badge, amber highlight), two-step `NewProjectModal`.
- **User_id consolidation** — gmail `c652fd7f-...` is canonical; all preference/activity tables migrated.

PENDING MIGRATIONS:
- None. All migrations from 2026-05-05/06/07 applied and verified.

OPEN PRODUCT QUESTION (deferred for user research):
- What do users DO with auto-attached stories? Workspace product theory needs grounding in real conversations before building further interaction features (story detail view, dismiss, accept, draft export).

NEXT PRIORITIES (in order):
1. **BUG (P1)**: Auto-attached stories not clickable — need story detail modal or link to `/platform/story/[id]`
2. **BUG (high)**: Entity picker acronym search — typing `iwc`, `isa`, `bbnj` returns no results; need alias-aware search
3. **DESIGN**: Workspace product theory — 2-3 user conversations before building more interaction features
4. **INVESTIGATE**: ISA Secretariat tracker_tag = null; audit and backfill
5. **DESIGN**: Unify Tags vs Tracked Entities (two parallel systems: topic_tags + project_entities)

---

## Previous: 2026-05-01 — incomplete commit cycle (resolved)

## Previous: Morning brief world-class rebuild (2026-05-01, commit 1c586b1)

- New mobile-first brief shipped end-to-end. Cream background (#FAFAF7), system font stack, no DM Sans, no em dashes, no Plus Jakarta Sans.
- Architectural shift: generate-brief now structures candidate pool (60 stories, 7-day window, 10 trackers, 14-day events). send-brief now per-user renders via compileBriefHtml.
- Phase 1-4 complete and committed. Phase 4c TEST_EMAIL verified end-to-end with two distinct user topic sets (lukedmcmillan@gmail.com 7-topic, lukedmcmillan+prodtest2@gmail.com 3-topic). Per-user filtering confirmed working: different leads, conditions, evidence, across-sector content per user.
- Subject line format: '[Cleaned headline] · [Pulse score OR event day-label]'. Double-Pulse guard prevents 'Pulse 5.9 ... · Pulse 5.6' repeats.
- Quick Ask rotating library shipped: 10 weekday variants (5 days x A/B) + 3 edge cases (first_brief, high_significance_week, quiet_week).
- Sign-off is day-aware: Mon-Thu 'Have a good [day]. I'll see you tomorrow at 7am.' Fri 'Have a good weekend. I'll see you Monday morning.'
- TRACKER_LABELS split from TOPIC_LABELS — tracker slugs (10 entries) and story topic values (9 entries) are now separate maps. Vitest 48/48 passing.
- selectEvidence dedup: same-topic stories with 3+ overlapping headline words within 7 days collapse to the higher-significance story.
- Action signal tiebreaker: within 10 significance points, prefers stories with action keywords (ratif, adopt, enforc, sanction, decision, resolution, agreement, signed, implement, deadline, mandate, binding, consultation, vote). ACTION_SIGNAL_KEYWORDS exported from utils.ts.
- ConditionRow.interpretation field added: populated from velocity_scores.interpretation (truncated 80 chars) or rule-based band fallback (ELEVATED/WATCH/LOW). Renders 11px muted below the score row.
- Haiku SUMMARY_SYSTEM_PROMPT rewritten twice: first for operator voice + epistemic restraint (removes consultant-voice), then refined to remove 'narrating ignorance' tic. Final prompt: 4-priority sentence 2 logic (named concrete change > next event > named entity > one additional fact). Banned phrases include 'remain unclear from source', 'not detailed in available text', any hedge on writer's knowledge. 0/45 summaries flagged on final scan.
- generate-brief writes structured JSONB to brief_buffer.stories: { candidate_stories, all_tracker_scores, all_events, work_revealed_count, generated_at }. html_content set NULL.
- send-brief detects legacy Array format and skips with 200 + log (no 422 errors).
- Subscription filter for brief eligibility: 'active', 'trial', 'trialing'.
- vercel.json schedules confirmed weekday-only (1-5) for both generate-brief and send-brief.

Pending follow-ups (NOT blocking — monitor first production week):
- TRACKER_TO_TOPICS is coarse: plastics, bbnj, 30x30 all map to 'governance'. selectLead may surface BBNJ stories to plastics-tracker subscribers. Fix paths: (a) granular AI topic tagging, (b) substring keyword filter post-topic-match. Revisit after first week of real subscriber data.
- velocity_scores returned 10 trackers in cron run; confirm whether all 11 expected slugs are scoring.
- BBNJ tracker reads 1.2 LOW despite governance topic having content — attribution path issue or genuine low BBNJ activity. Investigate.
- Dual summarisation debt: generate-brief and summarise-pending both call Haiku for the same stories with different output formats. Haiku cost doubled. Consolidate when brief is stable in production.
- TIDELINE-CONTEXT.md is UTF-16 encoded, garbled in terminal. Convert to UTF-8 and recommit.
- ngo_campaigner starter set revision pending: 10-entity list (regulators + treaties + watchdogs, no peer NGOs). Drafted in chat. Apply before more subscribers sign up under that job_type.
- Welcome screen build (/platform/welcome): investigation complete, build pending. Top 3 entities by 30-day mention count; rule-based 'why it matters' lines; cold-start caveat.
- lukedmcmillan@gmail.com topics: confirm current 7-topic state is real preference or revert.

Next session priority: monitor production morning brief for one full week. Watch open rates, Quick Ask reply rates, churn signals. Then prioritise: (a) ngo_campaigner starter set, (b) welcome screen build, (c) divergence detection (spec deferred).

---

## Previous: Entity embeddings + semantic match activation (2026-04-29, commit 1b6951e)

- Migration `20260429_entity_embedding_to_768.sql`: entities.embedding changed from vector(1536) → vector(768) to match Jina v2; RPC signature updated; ivfflat index recreated (lists=31)
- `scripts/embed-entities.ts`: mirrors embed-stories.ts pattern, 942/942 entities embedded via Jina, 0 failures (~2 min)
- `package.json`: `embeddings:entities` npm script added
- `matchEntitiesToStory` Pass 3 (semantic) confirmed live: `[exact, semantic]` firing
- Backfill run (182 stories, 11 loop iterations): 677/942 entities now have >= 1 story mention; 265 unmentioned remain (niche/not-yet-in-feed — expected)
- `app/onboarding/page.tsx`: JWT refresh via `useSession().update()` before redirect when `needsOnboarding=false` (fixes middleware staleness loop)
- Paste artifact cleanup: 6 shell-paste artifact files deleted before commit

---

## Previous: Entity dedup pass (2026-04-29)

Foundation work — completed and verified:
- mention_count integrity restored (8759 → 758, invariant SUM(mention_count) = COUNT(entity_mentions) holds)
- Bug 2 fixed in lib/entity-matching.ts:213 (conditional increment, ignoreDuplicates: true)
- Bug 2 verified by automated test: __tests__/entity-matching.idempotency.test.ts (passing)
- Bug 3 migration applied: entities.mention_count DEFAULT 0
- 7 entity merges executed (US three-way, UN, Trump, PLOS, ESA, Drones, Oceana)
- 7 noise entities deleted (US convenience store giant + 6 off-topic)
- 5 individual-type rows normalised to person
- 8 new aliases backfilled (11 already existed from seed loader)
- entity_review_queue migration applied
- findOrCreateEntity 5-pass helper installed in lib/entity-matching.ts
- Legacy lib/entities.ts deleted (orphaned since c351d8c)
- Vitest framework installed and configured (vitest.config.ts with @/ alias, dotenvx-wrapped test:run and test:watch scripts)
- Three corrupted shell-paste artifact files removed from repo (were blocking Vercel build; named 'ntent scripts*.ts', created by bash misinterpreting PowerShell paste)

Final entity table state: 942 entities, 688 aliases, 758 mentions, 0 'individual' type rows.

Known follow-ups (not blocking):
- 265 of 942 entities still have 0 story mentions — these are niche/seeded entities not yet covered by the feed. Will reduce naturally as cron runs with Pass 3 active.
- RSS source maintenance from April 20: APPLIED (verified 2026-04-30). NOAA, UK MMO, HELCOM, DFO Canada all in sources.ts since April 20 commits. Dead NOAA Fisheries/EEA URLs also removed April 20. DG MARE skipped — `?c=` parameter does not filter content; deferred (see below).
- 21 npm vulnerabilities reported by vitest install — do not run npm audit fix --force, leave alone unless one of the 2 highs is in production code.
- `backfill-entity-matching.ts` only processes stories with `entities_extracted IS NULL/false`. Stories previously marked `entities_extracted=true` were not re-run through Pass 3. Future cron runs will cover new stories going forward.

Deferred (medium priority):
- **DG MARE RSS endpoint** — Press Corner `?c=Maritime+Affairs+and+Fisheries` does not filter feed content; returns generic EU Commission press releases. Investigate correctly-scoped endpoint or scrape `https://oceans-and-fisheries.ec.europa.eu/news_en` directly via Jina.

Next session priorities (in order):
1. Resume morning brief pipeline (priority 1 from TIDELINE-CONTEXT.md)
2. Morning brief: personalised 7am email, pulls from stories + velocity_scores filtered by user_topics, quality-gated, via Resend

---

## What's built and live
- Daily brief (89 sources) ✓
- BBNJ tracker (live data) ✓
- Research / RAG layer ✓
- Entity directory (153+ entities) ✓
- Auth, subscriptions, Stripe ✓
- lp_portfolios table + lp_briefing view ✓
- GET /api/lp-briefing ✓
- GET /api/lp-briefing/pdf ✓ (PDFKit, serverExternalPackages fix applied)
- Portfolio Intelligence Briefing UI at /platform/lp-briefing ✓
- Entity search API at /api/entities/search ✓
- Supabase MCP live ✓
- Ruflo V3 installed (98 agents, 15-agent swarm) ✓
- Claude Skills installed ✓

- Cron refactor: 4 shared modules extracted (sources, html, jina, confidence), 2 auth fixes, ~350 lines removed ✓
- Conflict tracker with Pulse Score methodology ✓
- Dashboard redesigned as 2x3 card grid ✓
- Dashboard v2 Sprint 1 (wow layer) COMPLETE and shipped ✓
  - 17 new files: types, events seed, 6 API routes, 9 components (Sparkline, TickerStrip, OvernightReveal, HeroSignal + 5 subtypes)
  - 2 files modified: layout.tsx (sidebar logo + datetime + readiness placeholder), page.tsx (full dark-mode rewrite)
  - page.old.tsx gitignored as backup, delete at end of Sprint 3
- Threshold alerts end-to-end: seed script, AlertToggle, preferences API, cron route, alert_sends table ✓
- Ticker v2: /api/dashboard/ticker returns MixedTickerItem[] with 5 types (headline, score_delta, countdown, new_divergence, doc_ingestion). Interleaved round-robin with per-bucket caps. 2-minute revalidate. /api/trackers/ticker deleted. ✓

## Dashboard Sprint 2 carry-forward
1. Wire /api/dashboard/readiness to real data (need new schema: docs_read, tracker_dashboard_visits_last_7d)
2. Wire /api/dashboard/proof-of-work to real data
3. Wire /api/dashboard/upcoming-30d cells to velocity_scores weekday averages
4. Hero Signal headline accent: implement with structured headline fields, not colon heuristic
5. Build ReadinessWidget component (replaces sidebar placeholder)
6. Build CalendarHeatmap component

## Entity Tracking (Week 1)
- Step 1: Schema migration applied and verified ✓ (20260418_entity_tracking_v2.sql)
  - entities: +parent_entity_id, tracker_tag, description, metadata, embedding vector(1536)
  - entity_mentions: +match_score, match_method, confidence, significance
  - New tables: entity_aliases (trigram index), user_entities (FK public.users), entity_starter_sets (6 job types)
  - pg_trgm extension enabled, ivfflat index on entity embeddings
  - No RLS — matches existing pattern (alert_log, alert_sends, brief_sends, user_alert_preferences)
- Step 4: Onboarding v2 migration and fuzzy match RPCs ✓ (20260419_onboarding_v2.sql)
  - users: +job_type, +brief_time (default 07:00), +onboarded_at (timestamptz)
  - entities: +created_by (FK users.id) for user-generated entity audit
  - New table: morning_brief_queue (user_id, scheduled_for, status, sent_at)
  - Fuzzy match RPCs: match_entities_by_name, match_entities_by_alias (pg_trgm, threshold 0.4)
  - Both RPCs tested against live data. Mowi returns 0.57 similarity on exact match.
  - Backfill verified: hotmail account onboarded_at set; gmail account correctly left NULL
  - Onboarding UI scaffolded (4-step dark theme: job type > entities > brief time > confirm)
  - Awaiting seed CSV load before deploy
- Step 2: NEXT — seed-entities.csv with 500 entities across 6 categories. Must UPSERT to enrich existing 496 rows (name + entity_type only), not INSERT (unique constraint).
  - Continue seed research in parallel chat
- Step 3: Seed loader script — BLOCKED on Step 2 completion
- Step 5: Entity matching function — BLOCKED on Step 2 completion

## Completed this session (2026-04-20)
- Week 2 source gap fix — critical feed quality audit and remediation ✓
  - RSS sources reduced from 80 to 38: removed 36 dead/low-value feeds, fixed 12 URLs (Oceana, Mongabay, Hakai, etc.)
  - Jina scraper targets increased from 7 to 14: added IWC, SeafoodSource, ICCAT, OSPAR news, MSC, TradeWinds, CBD news
  - Per-source daily cap implemented in fetch-feeds cron: 15% of daily total, floor of 5 stories/source
  - New shipping sources: gCaptain, Splash247, TradeWinds (Jina)
  - CBD Secretariat confirmed dead RSS ("Under Construction"), migrated to Jina at cbd.int/news
  - Feed cron verified: 123 saved, 178 skipped, 23 sources capped, 19.5% quarantine rate on ocean-relevance gate
  - 8 sources showing intermittent failures (CITES, WWF, DSCC, Nature Ocean, Scripps, WHOI, BAS) — monitoring 24h
- Related Stories feature removed from 11 files (story detail + 10 trackers) ✓
- PROJECT_INDEX.md refreshed ✓
- Hero Signal v3 plan produced (pending approval) ✓

## Completed this session (2026-04-21)
- Ocean-relevance gate shipped in shadow mode ✓ (3 commits: gate, batching, freshwater tune)
  - Gate first-run data: 28.4% quarantine rate, ~95% accuracy, avg 749ms per Haiku call
  - After RSS cleanup: 18.4% quarantine rate on 168 processed
- RSS source cleanup ✓
  - Removed: PLOS ONE Marine, Phys.org Ocean, Bloomberg Green (noisy); DSCC duplicate; DG MARE and EPA Water News (misconfigured)
  - Sources: 87 → 83 total, 66 → 61 OCEAN_DEDICATED
- 34 RSS sources still failing: FAO, IMO, CITES, IWC, CBD, Oceana, IUCN — critical gap, fixing tomorrow
- PROJECT_INDEX.md refreshed ✓
- **Week 2 entity matching — COMPLETE AND VERIFIED ✓**
  - Step 5: matchEntitiesToStory built — 3-pass (exact substring → fuzzy trigram → semantic embedding)
  - Step 6: deferred — embeddings backfill scheduled post-Week 3
  - Step 7: matcher wired into fetch-feeds cron and backfill-entities admin route; extractEntities fully replaced
  - Backfill run: 20 stories → 53 entity mentions written, 2.7 avg/story, 0 errors
  - BBNJ, IMO, ISA, LTC governance stories matching correct seed entities
  - entity_mentions table: match_score, match_method, confidence all populated
  - entities_extracted flag set on all 20 processed stories
  - Ocean-relevance gate flipped to BLOCKING mode ✓

## Completed this session (2026-04-21, continued)
**Week 3 — Morning Brief Pipeline — FUNCTIONAL ✓**
- Steps 8, 9, 10 complete: generate-entity-briefs cron + send-entity-briefs cron + entity-brief library
- First brief sent successfully to lukedmcmillan@hotmail.com at 14:28 UTC
- Quiet-dominant template rendering correctly
- Pulse substance surfacing: ISA 6.5 WATCH accelerating, IMO 5.9 WATCH accelerating, BBNJ 1.2 LOW stable
- Tracker display names correct (TRACKER_DISPLAY_NAMES map: ISA, BBNJ, IMO, 30x30, etc.)
- Design system holds (DM Sans, navy/teal, 600px, no em dashes)
- Significance thresholds calibrated to real distribution (P95=18): Material >= 25, Watch 10-24
- send-brief subscription_status bug fixed (.in("subscription_status",...) + .is("onboarded_at", null))
- One queued row failed on send — under investigation (likely Resend rate limit or duplicate queue entry)
- vercel.json NOT yet updated — awaiting material-present brief test

## Completed this session (2026-04-22) — part 3
**Fruit Machine Phase 4 — /api/dashboard/signals LIVE ✓**
- New route: `app/api/dashboard/signals/route.ts` (SHA 0e26e75, deployed after type fix SHA 4275e6a)
- Reads `users.last_dashboard_view` to determine window (falls back to now-24h)
- Filters by `getUserTrackedDomains(userId)` — defaults to all 10 if no prefs set
- Fetches signal_events (limit 100), computes `display_score = importance * exp(-age_hours / decay)` per type
- Decay constants: band_crossing 48h, countdown_threshold 12h, convergence_spike 6h, high_sig_story 12h
- Returns top 20 sorted by display_score, with window metadata and `is_quiet` flag
- Updates `last_dashboard_view` fire-and-forget on every request
- Verified: 20+ signals returned and ranked correctly; band crossings dominate; today's convergence spike present; future `?since=` returns `is_quiet=true`

**Known debt (post-launch action required):**
- `app/lib/entity-brief.ts` has TypeScript strictness issues that blocked multiple deploys today
- Morning brief entity pipeline was never formally approved — currently half-built
- Post-launch: either formalise or remove entirely

## Completed this session (2026-04-22) — part 2
**Fruit Machine (Signal Feed) — Phases 1–3 COMPLETE ✓**
- signal_events schema live in Supabase
- signal-generation library (`app/lib/signal-generation.ts`) with 4 generators:
  - `band_crossing`: fires when velocity_scores band changes (runs every 4 days)
  - `countdown_threshold`: fires 3/7/14/30d before governance events; procedural events filtered (workshops, expert groups, capacity-building, etc.)
  - `convergence_spike`: activity spike detector — real signal fired today ("IMO Shipping coverage accelerating — 12 stories in 6 hours vs 1 in prior")
  - `high_sig_story`: fixed via cross_tracker_flags normalisation (SHA f79f2de); fires on next scrape with stories scoring ≥8
- Signal generation wired into cron runs
- Ocean-relevance gate blocking mode confirmed stable (~25–28% quarantine rate)

**Mobile Phase 4b — all 10 tracker pages responsive ✓**
- TrackerHero fix: 2-col layout + full-width Next Event at ≤768px (shared component)
- IUU carding table overflow fixed
- BBNJ region timeline stacking fixed; BBNJ map hidden on mobile with regional breakdown full-width
- 30x30 and Plastics flex row wrap fixed
- BBNJ continent accordion replaces 148-country flat table

## Completed this session (2026-04-22) — part 1
**Week 3 — v6 Premium Brief Template — COMPLETE AND DEPLOYED ✓**
- Full rebuild of app/lib/entity-brief.ts to v6 premium design
- First v6 brief approved in inbox 22 April 2026
- New DB: users.first_name, velocity_scores.interpretation, brief_pulse_history (with index)
- app/lib/tracker-descriptions.ts added (10 tracker one-liners)
- UNEP added to RSS_SOURCES with generalised parser (path+datetime support)

Design changes:
- Plus Jakarta Sans throughout (#F7F7F5 page bg, #1D9E75 teal, #EF9F27 amber)
- Masthead: 32px teal T-square box + stacked "Tideline" / "OCEAN INTELLIGENCE" lockup
- Opening: firstName greeting + dynamic subline (all moved / N of M moved / all quiet)
- YOUR N TODAY: all tracked entities listed, amber dot if moved / grey if quiet
- Pulse tracker card: rotating per user/day, SVG sparkline 260x60, WoW delta, band label, interpretation
  - Rotation logic: band cross > max WoW > least recently featured (brief_pulse_history) > day-of-week
  - interpretation cached to velocity_scores.interpretation weekly
- Editor's Call: mint card (#F4FBF7), Haiku editorial judgement with action suggestion
- Across the Sector: progressive significance fallback (25→15→10→5→0), always renders if stories exist
- The Week Ahead: 7-day→30-day fallback on governance_events
- Footer: three links + Tideline Ocean Intelligence outside white card

Engineering:
- Quiet entity sentences deterministic (90-day entity_mentions lookback, no Haiku — zero refusal risk)
- Subject line truncates to last word boundary (handles short and long headlines)
- test-entity-brief.ts updated for v6 (all entities, pulse card, rotation test, all 3 subject line cases)

## Completed this session (2026-04-23)
- Survey v2 rebuilt for blue finance / ESG audience ✓ (15 questions, dark navy, DM Sans)
  - New DB table `survey_responses_v2` (35 cols, RLS, 2 indexes, `is_priority_lead` generated column)
  - New API route `/api/survey-v2` with Resend notification to lukedmcmillan@gmail.com
  - Existing 35 rows in `survey_responses` untouched
- Dashboard desktop layout restored to pre-350185f multi-column grid with light tokens ✓
  - Mobile single-column layout preserved exactly from 350185f
  - CSS class toggle at 769px breakpoint; trendChar() em dash violation fixed
- Dashboard data seeded for Luke: 6 topics, 2 projects, 4 entities in watchlist, last_dashboard_view ✓
- **Bug fixed: `/api/dashboard/signals` self-defeating window shrinkage ✓**
  - Root cause: fire-and-forget update reset `last_dashboard_view = NOW` on every API call, shrinking window to seconds between refreshes
  - Fix: sliding minimum window — always show at least last 6 hours regardless of refresh frequency
  - `last_dashboard_view` fire-and-forget update removed from signals route
  - Build passes, lint clean in signals route
- tasks/todo.md created with 2 open tickets (user_topics removal, mojibake fix)

## Open tickets (tasks/todo.md)
1. Remove `user_topics` dead code path — `getUserTrackedDomains()` queries a non-existent table, falls back to ALL_SLUGS silently
2. Fix mojibake in `generateBandCrossingSignals` — live cron writes `â†'` instead of `→`

## Completed this session (2026-04-27, continued)
**Library document queue investigation + fix ✓**
- Root cause confirmed: `document_queue` has 9,510 pending + 24 stuck-processing rows. No Vercel cron processes the queue — `scripts/processor-agent.ts` is manual-only. Last processor run was 2026-04-14.
- Fix: added `--limit=N` flag to `processor-agent.ts` (defaults to Infinity = backwards compat). `--limit` implies loop mode automatically.
- SQL reset for 24 stuck rows: `UPDATE document_queue SET status = 'pending' WHERE status = 'processing';`
- Overnight run command: `npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/processor-agent.ts --limit=15000`
- Estimated throughput: ~200 items/hour (sequential + 2s delay). Overnight run (~8h) = ~1,600 docs processed, ~930 new library documents.
- Estimated cost: ~$23 USD for full 9,534-item backlog at Haiku 4.5 pricing.
- **Bookmarked future task**: Build `app/api/cron/process-document-queue/route.ts`, schedule daily at 4am UTC after embed-documents 3am cron.

**Prompt caching audit ✓**
- Audited all 28 files with Claude API calls. 21 already cached.
- Added `cache_control` to `app/lib/ocean-relevance-gate.ts` (highest-volume call: ~890/hr).
- Documented in `CLAUDE_RULES.md`: velocity.ts, treaty-change, send-brief, generate-brief intentionally left uncached (too short / too low volume to benefit).
- Note: current system prompts are ~250 tokens — below 1024-token minimum for caching to activate. Markers are in place for future use.

## Completed this session (2026-04-27)
**Landing page v5 rebuild — COMPLETE ✓**
- Full rebuild of `app/LandingClient.tsx` to match approved mockup-v5.html
- New components: `components/LandingHeader.tsx`, `components/HeroPulseCard.tsx`
- All 8 phases shipped: promo bar, header, hero with animated pulse card, 3-stat band, 3-row showcase, split-screen comparison + mid-CTA, supporting band (Directory + iPhone brief) + IsntStrip + BuiltFor, 3-card pricing + Founder + Final CTA, 4-column footer
- Dead code removed: `roles`, `formatVerifiedDate`, `PulseFallback`, `PulseErrorBoundary`, `BriefPreview`/`VelocityScore`/`DirectoryPreview` imports
- `styles/landing.css` stripped from 1030 lines to ~52 lines (4 keyframes + reduced-motion + visibility utilities)
- Key constraints honoured: light editorial palette, 7-day trial everywhere, 3-stat bar, no 4th stat, single-colour navy headlines with teal italic accent

## WHAT WAS COMPLETED (2026-04-27 session)

1. **Prompt caching audit** — Audited all 28 Claude API call sites. Added `cache_control` to `app/lib/ocean-relevance-gate.ts` (highest-volume: ~890 calls/hr). Documented 4 intentionally uncached files in `CLAUDE_RULES.md`. Markers are below 1024-token minimum; in place for future use.
2. **Library queue investigation + processor fix** — Confirmed `document_queue` has 9,510 pending + 24 stuck rows (no Vercel cron drains it — processor-agent.ts is manual-only). Added `--limit=N` flag to `scripts/processor-agent.ts`. Overnight drain command ready: `npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/processor-agent.ts --limit=15000`
3. **SQL reset for stuck rows** (user to run): `UPDATE document_queue SET status = 'pending' WHERE status = 'processing';`
4. **LESSONS.md updated** — Added 5 new entries covering Supabase REST pagination, manual queue architecture, embed-documents cron window bug, prompt caching thresholds, and caching priority scoring.

## NEW KNOWN ISSUES

- **embed-documents cron window bug** — Only fetches 100 most-recently-created approved docs. Once those are embedded, it silently processes 0 forever. Fix: replace recency cap with `NOT IN (SELECT document_id FROM document_chunks)` pagination.
- **embed-stories.ts uses short_summary** — Should prefer `description` (RSS original text) where >500 chars, fall back to `full_summary`. Change deferred from this session (interrupted).
- **document_queue has no Vercel cron** — After overnight run, need to build `app/api/cron/process-document-queue/route.ts` (daily 4am UTC).

## Completed this session (2026-04-28) — Mobile landing rebuild

**Mobile landing page rebuilt from Claude Design handoff bundle — COMPLETE ✓**
- New file: `app/LandingClientMobile.tsx` (~1,700 lines) — full mobile-first landing page
- `app/LandingClient.tsx` modified with 3 lines: import + mob-show-block/mob-hide wrappers
- `app/globals.css` reconciled with design tokens (4 conflicting tokens corrected; 20+ new tokens added)
- `styles/landing.css` — 2 new keyframes added (tdl-pulse, tdl-slide-down)
- All 10 documented bug fixes implemented (header collapse, score stacking, mid-CTA stack, stats single-col, not-strip dividers, built-for H2 26px, comparison close margin, pulse labels, H1 period, founding-spots weight)
- Sections: Promo bar, Header+Drawer, Hero, Pulse Card, Stats, Showcase (Feed/Pulse/Workspace), Value band, Mid-CTA, Not-strip, Built-for, Supporting band (Directory+Brief+iPhone frame), Founder, Pricing (3 cards, amber badge), Final CTA, Footer
- Comparison section dropped on mobile after smoke test (stacked vertical kills the value); closing line promoted to standalone band
- Pricing anchor link added after hero trust line
- Hamburger nav reordered: Platform → Pricing → Built for → Methodology
- Founder credibility sentence added (32 interviews before code was written)
- SSR-safe split: CSS mob-hide/mob-show-block at 768px — zero CLS

## Completed this session (2026-04-29) — Entity dedup pass

**Entity dedup audit — COMPLETE ✓ (commit 03ea317)**

- mention_count integrity restored: 8,759 → 758 (recalc from entity_mentions truth, 488 rows fixed)
- Bug 2 fixed in `lib/entity-matching.ts`: `increment_entity_count` now only fires when a new mention row was actually inserted (ignoreDuplicates: true + check returned rows > 0)
- Bug 3 migration: `entities.mention_count` DEFAULT changed from 1 → 0
- 7 entity merges executed: United States (absorbed U.S. + US), United Nations (absorbed UN), Trump, PLOS ONE, Endangered Species Act, Drones, Oceana (type set to 'ngo'; Oceana US child entity re-pointed to keep)
- 7 noise entities deleted (ADHD, God Squad, public hospital, QMN Framework x2, TNGSG panel, US convenience store giant)
- 5 entity_type 'individual' → 'person' normalised (Aaron Longton, Bad Bunny, Jim Skea, Zain Smith, Dr. Phadtaya Poemnamthip)
- 19 aliases backfilled (IMO, EC, FAO, WTO, BBNJ, ISA, IOTC, IOC, USCG, NOAA etc.)
- `entity_review_queue` table migration written (2026-04-29 — apply in Supabase Studio)
- `findOrCreateEntity()` helper added to `lib/entity-matching.ts` (5-pass dedup: exact → alias → normalised-key → trigram > 0.85 → insert)
- Idempotency test written at `__tests__/entity-matching.idempotency.test.ts` (requires `npm install -D vitest` to run)
- `lib/entities.ts` deleted (confirmed zero imports)
- `CLAUDE-RULES.md` created with Sections 4 (counter integrity) and 5 (fix-X.ts anti-pattern)
- Final state: 942 entities, 0 'individual' type, SUM(mention_count) = 758 = COUNT(entity_mentions) ✓

## NEXT STEP

**Apply two pending migrations in Supabase Studio:**
1. `supabase/migrations/20260428_entity_mention_count_default_zero.sql` — sets DEFAULT 0 on mention_count
2. `supabase/migrations/20260429_entity_review_queue.sql` — creates entity_review_queue table

**Then run overnight library backlog drain:**
1. In Supabase Studio: `UPDATE document_queue SET status = 'pending' WHERE status = 'processing';`
2. In terminal: `npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/processor-agent.ts --limit=15000`
3. Review results next session, then build `process-document-queue` Vercel cron.

---

## What's next (roadmap)
**Fruit Machine Phase 5 (next session)**
- `SignalFeed` component with pull-to-refresh gesture
- After Phase 5: mobile is fully launch-ready

**Week 4**
- Step 11: Entity dashboard page at /platform/entities
- Step 12: Entity detail page
- Step 12.5: Contact directory
- Step 13: Entity picker modal

**Backlog**
1. Build `app/api/cron/process-document-queue/route.ts` — Vercel cron equivalent of processor-agent.ts. Schedule daily at 4am UTC after embed-documents 3am cron. (Bookmarked 2026-04-27 — defer until overnight processor run results are reviewed)
2. Fix `embed-documents` cron window bug — will silently process 0 once newest 100 docs are embedded
3. Update `embed-stories.ts` description-field embedding strategy (deferred, interrupted this session)
4. Triage all 34 failed RSS sources — Tier 1: FAO, IMO, CITES, IWC, CBD, DSCC
5. Brief-reply webhook (reply-to-brief → AI answer)
6. Corporate Stripe pricing tier
7. ESG/NGO/journalist briefing_type PDF variants
8. Blue Economy market widget (opt-in, investor segment only)
9. Mobile app (Expo shell strategy)

## Known gaps — RSS sources needing Jina scrapers (separate session)

These sources have no accessible RSS feed and need Jina-based scrapers added to `harvest-scraped-sources`. They collectively represent major gaps in Tideline's NGO and governance coverage.

Priority order:
1. **CITES** (cites.org) — Cloudflare blocks Vercel IPs; critical species trade governance
2. **WWF** (worldwildlife.org) — Cloudflare blocks Vercel IPs; major NGO voice
3. **IWC** (iwc.int) — Cloudflare blocks all RSS; key cetacean governance body
4. **IUCN Red List** (iucn.org) — Cloudflare blocks all RSS; essential conservation authority
5. **FAO Fisheries** (fao.org/fishery/en) — No RSS endpoint found; critical UN fisheries body
6. **Marine Conservation Society** (mcsuk.org) — Cloudflare blocked; key UK NGO
7. **Smithsonian Ocean** (ocean.si.edu) — Cloudflare blocked; strong science content
8. **ClientEarth** (clientearth.org) — No RSS; major ocean litigation NGO
9. **MSC** (msc.org) — No RSS; Marine Stewardship Council sustainability certification

## Landing page — current state (2026-04-28)
- Mobile landing rebuilt from Claude Design handoff bundle (LandingClientMobile.tsx, ~1,550 lines) ✓
- Desktop/mobile split via CSS mob-show-block/mob-hide — SSR-safe, zero CLS ✓
- Stats band removed from both desktop and mobile (three numbers covered by inline copy) ✓
- Site-wide copy + typography pass complete:
  - All teal accent em tags changed from fontStyle: "italic" → "normal" on mobile ✓ (desktop was already normal)
  - DM Mono → DM Sans for trust lines, sub-lines, inline copy (eyebrow labels still DM Mono) ✓
  - Hero sub-line: "A destination for ocean governance professionals..." ✓
  - Feed copy: "Continuous coverage from over 100 independent news outlets..." ✓
  - Pulse copy: "Recognise when something might be coming..." ✓
  - Workspace H2/copy: "Choose what to follow. The platform watches." ✓
  - Comparison closing: two-line split (desktop + mobile) ✓
  - Built-for: letter glyphs removed, sector name as bold heading ✓
  - Directory sub-copy: email prompt appended ✓
  - Brief mockup: amber badge + inline sparkline + ISA Pulse delta enrichment ✓
  - Founding member pricing: "Direct line to the founder..." as first feature ✓
- Next: responsive QA at 360/390/414/430px and 1200/1440px

## Known issues / debt
- Firecrawl MCP not connecting on Windows — use Jina fallback
- community-documents POST bug fix pending push
- Next.js middleware.ts deprecated — migrate to proxy convention
- Stripe corporate tier not wired up — upgrade CTA goes nowhere

## Funds seeded in lp_portfolios
- Oceanus Capital (test)
- Ocean 14 Capital
- Katapult Ocean
- SWEN Capital Partners
- Aqua-Spark
