# Project Index: Tideline

Generated: 2026-04-20

## 📁 Project Structure

```
tideline-next/
├── app/
│   ├── api/              # API routes (REST endpoints)
│   │   ├── cron/         # 20 scheduled jobs
│   │   ├── admin/        # Admin-only endpoints
│   │   ├── webhooks/     # Supabase pg_net triggers
│   │   └── ...           # Feature endpoints
│   ├── lib/              # Shared server-side utilities
│   ├── platform/(shell)/ # Authenticated platform pages
│   └── tracker/          # Public tracker pages (legacy)
├── components/           # Shared React components
├── scripts/              # One-off data scripts (tsx)
├── supabase/migrations/  # SQL migration files
└── data/audits/          # Feed audit CSVs + analysis
```

## 🚀 Entry Points

- **Dev server**: `npm run dev`
- **Production**: `npm run build && npm start`
- **Lint**: `npm run lint`
- **Seed scripts**: `npm run seed:events`, `npm run seed:alerts`
- **Backfill**: `npm run backfill:multipliers`, `npm run backfill:controversy`

## 📄 Public Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Marketing homepage |
| `/start` | `app/start/page.tsx` | Trial signup flow |
| `/sign-in` | `app/sign-in/page.tsx` | Magic link / Google auth |
| `/pricing` | `app/pricing/page.tsx` | Pricing page |
| `/demo` | `app/demo/page.tsx` | Demo page |
| `/survey` | `app/survey/page.tsx` | User survey |
| `/upgrade` | `app/upgrade/page.tsx` | Upgrade prompt |
| `/workspace` | `app/workspace/page.tsx` | Standalone workspace |
| `/workspace/[id]` | `app/workspace/[id]/page.tsx` | Workspace detail |
| `/reports` | `app/reports/page.tsx` | Reports page |
| `/admin/brief` | `app/admin/brief/page.tsx` | Admin brief override |

## 🔒 Platform Pages (auth required, `/platform/(shell)/`)

| Route | Description |
|-------|-------------|
| `/platform/feed` | Main news feed with topic sidebar + paywall |
| `/platform/story/[id]` | Story detail with AI summary |
| `/platform/workspace` | Intelligence workspace |
| `/platform/projects` | Research projects list |
| `/platform/projects/[id]` | Project detail |
| `/platform/projects/[id]/draft` | Project draft editor (Tiptap) |
| `/platform/threads` | Intelligence threads |
| `/platform/research` | Research assistant |
| `/platform/calendar` | Governance calendar |
| `/platform/directory` | Entity/org directory |
| `/platform/library` | Document library |
| `/platform/library/submit` | Document submission |
| `/platform/lp-briefing` | LP briefing panel |
| `/platform/settings/topics` | Topic preferences |
| `/platform/trackers` | Tracker hub |
| `/platform/admin/library` | Admin: library management |

## 🗺️ Tracker Pages (`/platform/tracker/`)

| Tracker | Slug |
|---------|------|
| BBNJ Treaty | `bbnj` |
| ISA (Deep Sea Mining) | `isa` |
| IUU Fishing | `iuu` |
| 30x30 Marine Protection | `30x30` |
| Plastics Treaty | `plastics` |
| Blue Finance | `blue-finance` |
| IMO Shipping Decarbonisation | `imo-shipping` |
| WTO Fisheries Subsidies | `wto-fisheries` |
| CITES Marine | `cites-marine` |
| Offshore Wind | `offshore-wind` |
| Governance Calendar | `governance` |

## 🌐 API Routes

### Auth
- `POST /api/auth/[...nextauth]` — NextAuth (Google OAuth + magic link)
- `POST /api/auth/verify` — Validates magic link token, creates user, sets session cookie
- `POST /api/magic-link` — Generates and sends magic link via Resend

### Content & Stories
- `GET /api/stories` — Fetch stories (topic filter, pagination, id lookup)
- `POST /api/stories/save` — Save/unsave story
- `GET/POST /api/stories/comments` — Story comments
- `POST /api/summarise` — On-demand AI summarization (Jina→fetch→RSS fallback)
- `GET /api/search` — Semantic vector search
- `POST /api/ask` — AI Q&A over corpus
- `POST /api/research/inline` — Inline research assistant

