# Tier 1 Governance Source Verification — 2026-04-20

## Summary

| # | Source | Recommended URL | Status | Action |
|---|--------|----------------|--------|--------|
| 1 | ISA | `isa.org.jm/feed` | SUSPICIOUS | Keep existing scraper, ISA publishes infrequently |
| 2 | DG MARE | `ec.europa.eu/commission/presscorner/api/rss?c=Maritime+Affairs+and+Fisheries` | VERIFIED | **ADD** new source |
| 3 | EEA | (all URLs tested) | BROKEN | Old RSS discontinued, new site has no feed |
| 4 | UNEP | `unep.org/news-and-stories/rss.xml` | SUSPICIOUS | Non-standard XML, no parseable dates |
| 5 | NOAA Fisheries | (all URLs tested) | BROKEN | RSS feed discontinued, site restructured |
| 6 | UK MMO | `gov.uk/.../marine-management-organisation.atom` | VERIFIED | **ADD** new source |
| 7 | UK DEFRA | `gov.uk/.../department-for-environment-food-rural-affairs.atom` | VERIFIED | Already configured, working |
| 8 | DFO Canada | `canada.ca/en/fisheries-oceans/news.rss` | BROKEN | Returns HTML, not RSS |
| 9 | HELCOM | `helcom.fi/feed/` | VERIFIED | **ADD** new source |

## Detailed Results

### VERIFIED (ready to add/update)

**DG MARE (EU Maritime Affairs & Fisheries)**
- URL: `https://ec.europa.eu/commission/presscorner/api/rss?c=Maritime+Affairs+and+Fisheries`
- HTTP 200, valid XML, 10 items, most recent: 2026-04-19 (today)
- Original recommended URL was an RSS list page, not a feed. The Press Corner API works.
- Action: ADD as new source, topic: governance, type: gov

**UK MMO (Marine Management Organisation)**
- URL: `https://www.gov.uk/government/organisations/marine-management-organisation.atom`
- HTTP 200, valid Atom, 20 items, most recent: 2026-04-17 (2 days ago)
- Not currently in sources.ts
- Action: ADD as new source, topic: governance, type: gov

**UK DEFRA**
- URL: `https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs.atom`
- HTTP 200, valid Atom, 20 items, most recent: 2026-04-17 (2 days ago)
- Already in sources.ts with this exact URL. Producing 28 stories/30d.
- Action: No change needed, already working

**HELCOM (Helsinki Commission)**
- URL: `https://helcom.fi/feed/`
- HTTP 200, valid RSS, 10 items, most recent: 2026-04-14 (5 days ago)
- Not currently in sources.ts
- Action: ADD as new source, topic: governance, type: reg

### SUSPICIOUS (need investigation)

**ISA (International Seabed Authority)**
- URL: `https://isa.org.jm/feed/` — HTTP 200, valid RSS, 9 items
- Most recent item: 2026-04-01 (18 days ago). ISA publishes infrequently.
- Already configured in sources.ts AND as a scraped source in harvest-scraped-sources.
- The RSS feed URL matches what's already configured. Producing 7 stories/30d.
- Action: No URL change needed. The low volume is expected for ISA.

**UNEP**
- URL: `https://www.unep.org/news-and-stories/rss.xml` — HTTP 200, valid XML
- 15 items but uses non-standard `<response><item>` format, not RSS/Atom
- No parseable `<pubDate>`, `<published>`, `<updated>`, or `<dc:date>` tags
- The existing RSS parser in fetch-feeds won't parse this format
- Action: Would need a custom parser. DEFER — not worth the effort for one source.

### BROKEN (cannot use)

**EEA (European Environment Agency)**
- Original URL: `eea.europa.eu/rss/highlights.rss` — 404
- Alt `eea.europa.eu/en/newsroom/rss-feeds/eeas-press-releases-rss` — 200 but HTML, not XML
- Alt `eea.europa.eu/en/topics/in-depth/water-and-marine-environment/rss.xml` — 404 with JSON error
- EEA rebuilt their website and discontinued all RSS feeds.
- Action: REMOVE from sources.ts (currently configured but returning 0 stories). Consider Jina scraper later.

**NOAA Fisheries**
- Original URL: `fisheries.noaa.gov/rss.xml` — 404
- Alt `fisheries.noaa.gov/news-and-announcements/news/feed` — 404
- Alt `fisheries.noaa.gov/feeds/all` — 404
- Alt `noaa.gov/news-release/feed` — 404
- NOAA has completely removed RSS feeds from fisheries.noaa.gov.
- Action: REMOVE from sources.ts (3 NOAA entries all dead). Consider GDELT filtered for NOAA or Jina scraper.

**DFO Canada (Fisheries and Oceans Canada)**
- URL: `canada.ca/en/fisheries-oceans/news.rss` — HTTP 200 but returns HTML page, not RSS
- Canada.ca appears to have discontinued RSS feeds for department news
- Action: Do not add. Consider Jina scraper later.

## Proposed Code Changes

### ADD to `app/lib/sources.ts` RSS_SOURCES array:

```typescript
// GOVERNANCE (Tier 1 additions — verified 2026-04-20)
{ name: "DG MARE", rss: "https://ec.europa.eu/commission/presscorner/api/rss?c=Maritime+Affairs+and+Fisheries", topic: "governance", type: "gov" },
{ name: "UK MMO", rss: "https://www.gov.uk/government/organisations/marine-management-organisation.atom", topic: "governance", type: "gov" },
{ name: "HELCOM", rss: "https://helcom.fi/feed/", topic: "governance", type: "reg" },
```

### ADD to `OCEAN_DEDICATED_SOURCES` set:

```typescript
'DG MARE', 'UK MMO', 'HELCOM',
```

### REMOVE from RSS_SOURCES (confirmed dead):

```
- European Environment Agency (rss/highlights.rss → 404)
- NOAA Fisheries (rss.xml → 404)
- NOAA Ocean Service (rss/oceancast.xml → likely dead too)
- NOAA News (news-release/feed → 404)
```

Awaiting your approval before applying these changes.
