# Project Index: Tideline

Generated: 2026-04-18

## Project Overview

Professional ocean intelligence SaaS — curates and summarizes ocean news, research, regulatory developments, and treaty monitoring for policy, NGO, and industry professionals.

**Stack**: Next.js 16.1.7 · React 19 · TypeScript · Tailwind CSS v4 · Supabase · Stripe · Claude API · Vercel

## Project Structure

```
tideline-next/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Marketing homepage
│   ├── lib/                          # Shared utilities (16 modules)
│   ├── api/                          # ~50 API routes (see below)
│   ├── platform/(shell)/             # Authenticated app (shell layout)
│   │   ├── feed/                     # Main news feed
│   │   ├── story/[id]/              # Story detail
│   │   ├── tracker/                  # 11 policy trackers
│   │   ├── workspace/               # User workspace
│   │   ├── projects/                # Project management
│   │   ├── research/                # Research tools
│   │   ├── library/                 # Document library
│   │   ├── lp-briefing/             # LP briefing generator
│   │   ├── threads/                 # Intelligence threads
│   │   ├── calendar/                # Governance calendar
│   │   ├── directory/               # Entity directory
│   │   ├── conflicts/               # Conflict tracker
│   │   ├── settings/topics/         # Topic preferences
│   │   └── admin/library/           # Admin doc uploads
│   ├── sign-in/ login/ onboarding/  # Auth pages
│   ├── start/ subscribe/ pricing/   # Signup + payment
│   ├── survey/ demo/ upgrade/       # Misc pages
│   ├── admin/brief/                 # Admin brief editor
│   ├── workspace/ reports/          # Legacy routes
│   └── tracker/                     # Public tracker (pre-auth)
├── components/                       # 29 shared components
├── scripts/                          # 17 CLI scripts (scrapers, backfills, seeds)
├── middleware.ts                     # Auth gate for /platform/* & /tracker/*
├── vercel.json                       # Cron schedules + function config
└── CLAUDE.md                         # Full architecture docs
```

## Core Library Modules (`app/lib/`)

| Module | Purpose |
|--------|---------|
| `auth.ts` | NextAuth config, `getEmailFromSession` helper |
| `subscription.ts` | Subscription status checks |
| `search.ts` | RAG semantic search |
| `embeddings.ts` | Vector embedding generation |
| `query-expansion.ts` | Multi-strategy query expansion for RAG |
| `velocity.ts` | Topic velocity scoring |
| `divergence.ts` | Source divergence detection |
| `confidence.ts` | Confidence scoring |
| `tracker-metadata.ts` | Tracker definitions/config |
| `sources.ts` | RSS source registry (~89 feeds) |
| `jina.ts` | Jina scraping client |
| `html.ts` | HTML utilities |
| `events.ts` | Event helpers |
| `brief-reply.ts` | Brief reply formatting |
| `user-preferences.ts` | User preference helpers |
| `types/dashboard.ts` | Dashboard type definitions |

## API Routes Summary

### Cron Jobs (20 scheduled tasks)

| Cron | Schedule | Purpose |
|------|----------|---------|
| `fetch-feeds` | Every 2h | RSS aggregation (~89 sources) |
| `summarise-pending` | Every 2h +15m | AI summarization queue |
| `project-populate` | Every 2h +30m | Auto-populate projects |
| `harvest-scraped-sources` | Daily 6:30am | Scrape non-RSS sources (IMO, ISA, etc.) |
| `generate-embeddings` | Daily 1am | Vector embeddings for stories |
| `embed-documents` | Daily 3am | Document embedding (50/day, 1024MB) |
| `score-significance` | Daily 3:30am | Story significance scoring |
| `generate-brief` | Daily 5:45am | Generate daily brief |
| `send-brief` | Daily 6:15am | Email daily brief |
| `velocity-scores` | Every 4 days | Topic velocity calculation |
| `generate-connections` | Daily 7am | Entity connection mapping |
| `threshold-alerts` | Daily 8am | Alert threshold checks |
| `conversion-triggers` | Daily 9am | Trial conversion nudges |
| `monitor-sources` | Weekly Mon 7am | Source health monitoring |
| `governance-agent` | Weekly Mon 4am | Governance event agent |
| `blue-finance-agent` | Weekly Mon 4:30am | Blue finance tracking |
| `scrape-isa` | Weekly Tue 5am | ISA scraper |
| `scrape-psma` | Weekly Wed 8am | PSMA scraper |
| `scrape-governance-calendar` | Every 10 days | Governance calendar scrape |
| `divergence-detection` | (not in vercel.json) | Source divergence analysis |

### Data APIs

| Route | Purpose |
|-------|---------|
| `stories` | Story CRUD with topic/pagination |
| `stories/save` | Save/bookmark stories |
| `stories/comments` | Story comments |
| `summarise` | On-demand AI summarization |
| `search` | RAG semantic search |
| `ask` | AI Q&A over corpus |
| `documents/[id]` | Document CRUD |
| `documents/[id]/export` | Document export |
| `documents/submit` | Community doc submission |
| `documents/generate-brief` | AI brief generation |
| `entities/search` | Entity search |
| `connections` | Entity connections |
| `threads` | Intelligence threads |
| `threads/me` | User's threads |
| `threads/match` | Thread matching |
| `projects` | Project CRUD |
| `projects/new-stories` | New stories for projects |
| `project-entries/[id]` | Project entry management |
| `governance-events` | Governance calendar events |
| `tracker-events` | Tracker event data |
| `consultations` | Open consultations |
| `conflicts` | Conflict data |

### Tracker APIs

