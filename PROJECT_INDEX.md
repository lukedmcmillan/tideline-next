# Project Index: Tideline

Generated: 2026-05-08

## Stack

Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4 (inline styles only), Supabase, Stripe, Resend, Anthropic API, Jina, Vercel

---

## Public Routes (app/)

| Path | Purpose |
|------|---------|
| `/` | Marketing homepage — PROTECTED, do not modify |
| `/login` | Magic link sign-in |
| `/sign-in` | Google OAuth sign-in |
| `/start` | Trial signup flow |
| `/onboarding` | Topic + timezone setup |
| `/subscribe` | Stripe Elements checkout |
| `/upgrade` | Upgrade prompt |
| `/pricing` | Pricing page |
| `/demo` | Demo page |
| `/survey` | User survey |
| `/reports` | Reports |
| `/methodology` | Methodology explanation |
| `/workspace` | Workspace list |
| `/workspace/[id]` | Individual workspace |

## Platform Routes (auth-protected, /platform/...)

feed, story/[id], trackers, tracker/bbnj, tracker/governance, tracker/isa, tracker/iuu, tracker/30x30, tracker/blue-finance, tracker/imo-shipping, tracker/offshore-wind, tracker/cites-marine, tracker/wto-fisheries, tracker/plastics, research, threads, projects, projects/[id], projects/[id]/draft, library, library/submit, lp-briefing, calendar, workspace, directory, settings/topics, welcome, admin/library

---

## API Routes (app/api/)

### Auth & User
- `auth/[...nextauth]` — NextAuth (Google OAuth + magic link)
- `auth/verify` — Magic link verification, cookie, redirect
- `trial-signup` — Store trial, send welcome email
- `subscription-access` — Status + needsOnboarding flag
- `user/onboarding-status`, `user/complete-onboarding`, `user/modal-status`, `user/dismiss-modal`, `user/sector`, `user/update-last-seen`

### Stories & Content
- `stories` — Fetch (id/topic/pagination)
- `stories/save` — Save to workspace
- `stories/comments` — Comments
- `summarise` — On-demand summarisation (Sonnet, 3-tier fallback: Jina → direct → RSS)
- `search` — Vector search
- `connections` — Story connection graph
- `notifications` — User notifications

### Workspace & Projects
- `workspace/narrative` — Intelligence thread narrative (Sonnet)
- `workspace/quick-note` — Quick note capture
- `projects/[id]/draft` — Draft CRUD
- `projects/[id]/draft/compile` — Compile draft
- `projects/new-stories` — New stories for project

### Research & AI
- `ask` — RAG research queries (Sonnet, prompt-cached)
- `research/inline` — Inline research with RAG (Sonnet, prompt-cached)
- `documents/generate-brief` — Generate brief (Sonnet)
- `documents/[id]/export` — Export document
- `documents/submit` — Submit to library
- `story/linkedin-draft` — LinkedIn post drafting (Sonnet)
- `threads`, `threads/me`, `threads/match` — Crosscurrent threads (match: Sonnet)

### Trackers
- `treaty-status` — BBNJ treaty status
- `governance-events` — Governance calendar events (body/topic/significance filters)
- `tracker-events`, `tracker-status/[slug]`, `tracker/view`
- `iuu-status`, `iuu/carding`, `30x30-status`, `blue-finance-status`
- `isa-status`, `isa-contractors`, `psma`

### Calendar
- `calendar/[token]` — Personal iCal feed (text/calendar)
- `calendar/subscribe` — Create subscription with filters (Google/Outlook/Apple links)

### Payments
- `stripe/checkout` — Create Stripe checkout session
- `portal` — Stripe customer portal
- `webhooks/treaty-change` — pg_net trigger → Sonnet significance → story alert

### LP Briefing
- `lp-briefing`, `lp-briefing/pdf`, `lp-briefing/stats`, `lp-portfolios`

### Library & Documents
- `library/search`, `library/view`, `library/activity`, `library/signed-url`, `library/extract-metadata`
- `community-documents`, `entities/search`
- `admin/documents/upload`, `admin/documents/review`, `admin/documents/signed-upload-url`
- `admin/story-override`, `admin/backfill-velocity`

