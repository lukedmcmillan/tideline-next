# Project Index: Tideline

Generated: 2026-04-21

## 📁 Project Structure

```
tideline-next/
├── app/
│   ├── api/                  # All API routes
│   │   ├── auth/             # NextAuth + magic link
│   │   ├── cron/             # 20 scheduled jobs
│   │   ├── webhooks/         # Stripe + treaty triggers
│   │   ├── admin/            # Admin-only endpoints
│   │   └── ...               # Feature endpoints
│   ├── lib/                  # Shared utilities
│   ├── platform/(shell)/     # Auth-protected platform pages
│   └── ...                   # Public pages (/, /start, /sign-in, etc.)
├── components/               # Shared React components
├── lib/                      # Root-level lib (email, entities, PDF)
├── scripts/                  # One-off scripts (entity work, scrapers)
├── supabase/migrations/      # SQL migrations (40+ files)
└── data/audits/              # Manual audit files
```

## 🚀 Entry Points

- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Root layout**: `app/layout.tsx`
- **Platform layout**: `app/platform/layout.tsx`
- **Platform shell layout**: `app/platform/(shell)/layout.tsx`

## 📄 Public Pages

| Route | File |
|-------|------|
| `/` | `app/page.tsx` (marketing homepage) |
| `/start` | `app/start/page.tsx` (trial signup) |
| `/sign-in` | `app/sign-in/page.tsx` |
| `/subscribe` | `app/subscribe/page.tsx` (Stripe checkout) |
| `/onboarding` | `app/onboarding/page.tsx` |
| `/pricing` | `app/pricing/page.tsx` |
| `/demo` | `app/demo/page.tsx` |
| `/survey` | `app/survey/page.tsx` |
| `/upgrade` | `app/upgrade/page.tsx` |

## 🔐 Platform Pages (auth-protected)

| Route | File |
|-------|------|
| `/platform/feed` | `app/platform/(shell)/feed/page.tsx` |
| `/platform/story/[id]` | `app/platform/(shell)/story/[id]/page.tsx` |
| `/platform/workspace` | `app/platform/(shell)/workspace/page.tsx` |
| `/platform/projects` | `app/platform/(shell)/projects/page.tsx` |
| `/platform/projects/[id]` | `app/platform/(shell)/projects/[id]/page.tsx` |
| `/platform/research` | `app/platform/(shell)/research/page.tsx` |
| `/platform/threads` | `app/platform/(shell)/threads/page.tsx` |
| `/platform/library` | `app/platform/(shell)/library/page.tsx` |
| `/platform/directory` | `app/platform/(shell)/directory/page.tsx` |
| `/platform/calendar` | `app/platform/(shell)/calendar/page.tsx` |
| `/platform/trackers` | `app/platform/(shell)/trackers/page.tsx` |
| `/platform/lp-briefing` | `app/platform/(shell)/lp-briefing/page.tsx` |
| `/platform/settings/topics` | `app/platform/(shell)/settings/topics/page.tsx` |
| `/platform/tracker/bbnj` | `app/platform/(shell)/tracker/bbnj/page.tsx` |
| `/platform/tracker/governance` | `app/platform/(shell)/tracker/governance/page.tsx` |
| `/platform/tracker/isa` | `app/platform/(shell)/tracker/isa/page.tsx` |
| `/platform/tracker/iuu` | `app/platform/(shell)/tracker/iuu/page.tsx` |
| `/platform/tracker/30x30` | `app/platform/(shell)/tracker/30x30/page.tsx` |
| `/platform/tracker/blue-finance` | `app/platform/(shell)/tracker/blue-finance/page.tsx` |
| `/platform/tracker/plastics` | `app/platform/(shell)/tracker/plastics/page.tsx` |
| `/platform/tracker/offshore-wind` | `app/platform/(shell)/tracker/offshore-wind/page.tsx` |
| `/platform/tracker/imo-shipping` | `app/platform/(shell)/tracker/imo-shipping/page.tsx` |
| `/platform/tracker/wto-fisheries` | `app/platform/(shell)/tracker/wto-fisheries/page.tsx` |
| `/platform/tracker/cites-marine` | `app/platform/(shell)/tracker/cites-marine/page.tsx` |
| `/platform/admin/library` | `app/platform/(shell)/admin/library/page.tsx` |

## 📡 API Routes

