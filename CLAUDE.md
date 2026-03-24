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
- `/` — marketing homepage (large single file, ~800 lines)
- `/start` — trial signup flow (topic selection → email)
- `/login` — email magic link sign-in
- `/platform/feed` — main feed with topic sidebar and story list
- `/platform/story/[id]` — individual story detail with AI summaries

**API Routes** (`app/api/`):
- `auth/[...nextauth]` — NextAuth handlers
- `trial-signup` — stores signups in Supabase `trial_signups` table
- `subscribe` — Stripe subscription creation with trial period
- `stories` — fetches from Supabase `stories` table (supports id lookup, topic filter, pagination)
- `summarise` — on-demand Claude-powered article summarization (fetches via Jina or direct, caches in DB)
- `cron/fetch-feeds` — hourly RSS aggregation from ~89 sources, bearer token auth via `CRON_SECRET`

**Auth**: NextAuth v4 with email provider (Resend SMTP), Supabase adapter, database sessions. Config in `auth.ts`. Professional email enforcement (blocks Gmail/Yahoo/Outlook etc.) on both signup and login.

**Database**: Supabase. Key tables: `stories` (aggregated articles + summaries), `trial_signups`, plus NextAuth tables (users, sessions, accounts, verification_tokens).

**External Services**: Supabase (DB + auth adapter), Resend (email), Claude API (summarization via `claude-sonnet-4-20250514`), Stripe (payments), Jina (article scraping fallback), Vercel (hosting + cron).

## Styling

All pages use **inline styles** (`style={{...}}`), not Tailwind utility classes in JSX. The design system uses navy (`#0a1628`), blue (`#1d6fa4`), off-white backgrounds, with DM Sans (body), Georgia (serif headlines), and IBM Plex Mono. Source type badges are color-coded: gov (blue), reg (red), ngo (green), res (purple), media (yellow), esg (teal).

## Key Patterns

- Path alias: `@/*` maps to project root
- The only shared component is `components/Header.tsx` — pages are largely self-contained
- The middleware (`middleware.ts`) matches `/platform/:path*` but currently just passes through
- The cron job (`vercel.json`) runs `/api/cron/fetch-feeds` hourly
- AI summaries are generated lazily on story view and cached in the `stories` table
- RSS feed sources include keyword filtering for non-ocean-dedicated sources, 60-day age cutoff, and link-based deduplication

## Environment Variables

`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `CRON_SECRET`, `JINA_API_KEY` (optional)
