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

## What's next
1. Nav link to /platform/lp-briefing in platform nav
2. Corporate Stripe pricing tier
3. Prompt caching on all API calls
4. ESG/NGO/journalist briefing_type PDF variants
5. Blue Economy market widget (opt-in, investor segment only)
6. Mobile app (Expo shell strategy)

## Known issues / debt
- Firecrawl MCP not connecting on Windows — use Jina fallback
- Debug logs still in /api/lp-portfolios/route.ts — remove before next push
- community-documents POST bug fix pending push
- Next.js middleware.ts deprecated — migrate to proxy convention
- Stripe corporate tier not wired up — upgrade CTA goes nowhere

## Funds seeded in lp_portfolios
- Oceanus Capital (test)
- Ocean 14 Capital
- Katapult Ocean
- SWEN Capital Partners
- Aqua-Spark
