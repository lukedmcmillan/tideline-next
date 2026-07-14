# TRACKER-PAGES-SPEC.md

## Tracker pages: board and detail views

*Created July 2026. Visuals governed by UI-SYSTEM.md; reference mockups are `public/demo/tideline-trackers.html` (board) and `public/demo/tideline-tracker-detail.html` (detail). If code and the mockups disagree, the mockups win on visuals; this file wins on data and logic.*

---

## Board view (`/platform/trackers`)

The board shows all 11 active tracker domains as summary tiles: score, band, 12-week history strip, state chip, and a "what changed" line when the domain moved. Visual specification is entirely in the mockup; do not redefine it here.

## Detail view (`/platform/tracker/[slug]`)

The detail view carries three additional modules beyond the score, history, and contributing-stories sections shown in the mockup:

### 1. On the table

A curated, per-session state of play for this governance domain. Content is hand-maintained by Luke (not generated). Structured as a short prose block with a last-updated date. Renders as an inset panel. Empty state: "No current session summary. Check back after the next formal meeting."

### 2. Primary documents

Library documents filtered to this tracker's domain (`tracker_tag`). Query: `documents WHERE tracker_tag = :slug ORDER BY created_at DESC LIMIT 10`. Renders as a compact document list with title, source organisation, and date. Links to `/platform/library` filtered view.

### 3. Most-active entities

Entities with the highest `mention_count` in stories tagged to this domain within the last 90 days. Query: join `entity_mentions` on `stories` WHERE `cross_tracker_flags @> ARRAY[:slug]`, group by entity, order by count DESC, limit 8. Renders as entity chips with mention count badges.
