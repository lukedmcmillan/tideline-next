# Tideline Build State

## Verification metadata

- **Repository path:** `C:\Users\luke.mcmillan\tideline-next`
- **Branch:** `codex-migration`
- **Branch-relative evidence boundary:** All repository findings are branch-relative to `codex-migration`. The branch and commit deployed to production remain `UNKNOWN`.
- **Baseline commit:** `8a800199d8ff8c410d2194fd2cde5e48595a2dba`
- **Verification date:** 17 July 2026
- **Environment covered:** Local repository inspection only. No localhost process, preview, staging or production environment was inspected.
- **Production status:** `UNKNOWN` for every subsystem.
- **Tests executed:** None.
- **Builds executed:** None.
- **External systems accessed:** None.
- **Unrelated untracked work:** `Design/BRIEF-V2-SPEC.txt` and `Design/tideline-homepage.html`; neither was opened or modified.
- **Freshness rule:** Any later implementation, migration, configuration, governing-document or deployment change invalidates the affected claim until it is re-audited in the relevant environment.

Evidence lineage: the detailed implementation audit was conducted at `ff312e59749c5e17648d08f7da15b33ae61afec8`; subsequent tracked changes through the current baseline, `8a800199d8ff8c410d2194fd2cde5e48595a2dba`, concerned governing documentation and approved visual references rather than application implementation.

## Evidence standard

- Repository code proves only that an implementation exists at the audited commit.
- Specifications define intended behaviour; they do not prove implementation or runtime state.
- Migration files prove that SQL exists, not that it was applied.
- Configuration proves declared settings, not deployment, execution or success.
- Tests count only when their command, working tree, environment, output and exit code are recorded.
- Localhost, preview and production evidence are distinct and cannot substitute for one another.
- Production remains `UNKNOWN` without direct evidence from the exact production deployment and supporting systems.
- Historical scores, classifications, divergences and export-grade rows are additive history and must not be silently rewritten.

## Status summary