### Misc
- `alerts/preferences` — Alert preferences
- `sidebar-data`, `dashboard`, `landing-data`, `waitlist`, `survey`, `consultations`, `test-email`

---

## Cron Jobs (app/api/cron/)

| Route | Schedule | Purpose |
|-------|----------|---------|
| `fetch-feeds` | Hourly | RSS aggregation ~89 sources |
| `harvest-scraped-sources` | Every 6h | Scrape IMO, ISA, FAO, IUCN, CBD, CITES, UN BBNJ |
| `scrape-governance-calendar` | Weekly Mon 3am UTC | Scrape 10 governance body pages (Sonnet) |
| `score-significance` | Daily | Score story significance (Haiku) |
| `velocity-scores` | Daily | Entity velocity scores |
| `send-brief` | Daily 7am | Send morning brief emails |
| `generate-brief` | Before send | Generate brief (Haiku quality gate) |
| `summarise-pending` | Regular | Batch article summarisation (Sonnet) |
| `generate-embeddings` | Regular | Story embeddings |
| `embed-documents` | Regular | Library document embeddings |
| `generate-connections` | Regular | Story connection graph |
| `project-populate` | Regular | Populate project stories (Haiku) |
| `blue-finance-agent` | Regular | Classify blue finance events (Haiku) |
| `governance-agent` | Regular | Classify governance events (Haiku) |
| `scrape-isa` | Regular | ISA data scraper |
| `scrape-psma` | Regular | PSMA data scraper |
| `source-health` | Regular | Source health monitor |
| `monitor-sources` | Regular | Source monitoring |
| `threshold-alerts` | Regular | Velocity threshold alerts |
| `conversion-triggers` | Regular | Conversion email triggers |

---

## Core Lib Modules

| Module | Purpose |
|--------|---------|
| `app/lib/auth.ts` | `getEmailFromSession` shared helper |
| `app/lib/embeddings.ts` | pgvector embedding functions |
| `app/lib/search.ts` | Vector search utilities |
| `app/lib/jina.ts` | Jina article scraping |
| `app/lib/html.ts` | HTML parsing |
| `app/lib/confidence.ts` | Confidence scoring |
| `app/lib/events.ts` | Event helpers |
| `app/lib/subscription.ts` | Subscription status helpers |
| `app/lib/tracker-metadata.ts` | Tracker metadata definitions |
| `lib/entity-matching.ts` | Entity matching pipeline |
| `lib/lp-briefing-pdf.ts` | LP briefing PDF (PDFKit) |
| `lib/email/alert-data.ts` | Alert email data builder |
| `lib/email/sparkline.ts` | Sparkline chart for emails |
| `lib/emails/onboarding-day3.ts` | Day-3 onboarding email |

---

## Key Database Tables

public: users, stories, scraped_sources, treaty_ratifications, governance_bodies, governance_events, expected_decisions, subscriptions, trial_signups, magic_links, calendar_subscriptions, scrape_runs, velocity_scores, entities, entity_mentions, divergences, lp_portfolios, documents, threads, projects, workspaces, connections, saved_stories

next_auth: users (NextAuth session management, separate from public.users)

---

## Model Assignment

**Haiku** (`claude-haiku-4-5-20251001`): classification, scoring, structured output
→ blue-finance-agent, generate-brief, governance-agent, project-populate, score-significance

**Sonnet** (`claude-sonnet-4-6`): interpretation, reasoning, drafting, research
→ ask, research/inline, summarise, summarise-pending, workspace/narrative, threads/match, story/linkedin-draft, webhooks/treaty-change, documents/generate-brief, cron/scrape-governance-calendar

---

## Configuration

- `vercel.json` — Cron schedules + routes
- `next.config.ts` — Next.js config
- `tsconfig.json` — TypeScript strict
- `middleware.ts` — Auth guard for /platform/* and /tracker/*
- `.env.local` — Secrets (gitignored)

---

## Session Checklist

1. `/sc:index-repo` (done)
2. Read `tasks/lessons.md` before writing any code
3. Read `tasks/todo.md` for current priorities
4. Read `MESSAGING_HOUSE.md` before any UI/copy work
5. `/sc:save` + update `.claude/SPEC.md` + `tasks/lessons.md` at session end
