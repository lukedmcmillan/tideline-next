# Source Gap Analysis — 2026-04-19

## Summary

Tideline ingests from **80 RSS sources** (in `app/lib/sources.ts`) and **7 scraped sources** (in `harvest-scraped-sources`). Over the last 30 days, **1,564 stories** were ingested. However, the feed is heavily skewed: 4 sources account for 50% of all stories.

## Feed concentration problem

| Source | Stories (30d) | % of feed | Type |
|--------|--------------|-----------|------|
| Undercurrent News | 347 | 22% | media/fisheries |
| Phys.org Ocean | 173 | 11% | media/science |
| PLOS ONE Marine | 158 | 10% | research |
| Bloomberg Green | 110 | 7% | esg/finance |
| **Top 4 total** | **788** | **50%** | |

The remaining 50% is spread across 27 sources, with most contributing fewer than 10 stories/month. **53 of 80 configured RSS sources produced zero stories in the last 30 days.**

## Sources that ARE configured and working

### High-performing (10+ stories/30d)

| Source | Stories | Last seen | Type | Notes |
|--------|---------|-----------|------|-------|
| Undercurrent News | 347 | Apr 19 | media | Over-represented |
| Phys.org Ocean | 173 | Apr 19 | media | Mixed relevance |
| PLOS ONE Marine | 158 | Apr 17 | research | Academic, may need filtering |
| Bloomberg Green | 110 | Apr 19 | esg | Good, but broad |
| UK DEFRA | 28 | Apr 13 | gov | Solid |
| Oceanographic Magazine | 26 | Apr 14 | media | Good |
| Carbon Brief | 17 | Apr 8 | media | Climate-focused |
| Nature Ecology & Evolution | 16 | Apr 17 | research | Good |
| ScienceAlert | 14 | Apr 18 | media | Mixed relevance |
| Nature Sustainability | 13 | Apr 15 | research | Good |
| Nature Climate Change | 12 | Apr 15 | research | Good |

### Low-performing (1-9 stories/30d)

| Source | Stories | Last seen | Notes |
|--------|---------|-----------|-------|
| Blue Marine Foundation | 9 | Apr 17 | Good source, low volume |
| Guardian Oceans | 9 | Apr 18 | Good |
| New Scientist | 9 | Apr 14 | Mixed |
| Global Fishing Watch | 8 | Apr 14 | High value |
| ISA (scraped) | 7 | Apr 1 | **Gap: not seen since Apr 1** |
| Science Ocean Research | 6 | Apr 17 | |
| UN BBNJ (scraped) | 6 | Apr 11 | Low volume expected |
| CBD (scraped) | 5 | Apr 11 | |
| IMO (scraped) | 4 | Apr 15 | Should be higher |
| MBARI | 4 | Apr 9 | Niche |
| Guardian Fishing | 2 | Apr 8 | |
| FAO Fisheries (scraped) | 2 | Apr 11 | Should be higher |
| CITES (scraped) | 2 | Apr 11 | |
| High Seas Alliance | 1 | Apr 14 | Low volume expected |
| Sea Shepherd | 1 | Mar 27 | **Stale** |
| Ocean Conservancy | 1 | Mar 31 | **Stale** |
| Mission Blue | 1 | Mar 23 | **Stale** |
| The Ocean Foundation | 1 | Mar 26 | **Stale** |

### Zero stories in 30 days (configured but producing nothing)

These 53 RSS sources are in `app/lib/sources.ts` but returned 0 stories in the last 30 days:

NOAA Fisheries, NOAA Ocean Service, NOAA News, EPA Water News, European Environment Agency, FAO Fisheries (RSS), IMO News (RSS), IWC, IUCN Red List, WWF, Oceana, Shark Trust, WCS Marine, Plastic Soup Foundation, Sea Turtle Conservancy, Reef Check, DSCC, ClientEarth, EDF Oceans, 5 Gyres, Surfrider Foundation, MSC, Marine Conservation Society, Deep Sea Conservation Coalition, WWF Oceans, Scripps Oceanography, WHOI, Smithsonian Ocean, British Antarctic Survey, National Oceanography Centre, Plymouth Marine Laboratory, Mongabay Oceans, Hakai Magazine, The Fish Site, IntraFish, BBC Science & Environment, National Geographic, Natural History Museum, GreenBiz, OECD Ocean Finance, CBD Secretariat, IPCC

**Root causes likely**: RSS feeds broken/changed, ocean keyword filter too aggressive for general sources, or feeds genuinely low-volume.

## Publisher check: configured vs missing

### CONFIGURED (in RSS or scraped sources)

