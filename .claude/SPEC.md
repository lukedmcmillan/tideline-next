# Tideline — Live Project Status

## What's built and live
- Daily brief (89 sources) ✓
- BBNJ tracker (live data) ✓
- Research / RAG layer ✓
- Entity directory (153+ entities) ✓
- Auth, subscriptions, Stripe ✓
- lp_portfolios table + lp_briefing view ✓
- GET /api/lp-briefing ✓
- GET /api/lp-briefing/pdf ✓ (PDFKit, serverExternalPackages fix applied)
- Portfolio Intelligence Briefing UI at /platform/lp-briefing ✓
- Entity search API at /api/entities/search ✓
- Supabase MCP live ✓
- Ruflo V3 installed (98 agents, 15-agent swarm) ✓
- Claude Skills installed ✓

- Cron refactor: 4 shared modules extracted (sources, html, jina, confidence), 2 auth fixes, ~350 lines removed ✓
- Conflict tracker with Pulse Score methodology ✓
- Dashboard redesigned as 2x3 card grid ✓
- Dashboard v2 Sprint 1 (wow layer) COMPLETE and shipped ✓
  - 17 new files: types, events seed, 6 API routes, 9 components (Sparkline, TickerStrip, OvernightReveal, HeroSignal + 5 subtypes)
  - 2 files modified: layout.tsx (sidebar logo + datetime + readiness placeholder), page.tsx (full dark-mode rewrite)
  - page.old.tsx gitignored as backup, delete at end of Sprint 3
- Threshold alerts end-to-end: seed script, AlertToggle, preferences API, cron route, alert_sends table ✓

## Dashboard Sprint 2 carry-forward
1. Wire /api/dashboard/readiness to real data (need new schema: docs_read, tracker_dashboard_visits_last_7d)
2. Wire /api/dashboard/proof-of-work to real data
3. Wire /api/dashboard/upcoming-30d cells to velocity_scores weekday averages
4. Hero Signal headline accent: implement with structured headline fields, not colon heuristic
5. Build ReadinessWidget component (replaces sidebar placeholder)
6. Build CalendarHeatmap component

## What's next
1. Brief-reply webhook (reply-to-brief → AI answer)
2. Corporate Stripe pricing tier
3. Prompt caching on all API calls
4. ESG/NGO/journalist briefing_type PDF variants
5. Blue Economy market widget (opt-in, investor segment only)
6. Mobile app (Expo shell strategy)

## Known issues / debt
- Firecrawl MCP not connecting on Windows — use Jina fallback
- community-documents POST bug fix pending push
- Next.js middleware.ts deprecated — migrate to proxy convention
- Stripe corporate tier not wired up — upgrade CTA goes nowhere

## Funds seeded in lp_portfolios
- Oceanus Capital (test)
- Ocean 14 Capital
- Katapult Ocean
- SWEN Capital Partners
- Aqua-Spark
