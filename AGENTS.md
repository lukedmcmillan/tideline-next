# AGENTS.md

## Repository Purpose

Tideline is an ocean governance intelligence platform built with Next.js App Router, React, TypeScript, Supabase/PostgreSQL with pgvector, and npm.

AGENTS.md governs the Codex workflow. Claude-specific command and session instructions are historical only and must not control Codex.

The Claude to Codex migration changes the development assistant only. It does not authorise changing Haiku, Jina, prompts, classifiers, scoring logic, or any other runtime product dependency.

A specification defines intended behaviour. It is never proof that code is built, deployed, configured, scheduled, or working in any environment.

`TIDELINE-MASTER.md` is the consolidated product authority and patches older specifications. Verify its build-state claims in the relevant environment. Use `tasks/lessons-MERGED.md` for relevant historical lessons.

## Safety And Approval

- Never read, display, paste, log, hardcode, or commit secrets or environment variable values.
- Never access production services or data unless Luke explicitly requests and approves it.
- Database migrations, production data writes, authentication, Stripe, Resend, cron schedules, ingestion, scrapers, and operations involving `stories`, `velocity_scores`, `divergences`, or `document_queue` require a written plan and Luke's explicit approval before execution.
- Do not commit, push, merge, deploy, rebase, reset, or switch branches unless Luke explicitly requests it.
- Run `git status` before editing. Inspect relevant diffs and never overwrite or revert unrelated work.
- Stage only reviewed, task-specific paths.
- Do not install or upgrade packages without Luke's explicit approval.

## Data Invariants

### Embeddings

The document corpus uses Jina `jina-embeddings-v2-base-en` with 768 dimensions. Never introduce another embedding model or vector dimension without an explicitly approved migration.

Before changing embedding code, inspect `PROJECT_INDEX.md`, migrations, vector columns, RPC signatures, and consumers. Verify compatibility at runtime, not only through PostgreSQL metadata.

### Historical Data

Historical export-grade tables are additive only. Never rewrite historical scores, classifications, divergence rows, or exported records. Corrections must use new rows, versioning, superseding records, or annotations while preserving the original record and provenance.

### Database Discipline

- Audit existing migrations and `app/lib/types/supabase.ts`; never assume a proposed table or column is absent.
- Every approved migration needs explicit post-condition verification.
- Never run destructive SQL without a reviewed, narrow predicate and recovery plan.
- Paginate full-table Supabase reads; client queries can silently cap rows.
- Check ownership before calling `SECURITY DEFINER` functions.
- Authenticated APIs must fail closed, without fallback user data or misleading empty results.

### Entity Integrity

- Do not write directly to `entities`, `entity_mentions`, or `entity_aliases`. Use `findOrCreateEntity()` and established matching paths.
- Use `matchEntitiesToStory` for story linking and `matchEntitiesBatch` for bulk backfills. Do not suppress `entity_review_queue` entries.
- Denormalised-counter writes must be idempotent. Test identical input twice and prove the counter changes once. Reconcile bulk recalculations against source rows.

## Engineering Rules

- Audit implementation, callers, schema, configuration, and relevant history before replacing code.
- Prefer existing helpers and patterns. Audit every reader and writer before consolidating parallel implementations.
- Cross-check thresholds and tuned values against code. Do not silently alter locked values.
- Make invalid outputs structurally impossible where practical. Use deterministic assembly and pre-send validation for trust-critical output.
- Schema-validate generated structured data before persistence. Do not use generated scalar scores as unverified load-bearing thresholds.
- Give every outbound network request an explicit timeout.
- Scrapers must respect robots.txt, provide a no-write dry-run, make scope explicit, and flag repeated zero-yield success.
- Professional citations require source name, source URL, and publication date.
- Keep user-facing "workspace" terminology distinct from the database's "project" terminology.

## Design And Copy

The Tideline design system and product copy are locked.

- Read `UI-SYSTEM.md` before visual work and `MESSAGING_HOUSE.md` before changing product copy.
- Use the applicable locked mockup under `public/demo/` as the visual reference.
- Keep the existing dark navy platform shell and use white for the main content area. Do not introduce blue accents, beige content backgrounds, or DM Mono.
- Use current design-system typography and tabular numerals for scores, dates, and counts.
- Do not invent tokens, copy, navigation, pricing, or visual conventions where a locked decision exists.
- Pricing is locked. Do not alter or revisit pricing unless Luke explicitly requests it.
- Use British English. Do not use em dashes in product copy.
- Do not call product automation "Tideline's agents". Use approved language from `MESSAGING_HOUSE.md`.
- If code, an older document, and the current visual specification disagree, stop and identify the conflict before implementation.

## Verification

Always distinguish:

- **Localhost:** local process, URL, configuration, and browser evidence.
- **Preview:** exact preview URL and commit, with preview runtime evidence.
- **Production:** exact production deployment and commit, verified by an approved real request, browser flow, logs, or database result.

Local tests and builds do not prove preview or production behaviour. Existing or deployed code does not prove that it runs correctly.

Never mark work complete without runtime evidence from the environment claimed. Exercise real UI interactions and inspect console and network activity. Make a real API request. For approved database work, show the verification query result. If runtime verification is unavailable, report the work as unverified.

## Repository Commands

Run only commands appropriate to the approved scope:

```text
npm run dev
npm run lint
npm run test:run
npm run build
npx tsc --noEmit
```

## Required Reading By Task

- **Database work:** Read `DATA-LICENSING-DESIGN.md`, `OPS-RUNBOOK.md`, the owning feature specification, relevant sections of `tasks/lessons-MERGED.md`, existing migrations, and `app/lib/types/supabase.ts`.
- **Divergence work:** Read `TIDELINE-MASTER.md` section 4.4 before `CONFLICTS-PAGE-SPEC.md`. The master file's patches take precedence.
- **Morning brief work:** Read `TIDELINE-MASTER.md` section 4.2 before `BRIEF-LEAD-SPEC.md`. The category classifier supersedes the old verb-allowlist gate.
- **Tracker page work:** Read `TRACKER-PAGES-SPEC.md`, `UI-SYSTEM.md`, and the applicable tracker mockup under `public/demo/`.
- **Ask Tideline work:** Read `TIDELINE-MASTER.md` section 4.5, `RESEARCH-RAG-SPEC.md`, and `ASK-TIDELINE-BUILD-GUIDE.md`. Preserve the Jina 768-dimension invariant.
- **Homepage and visual work:** Read `MESSAGING_HOUSE.md`, `UI-SYSTEM.md`, and the applicable locked mockups under `public/demo/`.

If a required specification is missing or contradicts a locked decision, stop and ask Luke rather than reconstructing intended behaviour.