| Subsystem | Repository status | What repository evidence proves | What remains unverified | Next verification |
|---|---|---|---|---|
| Auth and subscriptions | `CONTRADICTED` | Auth, route protection and subscription checks exist. Repository implementation and current approved copy use a seven-day Individual trial, while `TIDELINE-MASTER.md` records fourteen days; a separate founding reservation hold also lasts seven days, and a legacy subscription path remains. | Production: `UNKNOWN`. The canonical Individual trial duration requires Luke's approval; provider configuration, ownership, fail-closed behaviour, price identity, checkout and webhook transitions are unverified. No Stripe or production change is authorised by this documentation edit. | Confirm the canonical Individual trial duration, then separately inventory and retire or reconcile legacy subscription and pricing paths through a controlled plan. |
| Platform shell | `PARTIALLY BUILT` | The authenticated shell, navigation and platform route structure exist. `UI-SYSTEM.md` and the committed approved July 2026 suite are the current visual authority; targeted DM Mono drift remains in the Research page implementation. | Production: `UNKNOWN`. Route protection, rendering, interactions, responsive states, truthful liveness and full visual alignment are unverified. | Run authenticated browser, console, network and side-by-side visual checks against the exact deployed commit. |
| Workspace | `PARTIALLY BUILT` | Workspace and project pages, APIs, drafting, export and project-entity associations exist in the repository. | Production: `UNKNOWN`. Ownership, isolation, persistence, exports and coherence between legacy project fields and entity-aware associations are unverified. | Test two-user permissions and end-to-end persistence, then reconcile every project reader and writer. |
| Ingestion and classification | `PARTIALLY BUILT` | RSS, scraper harvesting, summarisation, source monitoring and category-classifier paths exist; brief selection uses category eligibility rather than the superseded verb allowlist. | Production: `UNKNOWN`. Source reachability, robots compliance, timeouts, deduplication, queue progress, classifier versions, output quality, coverage and schedules are unverified. | Use approved no-write source checks, versioned classifier samples, cron heartbeats and resulting-row post-conditions. |
| Pulse and alerts | `CONTRADICTED` | `PULSE_SCORE_METHODOLOGY.md` identifies itself as v2.0, supersedes v1.1 wholesale and defines `Base Score = Volume Trend × 0.40 + Recency × 0.35 + Decision Signals × 0.25`, followed by `Adjusted Score = Base Score × Institutional Risk Multiplier`; `app/lib/velocity.ts` implements that calculation. The scorer does not write `methodology_version`, while a tracked migration adds it and assigns `v1.1` to null values. | Production: `UNKNOWN`. `TIDELINE-MASTER.md` records 35/30/20/15, conflicting with the v2.0 methodology and active scorer's 40/35/25 followed by a multiplier, and with the migration's proposed `v1.1` label for unversioned rows. Repository evidence does not prove the migration was applied or which formula generated existing production rows. | Freeze score, threshold and historical-row changes until Luke approves the canonical methodology version and production evidence establishes how existing rows were generated and labelled. |
| Morning brief | `PARTIALLY BUILT` | Category-gated selection, deterministic and generated sections, conflict presentation, send logging, Resend calls and weekday schedule declarations exist. The schema includes a Resend message identifier field, but repository inspection did not find the current send path populating it. No open-event ingestion or open-rate reporting implementation was found. | Production: `UNKNOWN`. Migrations, candidate selection, equality checks, personalisation, deduplication, sends, rendering and provider events are unverified. | Verify both variants with controlled data, mismatch omission, seed-inbox rendering and send-row evidence; specify open-rate instrumentation separately. |
| Entities | `CONFIRMED REPOSITORY` | Established helpers exist for entity creation, story linking, batch matching, aliases and review-queue handling, with migrations, pages and an idempotency test definition. | Production: `UNKNOWN`. Schema state, matching quality, review operations, permissions, identifiers, succession and runtime idempotency are unverified. | Run approved schema checks, representative match review and identical-input-twice counter reconciliation. |
| Trackers | `CONTRADICTED` | Board, detail, API, metadata and migration implementations exist. Repository coverage is split across several lists: the scoring map contains 11 slugs, the velocity/API allowlist contains 10, the alert-subscription allowlist contains 6, and the threshold-alert delivery map contains the same 10 slugs as the velocity allowlist. Separately, moved-state code computes a count while structurally suppressing moved cards. | Production: `UNKNOWN`. The repository does not establish whether the list differences are deliberate or whether all four lists represent the same product contract. Score accuracy, moved rendering, source coverage, evidence links and visual alignment are also unverified. | Produce a read-only mapping of scoring, API eligibility, subscription eligibility and delivery coverage before any consolidation; keep moved-card remediation separate. |
| Documents and embeddings | `CONTRADICTED` | Document intake, review, chunking, classification and embedding paths exist. Jina `jina-embeddings-v2-base-en` and the fixed 768-dimensional contract are present. Repository migrations define IVFFlat, while the master names HNSW as a prerequisite. | Production: `UNKNOWN`. Whether the applied production vector index achieves approved recall, latency, permission filtering and four-case Ask Tideline behaviour on the real corpus is unresolved; migration state, corpus coverage, dimensions, RPC compatibility, backlog and schedules are also unverified. | Preserve Jina and the fixed 768-dimensional contract; establish the applied index and benchmark the approved outcomes in production before deciding whether an index change is required. |
| Ask Tideline | `CONTRADICTED` | Retrieval, synthesis, citation checks, faithfulness code, multiple API routes and a Research page exist. Active paths can skip or survive failure of the canonical faithfulness gate. | Production: `UNKNOWN`. One faithfulness policy, caller consolidation, abstention, permissions, logging, citations, four-case behaviour, latency and limits are unverified. | Luke must approve one reliability contract before caller reconciliation and four-case runtime verification. |
| Divergence | `CONTRADICTED` | Schema fragments and consumer-side brief handling exist. No complete tracked producer, detection cron, API set or unified lifecycle implementation was found in the audit. | Production: `UNKNOWN`. Applied schema, producer behaviour, structured validation, scoring, deduplication, transitions, resolution semantics, continuity and history preservation are unverified. | Approve one additive lifecycle and producer contract before any writes, then verify controlled cases and post-conditions independently. |
| Project watcher and bulk imports | `PARTIALLY BUILT` | A scheduled project-population path writes from legacy topic tags while a separate entity-aware model exists. FAOLEX and other bulk-import tooling include dry-run and deduplication support. | Production: `UNKNOWN`. Population contract, ownership, idempotency, canonical import input, licensing, counts, progress, errors and schedules are unverified. | Reconcile the project model, then approve no-write population and import audits before any controlled writes. |
| Risk and licensing | `PARTIALLY BUILT` | Additive licensing scaffolding and LP briefing API and PDF paths exist. No complete screener score, evidence, deterministic OGX or licensed export pipeline was found. | Production: `UNKNOWN`. Schema state, permissions, PDF accuracy, coverage semantics, identifiers, succession, reproducibility, raw-text exclusion and export controls are unverified. | Review schema and licensing first, then verify a deterministic fixture, evidence reconciliation and null-versus-zero behaviour. |
| Crons and operations | `PARTIALLY BUILT` | Schedule declarations and two logging-table definitions exist, but heartbeat writing is implemented for only part of the declared job inventory. | Production: `UNKNOWN`. Deployed schedules, start and finish records, results, errors, retries, timeouts, continuity, backups and restores are unverified. | Inspect the exact deployed schedule and require one recent complete heartbeat plus outcome evidence per job; demonstrate backup restoration separately. |
| Testing and deployment | `PARTIALLY BUILT` | Vitest configuration, two identified automated test files, diagnostic scripts, Vercel configuration and GitHub workflows exist. Automated verification is narrow relative to protected subsystems. | Production: `UNKNOWN`. No test, lint, type-check, build, browser, API, deployment, rollback or runtime result was executed or observed for this audit. | Approve a scoped verification matrix for the exact commit and environment, then collect command, browser, API, deployment and rollback evidence. |

