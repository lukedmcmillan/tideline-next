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

## What's next
**Week 3 — remaining**
- Material-present brief test: needs a tracked entity with a significance >= 25 story in the 24h window
  - Can force-test by temporarily lowering MATERIAL_THRESHOLD or seeding a high-score story
- Fix the one failed queue row (check morning_brief_queue for status='failed', inspect error logs)
- Add crons to vercel.json once material-present path confirmed:
  ```json
  { "path": "/api/cron/generate-entity-briefs", "schedule": "0 * * * *" },
  { "path": "/api/cron/send-entity-briefs", "schedule": "*/15 * * * *" }
  ```
- Remaining corpus backfill: ~1202 stories unmatched (run scripts/run-full-backfill.ts --skip-semantic --limit 1400 --force)

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