### User & Subscription
- `GET /api/subscription-status` — Status + needsOnboarding flag
- `GET /api/subscription-access` — Access tier check
- `POST /api/onboarding` — Save topics + timezone
- `POST /api/subscribe` — Create Stripe subscription (14-day trial)
- `POST /api/stripe-webhook` — Stripe events (5 event types)
- `POST /api/stripe/checkout` — Stripe checkout session
- `GET /api/portal` — Stripe customer portal
- `POST /api/trial-signup` — Pre-auth trial signup + welcome email
- `POST /api/waitlist` — Waitlist signup
- `POST /api/survey` — Survey response submission
- `GET/POST /api/user/*` — User profile (sector, topics, modal, onboarding-status, last-seen)

### Trackers
- `GET /api/treaty-status` — BBNJ ratification data
- `GET /api/iuu-status` — IUU fishing status
- `GET /api/30x30-status` — 30x30 protection status
- `GET /api/blue-finance-status` — Blue finance status
- `GET /api/isa-status` — ISA mining status
- `GET /api/isa-contractors` — ISA contractor list
- `GET /api/psma` — PSMA compliance data
- `GET /api/iuu/carding` — IUU carding data
- `GET /api/tracker-status/[slug]` — Generic tracker status
- `GET /api/tracker-events` — Tracker event log
- `POST /api/tracker/view` — Record tracker view
- `GET /api/velocity/[slug]` — Velocity score for topic

### Workspace & Projects
- `GET/POST /api/projects` — Project CRUD
- `GET/PUT/DELETE /api/project-entries/[id]` — Project entry management
- `GET /api/projects/new-stories` — New stories since last visit
- `GET/POST /api/threads` — Intelligence threads
- `GET /api/threads/me` — User's threads
- `POST /api/threads/match` — Thread matching
- `GET /api/documents/[id]` — Document detail
- `GET /api/documents/[id]/export` — Export document
- `POST /api/documents/generate-brief` — AI brief generation
- `POST /api/documents/submit` — Submit document to library
- `POST /api/workspace/quick-note` — Quick note capture
- `POST /api/workspace/narrative` — Narrative generation
- `GET /api/community-documents` — Community document library

### Calendar & Governance
- `GET /api/governance-events` — Governance meeting events (body/topic/significance filters)
- `GET /api/calendar/[token]` — Personal iCal feed
- `POST /api/calendar/subscribe` — Create calendar subscription
- `GET /api/consultations` — Regulatory consultation calendar

### LP & Admin
- `GET /api/lp-briefing` — LP portfolio brief
- `GET /api/lp-briefing/pdf` — PDF export of LP brief
- `GET /api/lp-briefing/stats` — LP brief statistics
- `GET/POST /api/lp-portfolios` — LP portfolio management
- `GET /api/entities/search` — Entity search
- `GET /api/dashboard` — Dashboard summary data
- `GET /api/sidebar-data` — Sidebar data (topics, stories count)
- `GET /api/landing-data` — Homepage data
- `POST /api/alerts/subscribe` — Alert preference subscription
- `GET /api/library/signed-url` — Signed URL for library docs
- `POST /api/story/linkedin-draft` — LinkedIn post draft
- `POST /api/admin/story-override` — Admin story curation
- `POST /api/admin/backfill-entities` — Entity backfill
- `POST /api/admin/backfill-velocity` — Velocity backfill
- `POST /api/admin/documents/*` — Admin document upload

### Webhooks
- `POST /api/webhooks/treaty-change` — pg_net trigger for treaty ratification changes → Claude significance assessment → story alert