| Publisher | RSS? | Scraped? | Stories (30d) | Status |
|-----------|------|----------|---------------|--------|
| ISA (isa.org.jm) | Yes | Yes | 7 | Working |
| IMO (imo.org) | Yes | Yes | 4 | Working |
| IWC (iwc.int) | Yes | No | 0 | **RSS dead** |
| CITES | Yes | Yes | 2 | Working |
| European Environment Agency | Yes | No | 0 | **RSS broken** |
| FAO Fisheries | Yes | Yes | 2 | Low |
| NOAA Fisheries | Yes | No | 0 | **RSS broken** |
| UK DEFRA | Yes | No | 28 | Working |
| Deep Sea Conservation Coalition | Yes | No | 0 | **RSS broken** |
| High Seas Alliance | Yes | No | 1 | Low volume |
| Oceana | Yes | No | 0 | **RSS broken** |
| Sea Shepherd | Yes | No | 1 | Stale |
| WWF Marine | Yes | No | 0 | **RSS broken** |
| Blue Marine Foundation | Yes | No | 9 | Working |
| Global Fishing Watch | Yes | No | 8 | Working |
| Hakai Magazine | Yes | No | 0 | **RSS broken** |
| Mongabay Oceans | Yes | No | 0 | **RSS broken** |
| CBD | No | Yes | 5 | Working |
| UN BBNJ | No | Yes | 6 | Working |
| OSPAR | No | Governance scraper | ~12 events | Events only |
| CCAMLR | No | Governance scraper | ~9 events | Events only |

### NOT CONFIGURED (coverage gaps)

| Publisher | Priority | Why needed |
|-----------|----------|------------|
| **Reuters (environment/maritime)** | HIGH | Wire service, first to break governance stories |
| **Associated Press (environment)** | HIGH | Wire service coverage |
| **SeafoodSource** | HIGH | Fisheries trade press (complements Undercurrent News) |
| **Lloyd's List** | HIGH | Shipping intelligence, paywalled but RSS may work |
| **gCaptain** | HIGH | Shipping news, free RSS |
| **Trade Winds** | MEDIUM | Maritime trade press |
| **Splash247** | MEDIUM | Shipping news |
| **E&E News** | MEDIUM | Environmental law and energy policy |
| **Pew Charitable Trusts Marine** | MEDIUM | Major ocean policy NGO, no RSS source |
| **Environmental Justice Foundation** | MEDIUM | IUU fishing, labour rights at sea |
| **SDG Knowledge Hub / IISD** | MEDIUM | Ocean governance summaries |
| **European Commission Oceans** | MEDIUM | EU fisheries/marine policy |
| **UK MMO** | LOW | UK-specific marine management |
| **UN DOALOS** | LOW | Law of the sea, very low volume |

## Diagnosis: why governance is only 2.5% of the feed

1. **53 of 80 RSS feeds are producing zero stories.** Many are likely broken (URL changed, feed discontinued, or returning errors). The `monitor-sources` cron runs weekly but no health check data was found in the database — it may not be writing results, or the table is empty.

2. **The ocean keyword filter is too aggressive for general sources.** Sources like BBC, National Geographic, and NOAA publish ocean content but title-keyword matching (`oceanKeywords` in `fetch-feeds`) may miss stories that use terms like "marine", "fisheries framework", or "MARPOL" that aren't in the keyword list.

3. **Governance bodies publish infrequently.** ISA, IWC, CITES, and BBNJ naturally produce 2-7 stories/month. This is correct — the problem isn't their volume, it's that they're drowned out by high-volume media sources.

4. **Wire services are completely missing.** Reuters and AP break most governance stories first. Their absence means Tideline is always behind on regulatory developments.

5. **Shipping press is completely missing.** gCaptain, Lloyd's List, Trade Winds, and Splash247 would directly serve the shipping compliance audience.

## Recommendations

### Immediate (fix broken feeds)

1. **Run `monitor-sources` manually** and check Vercel logs — verify it's writing to `source_health_checks` table. If the table doesn't exist, create it.
2. **Test each of the 53 zero-story feeds** individually. Many RSS URLs may have changed. NOAA, Oceana, Hakai, and Mongabay are particularly high-value and shouldn't be zero.
3. **Expand the ocean keyword list** in `fetch-feeds` — add: `MARPOL`, `UNCLOS`, `subsidy`, `aquaculture`, `MSC`, `certification`, `MPA`, `ballast`, `decarbonisation`, `methane`, `ammonia fuel`, `MEPC`, `flag state`, `port state`, `RFMO`, `seagrass`, `mangrove`, `blue bond`, `TNFD`.

### Short-term (add missing sources)

4. **Add gCaptain RSS** (`https://gcaptain.com/feed/`) — free, high-volume shipping news
5. **Add SeafoodSource RSS** — fisheries trade press
6. **Add Reuters environment** — if RSS feed available, or use GDELT filtered for Reuters
7. **Add E&E News RSS** — environmental law coverage

### Medium-term (rebalance feed)

8. **Cap per-source contribution** to prevent single-source dominance. Undercurrent News at 347 stories/month (22%) skews the feed. Consider a per-source-per-day limit of 5-10 stories.
9. **Prioritise governance/regulatory sources** in the brief — even if they're low volume, they should always appear when available.
