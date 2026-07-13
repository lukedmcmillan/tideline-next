# RISK-SCREENER-SPEC.md

## Ocean Governance Risk Screener: output schema, buyer critique, and table protections

*Version 1.0, July 2026. Companion to DATA-LICENSING-DESIGN.md Section 5.*

---

### PRODUCTION MAPPING NOTE (added 2026-07-10, post-migration)

**P2 detected_at**: The screener spec requires `detected_at` on every evidence row and every classified story. In production, this maps to `stories.fetched_at`, which records UTC ingest time (distinct from `published_at`). Confirmed 2026-07-10: rows show `fetched_at` diverging from `published_at` by hours to years (future-dated stories from broken feeds show `published_at` in 2030/2035 with `fetched_at` in 2026). `fetched_at` has been populated since the stories table was created. No new column is needed; the export pipeline reads `fetched_at` as the point-in-time detection timestamp.

**P2 source_type**: Already exists on `stories` table (pre-existing column). No migration was needed.

**P5 cron_runs**: Already existed in production (created during pipeline hardening session). Schema: `id, cron_name, started_at, completed_at, status, items_processed, items_failed, error_summary, duration_ms`.

**P6 backfill**: All 346 existing `velocity_scores` rows backfilled to `methodology_version = 'v1.1'` (the only methodology version in force since scoring began).

**P7 entity_mentions.context**: Confirmed to store story titles, not verbatim article text. Safe for D12 (no third-party text in export).

---

*Full spec content follows (Parts 1-5 as provided). The spec is the single source of truth for the screener schema; this mapping note documents how production columns satisfy spec requirements without duplication.*