### Auth & Billing
- `POST /api/auth/[...nextauth]` — NextAuth handler (Google + magic link)
- `GET /api/auth/verify` — magic link verification + session cookie
- `POST /api/trial-signup` — stores trial signup, sends welcome email
- `POST /api/subscribe` — Stripe customer + subscription creation
- `POST /api/stripe-webhook` — 5 Stripe events (checkout, sub CRUD, payment_failed)
- `POST /api/stripe/checkout` — checkout session creation
- `GET /api/portal` — Stripe customer portal redirect

### User / Onboarding
- `GET/POST /api/subscription-access` — auth + subscription status check
- `POST /api/user/complete-onboarding` — save topics + timezone
- `GET /api/user/onboarding-status` — first-login redirect logic
- `POST /api/user/dismiss-modal` — modal dismiss state
- `GET /api/user/modal-status` — modal show/hide flag
- `POST /api/user/update-last-seen` — heartbeat
- `POST /api/user/sector` — save user sector

### Stories / Feed
- `GET /api/stories` — paginated feed (topic filter, id lookup)
- `POST /api/summarise` — on-demand Claude summarization (3-tier fallback)
- `POST /api/stories/save` — save story to project
- `GET/POST /api/stories/comments` — story comments
- `POST /api/story/linkedin-draft` — LinkedIn post draft generation

### Workspace / Projects
- `GET/POST /api/projects` — project CRUD
- `GET /api/projects/new-stories` — new stories for project since last visit
- `GET/POST/DELETE /api/project-entries/[id]` — project entry management
- `POST /api/workspace/quick-note` — add quick note
- `POST /api/workspace/narrative` — generate project narrative
- `GET/POST /api/threads` — intelligence threads
- `GET /api/threads/me` — user's threads
- `POST /api/threads/match` — match stories to threads
- `POST /api/research/inline` — inline AI research
- `POST /api/ask` — general AI question endpoint

### Documents / Library
- `GET/POST /api/documents/[id]` — document CRUD
- `POST /api/documents/[id]/export` — export document
- `POST /api/documents/submit` — community document submission
- `POST /api/documents/generate-brief` — AI brief generation
- `GET /api/community-documents` — public document library
- `GET /api/library/signed-url` — signed storage URL
- `POST /api/admin/documents/upload` — admin upload
- `GET /api/admin/documents/signed-upload-url` — presigned upload URL

### Trackers
- `GET /api/tracker-status/[slug]` — single tracker status
- `GET /api/tracker-events` — tracker event log
- `GET /api/iuu-status` — IUU fishing tracker data
- `GET /api/iuu/carding` — IUU carding data
- `GET /api/isa-status` — ISA tracker data
- `GET /api/isa-contractors` — ISA contractor list
- `GET /api/30x30-status` — 30x30 tracker data
- `GET /api/blue-finance-status` — blue finance tracker data
- `GET /api/psma` — PSMA treaty data
- `GET /api/velocity/[slug]` — topic velocity scores
- `GET /api/treaty-status` — BBNJ ratification status
- `GET /api/tracker/view` — record tracker view

### Governance Calendar
- `GET /api/governance-events` — events with body/topic/significance filters
- `GET /api/calendar/[token]` — personal iCal feed
- `POST /api/calendar/subscribe` — create calendar subscription

### Search / Entities / Data
- `GET /api/search` — full-text + semantic search
- `GET /api/entities/search` — entity search
- `GET /api/sidebar-data` — sidebar aggregations
- `GET /api/dashboard` — dashboard data
- `GET /api/landing-data` — marketing page data
- `GET /api/consultations` — active consultations

### LP Briefing
- `POST /api/lp-briefing` — generate LP briefing
- `GET /api/lp-briefing/pdf` — export LP briefing as PDF
- `GET /api/lp-briefing/stats` — briefing stats
- `GET/POST /api/lp-portfolios` — portfolio management

### Alerts / Waitlist
- `POST /api/alerts/subscribe` — subscribe to topic alerts
- `POST /api/waitlist` — waitlist signup

### Webhooks
- `POST /api/webhooks/treaty-change` — Supabase pg_net trigger on treaty INSERT → Claude assessment

### Admin
- `POST /api/admin/story-override` — manual story accept/reject
- `POST /api/admin/backfill-entities` — backfill entity extraction
- `POST /api/admin/backfill-velocity` — backfill velocity scores

## ⏰ Cron Jobs (20 routes)

