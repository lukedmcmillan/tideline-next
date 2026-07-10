# Project Index: Tideline

Generated: 2026-07-10 | Stack: Next.js 16, React 19, TypeScript, Tailwind v4, Supabase, Stripe, Resend, Claude API

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
| `/platform` | `app/platform/(shell)/page.tsx` |
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
- `api/subscription-access` — Paywall check
- `api/subscription-status` — Status + needsOnboarding flag
- `api/subscribe` — Stripe customer + subscription creation
- `api/user/topics`, `sector`, `update-last-seen`, `complete-onboarding`, `dismiss-modal`, `modal-status`, `onboarding-status`
- `api/onboarding/starter-set`, `entity-match` — Onboarding helpers
- `api/survey`, `api/survey-v2`, `api/waitlist` — Signup surveys

### Content
- `api/stories` — Feed stories (topic filter, pagination)
- `api/stories/save`, `api/stories/comments` — Save/comment on stories
- `api/summarise` — On-demand Claude summarisation (Sonnet)
- `api/workspace/quick-note` — Quick note save
- `api/search` — Full-text search
- `api/governance-events` — Calendar events
- `api/tracker-status/[slug]` — Per-tracker status
- `api/tracker-events` — Tracker event data
- `api/sidebar-data` — Feed sidebar counts
- `api/dashboard/*` — Signals, readiness, upcoming-30d, hero-signal, overnight, ticker, proof-of-work, reveal, new-stories
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
- `api/ask` — RAG ask endpoint (Sonnet)
- `api/threads/*` — Crosscurrent connection threads (Sonnet)
- `api/connections` — Story connections
- `api/alerts/preferences` — Alert prefs
- `api/story/linkedin-draft` — LinkedIn draft (Sonnet)
- `api/notifications` — User notifications
- `api/consultations` — Consultations data
- `api/entities/track`, `detail`, `dashboard` — Entity intelligence

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
| `velocity-scores` | Mon 6am | Velocity score recalculation |
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
- `api/admin/backfill-entities` — Entity backfill
- `api/admin/documents/*` — Document review, upload

---

## Shared Libraries

### `app/lib/` (35 files)
| File | Purpose |
|---|---|
| `auth.ts` | `getEmailFromSession()` — shared auth helper |
| `ask-engine.ts` | RAG pipeline for Ask Tideline |
| `brief-reply.ts` | Brief reply RAG |
| `brief/select.ts` | Brief lead story selection (category gate) |
| `brief/template.ts` | Brief email HTML template |
| `brief/utils.ts` | Brief utility functions |
| `brief/quick-asks.ts` | Brief quick-ask suggestions |
| `confidence.ts` | Confidence scoring |
| `constants.ts` | Shared constants |
| `embeddings.ts` | Jina embedding calls (jina-embeddings-v2-base-en 768-d) |
| `events.ts` | Event helpers |
| `html.ts` | HTML parsing utilities |
| `http-client.ts` | Shared HTTP client with robots.txt compliance |
| `jina.ts` | Jina scraping wrapper (JINA_API_KEY) |
| `ocean-relevance-gate.ts` | Claude relevance filter (prompt cached) |
| `query-expansion.ts` | RAG query expansion |
| `research.ts` | Unified RAG engine |
| `search.ts` | Full-text search helpers |
| `signal-generation.ts` | Dashboard signal generation |
| `sources.ts` | Source registry (~89 RSS sources) |
| `subscription.ts` | Subscription status helpers |
| `tracker-descriptions.ts` | Tracker one-liners |
| `tracker-metadata.ts` | Tracker config (INST_TYPE, PREP_HORIZON, etc.) |
| `trackers.ts` | Tracker constants + TRACKER_TO_TOPICS map |
| `user-preferences.ts` | User preference helpers |
| `velocity.ts` | Velocity score interpretation |
| `entity-type-label.ts` | Entity type label mapping |
| `onboarding/starter-sets.ts` | Onboarding starter set definitions |
| `welcome/topic-mapping.ts`, `data.ts`, `rules.ts` | Welcome flow logic |