## ⏰ Cron Jobs (20 total)

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `cron/fetch-feeds` | Hourly | RSS aggregation (~89 sources) |
| `cron/harvest-scraped-sources` | Every 6h | Web scraping (IMO, ISA, FAO, IUCN, etc.) |
| `cron/scrape-governance-calendar` | Weekly Mon 3am UTC | Governance meeting extraction |
| `cron/scrape-isa` | Scheduled | ISA deep-sea mining scraper |
| `cron/scrape-psma` | Scheduled | PSMA compliance scraper |
| `cron/summarise-pending` | Scheduled | AI summarization queue |
| `cron/generate-embeddings` | Scheduled | Vector embedding generation |
| `cron/embed-documents` | Scheduled | Document chunk embedding |
| `cron/generate-connections` | Scheduled | Story connection graph |
| `cron/score-significance` | Scheduled | Significance scoring |
| `cron/velocity-scores` | Scheduled | Velocity score updates |
| `cron/blue-finance-agent` | Scheduled | Blue finance monitoring |
| `cron/governance-agent` | Scheduled | Governance event agent |
| `cron/generate-brief` | Daily | AI brief generation |
| `cron/send-brief` | Daily | Brief email delivery |
| `cron/conversion-triggers` | Scheduled | Trial conversion emails |
| `cron/source-health` | Scheduled | Source health reporting |
| `cron/monitor-sources` | Scheduled | Source uptime monitoring |
| `cron/threshold-alerts` | Scheduled | Threshold-based alerts |
| `cron/project-populate` | Scheduled | Auto-populate projects |

## 📦 Lib Modules (`app/lib/`)

| File | Purpose |
|------|---------|
| `auth.ts` | `getEmailFromSession()` — extracts email from JWT for API routes |
| `sources.ts` | RSS/scrape source definitions (~89 sources with tiers, topics, types) |
| `ocean-relevance-gate.ts` | Batched Haiku calls to filter non-ocean stories (shadow mode) |
| `embeddings.ts` | Vector embedding generation + upsert utilities |
| `search.ts` | Semantic search over `story_embeddings` via pgvector |
| `subscription.ts` | Subscription status helpers, access tier logic |
| `jina.ts` | Jina API client for article scraping + HTML rendering |
| `velocity.ts` | Velocity score calculation (story volume × source weight × recency) |
| `tracker-metadata.ts` | Static config for tracker pages (labels, slugs, descriptions) |
| `confidence.ts` | Confidence scoring for AI-extracted data |
| `html.ts` | HTML stripping, text extraction utilities |
| `events.ts` | Governance event helpers |
| `brief-reply.ts` | Reply-to-brief email handling |
| `user-preferences.ts` | User topic/notification preference helpers |
| `query-expansion.ts` | Search query synonym expansion |

## 🧩 Components

| Component | Purpose |
|-----------|---------|
| `Header.tsx` | Shared site header |
| `Paywall.tsx` | Hard paywall overlay (canceled/past_due/none) |
| `TrialBanner.tsx` | Soft banner (≤5 days left in trial) |
| `ConversionModal.tsx` | Upgrade prompt modal |
| `WelcomeState.tsx` | First-login empty state |
| `EarlyAccessModal.tsx` | Early access gate |
| `StoryCard.tsx` | Feed story card |
| `FeaturedCard.tsx` | Featured/hero story card |
| `FeedSidebar.tsx` | Topic filter sidebar |
| `SegmentSwitcher.tsx` | Feed segment tabs |
| `AlertToggle.tsx` | Alert subscription toggle |
| `VelocityScore.tsx` | Velocity score display badge |
| `Sparkline.tsx` | Mini trend chart |
| `TopicsSelector.tsx` | Multi-topic picker (onboarding + settings) |
| `TrackerHero.tsx` | Tracker page hero section |
| `TrackerHistory.tsx` | Historical trend display |
| `TrackerMethodology.tsx` | Methodology explanation panel |
| `HeroSignal.tsx` | Homepage live signal widget |
| `HeroSignalBandCrossing.tsx` | Band crossing signal variant |
| `HeroSignalGovernance.tsx` | Governance signal variant |
| `HeroSignalVelocity.tsx` | Velocity signal variant |
| `OvernightReveal.tsx` | Overnight stories reveal animation |
| `TickerStrip.tsx` | Breaking news ticker |
| `LinkedInDraftPanel.tsx` | LinkedIn post draft UI |
| `DesktopOnly.tsx` | Desktop-only gate wrapper |
| `workspace/IntelligenceThread.tsx` | AI intelligence thread UI |
| `ui/TidelineLogo.tsx` | Logo SVG component |

