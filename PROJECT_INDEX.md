# Project Index: Tideline

Generated: 2026-05-13 | Stack: Next.js 16, React 19, TypeScript, Tailwind v4, Supabase, Stripe, Resend, Claude API

---

## Directory Structure

```
tideline-next/
├── app/                    # Next.js App Router
│   ├── api/                # API route handlers
│   │   ├── cron/           # Scheduled jobs (20 routes)
│   │   ├── entities/       # Entity CRUD + search
│   │   ├── workspace/      # Workspace ask + quick-note
│   │   ├── admin/          # Admin doc review + upload
│   │   ├── library/        # Document library routes
│   │   ├── projects/       # Project + draft routes
│   │   └── ...             # Auth, stories, tracker data, Stripe, etc.
│   ├── lib/                # Shared server-side modules (20 files)
│   ├── platform/           # Protected platform UI (App Router shell)
│   └── [public pages]      # /, /sign-in, /pricing, /legal, /admin
├── components/             # Shared React components (34 files)
├── lib/                    # Top-level shared libs (entity matching, emails, PDF)
├── scripts/                # Manual one-off scripts (36 files)
├── __tests__/              # Vitest tests (1 file)
└── supabase/               # Migrations
```

---

## Entry Points

| Path | Purpose |
|------|---------|
| `app/page.tsx` | Marketing homepage (PROTECTED -- do not modify without instruction) |
| `app/platform/(shell)/page.tsx` | Dashboard (signal feed, hero, ticker) |
| `app/platform/(shell)/feed/page.tsx` | Main story feed with topic sidebar |
| `app/platform/(shell)/workspace/page.tsx` | Entity workspace (picker + evidence panel) |
| `middleware.ts` | Auth guard for /platform/* and /tracker/* |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth v4 (Google OAuth + magic link) |

---

## Platform Pages

| Route | File |
|-------|------|
| /platform/ | `(shell)/page.tsx` -- dashboard |
| /platform/feed | `(shell)/feed/page.tsx` |
| /platform/workspace | `(shell)/workspace/page.tsx` |
| /platform/story/[id] | `(shell)/story/[id]/page.tsx` |
| /platform/research | `(shell)/research/page.tsx` |
| /platform/library | `(shell)/library/page.tsx` |
| /platform/directory | `(shell)/directory/page.tsx` |
| /platform/trackers | `(shell)/trackers/page.tsx` |
| /platform/tracker/bbnj | `(shell)/tracker/bbnj/page.tsx` |
| /platform/tracker/governance | `(shell)/tracker/governance/page.tsx` |
| /platform/tracker/isa | `(shell)/tracker/isa/page.tsx` |
| /platform/tracker/imo-shipping | `(shell)/tracker/imo-shipping/page.tsx` |
| /platform/tracker/iuu | `(shell)/tracker/iuu/page.tsx` |
| /platform/tracker/30x30 | `(shell)/tracker/30x30/page.tsx` |
| /platform/tracker/plastics | `(shell)/tracker/plastics/page.tsx` |
| /platform/tracker/cites-marine | `(shell)/tracker/cites-marine/page.tsx` |
| /platform/tracker/blue-finance | `(shell)/tracker/blue-finance/page.tsx` |
| /platform/tracker/offshore-wind | `(shell)/tracker/offshore-wind/page.tsx` |
| /platform/tracker/wto-fisheries | `(shell)/tracker/wto-fisheries/page.tsx` |
| /platform/projects | `(shell)/projects/page.tsx` |
| /platform/projects/[id] | `(shell)/projects/[id]/page.tsx` |
| /platform/lp-briefing | `(shell)/lp-briefing/page.tsx` |
| /platform/settings/topics | `(shell)/settings/topics/page.tsx` |
| /platform/welcome | `(shell)/welcome/page.tsx` |
| /platform/threads | `(shell)/threads/page.tsx` |
| /platform/calendar | `(shell)/calendar/page.tsx` |

---

## Cron Jobs (vercel.json schedules)

| Route | Schedule | Purpose |
|-------|----------|---------|
| `cron/fetch-feeds` | hourly | RSS aggregation (~89 sources) |
| `cron/harvest-scraped-sources` | every 6h | Jina scraper for non-RSS sources |
| `cron/scrape-governance-calendar` | Mon 3am UTC | Governance body meeting scraper |
| `cron/score-significance` | daily | Claude Haiku significance scoring |
| `cron/summarise-pending` | daily | Batch article summarisation |
| `cron/generate-brief` | weekdays | Morning brief candidate pool builder |
| `cron/send-brief` | weekdays | Per-user brief email via Resend |
| `cron/velocity-scores` | daily | Pulse score calculation |
| `cron/embed-documents` | daily 3am | Jina document chunk embeddings |
| `cron/threshold-alerts` | daily | Band crossing alert emails |
| `cron/blue-finance-agent` | daily | Blue finance event classification |
| `cron/governance-agent` | daily | Governance event classification |
| `cron/project-populate` | daily | Project entry generation |
| `cron/generate-connections` | daily | Cross-entity connection detection |
| `cron/monitor-sources` | daily | RSS source health monitoring |
| `cron/source-health` | daily | Source failure tracking |
| `cron/scrape-isa` | daily | ISA document scraper |
| `cron/scrape-psma` | daily | PSMA data scraper |
| `cron/conversion-triggers` | daily | Trial-to-paid conversion nudges |
| `cron/generate-embeddings` | daily | ORPHANED -- investigate/delete (RAG Bug 3) |

---

## App Lib Modules (app/lib/)

| File | Purpose |
|------|---------|
| `auth.ts` | `getEmailFromSession()` -- JWT extraction for API routes |
| `sources.ts` | RSS_SOURCES array (~89 sources) + OCEAN_DEDICATED list |
| `html.ts` | HTML parsing utilities for RSS/scraper content |
| `jina.ts` | Jina API wrapper for article fetch + embedding |
| `confidence.ts` | Entity match confidence scoring |
| `embeddings.ts` | Jina v2 embedding calls (vector(768)) |
| `ocean-relevance-gate.ts` | Claude Haiku ocean-topic classifier (blocking mode, ~25-28% quarantine) |
| `velocity.ts` | Pulse score computation + band classification |
| `signal-generation.ts` | 4 signal generators: band_crossing, countdown_threshold, convergence_spike, high_sig_story |
| `constants.ts` | TRACKER_LABELS, TOPIC_LABELS, TRACKER_TO_TOPICS, ACTION_SIGNAL_KEYWORDS |
| `trackers.ts` | Tracker slug definitions + display metadata |
| `tracker-metadata.ts` | Per-tracker data fetchers |
| `tracker-descriptions.ts` | 10 tracker one-liner descriptions |
| `events.ts` | Governance event utilities |
| `subscription.ts` | Subscription status helpers |
| `search.ts` | Full-text search utilities |
| `entity-type-label.ts` | Entity type display labels |
| `user-preferences.ts` | User preference helpers |
| `query-expansion.ts` | RAG query expansion |
| `brief-reply.ts` | Brief reply webhook handler |

---

## Top-Level Lib (lib/)

| File | Purpose |
|------|---------|
| `lib/entity-matching.ts` | 5-pass entity matching (exact/alias/normalised/trigram/insert) + `findOrCreateEntity()` |
| `lib/lp-briefing-pdf.ts` | PDFKit LP briefing PDF generator |
| `lib/email/sparkline.ts` | SVG sparkline for email |
| `lib/email/alert-data.ts` | Alert email data builder |
| `lib/emails/onboarding-day3.ts` | Day-3 onboarding email template |

---

## Key API Routes

| Route | Purpose |
|-------|---------|
| `api/entities/search` | Entity search (name + alias ILIKE, `search_entities` RPC, 300ms debounce client-side) |
| `api/entities/track` | Toggle entity tracking for user |
| `api/entities/dashboard` | Entity dashboard data |
| `api/entities/detail` | Single entity detail with mentions |
| `api/workspace/ask` | RAG ask endpoint (exists; BLOCKED on Bug 1+2 fix before wiring UI) |
| `api/workspace/quick-note` | Save workspace quick note |
| `api/research/inline` | Inline research with RAG |
| `api/ask` | Orphaned -- 61 lines, investigate/delete (RAG Bug 4) |
| `api/stories` | Story list + pagination |
| `api/summarise` | On-demand article summarisation |
| `api/lp-briefing` | LP portfolio briefing JSON |
| `api/lp-briefing/pdf` | LP briefing PDFKit export |
| `api/governance-events` | Governance calendar events |
| `api/dashboard` | Dashboard data endpoint |
| `api/sidebar-data` | Sidebar entity/tracker data |
| `api/stripe/checkout` | Stripe checkout session |
| `api/webhooks/treaty-change` | pg_net treaty change webhook |
| `api/webhooks/brief-reply` | Brief reply handler |

---

## Shared Components (components/)

| Component | Purpose |
|-----------|---------|
| `Header.tsx` | Site header (auth-aware) |
| `TrackerHero.tsx` | Shared tracker hero section |
| `TrackerHistory.tsx` | Tracker score history chart |
| `TrackerMethodology.tsx` | Methodology explainer |
| `HeroSignal.tsx` | Dashboard signal card (4 subtypes) |
| `HeroSignalBandCrossing.tsx` | Band crossing signal subtype |
| `HeroSignalGovernance.tsx` | Governance countdown subtype |
| `HeroSignalVelocity.tsx` | Velocity spike subtype |
| `OvernightReveal.tsx` | Dashboard overnight reveal animation |
| `DashboardReveal.tsx` | Dashboard content reveal |
| `TickerStrip.tsx` | Horizontal ticker (5 item types, 2-min revalidate) |
| `SignalFeed.tsx` | Signal event feed list |
| `Sparkline.tsx` | SVG sparkline chart |
| `VelocityScore.tsx` | Pulse score display card |
| `StoryCard.tsx` | Story list item |
| `FeedSidebar.tsx` | Topic filter sidebar |
| `AlertToggle.tsx` | Threshold alert toggle |
| `Paywall.tsx` | Hard paywall overlay |
| `TrialBanner.tsx` | Soft trial expiry banner |
| `ConversionModal.tsx` | Trial conversion modal |
| `TopicsSelector.tsx` | Multi-topic selector |
| `LinkedInDraftPanel.tsx` | LinkedIn post draft panel |
| `LandingHeader.tsx` | Marketing header |
| `HeroPulseCard.tsx` | Landing hero pulse card |
| `WelcomeState.tsx` | Welcome/empty state |

---

## Scripts (scripts/)

Manual scripts -- run with: `npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/<name>.ts`

| Script | Purpose |
|--------|---------|
| `processor-agent.ts` | Library doc queue processor (--limit=N flag; sequential, ~200 items/hr) |
| `embed-entities.ts` | Embed all entities via Jina v2 |
| `embed-stories.ts` | Embed stories via Jina v2 |
| `embed-documents.ts` | Embed library document chunks |
| `backfill-entity-matching.ts` | Re-run 3-pass entity matching on stories |
| `seed-loader.ts` | Seed entities from CSV |
| `scraper-agent.ts` | Manual scraper run |
| `import-faolex.ts` | FAO LEX document import |
| `scraper-informea.ts` | InforMEA treaty document scraper |
| `replay-recent-matches.ts` | Re-run entity matching on recent stories |
| `diag-informea-dedup.ts` | Diagnose InforMEA duplicate detection |
| `diag-null-status.ts` | Diagnose null status rows in library queue |
| `diag-queue-nulls.ts` | Diagnose null entries in document queue |
| `probe-informea.ts` | Probe InforMEA scraper responses |
| `screenshot-briefs.ts` | Screenshot brief email rendering |
| `test-send-brief.ts` | Test brief send pipeline end-to-end |
| `verify-queue-insert.ts` | Verify document queue insert behaviour |

---

## Database -- Key Tables

| Table | Purpose |
|-------|---------|
| `public.users` | Subscription status, topics (jsonb), job_type, brief_time, onboarded_at |
| `public.stories` | Feed stories with significance, entity extraction flags |
| `public.entities` | 942 entities, aliases[], embedding vector(768), mention_count |
| `public.entity_aliases` | GIN-indexed aliases, feeds `search_entities` RPC |
| `public.entity_mentions` | Story<->entity links with match_score, method, confidence |
| `public.user_entities` | Per-user tracked entities |
| `public.velocity_scores` | Pulse scores per tracker per day, band, interpretation |
| `public.signal_events` | 4 signal types for dashboard hero |
| `public.governance_events` | Meeting/deadlines with significance + expected_decisions |
| `public.document_queue` | Library doc processing queue (manual drain via processor-agent.ts) |
| `public.document_chunks` | RAG chunks -- 28K duplicate rows (Bug 1 PENDING FIX) |
| `public.brief_buffer` | Morning brief candidate pool (JSONB) |
| `public.alert_sends` | Threshold alert send log |
| `public.lp_portfolios` | LP fund portfolio data |

---

## Known Issues (active)

| # | Issue | Fix path |
|---|-------|---------|
| Bug 1 | 28,337 duplicate chunk rows (33%) in document_chunks. Idempotency check broken in embed-documents cron | Patch idempotency check + dedupe pass |
| Bug 2 | 2,711 approved docs with no chunks. Silent failure on image-only PDFs | Add chunking_status column, mark failures, backfill |
| Bug 3 | cron/generate-embeddings queries dropped `embeddings` table -- fails nightly | Delete this cron route (5 min fix) |
| Bug 4 | app/api/ask/route.ts (61 lines) likely orphaned post-RAG refactor | Investigate + delete |
| Auth | 6 API routes have hardcoded email fallback (security bug) | Fix secureCookie in auth.ts first, then remove fallbacks |

---

## Recent Changes (2026-05-12 session)

- `feat(library)`: InforMEA HTML fallback + `source_format` column tracking in scraped_sources
- `fix(brief)`: Brief cron falls back to stored `short_summary` when Haiku API fails

---

## Next Priorities (SPEC.md 2026-05-08)

1. RAG cleanup: delete `cron/generate-embeddings` + investigate `api/ask/route.ts` (20 min)
2. RAG Bug 1: patch idempotency + dedupe 28K duplicate chunks
3. RAG Bug 2: add `chunking_status` column, mark failures, backfill
4. Workspace UI: wire FloatingDock ask panel to `/api/workspace/ask` (BLOCKED on 1+2)

---

## Design Rules (enforced across all UI)

- Inline styles only in JSX -- no Tailwind utility classes
- Teal: `#1D9E75` -- no blue `#1a73e8` anywhere
- No em dashes -- use commas, colons, or restructure
- No monospace fonts -- DM Sans everywhere (scores, timestamps, source labels)
- Fonts: DM Sans (body), Georgia (serif headlines)
- Dark bg: `#0B1628` / `#0D1E35` | Text primary: `#E8EDF4` | Muted: `#8BA0BC`
- Workspace standard: white bg, teal 3px top border on selected, underline-only inputs, 4px button radius, never dark bg in content area
