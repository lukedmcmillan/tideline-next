# Project Index: Tideline

Generated: 2026-07-02 | Stack: Next.js 16, React 19, TypeScript, Tailwind v4, Supabase, Stripe, Resend, Claude API

---

## Entry Points

- **Marketing**: `app/page.tsx` — Landing page (DO NOT MODIFY without instruction)
- **Platform shell**: `app/platform/(shell)/layout.tsx` — Auth-protected workspace
- **Auth**: `app/api/auth/[...nextauth]/route.ts` — NextAuth v4 (Google OAuth + magic link)
- **Middleware**: `middleware.ts` — Protects `/platform/*` and `/tracker/*`

---

## Core Pages

| Route | File |
|---|---|
| `/` | `app/page.tsx` |
| `/start` | `app/start/page.tsx` |
| `/login` | `app/login/page.tsx` |
| `/sign-in` | `app/sign-in/page.tsx` |
| `/onboarding` | `app/onboarding/page.tsx` |
| `/subscribe` | `app/subscribe/page.tsx` |
| `/pricing` | `app/pricing/page.tsx` |
| `/platform/feed` | `app/platform/(shell)/feed/page.tsx` |
| `/platform/story/[id]` | `app/platform/(shell)/story/[id]/page.tsx` |
| `/platform/projects` | `app/platform/(shell)/projects/page.tsx` |
| `/platform/projects/[id]/draft` | `app/platform/(shell)/projects/[id]/draft/page.tsx` |
| `/platform/research` | `app/platform/(shell)/research/page.tsx` |
| `/platform/library` | `app/platform/(shell)/library/page.tsx` |
| `/platform/threads` | `app/platform/(shell)/threads/page.tsx` |
| `/platform/workspace` | `app/platform/(shell)/workspace/page.tsx` |
| `/platform/lp-briefing` | `app/platform/(shell)/lp-briefing/page.tsx` |
| `/platform/welcome` | `app/platform/(shell)/welcome/page.tsx` |
| `/platform/directory` | `app/platform/(shell)/directory/page.tsx` |
| `/platform/calendar` | `app/platform/(shell)/calendar/page.tsx` |
| `/platform/trackers` | `app/platform/(shell)/trackers/page.tsx` |
| `/platform/settings/topics` | `app/platform/(shell)/settings/topics/page.tsx` |
| `/platform/admin/library` | `app/platform/(shell)/admin/library/page.tsx` |

### Trackers (12)
`bbnj`, `governance`, `30x30`, `isa`, `blue-finance`, `blue-carbon-credits`, `cites-marine`, `imo-shipping`, `iuu`, `offshore-wind`, `plastics`, `wto-fisheries`

---

## API Routes

### Auth & User
- `api/auth/[...nextauth]` — NextAuth handler
- `api/auth/verify` — Magic link verification
- `api/subscription-status` — Session + needsOnboarding flag
- `api/subscription-access` — Paywall check
- `api/user/topics`, `sector`, `update-last-seen`, `complete-onboarding`, `dismiss-modal`, `modal-status`, `onboarding-status`

### Content
- `api/stories` — Feed stories (topic filter, pagination)
- `api/stories/save`, `api/stories/comments` — Save/comment on stories
- `api/summarise` — On-demand Claude summarisation (Sonnet)
- `api/workspace/ask` — RAG research (Sonnet) **[PRODUCTION — migration to /api/research/ask pending Phase 3]**
- `api/workspace/quick-note` — Quick note save
- `api/search` — Full-text search
- `api/governance-events` — Calendar events
- `api/tracker-status/[slug]` — Per-tracker status
- `api/tracker-events` — Tracker event data
- `api/sidebar-data` — Feed sidebar counts
- `api/dashboard/*` — Signals, readiness, upcoming-30d
- `api/landing-data` — Marketing page data

### Payments
- `api/stripe/checkout` — Checkout session
- `api/stripe-webhook` — 5 Stripe events (in root, not under stripe/)
- `api/portal` — Stripe billing portal

### Projects & Library
- `api/projects/*` — CRUD + draft compile + new-stories
- `api/projects/[id]/draft`, `api/projects/[id]/draft/compile` — Word processor
- `api/documents/*` — Library PDFs, upload, export, generate-brief (Sonnet)
- `api/library/*` — Search, view, extract metadata, activity, signed-url
- `api/admin/documents/*` — Review, signed-upload-url, upload
- `api/lp-briefing`, `lp-briefing/pdf`, `lp-briefing/stats`
- `api/lp-portfolios`
- `api/community-documents`

