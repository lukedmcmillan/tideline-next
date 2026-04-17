# Project Index: Tideline

Generated: 2026-04-17

## Stack

Next.js 16.1 · React 19 · TypeScript 5 · Tailwind CSS 4 · Supabase · Stripe · Claude API · Jina AI · Resend · Vercel

## Project Structure

```
app/
├── layout.tsx                    # Root layout (DM Sans, Georgia, IBM Plex Mono)
├── page.tsx                      # Marketing homepage
├── api/                          # ~95 API routes
│   ├── auth/                     # NextAuth [...nextauth], verify
│   ├── cron/                     # 18 scheduled jobs (see Cron Jobs)
│   ├── workspace/                # ask (RAG), narrative, quick-note
│   ├── admin/                    # backfill-entities, backfill-velocity, documents/, story-override
│   ├── library/                  # extract-metadata, signed-url, search, view, activity
│   ├── user/                     # sector, dismiss-modal, modal-status, onboarding-status, update-last-seen
│   ├── stories/                  # CRUD, save, comments
│   ├── projects/                 # CRUD, [id]/draft, [id]/draft/compile, new-stories
│   ├── lp-briefing/              # briefing, pdf, stats
│   ├── documents/                # CRUD, [id]/export, submit, generate-brief
│   ├── threads/                  # CRUD, me, match
│   ├── alerts/                   # subscribe, preferences
│   ├── conflicts/                # list, [id]/dismiss
│   ├── tracker/                  # view
│   ├── calendar/                 # [token] iCal, subscribe
│   ├── webhooks/                 # treaty-change
│   └── (standalone)              # summarise, ask, search, subscribe, stripe-webhook, portal, etc.
├── lib/                          # 12 shared modules
│   ├── auth.ts                   # getEmailFromSession (NextAuth JWT extraction)
│   ├── embeddings.ts             # Jina embedding helpers
│   ├── search.ts                 # Vector search utilities
│   ├── subscription.ts           # Subscription status checks
│   ├── tracker-metadata.ts       # Tracker slug → config mapping
│   ├── velocity.ts               # Velocity score calculations
│   ├── sources.ts                # Source type definitions
│   ├── html.ts                   # HTML decode/sanitise helpers
│   ├── jina.ts                   # Jina API client
│   ├── confidence.ts             # Confidence scoring
│   ├── events.ts                 # Event utilities
│   └── types/dashboard.ts        # Dashboard type definitions
├── platform/(shell)/             # Authenticated app (sidebar layout)
│   ├── layout.tsx                # Shell layout with sidebar nav
│   ├── page.tsx                  # Dashboard (2×3 card grid)
│   ├── feed/                     # News feed with topic filter + paywall
│   ├── story/[id]/               # Story detail with AI summaries
│   ├── workspace/                # RAG workspace (ask questions to document library)
│   ├── library/                  # Document library browser
│   ├── projects/                 # Project boards + [id] detail + [id]/draft editor
│   ├── threads/                  # Intelligence threads
│   ├── research/                 # Research tools
│   ├── conflicts/                # Conflict detection + Pulse Score
│   ├── trackers/                 # Tracker index page
│   ├── tracker/                  # 11 tracker pages (see Trackers)
│   ├── calendar/                 # Governance calendar with iCal sync
│   ├── directory/                # Entity directory
│   ├── lp-briefing/              # LP briefing builder
│   └── admin/library/            # Admin: document management
├── (public pages)
│   ├── start/                    # Trial signup flow
│   ├── login/                    # Magic link sign-in
│   ├── sign-in/                  # Google OAuth sign-in
│   ├── onboarding/               # Topic selection + timezone
│   ├── subscribe/                # Stripe checkout
│   ├── pricing/                  # Pricing page
│   ├── upgrade/                  # Upgrade CTA
│   ├── demo/                     # Demo page
│   ├── survey/                   # User survey
│   └── reports/                  # Public reports
components/                       # 28 shared components
│   ├── Header.tsx                # Global header
│   ├── StoryCard.tsx, FeaturedCard.tsx  # Feed cards
│   ├── FeedSidebar.tsx           # Topic filter sidebar
│   ├── Paywall.tsx, TrialBanner.tsx    # Subscription gates
│   ├── ConversionModal.tsx, EarlyAccessModal.tsx
│   ├── HeroSignal*.tsx (6)       # Dashboard signal components
│   ├── Tracker*.tsx (3)          # Tracker shared components
│   ├── VelocityScore.tsx, Sparkline.tsx, TickerStrip.tsx
│   ├── workspace/IntelligenceThread.tsx
│   └── ui/TidelineLogo.tsx
scripts/                          # 14 CLI scripts
│   ├── embed-documents.ts        # Batch document embedding
│   ├── processor-agent.ts        # Document processor agent
│   ├── scraper-*.ts (6)          # Scrapers: playwright, informea, openalex, ngo-reports, un-library, agent
│   ├── import-faolex.ts          # FAOLEX fisheries data import
│   ├── seed-*.ts (2)             # Seeders: tracker-events, alert-preferences
│   └── backfill-multipliers.ts   # Velocity multiplier backfill
```