### `lib/` (project root)
| File | Purpose |
|---|---|
| `entity-matching.ts` | Entity matching pipeline (`findOrCreateEntity`, `matchEntitiesToStory`) |
| `lp-briefing-pdf.ts` | LP briefing PDF generation |
| `email/alert-data.ts` | Alert email data helpers |
| `email/sparkline.ts` | Sparkline SVG for emails |

### Components (34 files in `components/`)
Key: `Header`, `LandingHeader`, `Paywall`, `TrackerHero`, `TrackerHistory`, `TrackerMethodology`, `VelocityScore`, `AlertToggle`, `HeroSignal*`, `Sparkline`, `TickerStrip`, `SignalFeed`, `StoryCard`, `FeedSidebar`, `TopicsSelector`, `BriefPreview`, `DirectoryPreview`, `ConversionModal`, `EarlyAccessModal`

---

## Scripts (`scripts/`) — 100+ files

- **Diagnostic**: `diag-*.ts` (25+), `probe-*.ts`
- **Backfill**: `backfill-*.ts`, `embed-*.ts`, `recalc-*.ts`
- **Scrapers**: `scraper-informea.ts`, `scraper-ngo-reports.ts`, `scraper-openalex.ts`, `scraper-playwright.ts`, `scraper-un-library.ts`, `processor-agent.ts`
- **Entity**: `merge-entity-duplicates.ts`, `cleanup-entities.ts`, `fix-entities.ts`
- **Testing**: `test-*.ts`, `verify-*.ts`
- **Research RAG**: `embed-stories.ts`

---

## Tests

- `__tests__/entity-matching.idempotency.test.ts` — Entity counter idempotency
- `app/lib/brief/select.test.ts` — Brief selection logic
- Framework: Vitest (`vitest.config.ts` with `@/` alias)

---

## Key Configuration

- `vercel.json` — Cron schedules; 512MB default / 1GB embed-documents / 300s summarise-pending
- `tsconfig.json` — `@/*` alias = project root
- `.env.local` — All secrets (never commit)
- `supabase/migrations/` — 68 migration files

---

## Model Assignments (invariant)

| Model | Routes |
|---|---|
| `claude-haiku-4-5-20251001` | blue-finance-agent, generate-brief, governance-agent, project-populate, score-significance, research faithfulness |
| `claude-sonnet-4-6` | ask, scrape-governance-calendar, summarise-pending, documents/generate-brief, linkedin-draft, summarise, threads/match, treaty-change, research synthesis |

---

## Database (Supabase — 3 schemas: `public`, `auth`, `next_auth`)

**Key tables**: `users`, `stories`, `scraped_sources`, `treaty_ratifications`, `scrape_runs`, `subscriptions`, `trial_signups`, `governance_bodies`, `governance_events`, `expected_decisions`, `calendar_subscriptions`, `document_chunks`, `story_chunks`, `velocity_scores`, `entities`, `entity_mentions`, `entity_aliases`, `entity_merges`, `lp_portfolios`, `research_queries`, `delta_classifications`, `brief_sends`, `signal_events`, `documents`, `document_queue`

**RAG RPCs**: `match_document_chunks`, `match_primary_chunks`, `match_document_chunks_filtered`, `match_story_chunks` — Jina `jina-embeddings-v2-base-en` (768-dim, **do not change**)

**Trigger**: `treaty_ratifications` INSERT -> pg_net POST -> `api/webhooks/treaty-change`

---

## Current Status (2026-07-10)

**Recent commits**: pipeline backfill script + cron hardening + heartbeat, date guard + quarantine infrastructure + score annotations, onboarding loading gate fix, SessionProvider for /subscribe

**Category gate LIVE**: `prompt_version=f6491a2171c78bdf`, Gate2=GOVERNANCE_CHANGE+sig>=35

**Known issues**:
- 6 API routes have hardcoded email fallback (security bug) — `hazard_auth_fallbacks.md`
- Stage 2 headline generation FROZEN pending 30-day backtest
- scraper-ngo-reports BROKEN (regex misses modern NGO page patterns)
- wto-fisheries and plastics trackers have zero source coverage
- entity_type column has 15+ inconsistent values (architectural debt)
- document_queue backlog (~10K pending)
