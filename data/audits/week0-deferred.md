# Week 0 Deferred Items — 2026-04-20

Items requiring more work, scheduled for Wednesday alongside Google News fallback pipeline.

## 1. UNEP — Custom parser fix

**Why deferred**: UNEP's RSS endpoint returns a custom XML schema (`<response><item><path>` instead of standard RSS `<channel><item><link>`). No date fields present. Existing parser can't handle it.

**What's needed**: Add a UNEP-specific parsing branch in `fetch-feeds` that:
- Matches `<item key="N">` elements (already works — uses `<item>` tag)
- Reads `<path>` instead of `<link>` for the URL
- Uses current timestamp as `published_at` (UNEP provides no dates)
- Reads `<title>` (already works)

**Estimated effort**: 15-line parser addition, ~30 minutes including testing.

**Feed URL**: `https://www.unep.org/news-and-stories/rss.xml`

## 2. EEA — Jina scraper for new site

**Why deferred**: EEA rebuilt their website and removed all RSS feeds. No `<link rel="alternate">` tags anywhere on the new site. The old `/highlights/RSS`, `/news/RSS`, and `/rss-feeds` paths all 404.

**What's needed**: Add EEA as a scraped source in `harvest-scraped-sources` using Jina to render `https://www.eea.europa.eu/en/newsroom`, then extract article links and titles with the existing regex + Jina pipeline.

**Estimated effort**: ~3 hours (new scraper config, link pattern regex, testing against live page, dedup logic).

**Alternative**: Skip EEA entirely — DG MARE (already added) covers EU ocean policy more directly, and EEA publishes infrequently on ocean topics specifically.

**Newsroom URL**: `https://www.eea.europa.eu/en/newsroom`
