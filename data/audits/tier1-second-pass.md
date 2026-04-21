# Tier 1 Second-Pass Diagnostic — 2026-04-20

## Source A: NOAA Fisheries

### Finding: WORKING URL FOUND (parent agency, not fisheries-specific)

### Evidence

**fisheries.noaa.gov** has completely removed RSS. Checked 4 paths:
- `/news-and-announcements` — 200, no `<link rel="alternate">`, no feed refs
- `/` (root) — 200, no alternate links, no feed refs
- `/rss` — 404
- `/feed` — 404

**noaa.gov** (parent) still has RSS:
- Root page declares `<link rel="alternate" href="https://www.noaa.gov/rss.xml" title="NOAA" type="application/rss+xml" />`
- `https://www.noaa.gov/rss.xml` — **VERIFIED**: 200, valid RSS, 10 items, most recent **2026-04-17** (2 days ago)
- Feed title: "National Oceanic and Atmospheric Administration"

**oceanservice.noaa.gov** (NOS) has an RSS library page at `/rss.html` listing 6 feeds:
- `/rss/nosnews.xml` — 200, 397 items, but most recent is 2026-03-18 (32 days stale)
- `/rss/oceanfacts.xml` — 200, but last item 2023 (dead)
- `/newsroom/nosmedia.xml` — 200, but last item 2023 (dead)

### Recommended action

1. **Add `https://www.noaa.gov/rss.xml`** as "NOAA" (topic: climate, type: gov). This is the parent agency feed — not fisheries-specific but covers ocean, climate, and weather. NOAA Fisheries stories that get promoted to the parent site will appear here.
2. The fisheries-specific RSS is truly dead. For fisheries.noaa.gov specifically, would need a Jina scraper against `https://www.fisheries.noaa.gov/news-and-announcements` — not a quick fix, but doable as a scraped source in `harvest-scraped-sources`.

---

## Source B: EEA (European Environment Agency)

### Finding: TRULY DEAD

### Evidence

EEA rebuilt their entire website on a new platform. Every RSS path returns 404:
- `https://www.eea.europa.eu/en` — 200, 1.17 MB HTML, **no alternate links, no feed references anywhere**
- `https://www.eea.europa.eu/en/newsroom` — 200, 873 KB HTML, **no alternate links, no feed references**
- `https://www.eea.europa.eu/highlights/RSS` — 404
- `https://www.eea.europa.eu/news/RSS` — 404
- `https://www.eea.europa.eu/rss-feeds` — 404

The 404 pages reference `/subscription/news-feeds` as an old page. Fetching that page returns HTML with the heading "Our RSS feeds" but the page content says feeds are being phased out in favour of their newsletter.

### Recommended action

EEA's RSS is dead with no replacement. Two options:
1. **Jina scraper** against `https://www.eea.europa.eu/en/newsroom` — add to `harvest-scraped-sources`
2. **Skip for now** — EEA publishes infrequently on ocean topics specifically. DG MARE (already added) covers EU ocean policy more directly.

---

## Source C: UNEP

### Finding: PARSER FIX NEEDED

### Evidence

`https://www.unep.org/news-and-stories/rss.xml` returns HTTP 200 with `text/xml` content-type. But the format is **not RSS 2.0 or Atom** — it's a custom XML schema:

```xml
<?xml version="1.0"?>
<response>
  <item key="0">
    <title>How natural farming is transforming food production...</title>
    <path>http://www.unep.org/news-and-stories/story/how-natural-farming...</path>
    <field_article_billboard_image>https://cdn.unenvironment.org/...</field_article_billboard_image>
    <field_body><![CDATA[...]]></field_body>
  </item>
  ...
</response>
```

Key differences from RSS:
- Root element is `<response>` not `<rss>` or `<feed>`
- Items use `<path>` instead of `<link>`
- **No date fields at all** — no `<pubDate>`, no `<published>`, no `<dc:date>`, no `<updated>`
- Content is in `<field_body>` CDATA instead of `<description>` or `<content>`

The existing RSS parser in `fetch-feeds` looks for `<item>` tags (which exist) but then looks for `<link>` (missing — it's `<path>`) and `<pubDate>` (missing entirely). So the parser would find items but fail to extract links or dates, and all items would be skipped due to the "no pub date" filter.

### Recommended action

Two options:
1. **Custom parser** — add a UNEP-specific handler in `fetch-feeds` that reads `<path>` as link and uses the current timestamp as published_at (since UNEP doesn't provide dates in their feed). This is ~15 lines of code.
2. **Jina scraper** — add `https://www.unep.org/news-and-stories` to the scraped sources in `harvest-scraped-sources`. More robust but slower.

Recommendation: **Option 1** (custom parser). The feed has 15 items and valid titles/links. Only the date and link tag names differ.

---

## Source D: DFO Canada (Fisheries and Oceans Canada)

### Finding: WORKING URL FOUND

### Evidence

The recommended URL (`canada.ca/en/fisheries-oceans/news.rss`) returns HTML, not RSS. But the DFO homepage at `https://www.dfo-mpo.gc.ca/index-eng.htm` contains a direct link to the **actual feed**:

```
href="https://api.io.canada.ca/io-server/gc/news/en/v2?dept=fisheriesoceans&sort=publishedDate&orderBy=desc&publishedDate%3E=2022-04-01&pick=25&format=atom&atomtitle=Canada%20News%20Centre%20-%20Fisheries%20and%20Oceans%20Canada"
```

Verification:
- HTTP 200, valid Atom XML
- 25 items
- Most recent: **2026-04-17** (2 days ago)
- Feed title: "Canada News Centre - Fisheries and Oceans Canada"
- **VERIFIED**

### Recommended action

**Add to sources.ts**:
```typescript
{ name: "DFO Canada", rss: "https://api.io.canada.ca/io-server/gc/news/en/v2?dept=fisheriesoceans&sort=publishedDate&orderBy=desc&publishedDate%3E=2022-04-01&pick=25&format=atom&atomtitle=Canada%20News%20Centre%20-%20Fisheries%20and%20Oceans%20Canada", topic: "fisheries", type: "gov" },
```

Add `'DFO Canada'` to `OCEAN_DEDICATED_SOURCES`.

---

## Summary

| Source | Finding | Next Action |
|--------|---------|-------------|
| NOAA Fisheries | WORKING URL FOUND (parent `noaa.gov/rss.xml`) | Add parent NOAA feed; consider Jina scraper for fisheries-specific |
| EEA | TRULY DEAD (site rebuilt, no RSS anywhere) | Skip or add Jina scraper for newsroom page |
| UNEP | PARSER FIX NEEDED (custom XML schema, no dates) | Add custom parser for `<path>` tags, or Jina scraper |
| DFO Canada | WORKING URL FOUND (`api.io.canada.ca` Atom feed) | Add to sources.ts — verified, 25 items, fresh |
