# Tideline — Live Project Status

## Last session: 2026-07-10 — Full project audit, Ask engine unification, auth fixes, pipeline recovery

WHAT SHIPPED (2026-07-02 to 2026-07-10, multi-day session):

### Security
- **RLS lockdown**: Enabled Row Level Security on all 65 base tables (lp_briefing excluded, view). Zero code impact — all createClient calls use service role key. Migration: `20260703_enable_rls_all.sql`
- **Treaty-change webhook auth**: Added Bearer CRON_SECRET check. Updated pg_net trigger function to include Authorization header. Commit `eb9e76d`.
- **Auth fallbacks confirmed clean**: Security audit found getEmailFromSession() returns null correctly, no hardcoded email fallbacks remain.

### Ask Tideline (formerly Research)
- **Unified ask engine**: `app/lib/ask-engine.ts` — extracted from workspace/ask (the working engine). Both surfaces now call `askTideline()`. Includes: multi-strategy embedding, dual-corpus search, keyword re-scoring, keyword guard, citation verification (deterministic), faithfulness check (Haiku, optional).
- **Keyword guard**: `abstentionGate()` now checks if retrieved chunks contain any query keyword. Catches wrong-subject retrieval (BBNJ returning MARPOL).
- **sourceTiers default**: Changed from PRIMARY-only to PRIMARY+SECONDARY. SECONDARY is 2.2% of corpus (171 docs) but contains high-quality NGO analysis.
- **Live research console**: `research/page.tsx` rewired from hardcoded mock to real API. Markdown rendering, pipeline stage indicator, four honesty states. Renamed "Research" to "Ask Tideline" in sidebar + page.
- **Speed optimisation**: Reduced embedding strategies from 3-5 to 2. Faithfulness check skipped on research surface (citation verification still runs). Documented as deliberate decision with Phase 2 async approach.
- **RESEARCH-RAG-SPEC.md v1.1**: Updated standalone_research default from primary-only to all.

### Auth & Onboarding
- **JWT TTL refresh**: 30-min TTL on token claims. Single indexed lookup by email. Catches subscription_status, tier, role, onboarded_at changes.
- **Post-payment instant refresh**: SessionProvider added to /subscribe layout. useSession().update() forces JWT refresh after Stripe checkout.
- **Onboarding loading gate**: Form never renders for already-onboarded users. API error → redirect to /platform (prevents spurious re-onboard that would overwrite preferences).
- **Post-login landing unified**: All three post-auth paths (Google, magic-link, onboarding bounce) now land on /platform (dashboard).
- **onboarded_at === null**: Added to shouldRefresh condition in JWT callback.

### Pipeline Recovery
- **Summarise-pending diagnosis**: 2,842 unsummarised stories (April-July 2026). Root cause: two WHOI poison stories with future dates (2030, 2035) + Vercel Hobby 60s timeout. Every downstream system blocked (tracker tags, category classifier, entity matching, velocity scores, brief leads).
- **Poison rows quarantined**: Two future-dated WHOI stories flagged.
- **Ingest date guard**: `fetch-feeds/route.ts` now rejects stories with published_at > now()+48h or < now()-5y.
- **Cron hardened**: Batch reduced 50→15 (fits 60s). Excludes quarantined + permanently failed stories. Writes summarise_status/failure_count. Heartbeat via cron_runs table.
- **Backfill script**: `scripts/backfill-summarise.ts` — standalone, no timeout, identical output to cron. Running overnight to clear 2,842 backlog. Rate: ~2 stories/min.
- **Score annotations**: All 11 trackers annotated for June 1 - July 8 ingestion incident.

### Data Quality
- **Stories quarantine**: 16 pre-gate non-ocean stories flagged (tirzepatide, Bloom's Taxonomy, etc.). From PLOS ONE Marine, Bloomberg Green before April 22 removal.
- **Entity quarantine infrastructure**: quarantined_at + quarantine_reason columns on entities table.
- **Entity merge infrastructure**: entity_merges audit table, entities.status column (active/merged/quarantined). Alias transfer in merge pattern.
- **Entity precision audit**: ~150 junk entities identified (medical terms, non-ocean content). ~20 countries mistyped as "organisation". TMC duplicate confirmed (timing issue, not matcher bug).
- **Mock data audit**: Only research page was mocked (now live). All other 25+ surfaces confirmed LIVE.
- **Feature vs persona gap analysis**: Platform strongest as monitoring tool, weakest as workflow tool. Three personas mapped (ESG analyst, lawyer, compliance officer).

### Migrations Applied
- `20260703_enable_rls_all.sql` — RLS on all 65 tables
- `20260708_stories_quarantine_flag.sql` — stories quarantine columns + 16 rows flagged
- `20260708_entities_quarantine_flag.sql` — entities quarantine columns
- `20260708_entity_merges.sql` — merge audit table + entities.status
- `20260708_summarise_pipeline_fixes.sql` — summarise_status/failure_count, score_annotations, cron_runs

### Schema Changes
- `stories`: +quarantined_at, +quarantine_reason, +summarise_status, +failure_count, +last_failure_reason
- `entities`: +quarantined_at, +quarantine_reason, +status
- New tables: entity_merges, score_annotations, cron_runs

KNOWN ISSUES (carry forward):
- **Vercel Hobby 60s limit**: Binding constraint on cron throughput. Pro upgrade (300s) would give 5x headroom.
- **Entity registry**: ~150 junk entities need quarantine flags (after review). ~20 countries need reclassification to STATE type. TMC duplicate needs merge (test case for merge pattern).
- **HNSW index not built**: document_chunks vector index still missing. Biggest remaining speed gain for Ask.
- **Phys.org Ocean feed**: Still active, RSS not ocean-filtered (/earth-news/). Gate catches non-ocean content but wastes quota.
- **summarise-pending backfill running**: ~2,842 stories processing overnight. Check completion with `SELECT summarise_status, COUNT(*) FROM stories GROUP BY 1`.
- **Stage 2 headline generation FROZEN**: pending 30-day category backtest.
- `app/api/reserve/route.ts` — missing resend import, build error (unrelated).
- **Brief synthesis line NOT BUILT**: STALLED/QUIET/OUTSIDE/BLINDSPOT templates from BRIEF-LEAD-SPEC.md not implemented.
- **Gate 2 ranking**: Ranks by significance_score, not edge/ubiquity as spec requires.

NEXT SESSION PRIORITIES:
1. Verify backfill completion — check summarise_status counts, confirm velocity_scores recover
2. Build HNSW index on document_chunks (SQL Editor, non-concurrent)
3. Entity quarantine flags — apply after review CSV adjudication
4. TMC merge — test case for merge pattern
5. Entity recall script — find missing entities from corpus
6. Landing page fixes (deferred from this session)

---