| Route | Purpose |
|-------|---------|
| `cron/fetch-feeds` | Hourly RSS aggregation (~89 sources), ocean-relevance gate (blocking) |
| `cron/harvest-scraped-sources` | Every 6h — scrape IMO, ISA, FAO, IUCN, CBD, UN BBNJ via Jina |
| `cron/scrape-governance-calendar` | Weekly Mon 3am — 10 gov body pages, Claude extraction |
| `cron/scrape-isa` | ISA contractor/decision scraper |
| `cron/scrape-psma` | PSMA treaty data scraper |
| `cron/generate-brief` | Daily brief generation |
| `cron/send-brief` | Email brief dispatch |
| `cron/summarise-pending` | Batch summarize queued stories |
| `cron/score-significance` | Score story significance |
| `cron/generate-embeddings` | Story embedding generation |
| `cron/embed-documents` | Document chunk embedding |
| `cron/generate-connections` | Cross-story connection discovery |
| `cron/velocity-scores` | Topic velocity computation |
| `cron/source-health` | Monitor RSS/scrape source health |
| `cron/monitor-sources` | Source availability checks |
| `cron/blue-finance-agent` | Blue finance data agent |
| `cron/governance-agent` | Governance calendar agent |
| `cron/project-populate` | Auto-populate projects with stories |
| `cron/threshold-alerts` | Alert threshold monitoring |
| `cron/conversion-triggers` | Conversion event tracking |

## 📦 app/lib/ Modules

| Module | Purpose |
|--------|---------|
| `auth.ts` | `getEmailFromSession()` helper, JWT extraction |
| `subscription.ts` | Subscription status checks, paywall logic |
| `ocean-relevance-gate.ts` | Claude-based gate — filter non-ocean stories (blocking) |
| `sources.ts` | RSS source list definitions |
| `jina.ts` | Jina article fetch wrapper |
| `embeddings.ts` | Vector embedding generation |
| `search.ts` | Semantic + full-text search |
| `velocity.ts` | Topic velocity scoring |
| `confidence.ts` | Confidence score utilities |
| `html.ts` | HTML parsing/cleaning utilities |
| `events.ts` | Event tracking utilities |
| `brief-reply.ts` | Brief reply/feedback handling |
| `user-preferences.ts` | User preference helpers |
| `query-expansion.ts` | AI query expansion |
| `tracker-metadata.ts` | Tracker config/metadata |
| `onboarding/starter-sets.ts` | Topic starter set definitions |
| `types/dashboard.ts` | Dashboard TypeScript types |

## 📦 lib/ (root) Modules

| Module | Purpose |
|--------|---------|
| `entities.ts` | Entity CRUD operations |
| `entity-matching.ts` | Entity matching algorithms (substring + embedding RPCs) |
| `lp-briefing-pdf.ts` | PDF generation (PDFKit) |
| `emails/onboarding-day3.ts` | Day-3 onboarding email template |

## 🧩 Components

| Component | Purpose |
|-----------|---------|
| `Header.tsx` | Global nav header |
| `Paywall.tsx` | Hard paywall overlay |
| `TrialBanner.tsx` | Trial countdown banner |
| `ConversionModal.tsx` | Upgrade conversion modal |
| `StoryCard.tsx` | Feed story card |
| `FeaturedCard.tsx` | Featured story card |
| `FeedSidebar.tsx` | Topic filter sidebar |
| `TopicsSelector.tsx` | Topic selection UI |
| `VelocityScore.tsx` | Velocity indicator |
| `Sparkline.tsx` | Mini chart |
| `AlertToggle.tsx` | Alert preference toggle |
| `LinkedInDraftPanel.tsx` | LinkedIn draft panel |
| `TrackerHero.tsx` | Tracker hero section |
| `TrackerHistory.tsx` | Tracker historical chart |
| `TrackerMethodology.tsx` | Methodology explainer |
| `HeroSignal.tsx` | Hero signal widget |
| `HeroSignalBandCrossing.tsx` | Band crossing signal |
| `HeroSignalGovernance.tsx` | Governance signal |
| `HeroSignalVelocity.tsx` | Velocity signal |
| `TickerStrip.tsx` | News ticker strip |
| `OvernightReveal.tsx` | Overnight briefing reveal |
| `SegmentSwitcher.tsx` | Segment toggle |
| `WelcomeState.tsx` | Empty state for new users |
| `DesktopOnly.tsx` | Mobile guard wrapper |
| `EarlyAccessModal.tsx` | Early access gate |
| `workspace/IntelligenceThread.tsx` | Workspace thread UI |
| `ui/TidelineLogo.tsx` | Logo component |