## Confirmed repository contradictions

### 1. Ask Tideline faithfulness contract

- **Conflict:** The canonical Research specification requires a retry then HTTP 503, while active repository paths can skip faithfulness or return an answer after the faithfulness check fails.
- **Current authority or unresolved authority:** `RESEARCH-RAG-SPEC.md` is the canonical engineering authority, but implementation does not conform.
- **Luke decision required:** Choose fail-closed synchronous verification, delayed verification or another explicit reliability contract.
- **Safe next action:** Freeze caller migration and document the chosen contract before a scoped implementation and four-case verification plan.

### 2. Pulse Score formula

- **Conflict:** `TIDELINE-MASTER.md` records 35/30/20/15; the v2.0 methodology and active scorer use 40/35/25 followed by a multiplier; and `supabase/migrations/20260710_risk_screener_p1_p7.sql` proposes a `v1.1` label for unversioned rows.
- **Current authority or unresolved authority:** `PULSE_SCORE_METHODOLOGY.md` identifies itself as v2.0, says it supersedes v1.1 wholesale and defines `Base Score = Volume Trend × 0.40 + Recency × 0.35 + Decision Signals × 0.25` and `Adjusted Score = Base Score × Institutional Risk Multiplier`. `app/lib/velocity.ts` implements the same calculation but does not write `methodology_version`. The migration adds that field and assigns `v1.1` to null values. Repository evidence does not prove that the migration was applied or which formula generated existing production rows.
- **Luke decision required:** Approve the canonical methodology version and its effective date.
- **Safe next action:** Freeze score, threshold and historical-row changes until Luke approves the canonical methodology version and production evidence establishes how existing rows were generated and labelled.

### 3. Trial duration and legacy pricing

