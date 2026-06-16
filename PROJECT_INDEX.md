# Project Index: Tideline

Generated: 2026-06-16 | Stack: Next.js 16, React 19, TypeScript, Tailwind v4, Supabase, Stripe, Resend, Claude API

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
| `/onboarding` | `app/onboarding/page.tsx` |
| `/subscribe` | `app/subscribe/page.tsx` |
| `/platform/feed` | `app/platform/(shell)/feed/page.tsx` |
| `/platform/story/[id]` | `app/platform/(shell)/story/[id]/page.tsx` |
| `/platform/projects` | `app/platform/(shell)/projects/page.tsx` |
| `/platform/research` | `app/platform/(shell)/research/page.tsx` |
| `/platform/library` | `app/platform/(shell)/library/page.tsx` |
| `/platform/threads` | `app/platform/(shell)/threads/page.tsx` |
| `/platform/workspace` | `app/platform/(shell)/workspace/page.tsx` |
| `/platform/lp-briefing` | `app/platform/(shell)/lp-briefing/page.tsx` |
| `/platform/welcome` | `app/platform/(shell)/welcome/page.tsx` |

### Trackers
`bbnj`, `governance`, `30x30`, `isa`, `blue-finance`, `blue-carbon-credits`, `cites-marine`, `imo-shipping`, `iuu`, `offshore-wind`, `plastics`, `wto-fisheries`

---

## API Routes

### Auth & User
- `api/auth/[...nextauth]` — NextAuth handler
- `api/auth/verify` — Magic link verification
- `api/subscription-status` — Session + needsOnboarding flag
- `api/subscription-access` — Paywall check
- `api/onboarding` — Save topics + timezone
- `api/user/topics`, `sector`, `update-last-seen`, `complete-onboarding`

### Content
- `api/stories` — Feed stories (topic filter, pagination)
- `api/summarise` — On-demand Claude summarisation (Sonnet)
- `api/workspace/ask` — RAG research (Sonnet) **[PRODUCTION — migration to /api/research/ask pending Phase 3]**
- `api/research/ask` — **NOT YET BUILT** — unified research engine (Step 4 next)
- `api/research/inline` — **ORPHAN — DELETE (zero callers, wrong model jina-v3)**
- `api/research/library-stats` — **NOT YET BUILT** (Step 5)
- `api/search` — Full-text search
- `api/governance-events` — Calendar events
- `api/tracker-status/[slug]` — Per-tracker status
- `api/sidebar-data` — Feed sidebar counts
- `api/dashboard/*` — Signals, hero, ticker, overnight, readiness, proof-of-work

### Payments
- `api/subscribe` — Create Stripe customer + subscription (7-day trial)
- `api/stripe-webhook` — 5 Stripe events
- `api/stripe/checkout` — Checkout session
- `api/portal` — Stripe billing portal

### Projects & Library
- `api/projects/*` — CRUD + draft compile
- `api/documents/*` — Library PDFs, upload, export, generate-brief (Sonnet)
- `api/library/*` — Search, view, extract metadata
- `api/lp-briefing`, `lp-briefing/pdf`, `lp-briefing/stats`
- `api/lp-portfolios`

### Intelligence
- `api/entities/*` — Entity directory (153 entities), search, track
- `api/threads/*` — Crosscurrent connection threads (Sonnet)
- `api/connections` — Story connections
- `api/velocity/[slug]` — Velocity scores
- `api/alerts/preferences`, `subscribe` — Alert prefs
- `api/story/linkedin-draft` — LinkedIn draft (Sonnet)

### Calendar
- `api/calendar/[token]` — Personal iCal feed
- `api/calendar/subscribe` — Create iCal subscription

### Cron Jobs (vercel.json)

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
- `api/webhooks/treaty-change` — pg_net trigger → Claude significance check → story alert
- `api/webhooks/brief-reply` — Email reply handling

---

## Shared Libraries

### `app/lib/`
| File | Purpose |
|---|---|
| `auth.ts` | `getEmailFromSession()` — shared auth helper |
| `http-client.ts` | Shared HTTP client with retry/bot-block logic |
| `jina.ts` | Jina scraping wrapper (JINA_API_KEY) |
| `ocean-relevance-gate.ts` | Claude relevance filter (prompt cached) |
| `velocity.ts` | Velocity score interpretation |
| `sources.ts` | Source registry (`RSSSource` interface incl. `skipGate?: boolean`) |
| `subscription.ts` | Subscription status helpers |
| `embeddings.ts` | Jina embedding calls (jina-embeddings-v2-base-en 768-d) |
| `search.ts` | Full-text search helpers |
| `signal-generation.ts` | Dashboard signal generation |
| `confidence.ts` | Confidence scoring |
| `query-expansion.ts` | RAG query expansion |
| `trackers.ts` / `tracker-metadata.ts` | Tracker config |
| `brief-reply.ts` | Brief reply RAG — copy-pasted retrieval logic, **migrate to lib/research.ts in Phase 3 Step 8** |
| `research.ts` | **BUILT (Step 3 ✓)** — unified RAG engine: `embedQuery`, `retrieveChunks`, `abstentionGate`, `synthesise`, `verifyCitations`, `checkFaithfulness`, `assembleResponse` |
| `brief/select.ts` | Brief story selection logic |
| `brief/template.ts` | Brief email template |
| `brief/utils.ts` | Brief utilities |
| `welcome/rules.ts` | Welcome modal display rules |
| `types/supabase.ts` | Generated Supabase types |
| `types/dashboard.ts` | Dashboard types |

