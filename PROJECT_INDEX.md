# Project Index: tideline-next

Generated: 2026-04-30

## Project

Ocean intelligence SaaS. Curates/summarises ocean news, research, regulatory developments.
Stack: Next.js 16, React 19, TypeScript 5, Tailwind v4 (inline styles only), Supabase, Stripe, Anthropic, Resend, Mastra, Vitest.

---

## Entry Points

- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npx vitest` (Vitest 4)
- Scripts: `npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/<name>.ts`

---

## App Router Pages (app/)

| Route | File |
|-------|------|
| `/` | app/page.tsx (marketing, hero, trackers, pricing, FAQ) |
| `/sign-in` | app/sign-in/page.tsx |
| `/pricing` | app/pricing/page.tsx |
| `/demo` | app/demo/page.tsx |
| `/upgrade` | app/upgrade/page.tsx |
| `/admin/brief` | app/admin/brief/page.tsx |
| `/workspace` | app/workspace/page.tsx |
| `/workspace/[id]` | app/workspace/[id]/page.tsx |
| `/reports` | app/reports/page.tsx |
| `/platform/(shell)/feed` | app/platform/(shell)/feed/page.tsx |
| `/platform/(shell)/calendar` | app/platform/(shell)/calendar/page.tsx |
| `/platform/(shell)/threads` | app/platform/(shell)/threads/page.tsx |
| `/platform/(shell)/research` | app/platform/(shell)/research/page.tsx |
| `/platform/(shell)/projects` | app/platform/(shell)/projects/page.tsx |
| `/platform/(shell)/projects/[id]` | app/platform/(shell)/projects/[id]/page.tsx |
| `/platform/(shell)/projects/[id]/draft` | app/platform/(shell)/projects/[id]/draft/page.tsx |
| `/platform/(shell)/lp-briefing` | app/platform/(shell)/lp-briefing/page.tsx |
| `/platform/(shell)/library` | app/platform/(shell)/library/page.tsx |
| `/platform/(shell)/library/submit` | app/platform/(shell)/library/submit/page.tsx |
| `/platform/(shell)/settings/topics` | app/platform/(shell)/settings/topics/page.tsx |
| `/platform/(shell)/story/[id]` | app/platform/(shell)/story/[id]/page.tsx |
| `/platform/(shell)/trackers` | app/platform/(shell)/trackers/page.tsx |
| `/platform/(shell)/tracker/governance` | app/platform/(shell)/tracker/governance/page.tsx |
| `/platform/(shell)/tracker/bbnj` | app/platform/(shell)/tracker/bbnj/page.tsx |
| `/platform/(shell)/tracker/30x30` | app/platform/(shell)/tracker/30x30/page.tsx |
| `/platform/(shell)/tracker/iuu` | app/platform/(shell)/tracker/iuu/page.tsx |
| `/platform/(shell)/tracker/blue-finance` | app/platform/(shell)/tracker/blue-finance/page.tsx |
| `/platform/(shell)/tracker/isa` | app/platform/(shell)/tracker/isa/page.tsx |
| `/platform/(shell)/tracker/imo-shipping` | app/platform/(shell)/tracker/imo-shipping/page.tsx |
| `/platform/(shell)/tracker/offshore-wind` | app/platform/(shell)/tracker/offshore-wind/page.tsx |
| `/platform/(shell)/tracker/cites-marine` | app/platform/(shell)/tracker/cites-marine/page.tsx |
| `/platform/(shell)/tracker/wto-fisheries` | app/platform/(shell)/tracker/wto-fisheries/page.tsx |
| `/platform/(shell)/tracker/plastics` | app/platform/(shell)/tracker/plastics/page.tsx |
| `/platform/(shell)/workspace` | app/platform/(shell)/workspace/page.tsx |
| `/platform/(shell)/directory` | app/platform/(shell)/directory/page.tsx |
| `/platform/(shell)/admin/library` | app/platform/(shell)/admin/library/page.tsx |

---

## API Routes (app/api/)

### Auth
- `auth/[...nextauth]` — NextAuth v4 (Google OAuth + magic link via Resend)
- `auth/verify` — validates magic link token, sets session cookie, redirects

### Stories & Content
- `stories` — fetch/filter stories (topic, pagination, id lookup)
- `stories/save` — save story for user
- `stories/comments` — story comments
- `summarise` — on-demand Claude summarisation (Jina -> direct fetch -> RSS fallback)
- `story/linkedin-draft` — LinkedIn post draft generator

### Stripe
- `stripe-webhook` — handles 5 Stripe events (checkout, created, updated, deleted, payment_failed)
- `stripe/checkout` — creates Stripe checkout session
- `portal` — Stripe customer portal redirect

### User
- `user/onboarding-status` — checks if onboarding needed
- `user/complete-onboarding` — saves topics + timezone
- `user/modal-status` / `user/dismiss-modal` — modal state
- `user/sector` — sector preference
- `user/update-last-seen` — activity tracking
- `subscription-access` — returns subscription status + needsOnboarding flag

### Governance & Trackers
- `governance-events` — GET events with body/topic/significance filters
- `tracker-events` — tracker event data
- `tracker-status/[slug]` — status for bbnj/30x30/iuu/blue-finance
- `tracker/view` — track page view
- `treaty-status` — BBNJ ratification status
- `iuu-status` — IUU fishing status
- `30x30-status` — 30x30 ocean protection status
- `blue-finance-status` — blue finance status
- `isa-status` / `isa-contractors` — ISA contractor data
- `psma` — PSMA status
- `iuu/carding` — IUU vessel carding data
- `webhooks/treaty-change` — Supabase pg_net trigger -> Claude significance check -> story alert

### Calendar
- `calendar/[token]` — personal iCal feed (text/calendar)
- `calendar/subscribe` — create personal calendar subscription

### Research & AI
- `research/inline` — inline AI research assistant
- `ask` — general AI Q&A endpoint
- `search` — semantic search (embeddings)

### Entities
- `entities/search` — entity search endpoint

### Projects & Documents
- `projects` — CRUD for user projects
- `projects/new-stories` — fetch new stories for project
- `project-entries/[id]` — project entry detail
- `documents` — document library CRUD
- `documents/[id]` — document detail
- `documents/[id]/export` — export document
- `documents/generate-brief` — AI brief generation
- `documents/submit` — submit document

### Library (Admin)
- `library/search` — library full-text search
- `library/view` — track document view
- `library/activity` — library activity feed
- `library/signed-url` — generate signed download URL
- `admin/documents/signed-upload-url` / `admin/documents/upload` / `admin/documents/review` — admin doc pipeline
- `admin/story-override` — manual story override
- `admin/backfill-velocity` — backfill velocity scores

### LP Briefing
- `lp-briefing` — generate LP briefing
- `lp-briefing/pdf` — export LP briefing as PDF (PDFKit via lib/lp-briefing-pdf.ts)
- `lp-briefing/stats` — briefing stats
- `lp-portfolios` — LP portfolio CRUD

### Workspace
- `workspace/quick-note` — quick note capture
- `workspace/narrative` — narrative generation

### Social & Community
- `threads` / `threads/me` / `threads/match` — discussion threads
- `connections` — user connections
- `community-documents` — community document sharing
- `notifications` — notification feed

### Data & Config
- `dashboard` — dashboard aggregated data
- `sidebar-data` — sidebar stats
- `landing-data` — public landing page stats
- `consultations` — consultation submissions
- `survey` / `waitlist` — lead capture
- `trial-signup` — stores signup in trial_signups, sends welcome email

---

## Cron Jobs (vercel.json)

| Path | Schedule | Purpose |
|------|----------|---------|
| `cron/fetch-feeds` | Every 2h (even hours) | RSS aggregation ~89 sources |
| `cron/summarise-pending` | Every 2h (+15min) | Claude summarise new stories |
| `cron/project-populate` | Every 2h (+30min) | Populate user projects with new stories |
| `cron/harvest-scraped-sources` | Daily 6:30am | Non-RSS scrapers (IMO, ISA, FAO, IUCN, CBD, CITES, UN BBNJ) |
| `cron/generate-embeddings` | Daily 1am | Story vector embeddings (768-dim) |
| `cron/score-significance` | Daily 3:30am | Significance scoring |
| `cron/generate-connections` | Daily 7am | Story connections |
| `cron/threshold-alerts` | Daily 8am | Velocity threshold email alerts |
| `cron/conversion-triggers` | Daily 9am | Trial conversion emails |
| `cron/embed-documents` | Daily 3am | Document embeddings |
| `cron/governance-agent` | Mondays 4am | Governance calendar scrape (Claude extraction) |
| `cron/blue-finance-agent` | Mondays 4:30am | Blue finance intelligence |
| `cron/monitor-sources` | Mondays 7am | Source health monitoring |
| `cron/source-health` | Mondays 5am | Source health check |
| `cron/scrape-isa` | Tuesdays 5am | ISA scrape |
| `cron/scrape-psma` | Wednesdays 8am | PSMA scrape |
| `cron/scrape-governance-calendar` | Every 10 days 3am | Governance body meeting pages |
| `cron/velocity-scores` | Every 4 days 6am | Entity velocity score recalc |
| `cron/generate-entity-briefs` | Hourly | Generate entity intelligence briefs |
| `cron/send-entity-briefs` | Every 30min | Send entity briefs to subscribers |

Vercel function config: 512MB/60s default, embed-documents gets 1024MB/300s.

---

## Core Lib Modules

| File | Purpose |
|------|---------|
| `lib/entity-matching.ts` | `findOrCreateEntity()`, `matchEntitiesToStory()`, `matchEntitiesBatch()` — only correct entity write paths |
| `lib/lp-briefing-pdf.ts` | PDFKit LP briefing PDF generation |
| `lib/emails/onboarding-day3.ts` | Day 3 onboarding email template |
| `app/lib/auth.ts` | `getEmailFromSession()` — extracts email from NextAuth JWT for API routes |
| `app/lib/embeddings.ts` | Vector embedding helpers (768-dim, text-embedding-3-small) |
| `app/lib/search.ts` | Semantic search over embeddings |
| `app/lib/subscription.ts` | Subscription status helpers |
| `app/lib/tracker-metadata.ts` | Tracker page metadata (BBNJ, 30x30, IUU, Blue Finance) |
| `app/lib/entity-brief.ts` | Entity brief generation logic (Material>=25, Watch 10-24 thresholds) |
| `app/lib/velocity.ts` | Velocity score calculation |
| `app/lib/ocean-relevance-gate.ts` | Ocean relevance classifier gate |
| `app/lib/signal-generation.ts` | Signal event generation |
| `app/lib/jina.ts` | Jina API wrapper |
| `app/lib/sources.ts` | RSS source list and config |
| `app/lib/constants.ts` | Shared constants |

---

## Database (Supabase, 3 schemas)

Key tables in `public`:
- `users` — subscription_status, topics (jsonb), timezone, stripe_subscription_id, trial_ends_at
- `stories` — title, link, source_name, topic, source_type, published_at, description, short_summary, full_summary, is_pro, alert_type
- `scraped_sources` — url, source_name, content_hash (dedup), raw_html
- `treaty_ratifications` — longitudinal change log with changed_from; pg_net trigger on INSERT
- `governance_bodies` — 10 intergovernmental bodies with scrape URLs
- `governance_events` — meetings/deadlines with source_id (dedup), expected decisions
- `expected_decisions` — per-event: description, type, expected_outcome, audience_tags
- `entities` — ocean entities with mention_count (denormalised — see CLAUDE-RULES Section 4), embedding (768-dim)
- `entity_mentions` — story->entity links
- `entity_aliases` — canonical name aliases
- `entity_review_queue` — near-matches for human review (do not suppress)
- `lp_portfolios` — LP portfolio records
- `subscriptions` — Stripe subscription state
- `calendar_subscriptions` — personal iCal subscriptions with filters
- `trial_signups` — email, topics, signed_up_at, status
- `magic_links` — email, token, expires_at, used
- `velocity_scores` — entity velocity over time
- `story_embeddings` — 768-dim story vectors (replaces old `embeddings` table dropped 2026-04-27)

Pending Studio migrations (as of 2026-04-30):
- `20260429_entity_review_queue.sql`
- `20260429_entity_embedding_to_768.sql`

Schema `next_auth`: NextAuth session management.

---

## Key Patterns

- **Styling**: Inline styles only (`style={{...}}`), never Tailwind classes in JSX. Responsive via `<style>` tags with `@media`.
- **Auth**: NextAuth v4 JWT strategy. Middleware protects `/platform/*` and `/tracker/*`. `getEmailFromSession()` in `app/lib/auth.ts`.
- **AI model split**: Internal bulk ops -> `claude-haiku-4-5`. Never Opus/Sonnet for scrapers/summaries/morning brief.
- **Entity writes**: Always via `findOrCreateEntity()` in `lib/entity-matching.ts`. Never write directly to entities tables.
- **Denormalised counters**: Idempotency required — call write path twice, counter must increment exactly once (CLAUDE-RULES Section 4).
- **Migrations**: Apply via Supabase Studio manually, verify with diagnostic query before marking complete.
- **Scripts**: Run via `npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/<file>.ts`
- **Path alias**: `@/*` maps to project root.
- **Embeddings**: 768-dim (text-embedding-3-small). Entity embeddings use `match_entity_embeddings` RPC. Old 1536-dim `embeddings` table dropped.

---

## Tests

- `entity-matching.idempotency.test.ts` (root) — Vitest idempotency test for `matchEntitiesToStory`
- Runner: `npx vitest` (Vitest 4.1.5)

---

## Admin Scripts (scripts/)

Entity: `backfill-entity-matching.ts`, `backfill-entity-aliases.ts`, `recalc-entity-mention-counts.ts`, `merge-entity-duplicates.ts`, `delete-noise-entities.ts`, `verify-mentions.ts`, `run-full-backfill.ts`, `check-unmatched.ts`, `cleanup-entities.ts`, `fix-entities.ts`, `test-entity-matching.ts`, `test-entity-brief.ts`, `embed-entities.ts`

Scrapers: `scraper-playwright.ts`, `scraper-informea.ts`, `scraper-openalex.ts`, `scraper-ngo-reports.ts`, `scraper-agent.ts`, `scraper-un-library.ts`, `import-faolex.ts`

Other: `embed-stories.ts`, `embed-documents.ts`, `backfill-multipliers.ts`, `backfill-controversy.ts`, `seed-tracker-events.ts`, `seed-alert-preferences.ts`, `seed-loader.ts`, `processor-agent.ts`, `fix-convergence.ts`, `fix-convergence-alias.ts`, `debug-convergence.ts`, `test-rpc.ts`

---

## External Services

| Service | Purpose | Key env var |
|---------|---------|-------------|
| Supabase | DB + Auth adapter | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Anthropic | Summarisation, classification | `ANTHROPIC_API_KEY` |
| Stripe | Payments + webhooks | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` |
| Resend | Transactional email | `RESEND_API_KEY` |
| Jina | Article scraping | `JINA_API_KEY` |
| Google OAuth | Sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| NextAuth | Session management | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| Vercel | Hosting + cron | (deployment) |
| Sentry | Error tracking | (auto-configured via `@sentry/nextjs`) |
| Mastra | RAG / AI pipeline | (via `@mastra/core`, `@mastra/rag`) |