- **Conflict:** The scoped repository search found seven-day subscription trials in active Stripe Checkout, the legacy subscription path, webhook trial-date creation, subscription fallback logic, conversion triggers, active pricing and trial copy, `MESSAGING_HOUSE.md`, and the approved homepage reference. A separate founding reservation hold also lasts seven days. `TIDELINE-MASTER.md` records a 14-day Individual trial.
- **Current authority or unresolved authority:** Repository implementation and current approved copy use seven days, while the master records fourteen days. The canonical product decision still requires Luke's approval, and no Stripe or production change is authorised by this documentation edit.
- **Luke decision required:** Confirm the canonical Individual trial duration and the treatment of legacy subscription and pricing paths.
- **Safe next action:** Confirm the canonical Individual trial duration, then separately inventory and retire or reconcile legacy subscription and pricing paths through a controlled plan.

### 4. HNSW and four-case verification gate

- **Conflict:** Repository migrations define IVFFlat, while the master names HNSW as a prerequisite. The unresolved requirement is whether the applied production vector index achieves approved recall, latency, permission filtering and four-case Ask Tideline behaviour on the real corpus.
- **Current authority or unresolved authority:** Jina `jina-embeddings-v2-base-en` and the fixed 768-dimensional contract remain unchanged. Repository evidence does not establish which index is applied in production or that IVFFlat or HNSW necessarily meets the required outcomes.
- **Luke decision required:** Approve the production evidence and outcome criteria that govern any vector-index decision.
- **Safe next action:** Do not alter embeddings or indexes; establish the applied production index and verify the approved outcomes on the real corpus before proposing any change.

### 5. Tracker inventory, alert coverage and moved section

- **Conflict:** Repository coverage is split across several lists: the scoring map contains 11 slugs, the velocity/API allowlist contains 10, the alert-subscription allowlist contains 6, and the threshold-alert delivery map contains the same 10 slugs as the velocity allowlist. `blue-carbon-credits` is present in the scoring map but absent from the velocity allowlist and threshold-alert delivery map. `governance` is present in the alert-subscription allowlist but absent from the velocity allowlist. Five velocity slugs are absent from subscription eligibility: `plastics`, `imo-shipping`, `wto-fisheries`, `offshore-wind`, and `cites-marine`.
- **Current authority or unresolved authority:** The repository does not establish whether these differences are deliberate or whether all four lists represent the same product contract. Separately, moved cards are structurally filtered out despite a moved count.
- **Luke decision required:** Approve the canonical relationship among scoring, API eligibility, subscription eligibility and delivery coverage, and separately confirm intended moved-section behaviour.
- **Safe next action:** Produce a read-only mapping of scoring, API eligibility, subscription eligibility and delivery coverage before any consolidation; keep moved-card remediation separate.

### 6. Divergence lifecycle and missing producer

- **Conflict:** Governing files use competing resolution and provenance fields, while repository evidence lacks the complete producer and state-transition path.
- **Current authority or unresolved authority:** The master patches `CONFLICTS-PAGE-SPEC.md`, but brief and risk specifications add incompatible lifecycle requirements that still need one contract.
- **Luke decision required:** Approve the schema, producer, transition rules and historical-preservation policy before row one is written.
- **Safe next action:** Draft one additive contract and independent verification matrix; do not migrate or write data.

### 7. Entity-aware workspace versus legacy project population

- **Conflict:** The watcher reads legacy `topic_tags` while project-entity associations provide a separate entity-aware model.
- **Current authority or unresolved authority:** The master requires reconciliation, but no single repository population contract governs every reader and writer.
- **Luke decision required:** Choose the authoritative population model and compatibility treatment for existing projects.
- **Safe next action:** Audit readers, writers, ownership and idempotency, then propose a no-write transition plan.

### 8. Unsupported shipped or live claims

