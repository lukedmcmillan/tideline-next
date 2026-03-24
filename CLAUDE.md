# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Tideline — a professional ocean intelligence platform that curates and summarizes ocean-related news, research, and regulatory developments. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run start` — start production server

## Architecture

**Routing** (Next.js App Router, all under `app/`):
- `/` — marketing homepage with hero, trackers, founder section, pricing, FAQ accordion, and footer
- `/start` — trial signup flow (topic selection → email)
- `/login` — email magic link sign-in
- `/onboarding` — two-step onboarding (31 topic cards, min 3 → timezone dropdown), shown on first login
- `/subscribe` — Stripe Elements checkout page with card form and SCA handling
- `/platform/feed` — main feed with topic sidebar, story list, subscription banners, and paywall overlay
- `/platform/story/[id]` — individual story detail with AI summaries

**API Routes** (`app/api/`):
- `magic-link` — generates magic link token, stores in `magic_links` table, sends email via Resend
- `verify` — validates magic link, creates `public.users` row on first login, sets `tideline_session` cookie, redirects to `/onboarding` or `/platform/feed`
- `trial-signup` — stores signups in `trial_signups` table, sends welcome email via Resend
- `subscribe` — creates Stripe customer + subscription (14-day trial), writes to `subscriptions` table
- `onboarding` — saves topic selection + timezone to `public.users`
- `subscription-status` — returns subscription status + `needsOnboarding` flag from session cookie
- `stripe-webhook` — handles 5 Stripe events (see below), syncs to `subscriptions` + `public.users` tables
- `stories` — fetches from `stories` table (supports id lookup, topic filter, pagination)
- `summarise` — on-demand Claude-powered article summarization with three-tier fallback (Jina → direct fetch → RSS description)
- `cron/fetch-feeds` — hourly RSS aggregation from ~89 sources, extracts descriptions, bearer token auth via `CRON_SECRET`
- `cron/harvest-scraped-sources` — every 6 hours, scrapes non-RSS sources (IMO, ISA, FAO, IUCN, CBD, CITES, UN BBNJ) via Jina + BBNJ treaty ratification XML parser. Writes to `scraped_sources`, `stories`, `treaty_ratifications`, and `scrape_runs` tables
- `webhooks/treaty-change` — receives Supabase pg_net trigger on `treaty_ratifications` INSERT, uses Claude to assess significance, creates story with `alert_type: "treaty_alert"` if warranted

**Auth**: Custom magic link system (`/api/magic-link` + `/api/verify`) sets a `tideline_session` cookie (base64 JSON with email + 30-day expiry, httpOnly). NextAuth v4 also configured in `auth.ts` but the custom system is primary. Middleware protects `/platform/*` by checking `tideline_session` first, then NextAuth cookies as fallback. Login page passes `callbackUrl` through the full chain.

**Database**: Supabase (three schemas: `public`, `auth`, `next_auth`). Key tables:
- `public.users` — subscription status, topics (jsonb), timezone, stripe_subscription_id, trial_ends_at, last_brief_sent. `id` column uses `gen_random_uuid()` default.
- `public.stories` — title, link, source_name, topic, source_type, published_at, description (RSS), short_summary, full_summary, is_pro, alert_type
- `public.scraped_sources` — url, source_name, source_type, document_title, published_date, content_hash (dedup), ingested_at, raw_html
- `public.treaty_ratifications` — treaty_name, country_name, status (ratified/signed/neither), status_date, changed_from (previous status), recorded_at. Longitudinal change log, not a snapshot. Has pg_net trigger that POSTs to `/api/webhooks/treaty-change` on INSERT.
- `public.scrape_runs` — source, status, documents_found, documents_new, error_message, ran_at
- `public.subscriptions` — Stripe subscription state (status, trial_end, current_period_end, cancel_at_period_end)
- `public.trial_signups` — email, topics, signed_up_at, status
- `public.magic_links` — email, token, expires_at, used
- `next_auth.users` — NextAuth session management (separate from `public.users`)

**Stripe Webhook** (`/api/stripe-webhook`) handles these 5 events:
- `checkout.session.completed` — sets user status to "active", creates user row if needed
- `customer.subscription.created` — syncs to both `subscriptions` and `users` tables
- `customer.subscription.updated` — syncs status changes
- `customer.subscription.deleted` — sets status to "cancelled"
- `invoice.payment_failed` — sets status to "cancelled"

**Onboarding**: On first login, users with empty topics in `public.users` are redirected to `/onboarding` (31 topic cards, min 3 required, then timezone). The verify route handles this redirect server-side; the feed page has a client-side safety net via the `needsOnboarding` flag from `/api/subscription-status`.

**Paywall**: Feed page shows a hard paywall overlay (blocking) for users with status `canceled`, `past_due`, or `none`. Trialing users with ≤5 days left see a soft banner. Active and trialing users get full access.

**Treaty Monitoring Agent**: The harvest cron parses BBNJ treaty ratification data from the UN Treaty Collection XML. New ratification changes are inserted into `treaty_ratifications` with `changed_from` tracking. A Supabase pg_net trigger fires on INSERT, calling `/api/webhooks/treaty-change`. The webhook uses Claude to assess significance and creates a story alert if warranted. Treaty alerts appear at the top of the feed with a distinct red ALERT badge, above all regular stories regardless of topic filter.

**External Services**: Supabase (DB), Resend (email via SMTP and API), Claude API (summarization via `claude-sonnet-4-20250514`), Stripe (payments + webhooks), Jina (article scraping), Vercel (hosting + cron).

## Styling

All pages use **inline styles** (`style={{...}}`), not Tailwind utility classes in JSX. The design system uses navy (`#0a1628`), blue (`#1d6fa4`), off-white backgrounds, with DM Sans (body), Georgia (serif headlines), and IBM Plex Mono. Source type badges are color-coded: gov (blue), reg (red), ngo (green), res (purple), media (yellow), esg (teal).

## Key Patterns

- Path alias: `@/*` maps to project root
- Pages are largely self-contained — minimal shared components (`components/Header.tsx`)
- Middleware checks `tideline_session` cookie first, then NextAuth cookies as fallback
- Cron jobs (`vercel.json`): `/api/cron/fetch-feeds` hourly, `/api/cron/harvest-scraped-sources` every 6 hours
- AI summaries are generated lazily on story view with three-tier fallback: Jina article fetch → direct fetch/meta scrape → RSS description field. Only shows "Summary unavailable" if all three fail.
- Feed urgency tags: Breaking (< 2 hours old), New (2-24 hours), no tag (> 24 hours)
- RSS feed cron extracts `<description>`, `<content>`, or `<summary>` from feed items and stores in `stories.description`
- Welcome email sent on trial signup via Resend API (fire-and-forget, doesn't block response)
- All email domain restrictions removed — any email address accepted on signup, login, and subscribe
- Trial period is 14 days everywhere (landing page, /start, Stripe subscription, verify route)

## Environment Variables

`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `CRON_SECRET`, `JINA_API_KEY`, `NEXTAUTH_URL`
