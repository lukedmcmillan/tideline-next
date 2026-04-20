# Project Index: Tideline

Generated: 2026-04-20

## Project Summary

Ocean intelligence SaaS platform curating news, research, and regulatory developments. Next.js 16 + React 19 + Supabase + Stripe.

## Project Structure

```
app/
  api/
    auth/           # NextAuth [...nextauth], verify
    cron/            # 20 scheduled jobs (feeds, scrapers, briefs, agents)
    admin/           # backfill-entities, backfill-velocity, documents, story-override
    calendar/        # [token] iCal feed, subscribe
    documents/       # [id] CRUD, export, generate-brief, submit
    lp-briefing/     # LP briefing + PDF + stats
    projects/        # CRUD, new-stories
    stories/         # list, save, comments
    stripe-webhook/  # 5 Stripe events
    threads/         # list, me, match
    user/            # dismiss-modal, modal-status, complete-onboarding, onboarding-status, sector, update-last-seen
    webhooks/        # treaty-change
    # Single-file routes: ask, consultations, dashboard, entities/search, governance-events,
    #   iuu-status, isa-status, 30x30-status, blue-finance-status, iuu/carding, psma,
    #   landing-data, portal, research/inline, search, sidebar-data, stories, subscribe,
    #   subscription-access, summarise, survey, tracker-events, tracker-status/[slug],
    #   tracker/view, treaty-status, trial-signup, velocity/[slug], waitlist,
    #   workspace/quick-note, workspace/narrative, story/linkedin-draft
  lib/               # Shared modules (16 files)
    auth.ts           # getEmailFromSession, NextAuth helpers
    sources.ts        # ~89 RSS feed definitions
    embeddings.ts     # Vector embedding generation
    search.ts         # Semantic search
    subscription.ts   # Subscription status checks
    tracker-metadata.ts # Tracker config per slug
    velocity.ts       # Story velocity scoring
    jina.ts           # Jina article scraping
    confidence.ts     # Confidence scoring
    events.ts         # Event helpers
    brief-reply.ts    # Brief reply formatting
    user-preferences.ts # User pref helpers
    query-expansion.ts  # Search query expansion
    html.ts           # HTML utilities
  platform/(shell)/  # Authenticated app (behind auth middleware)
    feed/            # Main news feed
    story/[id]/      # Story detail + AI summary
    tracker/         # 10 tracker pages (governance, iuu, 30x30, plastics, imo-shipping, wto-fisheries, offshore-wind, cites-marine, isa, bbnj, blue-finance)
    trackers/        # Tracker index
    threads/         # Thread view
    directory/       # Entity directory
    research/        # Research assistant
    calendar/        # Governance calendar
    workspace/       # Workspace
    projects/        # Projects + [id] + [id]/draft
    lp-briefing/     # LP briefing view
    library/         # Document library + submit
    settings/topics/ # Topic preferences
    admin/library/   # Admin document management
    layout.tsx       # Shell layout (sidebar nav)
  # Public pages: layout.tsx, page.tsx (homepage), start/, sign-in/, subscribe/,
  #   pricing/, upgrade/, demo/, survey/, reports/, workspace/, admin/brief/
components/          # 27 shared components
  Header, StoryCard, FeaturedCard, FeedSidebar, Paywall, TrialBanner,
  ConversionModal, EarlyAccessModal, WelcomeState, SegmentSwitcher,
  LinkedInDraftPanel, DesktopOnly, TopicsSelector, AlertToggle,
  VelocityScore, Sparkline, TickerStrip, OvernightReveal,
  TrackerHero, TrackerHistory, TrackerMethodology,
  HeroSignal, HeroSignalBandCrossing, HeroSignalGovernance, HeroSignalVelocity
scripts/             # CLI scripts + data files
  seed-entities.csv   # ~500 entity definitions (active work)
  seed-tracker-events.ts, seed-alert-preferences.ts
  backfill-multipliers.ts, backfill-controversy.ts
  embed-documents.ts, import-faolex.ts, processor-agent.ts
  scraper-*.ts        # 5 scrapers (playwright, informea, openalex, ngo-reports, un-library, agent)
  *.sql               # Table creation scripts
supabase/
  migrations/         # 34 migrations (20260330 - 20260420)
  seeds/threads.sql
data/audits/          # Feed audit reports + gap analysis
```

## Entry Points

- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Seed scripts**: `npm run seed:events`, `npm run seed:alerts`
- **Backfills**: `npm run backfill:multipliers`, `npm run backfill:controversy`

