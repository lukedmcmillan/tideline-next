# Tideline — Live Project Status

## What's built
- Daily brief (89 sources) ✓
- BBNJ tracker ✓
- Research / RAG layer ✓
- Entity directory (153 entities) ✓
- Auth, subscriptions, Stripe ✓
- lp_portfolios table + lp_briefing view ✓
- GET /api/lp-briefing endpoint ✓
- Supabase MCP live ✓
- Ruflo V3 installed ✓

## What's next
1. LP briefing PDF layer (lib/lp-briefing-pdf.ts + /api/lp-briefing/pdf)
2. Fund config UI (/dashboard/lp-briefing)
3. Corporate pricing tier in Stripe
4. Seed real funds into lp_portfolios
5. briefing_type column for ESG/NGO/journalist variants

## Known issues
- Firecrawl MCP not connecting
- IMO press briefings fix deployed — verify next cron run
- Prompt caching not implemented
