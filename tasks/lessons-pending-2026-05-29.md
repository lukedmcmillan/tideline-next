# Lessons to merge into lessons.md

Append this section after the 2026-05-20 entry. File was locked at save time.

---

## 2026-05-29 (Research RAG architecture, spec review, git discipline)

- **Audit before building.** When discovering existing implementations of a feature you're about to build, do a full audit BEFORE writing any new code. This session benefited from a prior audit that prevented a rewrite-from-scratch detour and revealed the correct production thresholds already in brief-reply.

- **Spec diffs miss vague numbers and production-tuned values.** Claude Code spec diffs are ~90% reliable but consistently produce two failures: vague numerical parameters ("apply a boost" instead of "multiply by 1.2") and wrong thresholds ("0.78" instead of production's 0.65). Always cross-check numbers in spec drafts against the actual calling code before approving. First question: "does this number exist in production code and is this its actual value?"

- **Sample the allowlist inputs before finalising classification backfills.** The quality of a domain/org allowlist determines whether Haiku gets called for the ambiguous tail or for the bulk. Run `SELECT source_organisation, count(*) ... LIMIT 50` before writing the allowlist — the diagnostic costs nothing and saves Haiku spend on every run.

- **Never use `git add -A` without reviewing `git status` first.** Working trees accumulate untracked files (logs, debug scripts, half-written experiments). `git add -A` sweeps all of them silently. The safer default is `git add <specific-files>`. Use `git rm path` or `git add -- path` for deletions. Especially dangerous in long sessions where subagents may have created files you don't know about.

- **Multi-surface features need a written architecture before any code.** "One engine, multiple surfaces" sounds obvious but the question of HTTP calls vs direct library imports vs copy-pasted logic determines maintainability for years. Write the surface contract (sourceSurface, primaryFilter defaults, projectContext shape) and the endpoint signature before touching implementation.

- **On a solo repo, soft reset + logical reconstruction + force-push-with-lease beats `git revert` for a recent bad commit.** Revert preserves history but requires re-adding all legitimate work in another commit. Reconstruction splits one chaotic commit into 5-6 reviewable commits. Safe only when: (a) solo on the repo, (b) bad commit is recent, (c) nobody else has pulled it.