## 🔧 Configuration

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js config |
| `tsconfig.json` | TypeScript strict mode, `@/*` path alias |
| `vercel.json` | Cron schedules, deployment config |
| `.env.local` | Secrets (gitignored) |

## 🗄️ Database (Supabase — 3 schemas)

### Key Tables — public schema
- `users` — subscription status, topics (jsonb), timezone, stripe IDs, trial dates
- `stories` — title, link, source_name, topic, description, summaries, is_pro, alert_type, quarantine
- `scraped_sources` — non-RSS scrape output with content_hash dedup
- `treaty_ratifications` — longitudinal change log for BBNJ ratifications
- `governance_events` — intergovernmental meeting data (10 bodies)
- `expected_decisions` — per-event decision tracker
- `governance_bodies` — 10 body configs with scrape URLs
- `calendar_subscriptions` — personal iCal subscriptions
- `subscriptions` — Stripe subscription mirror
- `trial_signups` — pre-auth signups
- `magic_links` — email magic link tokens
- `embeddings` — story/document vector embeddings
- `entities` — named entities extracted from stories
- `threads` — intelligence threads
- `projects` — workspace projects
- `project_entries` — stories/notes in projects
- `documents` — community library documents
- `document_chunks` — chunked document text for RAG
- `tracker_events` — tracker data points log
- `source_health` — RSS/scrape source health status
- `cron_log` — cron job run history
- `lp_portfolios` — LP briefing portfolio configs
- `waitlist` — pre-launch waitlist
- `survey_responses` — user survey data

### Schemas
- `public` — app data
- `auth` — Supabase Auth
- `next_auth` — NextAuth session management

## 🔗 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` | Next.js 16, App Router |
| `react` | React 19 |
| `@supabase/supabase-js` | Database client |
| `@anthropic-ai/sdk` | Claude API (summarization, gates, extraction) |
| `@ai-sdk/anthropic` | Vercel AI SDK adapter |
| `@mastra/core` + `@mastra/rag` | RAG pipeline |
| `@stripe/stripe-js` + `@stripe/react-stripe-js` | Payments |
| `next-auth` | Authentication (Google + magic link) |
| `@auth/supabase-adapter` | NextAuth ↔ Supabase bridge |
| `resend` | Transactional email |
| `pdfkit` | LP briefing PDF generation |
| `@tiptap/*` | Rich text editor (workspace) |
| `recharts` | Charts (trackers) |
| `d3` | Advanced charts (choropleth) |
| `ical-generator` | iCal feed generation |

## 🎨 Design System

- **All styling**: Inline styles (`style={{...}}`), never Tailwind in JSX
- **Responsive**: CSS `@media` in `<style>` tags
- **Colors**: Navy `#0a1628`, Blue `#1d6fa4`, Teal (primary action), CTA bg `#112236`
- **Fonts**: DM Sans (body), Georgia (serif headlines), IBM Plex Mono (status)
- **Workspace standard**: White bg, 48px left padding, grid-gap borders (1px #E8EAED), teal selected state (3px top + #E6F4F1 bg)
- **Source badges**: gov=blue, reg=red, ngo=green, res=purple, media=yellow, esg=teal

## 🔐 Auth Flow

1. Google OAuth or email magic link → NextAuth
2. First login → `public.users` row created with trial defaults
3. Topics empty → redirect to `/onboarding`
4. Middleware protects `/platform/*` via JWT cookie check
5. `getEmailFromSession()` in `app/lib/auth.ts` — shared helper for API routes

## 📝 Quick Reference

- **Ocean gate**: `app/lib/ocean-relevance-gate.ts` — **blocking** filter in `fetch-feeds` cron (stories fail = dropped)
- **Entity RPCs**: `match_entity_embeddings` + `entity_substring_match` (migrations 20260421)
- **Paywall logic**: `components/Paywall.tsx` + `app/lib/subscription.ts`
- **Story feed**: `app/api/stories/route.ts`
- **Email**: Resend API via `RESEND_API_KEY`
- **Claude model**: `claude-haiku-4-5` for bulk cron (gate, scrapers, summaries, brief); Sonnet for interactive API routes
- **Jina**: article scraping via `JINA_API_KEY`
- **Trial period**: 14 days everywhere