| Route | Purpose |
|-------|---------|
| `treaty-status` | BBNJ treaty ratification data |
| `iuu-status` | IUU fishing status |
| `iuu/carding` | IUU carding data |
| `30x30-status` | 30x30 MPA tracker |
| `blue-finance-status` | Blue finance tracker |
| `isa-status` | ISA deep-sea mining tracker |
| `isa-contractors` | ISA contractor data |
| `psma` | PSMA port state measures |
| `velocity/[slug]` | Topic velocity scores |

### Auth & User

| Route | Purpose |
|-------|---------|
| `auth/[...nextauth]` | NextAuth (Google + Email) |
| `auth/verify` | Magic link verification |
| `subscribe` | Stripe checkout |
| `stripe-webhook` | Stripe event handler |
| `subscription-status` | User sub status |
| `subscription-access` | Access control |
| `onboarding` | Topic + timezone save |
| `user/complete-onboarding` | Onboarding completion |
| `user/onboarding-status` | Onboarding check |
| `user/dismiss-modal` | Modal dismissal |
| `user/modal-status` | Modal state |
| `user/sector` | User sector pref |
| `user/update-last-seen` | Activity tracking |
| `portal` | Stripe customer portal |
| `trial-signup` | Trial registration |
| `waitlist` | Waitlist signup |
| `survey` | User survey |
| `alerts/subscribe` | Alert preferences |

### Workspace & Research

| Route | Purpose |
|-------|---------|
| `workspace/quick-note` | Quick note creation |
| `workspace/narrative` | AI narrative generation |
| `research/inline` | Inline research assistant |
| `lp-briefing` | LP briefing generation |
| `lp-briefing/pdf` | LP briefing PDF export |
| `lp-briefing/stats` | LP briefing statistics |
| `lp-portfolios` | LP portfolio management |
| `story/linkedin-draft` | LinkedIn post drafting |
| `calendar/[token]` | Personal iCal feed |
| `calendar/subscribe` | Calendar subscription |

## Platform Pages (11 Trackers)

| Tracker | Topic |
|---------|-------|
| `bbnj` | BBNJ Treaty ratification |
| `governance` | Ocean governance calendar |
| `iuu` | IUU fishing enforcement |
| `30x30` | Marine protected areas |
| `blue-finance` | Blue finance/bonds |
| `isa` | Deep-sea mining (ISA) |
| `plastics` | Plastics treaty |
| `imo-shipping` | IMO shipping regulations |
| `wto-fisheries` | WTO fisheries subsidies |
| `cites-marine` | CITES marine species |
| `offshore-wind` | Offshore wind energy |

## Components (29)

**Feed**: StoryCard, FeaturedCard, FeedSidebar, SegmentSwitcher, TopicsSelector
**Paywall/Conversion**: Paywall, TrialBanner, ConversionModal, EarlyAccessModal
**Workspace**: IntelligenceThread, LinkedInDraftPanel
**Trackers**: TrackerHero, TrackerHistory, TrackerMethodology, VelocityScore, Sparkline, AlertToggle
**Hero Signals**: HeroSignal, HeroSignalBandCrossing, HeroSignalGovernance, HeroSignalVelocity, HeroSignalScanning, HeroSignalDivergence
**Layout**: Header, DesktopOnly, OvernightReveal, TickerStrip, WelcomeState
**UI**: TidelineLogo

## Scripts (17)

| Script | Purpose |
|--------|---------|
| `embed-documents.ts` | Bulk document embedding |
| `backfill-controversy.ts` | Controversy score backfill |
| `backfill-multipliers.ts` | Multiplier backfill |
| `seed-tracker-events.ts` | Seed tracker event data |
| `seed-alert-preferences.ts` | Seed alert prefs |
| `import-faolex.ts` | Import FAOLEX fisheries data |
| `scraper-agent.ts` | General scraper agent |
| `scraper-playwright.ts` | Playwright-based scraper |
| `scraper-informea.ts` | InforMEA treaty scraper |
| `scraper-openalex.ts` | OpenAlex research scraper |
| `scraper-ngo-reports.ts` | NGO report scraper |
| `scraper-un-library.ts` | UN digital library scraper |
| `processor-agent.ts` | Document processing agent |

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.7 | Framework |
| `react` | 19.2.3 | UI library |
| `next-auth` | 4.x | Authentication |
| `@supabase/supabase-js` | 2.x | Database client |
| `stripe` | 20.x | Payments |
| `@anthropic-ai/sdk` | 0.82 | Claude AI |
| `ai` + `@ai-sdk/anthropic` | 6.x | AI SDK streaming |
| `@mastra/rag` | 2.x | RAG pipeline |
| `pdfkit` | 0.18 | PDF generation |
| `d3` | 7.x | Data visualization |
| `chart.js` | 4.x | Charts |
| `@tiptap/*` | 3.x | Rich text editor |
| `ical-generator` | 10.x | iCal feed generation |
| `playwright` | 1.x | Browser scraping |
| `docx` | 9.x | Word document export |

## Quick Start

```bash
npm install
cp .env.example .env.local  # Fill in all env vars
npm run dev                  # http://localhost:3000
npm run build                # Production build
npm run lint                 # ESLint check
```

## Design System

- **Inline styles only** (no Tailwind classes in JSX)
- Colors: Navy `#0a1628`, Blue `#1d6fa4`, off-white backgrounds
- Fonts: DM Sans (body), Georgia (serif headlines), IBM Plex Mono
- Source badges: gov (blue), reg (red), ngo (green), res (purple), media (yellow), esg (teal)
- Workspace: white bg, left-aligned, 48px padding, teal accents, DM Sans only
