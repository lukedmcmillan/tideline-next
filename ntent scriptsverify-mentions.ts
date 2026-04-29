[33mcommit c351d8cef013551394e03dbad0f059e48c337d69[m
Author: Luke McMillan <luke@thetideline.co>
Date:   Tue Apr 21 09:35:13 2026 +0100

    feat(entities): Week 2 Step 7 — wire matchEntitiesToStory into cron and backfill
    
    Replace legacy extractEntities (Claude-based entity discovery) with
    matchEntitiesToStory (seeded-entity matching via exact/fuzzy/semantic passes)
    in both the fetch-feeds cron and the admin backfill route.
    
    - fetch-feeds: awaits matchEntitiesToStory per story (only when short_summary
      set + !entities_extracted); returns entity_matching block in response JSON
    - backfill-entities: migrated to matchEntitiesBatch with short_summary guard;
      response now includes total_matches and avg_matches_per_story
    - lib/entity-matching.ts: new shared library (3-pass matcher + batch helper)
    - supabase/migrations: entity type taxonomy, substring match RPC,
      embedding match RPC (20260420–20260421)
    - scripts: seed-entities.csv, seed-loader, backfill, verify, fix/debug helpers
    - data/audits: tier1 second-pass and verification audit files
    - PROJECT_INDEX.md: updated to reflect current codebase state
    
    Co-Authored-By: claude-flow <ruv@ruv.net>

 PROJECT_INDEX.md                                   | 613 [32m+++++++++++[m[31m----------[m
 app/api/admin/backfill-entities/route.ts           |  35 [32m+[m[31m-[m
 app/api/cron/fetch-feeds/route.ts                  |  27 [32m+[m[31m-[m
 data/audits/tier1-second-pass.md                   | 131 [32m+++++[m
 data/audits/tier1-verification.md                  | 109 [32m++++[m
 lib/entity-matching.ts                             | 309 [32m+++++++++++[m
 scripts/backfill-entity-matching.ts                |  40 [32m++[m
 scripts/check-unmatched.ts                         |  32 [32m++[m
 scripts/cleanup-entities.ts                        |  53 [32m++[m
 scripts/debug-convergence.ts                       |  37 [32m++[m
 scripts/fix-convergence-alias.ts                   |  25 [32m+[m
 scripts/fix-convergence.ts                         |  46 [32m++[m
 scripts/fix-entities.ts                            |  37 [32m++[m
 scripts/seed-entities.csv                          | 497 [32m+++++++++++++++++[m
 scripts/seed-loader.ts                             | 479 [32m++++++++++++++++[m
 scripts/test-entity-matching.ts                    |  71 [32m+++[m
 scripts/test-rpc.ts                                |  17 [32m+[m
 scripts/verify-mentions.ts                         |  35 [32m++[m
 .../migrations/20260420_entity_type_taxonomy.sql   |  14 [32m+[m
 .../20260421_entity_substring_match_rpc.sql        |  81 [32m+++[m
 .../20260421_match_entity_embeddings_rpc.sql       |  20 [32m+[m
 21 files changed, 2385 insertions(+), 323 deletions(-)