## 🗄️ Database (Supabase)

**Key tables:**
- `public.users` — subscription status, topics (jsonb), timezone, stripe_subscription_id, trial_ends_at
- `public.stories` — title, link, source_name, topic, published_at, description, summaries, is_pro, alert_type, velocity_score
- `public.scraped_sources` — non-RSS scraped content with content_hash dedup
- `public.treaty_ratifications` — longitudinal BBNJ ratification change log
- `public.governance_events` — meetings with significance, expected_decisions
- `public.governance_bodies` — 10 intergovernmental bodies
- `public.expected_decisions` — per-event decision tracker
- `public.calendar_subscriptions` — personal iCal subscriptions
- `public.scrape_runs` — scraper health log
- `public.subscriptions` — Stripe subscription state
- `public.embeddings` / `public.document_chunks` — vector search
- `public.tracker_events` — tracker change event log
- `public.projects` / `public.project_entries` — workspace projects
- `public.threads` — intelligence threads
- `public.entities` — named entities (orgs, treaties, species) with taxonomy
- `public.lp_portfolios` — LP portfolio configs
- `public.consultations` — regulatory consultation calendar
- `public.source_health` / `public.source_health_snapshots` — feed health monitoring
- `next_auth.users` — NextAuth session management (separate schema)

**Latest migration:** `20260421_stories_quarantine.sql`

## 🔗 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` 16.x | App framework (App Router) |
| `react` 19.x | UI |
| `@anthropic-ai/sdk` ^0.82.0 | Claude API (summaries, classification) |
| `@ai-sdk/anthropic` ^3.0.69 | AI SDK for streaming |
| `@supabase/supabase-js` ^2.99.2 | Database client |
| `next-auth` 4.x | Auth (Google + magic link) |
| `stripe` | Payments + webhooks |
| `resend` | Transactional email |
| `@mastra/core` + `@mastra/rag` | RAG pipeline |
| `@tiptap/*` ^3.x | Rich text editor (project drafts) |
| `d3` | Data visualization (trackers) |
| `pdfkit` | PDF generation (LP brief) |

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `vercel.json` | Cron schedules + function config |
| `tsconfig.json` | TypeScript (`@/*` path alias to root) |
| `.env.local` | Secrets (never committed) |
| `middleware.ts` | Route protection for `/platform/*` |
| `next.config.ts` | Next.js config |

## 📝 Scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `seed-tracker-events.ts` | Seed governance tracker events |
| `seed-alert-preferences.ts` | Seed alert defaults |
| `seed-loader.ts` | Entity seed data loader |
| `backfill-multipliers.ts` | Velocity multiplier backfill |
| `backfill-controversy.ts` | Controversy score backfill |
| `embed-documents.ts` | One-off document embedding |
| `import-faolex.ts` | FAO FAOLEX fisheries data import |
| `scraper-*.ts` | Various one-off scrapers (Playwright, InforMEA, OpenAlex, NGO, UN Library) |
| `processor-agent.ts` | Document processing agent |

## 🧠 AI Model Usage

- **Summaries**: `claude-sonnet-4-20250514` (on-demand + batch)
- **Relevance filtering**: `claude-haiku-*` (ocean-relevance gate, shadow mode)
- **Governance extraction**: Claude via Jina-rendered HTML
- **Treaty significance**: Claude in webhook handler
- **Brief generation**: Claude (daily)
- **Research/Ask**: Claude with RAG (Mastra)

## 🔑 Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
RESEND_API_KEY
STRIPE_SECRET_KEY / STRIPE_PRICE_ID / STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
CRON_SECRET
JINA_API_KEY
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET / NEXTAUTH_URL
```