### `lib/` (project root)
| File | Purpose |
|---|---|
| `entity-matching.ts` | Entity matching pipeline (`findOrCreateEntity`, `matchEntitiesToStory`) |
| `lp-briefing-pdf.ts` | LP briefing PDF generation |
| `email/alert-data.ts` | Alert email data helpers |
| `email/sparkline.ts` | Sparkline SVG for emails |
| `emails/onboarding-day3.ts` | Day-3 onboarding email |

---

## Scripts (`scripts/`)

- **Diagnostic**: `diag-*.ts`, `probe-*.ts`
- **Backfill**: `backfill-*.ts`, `embed-*.ts`, `recalc-*.ts`
- **Scrapers**: `scraper-informea.ts`, `scraper-ngo-reports.ts`, `scraper-openalex.ts`, `scraper-playwright.ts`, `scraper-un-library.ts`, `processor-agent.ts`
- **Entity**: `entity-matching.ts`, `merge-entity-duplicates.ts`, `cleanup-entities.ts`
- **Testing**: `test-*.ts`, `verify-*.ts`, `replay-recent-matches.ts`
- **Research RAG**: `embed-stories.ts` (story chunk backfill — pending run), `classify-documents.ts` (source classification, complete)

---

## Key Configuration

- `vercel.json` — Cron schedules; 512MB default / 1GB embed-documents
- `tsconfig.json` — `@/*` alias = project root
- `.env.local` — All secrets (never commit)
- `supabase/` — Migration files

---

## Model Assignments (CLAUDE-RULES.md — invariant)

| Model | Routes |
|---|---|
| `claude-haiku-4-5-20251001` | blue-finance-agent, generate-brief (quality gate), governance-agent, project-populate, score-significance, research faithfulness check |
| `claude-sonnet-4-6` | ask, scrape-governance-calendar, summarise-pending, documents/generate-brief, story/linkedin-draft, summarise, threads/match, webhooks/treaty-change, workspace/narrative, research synthesis |

---

## Design System (CLAUDE.md — invariant)

- **Inline styles only** in JSX — no Tailwind utility classes
- **Brand teal**: `#1D9E75`
- **Fonts**: DM Sans (body), Georgia (serif headlines), DM Mono (mono)
- **No em dashes** anywhere in codebase
- **Workspace standard**: White bg, 48px left padding, teal top-border on selection, underline-only inputs, 4px radius buttons

---

## Database (Supabase — 3 schemas: `public`, `auth`, `next_auth`)

**Key tables**: `users`, `stories`, `scraped_sources`, `treaty_ratifications`, `scrape_runs`, `subscriptions`, `trial_signups`, `magic_links`, `governance_bodies`, `governance_events`, `expected_decisions`, `calendar_subscriptions`, `document_chunks`, `story_chunks`, `velocity_scores`, `entities`, `lp_portfolios`, `research_queries`

**RAG**: `match_document_chunks`, `match_primary_chunks`, `match_document_chunks_filtered`, `match_story_chunks` RPCs — Jina `jina-embeddings-v2-base-en` (768-dim, **do not change**)

**Trigger**: `treaty_ratifications` INSERT → pg_net POST → `api/webhooks/treaty-change`

**Document chunks**: 368,413 chunks across 7,580 docs (119 HTML/URL-sourced docs skipped, deferred Phase 5)

---

## Current Status (2026-06-16)

**Research RAG build progress (RESEARCH-RAG-SPEC.md)**:
- Step 1 ✓ Source classification backfill complete (2026-05-29) — `source_tier`, `source_type`, `needs_review` on all 7,698 docs
- Step 2 ✓ Document chunk embedding complete (2026-05-27) — 368,413 chunks live; **story_chunks backfill (embed-stories.ts) still pending**
- Step 3 ✓ `lib/research.ts` + migrations complete (2026-05-29) — 7 functions, `research_queries` table, `match_document_chunks_filtered` RPC
- **Step 4 NEXT**: Build `app/api/research/ask/route.ts` + `research_queries` surface columns migration
- Step 0.5.2 pending: Delete `app/api/research/inline/route.ts` (orphan, wrong model)

**Previously completed**: Daily brief (89 sources), BBNJ tracker, entity directory (153 entities), auth+Stripe, lp_portfolios+lp_briefing, category gate LIVE (`prompt_version=f6491a2171c78bdf`), blue_carbon_credits tracker LIVE, bot-block Phases 1-2B complete

**Known issues**:
- 6 API routes have hardcoded email fallback (security bug) — see `hazard_auth_fallbacks.md`
- `app/api/research/inline/route.ts` is an orphan with wrong model (jina-v3) — delete before Step 4
- story_chunks backfill not yet run (`scripts/embed-stories.ts` needs 3-bug audit first per BUILD GUIDE Step 2)
- DG MARE RSS endpoint unknown
- EPA Water News needs correct topic-filtered feed