## Trackers (11)

| Slug | Topic |
|------|-------|
| bbnj | BBNJ Treaty ratification (choropleth map) |
| governance | Ocean governance calendar (3 views) |
| iuu | IUU fishing status |
| 30x30 | 30×30 MPA targets |
| plastics | Plastics treaty |
| imo-shipping | IMO shipping regulations |
| wto-fisheries | WTO fisheries subsidies |
| offshore-wind | Offshore wind energy |
| cites-marine | CITES marine species |
| isa | ISA deep-sea mining |
| blue-finance | Blue finance instruments |

## Cron Jobs (18)

| Route | Schedule | Purpose |
|-------|----------|---------|
| fetch-feeds | Hourly | RSS aggregation (~89 sources) |
| harvest-scraped-sources | Every 6h | Non-RSS scraping (IMO, ISA, FAO, etc.) |
| scrape-governance-calendar | Weekly Mon 3am | Governance body meeting scraper |
| generate-brief | Daily | AI brief generation (2-sentence summaries) |
| send-brief | Daily | Email brief dispatch via Resend |
| summarise-pending | Periodic | Backfill missing AI summaries |
| generate-connections | Periodic | Cross-story connection detection |
| generate-embeddings | Periodic | Document chunk embedding |
| score-significance | Periodic | Story significance scoring |
| velocity-scores | Periodic | Topic velocity calculation |
| project-populate | Periodic | Auto-populate project feeds |
| threshold-alerts | Periodic | Threshold-based alert dispatch |
| conversion-triggers | Periodic | Trial conversion nudges |
| monitor-sources | Periodic | Source health monitoring |
| blue-finance-agent | Periodic | Blue finance data agent |
| governance-agent | Periodic | Governance intelligence agent |
| scrape-isa | Periodic | ISA-specific scraper |
| scrape-psma | Periodic | PSMA compliance scraper |

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.7 | Framework |
| react | 19.2.3 | UI |
| @supabase/supabase-js | ^2.99 | Database |
| @anthropic-ai/sdk | ^0.82 | Claude API |
| ai + @ai-sdk/anthropic | ^6.0 | Vercel AI SDK |
| next-auth | ^4.24 | Authentication |
| stripe | ^20.4 | Payments |
| pdfkit | ^0.18 | PDF generation |
| @tiptap/* | ^3.21 | Rich text editor |
| d3 + topojson-client | ^7.9 | Data visualisation |
| chart.js | ^4.5 | Charts |
| playwright | ^1.59 | Scraping |
| mammoth + unpdf | — | Document parsing (DOCX, PDF) |
| ical-generator | ^10.1 | Calendar feeds |
| @mastra/core + @mastra/rag | — | RAG pipeline |

## Auth Flow

NextAuth v4 → Google OAuth (primary) + Email magic link (Resend). JWT session strategy. Middleware protects `/platform/*`. `getEmailFromSession()` in `app/lib/auth.ts` for API routes.

## RAG Architecture

Dual-corpus vector search via Supabase pgvector:
1. `match_document_chunks` — uploaded library documents (threshold 0.65, top 15)
2. `match_primary_chunks` — primary source documents (threshold 0.62, top 10)

Embeddings: Jina `jina-embeddings-v2-base-en`. Generation: Claude Sonnet. 35,909 chunks indexed.

## Design System

Inline styles only (no Tailwind in JSX). Navy `#0a1628`, blue `#1d6fa4`, off-white backgrounds. DM Sans (body), Georgia (headlines), IBM Plex Mono. Source badges: gov (blue), reg (red), ngo (green), res (purple), media (yellow), esg (teal). Workspace: white background, Material Design underline inputs, 4px radius buttons, teal primary.

## Quick Start

```bash
npm run dev        # Dev server
npm run build      # Production build
npm run lint       # ESLint
```