### Intelligence
- `api/ask` — Short ask endpoint (possibly orphaned — investigate)
- `api/threads/*` — Crosscurrent connection threads (Sonnet)
- `api/connections` — Story connections
- `api/alerts/preferences` — Alert prefs
- `api/story/linkedin-draft` — LinkedIn draft (Sonnet)
- `api/notifications` — User notifications
- `api/consultations` — Consultations data

### Tracker-specific
- `api/treaty-status` — BBNJ treaty ratification data
- `api/iuu-status`, `api/iuu/carding` — IUU tracker data
- `api/isa-status`, `api/isa-contractors` — ISA tracker data
- `api/30x30-status` — 30x30 tracker data
- `api/blue-finance-status` — Blue finance tracker data
- `api/psma` — PSMA tracker data

### Calendar
- `api/calendar/[token]` — Personal iCal feed
- `api/calendar/subscribe` — Create iCal subscription

### Cron Jobs (vercel.json — 20 jobs)

| Job | Schedule | Purpose |
|---|---|---|
| `fetch-feeds` | Every 2h | RSS aggregation (~89 sources) |
| `summarise-pending` | Every 2h +15m | Batch summarisation (Sonnet) |
| `project-populate` | Every 2h +30m | Project entry classification (Haiku) |
| `score-significance` | Daily 3:30am | Story significance scoring (Haiku) |
| `harvest-scraped-sources` | Daily 6:30am | Non-RSS scraping (IMO, ISA, FAO, IUCN, CBD, CITES, UN BBNJ) |
| `generate-brief` | Weekdays 6:30am | Brief quality gate (Haiku) |
| `send-brief` | Weekdays 7am | Send morning brief via Resend |
| `generate-connections` | Daily 7am | Crosscurrent connections |
| `threshold-alerts` | Daily 8am | Velocity threshold alerts |
| `conversion-triggers` | Daily 9am | Conversion nudges |
| `velocity-scores` | Every 4d 6am | Velocity score recalculation |
| `governance-agent` | Mon 4am | Governance event classification (Haiku) |
| `blue-finance-agent` | Mon 4:30am | Blue finance classification (Haiku) |
| `scrape-governance-calendar` | Every 10d 3am | Governance calendar scrape (Sonnet) |
| `scrape-isa` | Tue 5am | ISA scraper |
| `scrape-psma` | Wed 8am | PSMA scraper |
| `generate-embeddings` | Daily 1am | Story embeddings |
| `embed-documents` | Daily 3am | Document embeddings (1GB memory) |
| `monitor-sources` | Mon 7am | Source health monitoring |
| `source-health` | Mon 5am | Source health check |

### Webhooks
- `api/webhooks/treaty-change` — pg_net trigger -> Claude significance check -> story alert
- `api/webhooks/brief-reply` — Email reply handling

### Admin
- `api/admin/story-override` — Story override
- `api/admin/backfill-velocity` — Velocity backfill
- `api/admin/documents/*` — Document review, upload

---

## Shared Libraries

### `app/lib/` (22 files)
| File | Purpose |
|---|---|
| `auth.ts` | `getEmailFromSession()` — shared auth helper |
| `brief-reply.ts` | Brief reply RAG — **migrate to lib/research.ts in Phase 3 Step 8** |
| `confidence.ts` | Confidence scoring |
| `constants.ts` | Shared constants |
| `embeddings.ts` | Jina embedding calls (jina-embeddings-v2-base-en 768-d) |
| `events.ts` | Event helpers |
| `html.ts` | HTML parsing utilities |
| `http-client.ts` | Shared HTTP client with retry/bot-block logic |
| `jina.ts` | Jina scraping wrapper (JINA_API_KEY) |
| `ocean-relevance-gate.ts` | Claude relevance filter (prompt cached) |
| `query-expansion.ts` | RAG query expansion |
| `research.ts` | Unified RAG engine (Step 3 complete) |
| `search.ts` | Full-text search helpers |
| `signal-generation.ts` | Dashboard signal generation |
| `sources.ts` | Source registry (`RSSSource`, `skipGate?: boolean`) |
| `subscription.ts` | Subscription status helpers |
| `tracker-descriptions.ts` | Tracker one-liners |
| `tracker-metadata.ts` | Tracker config (INST_TYPE, PREP_HORIZON, etc.) |
| `trackers.ts` | Tracker constants |
| `user-preferences.ts` | User preference helpers |
| `velocity.ts` | Velocity score interpretation |
| `entity-type-label.ts` | Entity type label mapping |

