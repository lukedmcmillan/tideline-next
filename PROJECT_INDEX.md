# Project Index: Tideline

Generated: 2026-04-28 (updated session 2)

## Project Structure

tideline-next/
  app/
    api/                  100+ API route handlers
      auth/               NextAuth + magic link verify
      cron/               22 scheduled jobs
      webhooks/           treaty-change, brief-reply
      admin/              story-override, documents, backfill-velocity
      workspace/          quick-note, narrative
      projects/           CRUD + draft compile + new-stories
      documents/          upload, export, generate-brief, submit
      library/            signed-url, search, activity, view
      threads/            list, me, match
      tracker/            view, tracker-status/[slug]
      user/               modal-status, dismiss-modal, complete-onboarding, onboarding-status, sector, update-last-seen
    lib/                  Shared utilities (22 modules)
    platform/(shell)/     All authenticated pages (30 files)
    workspace/            Standalone workspace pages (root-level, separate from platform shell)
    reports/              Reports page (public or lightly gated)
  components/             Shared UI components (34 files)
  lib/                    Root-level lib: entities.ts, entity-matching.ts, lp-briefing-pdf.ts, emails/
  scripts/                One-off admin/backfill scripts (32 files)
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
search.ts            Semantic search + query expansion
jina.ts              Jina article scraper wrapper
signal-generation.ts Feed signal scoring (new)
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
onboarding/starter-sets.ts Onboarding starter topic sets

Root lib/ (lib/):
entities.ts          Entity definitions + helpers
entity-matching.ts   Entity matching pipeline
lp-briefing-pdf.ts   LP briefing PDF generation
emails/onboarding-day3.ts Day-3 onboarding email template

## Pages

Public:
  /              Marketing homepage v5 (hero, trackers, pricing, FAQ) - rebuilt Apr 2026
                 Client split: app/LandingClient.tsx (desktop), app/LandingClientMobile.tsx (mobile, new)
  /start         Trial signup (topic selection -> email)
  /sign-in       Email magic link sign-in
  /subscribe     Stripe Elements checkout
  /pricing       Pricing page
  /demo          Demo page
  /workspace     Standalone workspace (root, not shell) - new
  /workspace/[id] Individual workspace document - new
  /reports       Reports page - new

Platform (auth-protected /platform/*):
  /              Dashboard (platform home)
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
  workspace              AI workspace with projects (shell version)
  projects + projects/[id] + projects/[id]/draft (Tiptap editor)
  library + library/submit
  research, threads, calendar, directory
  lp-briefing            LP briefing (fund managers)
  settings/topics, admin/library

## Cron Jobs — actual schedules from vercel.json

fetch-feeds              Every 2h on even hours (0,2,4...22 UTC)
summarise-pending        Every 2h at :15 past even hours
project-populate         Every 2h at :30 past even hours
score-significance       Daily 3:30am UTC
generate-embeddings      Daily 1am UTC
embed-documents          Daily 3am UTC (1024MB, 300s max)
generate-connections     Daily 7am UTC
threshold-alerts         Daily 8am UTC
harvest-scraped-sources  Daily 6:30am UTC
conversion-triggers      Daily 9am UTC
scrape-governance-calendar Every 10 days at 3am UTC
governance-agent         Monday 4am UTC
blue-finance-agent       Monday 4:30am UTC
monitor-sources          Monday 7am UTC
source-health            Monday 5am UTC
scrape-isa               Tuesday 5am UTC
scrape-psma              Wednesday 8am UTC
velocity-scores          Every 4 days at 6am UTC
generate-entity-briefs   Hourly
send-entity-briefs       Every 30 min
[generate-brief / send-brief exist as files but NOT scheduled in vercel.json]

## Webhooks

webhooks/treaty-change  pg_net trigger on treaty_ratifications INSERT -> Claude -> story alert
webhooks/brief-reply    Parses email replies to morning briefs

## Key API Routes (notable, not exhaustive)

stories              GET/POST stories with topic filter, pagination
summarise            On-demand Claude article summarisation (3-tier fallback)
governance-events    GET with body/topic/significance filters
calendar/[token]     Personal iCal feed
calendar/subscribe   Creates personal iCal subscription
stripe-webhook       5 Stripe events -> subscriptions + users tables
stripe/checkout      Create Stripe checkout session
subscription-access  Check subscription status
portal               Stripe customer portal
ask                  AI Q&A endpoint
research/inline      Inline research generation
story/linkedin-draft LinkedIn post draft generator
entities/search      Entity search
iuu/carding          IUU carding data
tracker-status/[slug] Tracker status by slug
lp-briefing/pdf      LP briefing PDF export
landing-data         Landing page data

## Key Components (components/)

Feed:     StoryCard, FeaturedCard, FeedSidebar, Paywall, TrialBanner, ConversionModal, WelcomeState
Signals:  HeroSignal, HeroSignalBandCrossing, HeroSignalVelocity, HeroSignalGovernance, VelocityScore, VelocityEmpty, VelocityFallback, Sparkline, SignalFeed, HeroPulseCard
Trackers: TrackerHero, TrackerMethodology, TrackerHistory
UI:       Header, LandingHeader, TopicsSelector, AlertToggle, TickerStrip, SegmentSwitcher, DesktopOnly, EarlyAccessModal
Landing:  DirectoryPreview
Workspace: LinkedInDraftPanel, OvernightReveal, DashboardReveal, BriefPreview, IntelligenceThread

## Database (Supabase — key tables)

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

vercel.json     Cron schedule definitions (20 active crons)
next.config.ts  Next.js config, path alias @/* -> root
tsconfig.json   TypeScript strict mode
.env.local      All secrets (never commit)

## Key Dependencies

next               16.1.7   App framework
react              19.2.3   UI
@anthropic-ai/sdk  ^0.82.0  Claude API
@ai-sdk/anthropic  ^3.0.69  AI SDK wrapper
ai                 ^6.0.158 Vercel AI SDK
@supabase/supabase-js ^2.99.2 Database
next-auth          ^4.24.13 Auth (Google OAuth + magic link)
stripe             ^20.4.1  Payments
pdfkit             ^0.18.0  PDF generation (LP briefing)
pdfjs-dist         ^5.6.205 PDF parsing (library upload)
@tiptap/*          ^3.x     Rich text editor (project drafts)
d3 + topojson      ^7.9.0   Choropleth maps (trackers)
chart.js           ^4.5.1   Charts
ical-generator     ^10.1.0  iCal feed generation
@mastra/core       ^1.24.1  RAG/AI agent framework
@mastra/rag        ^2.2.0   RAG pipeline
@sentry/nextjs     ^10.50.0 Error monitoring
docx               ^9.6.1   DOCX export
mammoth            ^1.12.0  DOCX parsing
playwright         ^1.59.1  Scraper automation
csv-parse          ^6.2.1   CSV import (FAOLEX)

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
Entities:   Material threshold >=25 mentions, Watch 10-24; quiet-dominant template primary
