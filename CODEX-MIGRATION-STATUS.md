# Codex migration status

Last verified: 15 July 2026

## Completed

- AGENTS.md created.
- TIDELINE_AI_EXECUTION_RULES.md created and made mandatory.
- Runtime product models are outside the Claude to Codex migration.
- Jina embeddings remain locked at 768 dimensions.
- Export grade table protections are mandatory.
- Claude specific commands are not valid Codex instructions.

## Still requiring verification

- Current repository build state.
- Production deployment state.
- Cron schedules and recent successful runs.
- Supabase schema and migration state.
- Stripe product, pricing and trial configuration.
- Resend delivery and webhook health.
- HNSW index status.
- Exposed database credential rotation and proof that the previous value is dead.

## Still requiring implementation or confirmation

- BUILD-STATE.md generated from repository and production evidence.
- Removal or archival of obsolete Claude instruction files.
- Divergence schema protections before the first production rows are written.
- stories detected_at and classifier version coverage.
- cron_runs heartbeat across every scheduled job.

## Completion condition

The migration is complete when a clean Codex session can identify:

- the current priority
- the governing specification
- the verified production state
- protected data and schema rules
- required tests and completion evidence

without relying on previous Claude conversations.