### `lib/` (project root)
| File | Purpose |
|---|---|
| `entity-matching.ts` | Entity matching pipeline (`findOrCreateEntity`, `matchEntitiesToStory`) |
| `lp-briefing-pdf.ts` | LP briefing PDF generation |
| `email/alert-data.ts` | Alert email data helpers |
| `email/sparkline.ts` | Sparkline SVG for emails |

### Components (33 files in `components/`)
Key: `Header`, `Paywall`, `TrackerHero`, `TrackerHistory`, `TrackerMethodology`, `VelocityScore`, `AlertToggle`, `HeroSignal*`, `Sparkline`, `TickerStrip`, `SignalFeed`, `StoryCard`, `FeedSidebar`, `TopicsSelector`

---

## Scripts (`scripts/`) — 90+ files

- **Diagnostic**: `diag-*.ts` (20+), `probe-*.ts`
- **Backfill**: `backfill-*.ts`, `embed-*.ts`, `recalc-*.ts`
- **Scrapers**: `scraper-informea.ts`, `scraper-ngo-reports.ts`, `scraper-openalex.ts`, `scraper-playwright.ts`, `scraper-un-library.ts`, `processor-agent.ts`
- **Entity**: `merge-entity-duplicates.ts`, `cleanup-entities.ts`, `fix-entities.ts`
- **Testing**: `test-*.ts`, `verify-*.ts`
- **Research RAG**: `embed-stories.ts`, `classify-documents.ts`

---

## Tests

- `__tests__/entity-matching.idempotency.test.ts` — Entity counter idempotency
- Framework: Vitest (`vitest.config.ts` with `@/` alias)

---

## Key Configuration

- `vercel.json` — Cron schedules; 512MB default / 1GB embed-documents
- `tsconfig.json` — `@/*` alias = project root
- `.env.local` — All secrets (never commit)
- `supabase/migrations/` — 60 migration files (20260330–20260529)

---

## Model Assignments (invariant)

| Model | Routes |
|---|---|
| `claude-haiku-4-5-20251001` | blue-finance-agent, generate-brief, governance-agent, project-populate, score-significance, research faithfulness |
| `claude-sonnet-4-6` | ask, scrape-governance-calendar, summarise-pending, documents/generate-brief, linkedin-draft, summarise, threads/match, treaty-change, research synthesis |

---

## Database (Supabase — 3 schemas: `public`, `auth`, `next_auth`)

**Key tables**: `users`, `stories`, `scraped_sources`, `treaty_ratifications`, `scrape_runs`, `subscriptions`, `trial_signups`, `governance_bodies`, `governance_events`, `expected_decisions`, `calendar_subscriptions`, `document_chunks`, `story_chunks`, `velocity_scores`, `entities`, `entity_mentions`, `entity_aliases`, `lp_portfolios`, `research_queries`, `delta_classifications`, `brief_sends`, `signal_events`, `documents`, `document_queue`

**RAG RPCs**: `match_document_chunks`, `match_primary_chunks`, `match_document_chunks_filtered`, `match_story_chunks` — Jina `jina-embeddings-v2-base-en` (768-dim, **do not change**)

**Trigger**: `treaty_ratifications` INSERT -> pg_net POST -> `api/webhooks/treaty-change`

---

## Current Status (2026-07-02)

**Research RAG build (RESEARCH-RAG-SPEC.md)**:
- Step 1 DONE: Source classification (79 docs reclassified, commit `2ae4de3`)
- Step 2 DONE: Document chunk embedding (368,413 chunks); **story_chunks backfill pending (embed-stories.ts 3-bug audit)**
- Step 3 DONE: `lib/research.ts` + migrations
- **Step 4 NEXT**: Build `app/api/research/ask/route.ts`
- Step 0.5.2 pending: Delete orphan `app/api/research/inline/route.ts`

**Category gate LIVE**: `prompt_version=f6491a2171c78bdf`, Gate2=GOVERNANCE_CHANGE+sig>=35

**Known issues**:
- 6 API routes have hardcoded email fallback (security bug) — `hazard_auth_fallbacks.md`
- story_chunks backfill not yet run (3-bug audit needed)
- Stage 2 headline generation FROZEN pending 30-day backtest
- scraper-ngo-reports BROKEN (regex misses modern NGO page patterns)