- **Conflict:** Governing and feature documents describe subsystems, counts, migrations and schedules as shipped, live or applied without evidence from the exact production environment in this audit.
- **Current authority or unresolved authority:** Production evidence outranks repository code and documentation; production remains `UNKNOWN`.
- **Luke decision required:** Approve targeted production verification or removal and qualification of unsupported claims.
- **Safe next action:** Treat all such wording as unverified and gather exact deployment, provider, database and runtime evidence before restating it.

### 9. Stale visual-authority references

- **Conflict:** Older governing text still points to retired palettes, DM Mono, old mockups or `public/demo/` as primary authority.
- **Current authority or unresolved authority:** `UI-SYSTEM.md` and the committed approved July 2026 suite under `Design/approved-2026-07/` are the current visual authority.
- **Luke decision required:** Approve a separate documentation cleanup for stale references outside this build-state correction.
- **Safe next action:** Apply the current authority to future visual work and flag conflicts rather than silently reconciling older files.

## Current blockers

### Documentation blockers

- Ask faithfulness, Pulse formula, trial duration, tracker inventory and divergence lifecycle require explicit decisions.
- Stale visual references and unsupported live or shipped wording remain outside this file.

### Repository implementation blockers

- The active scorer does not persist `methodology_version`, and a tracked migration proposes labelling null historical rows as `v1.1` despite the repository methodology identifying v2.0 as current.
- Pulse changes and historical recalculation remain frozen pending a versioned decision and production evidence.
- Ask Tideline's Research path skips the mandatory faithfulness check, and the shared engine can return an answer after faithfulness verification fails.
- Divergence lacks a complete producer and lifecycle implementation.
- Project population is not reconciled with entity-aware associations.
- Tracker moved cards are suppressed as a separate defect, and scoring, API, subscription and delivery coverage are not reconciled.
- Cron heartbeats do not cover every declared job.
- Open-rate event ingestion and reporting are not built.
- Risk screener and licensed export delivery remain scaffolding.
- Automated verification remains narrow.

### Production evidence blockers

- No production deployment, browser, API, database, cron, provider, email, payment, backup or restore evidence was collected.
- The exact production deployment commit and runtime state are unverified.
- Production status remains `UNKNOWN` for every subsystem.

## Safe work allowed

- Read-only repository inspection and evidence-grounded documentation correction.
- Scoped diff review and non-mutating local checks.
- Separately approved isolated UI, pure-function, type, lint or test work within locked decisions.
- Preparation of plans and verification matrices that do not access external systems or alter protected data.

## Controlled work requiring approval

- Database migrations, data writes, backfills or historical corrections.
- Authentication, permissions, Stripe, Resend, billing or secrets.
- Cron, ingestion, scraper, provider or bulk-import execution.
- Embeddings, vector dimensions, RPCs or index changes.
- Classification, Pulse, divergence, threshold or scoring changes.
- Entity, project-population or export-grade data changes.
- Risk exports, licensing changes, packages, deployments or external-system access.
- Commits, pushes, merges, rebases, resets or branch changes.

## Production evidence required

- Exact deployed commit, production URL and approved environment identity.
- Authenticated browser interactions with console and network evidence.
- Valid, invalid and unauthorised API requests with responses.
- Approved schema and row post-condition queries from the exact database.
- Cron start, finish, rows affected, error and resulting-output evidence for every job.
- Stripe and Resend provider events plus received payment and email outcomes where applicable.
- Ask four-case behaviour under the approved faithfulness contract and Jina 768-dimensional corpus path.
- Pulse recalculation from stored components under an approved methodology version.
- Divergence producer and lifecycle evidence with no silent historical rewrite.
- Backup configuration and a demonstrated restore with reconciliation.

## Freshness and update rule

- Record the evidence source, date, commit and environment for every update.
- Re-audit affected rows after implementation, migration, configuration, authority or deployment changes.
- Preserve prior evidence points; supersede conclusions explicitly rather than silently rewriting history.
- Never promote repository evidence to localhost, preview or production status.
- Production remains `UNKNOWN` until direct evidence from the exact production environment is recorded.
