# Tideline — Live Project Status

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

## Completed this session (2026-04-27)
**Landing page v5 rebuild — COMPLETE ✓**
- Full rebuild of `app/LandingClient.tsx` to match approved mockup-v5.html
- New components: `components/LandingHeader.tsx`, `components/HeroPulseCard.tsx`
- All 8 phases shipped: promo bar, header, hero with animated pulse card, 3-stat band, 3-row showcase, split-screen comparison + mid-CTA, supporting band (Directory + iPhone brief) + IsntStrip + BuiltFor, 3-card pricing + Founder + Final CTA, 4-column footer
- Dead code removed: `roles`, `formatVerifiedDate`, `PulseFallback`, `PulseErrorBoundary`, `BriefPreview`/`VelocityScore`/`DirectoryPreview` imports
- `styles/landing.css` stripped from 1030 lines to ~52 lines (4 keyframes + reduced-motion + visibility utilities)
- Key constraints honoured: light editorial palette, 7-day trial everywhere, 3-stat bar, no 4th stat, single-colour navy headlines with teal italic accent

## What's next
**Fruit Machine Phase 5 (next session)**
- `SignalFeed` component with pull-to-refresh gesture
- After Phase 5: mobile is fully launch-ready

**Week 4**
- Step 11: Entity dashboard page at /platform/entities
- Step 12: Entity detail page
- Step 12.5: Contact directory
- Step 13: Entity picker modal

**Backlog**
1. Triage all 34 failed RSS sources — Tier 1: FAO, IMO, CITES, IWC, CBD, DSCC
2. Brief-reply webhook (reply-to-brief → AI answer)
3. Corporate Stripe pricing tier
4. Prompt caching on all API calls
5. ESG/NGO/journalist briefing_type PDF variants
6. Blue Economy market widget (opt-in, investor segment only)
7. Mobile app (Expo shell strategy)

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
