# CLAUDE-RULES.md

Rules for Claude Code when working on this codebase. These supplement CLAUDE.md.

## Section 1 — Database Safety

- Never run destructive DB commands without a WHERE clause (DELETE, UPDATE, DROP).
- Every migration file in `supabase/migrations/` must be manually applied via Supabase Studio and verified with a diagnostic query before being marked complete.
- Always use the service role key for scripts; never expose it in chat.

## Section 2 — Secrets and Environment

- Never hardcode API keys, tokens, or secrets in any file.
- Always use `.env.local` for secrets. `.mcp.json` is gitignored and safe for MCP tokens.
- Scripts use `npx @dotenvx/dotenvx run -f .env.local -- npx tsx scripts/...`

## Section 3 — Code Patterns

- Inline styles only in JSX — no Tailwind utility classes.
- Internal AI calls (ocean gate, scrapers, summaries, morning brief) use `claude-haiku-4-5` only. Never Opus or Sonnet for bulk processing.
- Prefer editing existing files over creating new ones.
- Check `package.json` before installing anything new.

## Section 4 — Denormalised Counter Integrity

Any write path that updates a denormalised counter (e.g. `entities.mention_count`) must:

1. Use `ignoreDuplicates: true` on the upsert and check that returned rows > 0 before incrementing.
2. Have an idempotency test that calls the write path **twice** with identical input and asserts the counter is incremented exactly **once**. First-call correctness is not sufficient.
3. Include a verification step that asserts `SUM(counter) = COUNT(source_table)` at the end of any bulk recalculation.

## Section 5 — Ad-Hoc Script Accumulation

- If you have already shipped **two or more** ad-hoc scripts for the same class of problem (e.g. `fix-entities.ts`, `cleanup-entities.ts`), the next iteration **must** be a structural fix — not another script.
- Structural fixes include: a pre-insert dedup helper, a review queue table, an idempotent migration, or a recurring cron. A third ad-hoc script is never the right answer.
- The `fix-X.ts` pattern is a signal, not a solution. Treat two such scripts as a trigger to design the structural fix.

## Section 6 — Entity Write Rules

- Never write directly to `entities`, `entity_mentions`, or `entity_aliases` without going through `findOrCreateEntity()` (lib/entity-matching.ts).
- The `entity_review_queue` table captures near-matches for human review. Do not suppress or ignore queue entries — they represent the known failure mode of the trigram matcher on short strings.
- `matchEntitiesToStory` is the only correct path for story→entity linking. `matchEntitiesBatch` is the only correct path for bulk backfill. Never use legacy `lib/entities.ts` (deleted 2026-04-29).
