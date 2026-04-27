# Project Index: Tideline

Generated: 2026-04-24

## Project Structure

tideline-next/
  app/
    api/                  100+ API route handlers
      auth/               NextAuth + magic link verify
      cron/               22 scheduled jobs
      webhooks/           treaty-change, brief-reply
      admin/              story-override, documents, backfill
      workspace/          quick-note, narrative, ask
      projects/           CRUD + draft compile + new-stories
      dashboard/          Dashboard route + new-stories feed
      documents/          upload, export, generate-brief
      library/            signed-url, search, activity
    lib/                  Shared utilities (18 modules)
    platform/(shell)/     All authenticated pages
  components/             Shared UI components (28 files)
  scripts/                One-off admin/backfill scripts (26 files)
  vercel.json             Cron schedule config

## Entry Points

- Dev: npm run dev
- Build: npm run build
- Root layout: app/layout.tsx
- Platform shell: app/platform/(shell)/layout.tsx
- Auth: app/api/auth/[...nextauth]/route.ts

## Core Lib Modules (app/lib/)

auth.ts              getEmailFromSession helper, shared auth utils
subscription.ts      Subscription status checks
embeddings.ts        Vector embedding generation
search.ts            Semantic search logic
jina.ts              Jina article scraper wrapper
signal-generation.ts Feed signal scoring
entity-brief.ts      Entity brief pipeline (Material >=25, Watch 10-24)
velocity.ts          Story velocity/momentum scoring
confidence.ts        Tracker confidence scoring
ocean-relevance-gate.ts Story relevance filter
sources.ts           Source definitions (~89 RSS + scraped)
tracker-metadata.ts  Tracker config/metadata
events.ts            Governance event utilities
brief-reply.ts       Email reply parsing for briefs
user-preferences.ts  User pref helpers
query-expansion.ts   Search query expansion
html.ts              HTML parsing/sanitization
tracker-descriptions.ts Tracker page description copy
constants.ts         Shared constants (topics, slugs, etc.)

## Pages

Public:
  /              Marketing homepage (hero, trackers, pricing, FAQ)
  /start         Trial signup (topic selection -> email)
  /sign-in       Email magic link sign-in
  /subscribe     Stripe Elements checkout
  /pricing       Pricing page
  /demo          Demo page

Platform (auth-protected /platform/*):
  feed                   Main story feed with sidebar + paywall
  story/[id]             Story detail with AI summaries
  trackers               Tracker directory
  tracker/bbnj           BBNJ ratification map
  tracker/governance     Governance calendar (Timeline / By Body / By Topic)
  tracker/isa            ISA tracker
  tracker/imo-shipping   IMO shipping tracker
  tracker/iuu            IUU fishing tracker
  tracker/30x30          30x30 tracker
  tracker/plastics       Plastics tracker
  tracker/offshore-wind  Offshore wind tracker
  tracker/cites-marine   CITES marine tracker
  tracker/wto-fisheries  WTO fisheries tracker
  tracker/blue-finance   Blue finance tracker
  workspace              AI workspace with projects
  projects + projects/[id] + projects/[id]/draft (Tiptap editor)
  library + library/submit
  research, threads, calendar, directory
  lp-briefing            LP briefing (fund managers)
  settings/topics, admin/library

## Cron Jobs (app/api/cron/)

fetch-feeds              Hourly RSS aggregation (~89 sources)
harvest-scraped-sources  Every 6h: IMO, ISA, FAO, IUCN, CBD, CITES, UN BBNJ
scrape-governance-calendar Weekly Mon 3am UTC: 10 governance body pages
generate-brief           Morning brief generation
send-brief               Send morning brief emails
generate-entity-briefs   Entity-level brief generation
send-entity-briefs       Send entity brief emails
velocity-scores          Compute story velocity/momentum
score-significance       Score story significance
generate-embeddings      Batch embed stories
embed-documents          Embed library documents
generate-connections     Cross-story connection graph
summarise-pending        Batch summarize stories
scrape-isa, scrape-psma  ISA + PSMA website scraping
blue-finance-agent       Blue finance signal agent
governance-agent         Governance calendar agent
project-populate         Auto-populate projects from feed
threshold-alerts         Velocity/signal threshold alerts
monitor-sources, source-health Source health monitoring
conversion-triggers      Trial conversion email triggers

## Webhooks

webhooks/treaty-change  pg_net trigger on treaty_ratifications INSERT -> Claude -> story alert
webhooks/brief-reply    Parses email replies to morning briefs

## Key Components (components/)

Feed:     StoryCard, FeaturedCard, FeedSidebar, Paywall, TrialBanner, ConversionModal, WelcomeState
Signals:  HeroSignal, HeroSignalBandCrossing, HeroSignalVelocity, HeroSignalGovernance, VelocityScore, Sparkline
Trackers: TrackerHero, TrackerMethodology, TrackerHistory
UI:       Header, TopicsSelector, AlertToggle, TickerStrip, SegmentSwitcher, DesktopOnly, TidelineLogo
Workspace: IntelligenceThread, LinkedInDraftPanel, OvernightReveal, DashboardReveal

## Database (Supabase - key tables)

public.users              subscription status, topics (jsonb), stripe_subscription_id
public.stories            title, link, source, topic, summaries, alert_type, is_pro
public.scraped_sources    non-RSS content with content_hash dedup
public.treaty_ratifications longitudinal BBNJ change log (pg_net trigger)
public.governance_events  IGO meeting/deadline records
public.expected_decisions per-event decision tracker
public.calendar_subscriptions personal iCal tokens + filters
public.subscriptions      Stripe subscription state
public.lp_portfolios      LP briefing fund portfolios
public.governance_bodies  10 IGO bodies scrape config

## Configuration

vercel.json     Cron schedule definitions
next.config.ts  Next.js config, path alias @/* -> root
tsconfig.json   TypeScript strict mode
.env.local      All secrets (never commit)

## Key Dependencies

next               16.1.7   App framework
react              19.2.3   UI
@anthropic-ai/sdk  ^0.82.0  Claude API
@ai-sdk/anthropic  ^3.0.69  AI SDK wrapper
@supabase/supabase-js ^2.99.2 Database
next-auth          ^4.24.13 Auth (Google OAuth + magic link)
stripe             ^20.4.1  Payments
pdfkit             ^0.18.0  PDF generation
@tiptap/*          ^3.x     Rich text editor
d3                 ^7.9.0   Data viz / choropleth maps
ical-generator     ^10.1.0  iCal feed generation
@mastra/core       ^1.24.1  RAG/AI agent framework

## Quick Start

1. Fill in .env.local (see CLAUDE.md for var names)
2. npm install
3. npm run dev

## Key Patterns

Styling:    Inline styles only - no Tailwind in JSX. Responsive via style tags with @media
Auth:       NextAuth JWT; getEmailFromSession() in app/lib/auth.ts used by all API routes
AI model:   claude-haiku-4-5 for all cron/bulk; Sonnet only for interactive features
Paywall:    Hard overlay for cancelled/none; soft banner for <=5 days trial remaining
Workspace:  White bg, teal accents, 48px left padding, underline-only inputs (April 2026 standard)
Path alias: @/* -> project root