## Cron Jobs (20 endpoints)

| Job | Schedule | Purpose |
|-----|----------|---------|
| fetch-feeds | Every 2h (even hours) | RSS aggregation (~89 sources) |
| summarise-pending | Every 2h +15m | AI summarization queue |
| project-populate | Every 2h +30m | Auto-populate project feeds |
| generate-embeddings | Daily 01:00 | Vector embeddings for stories |
| embed-documents | Daily 03:00 | Document chunk embeddings (1GB/5min) |
| scrape-governance-calendar | Every 10 days | Governance body meetings |
| score-significance | Daily 03:30 | Story significance scoring |
| governance-agent | Weekly Mon 04:00 | Governance intelligence |
| blue-finance-agent | Weekly Mon 04:30 | Blue finance intelligence |
| source-health | Weekly Mon 05:00 | Source health snapshots |
| scrape-isa | Weekly Tue 05:00 | ISA document scraper |
| generate-brief | Daily 05:45 | Daily brief generation |
| send-brief | Daily 06:15 | Email daily brief |
| harvest-scraped-sources | Daily 06:30 | Non-RSS scraping |
| velocity-scores | Every 4 days 06:00 | Topic velocity recalc |
| generate-connections | Daily 07:00 | Story connection graph |
| monitor-sources | Weekly Mon 07:00 | Source health monitoring |
| threshold-alerts | Daily 08:00 | Alert threshold checks |
| scrape-psma | Weekly Wed 08:00 | PSMA status scraper |
| conversion-triggers | Daily 09:00 | Trial conversion nudges |

## Database (Supabase)

**Schemas**: public, auth, next_auth

**Core tables**: users, stories, subscriptions, trial_signups, magic_links, scraped_sources, scrape_runs, treaty_ratifications, governance_bodies, governance_events, expected_decisions, calendar_subscriptions, threads, tracker_events, entities, embeddings, document_chunks, consultations, story_comments, workspace tables, survey_responses, waitlist, lp_portfolios, community_documents, source_health_snapshots

**Latest migration**: 20260420_entity_type_taxonomy.sql

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.7 | Framework |
| react | 19.2.3 | UI |
| @supabase/supabase-js | ^2.99.2 | Database |
| stripe | ^20.4.1 | Payments |
| next-auth | ^4.24.13 | Auth (Google OAuth + magic link) |
| @anthropic-ai/sdk | ^0.82.0 | AI summarization |
| ai + @ai-sdk/anthropic | ^6.0 | AI SDK |
| pdfkit | ^0.18.0 | PDF generation |
| d3 + topojson-client | ^7.9 | Maps/charts |
| chart.js + react-chartjs-2 | ^4.5 | Charts |
| @tiptap/* | ^3.21 | Rich text editor |
| ical-generator | ^10.1 | Calendar feeds |
| csv-parse | ^6.2 | CSV parsing |
| playwright | ^1.59 | Web scraping |
| @mastra/core + @mastra/rag | ^1.24 | Agent/RAG framework |

## 10 Tracker Tags

`bbnj` `isa` `30x30` `iuu` `imo-shipping` `wto-fisheries` `cites-marine` `plastics` `offshore-wind` `blue-finance`

## Design System

- **Styling**: Inline styles (`style={{...}}`), not Tailwind classes in JSX
- **Colors**: Navy #0a1628, Blue #1d6fa4, off-white backgrounds, CTA #112236
- **Fonts**: DM Sans (body), Georgia (serif headlines), IBM Plex Mono
- **Source badges**: gov (blue), reg (red), ngo (green), res (purple), media (yellow), esg (teal)
- **Workspace standard**: White bg, left-aligned, 48px left pad, DM Sans only, teal primary, 4px radius buttons

## Auth

NextAuth v4: Google OAuth (primary) + Email magic link via Resend. JWT session strategy. Middleware protects `/platform/*` and `/tracker/*`. First login creates `public.users` row, redirects to `/onboarding`.

## Current Work (2026-04-20)

- Related Stories feature removed (unreliable matching eroded trust) — revisit with RAG embeddings
- Hero Signal v3 plan produced: 4-type compact rotation (governance, band crossing, top story, top velocity)
- Entity taxonomy: ~500 entities in `scripts/seed-entities.csv`, 9 types pending final reclassification
- Entity type taxonomy migration: `20260420_entity_type_taxonomy.sql`
- LP briefing PDF layer: next priority after entity work
