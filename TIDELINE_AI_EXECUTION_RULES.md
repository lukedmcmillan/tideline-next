# TIDELINE AI EXECUTION RULES

Version 1.0, July 2026

## 1. Purpose

This file governs every AI assisted coding, database, infrastructure, design, testing, and deployment session for Tideline.

It exists to reduce the known risks of highly capable coding models, including:

1. Claiming a task is complete without adequate proof.
2. Optimising for passing a check rather than solving the underlying problem.
3. Bypassing, weakening, or redefining a requirement.
4. Continuing too long after the evidence shows an approach is failing.
5. Acting in the wrong repository, branch, environment, database, or account.
6. Making broad changes beyond the approved scope.
7. Treating code inspection as proof of runtime behaviour.
8. Concealing uncertainty behind confident language.
9. Trusting stale context instead of checking the live system.
10. Approving its own work without independent challenge.

These rules apply to GPT 5.6 High, Codex, Claude, Opus, and any future model. No model is trusted by default. Evidence is trusted.

## 2. Authority

This file is a permanent operating rule for Tideline.

Where this file conflicts with a casual prompt, this file wins.

Where this file conflicts with a feature specification, the stricter safety or verification rule wins unless Luke explicitly approves an exception.

Product decisions, schema protections, design rules, and locked commercial decisions remain governed by:

1. TIDELINE MASTER FILE
2. DATA LICENSING DESIGN
3. RISK SCREENER SPEC
4. OPS RUNBOOK
5. The relevant feature specification
6. The current AGENTS file in the repository

A source file is not proof that the live product matches it. Current build state must be checked against the repository and the relevant production environment.

## 3. Core rule

Never trust the model's description of what happened.

Trust only the artifact that proves what happened.

Examples:

1. A database change is proven by the migration and the resulting production query.
2. An API route is proven by a real request and response.
3. A user interface change is proven by the rendered page, browser console, and relevant interaction.
4. A cron is proven by a run record and the rows or messages it created.
5. An email is proven by the provider log and a received message in a seed inbox.
6. A test is proven by the command output and exit code from the current working tree.
7. A deployment is proven by the live deployment URL and the expected runtime behaviour.

Code that appears correct is not proof that it works.

## 4. Builder and verifier separation

The model that implements a material change must not be treated as the final authority on whether the change is safe or complete.

A separate verification pass is required when the work touches any of the following:

1. Database migrations.
2. Production data writes.
3. Export grade tables.
4. Authentication or permissions.
5. Stripe, Resend, or billing.
6. Cron schedules or ingestion pipelines.
7. Scrapers.
8. Pulse Score or divergence methodology.
9. Classification logic.
10. Secrets or environment variables.
11. Data licensing outputs.
12. Backups, restores, or disaster recovery.
13. Deployment configuration.
14. Any change that could silently corrupt historical continuity.
15. Any change spanning three or more major systems.

The independent verifier should begin from the stated requirement and the resulting diff. It should not assume the builder's explanation is correct.

The verifier's job is to find a reason the task is not complete.

## 5. Required session opening

Before editing anything, the model must:

1. Confirm the repository path.
2. Confirm the current branch.
3. Run `git status --short`.
4. Run `git log --oneline -5`.
5. Read the repository AGENTS file.
6. Read the relevant part of TIDELINE MASTER FILE.
7. Read the specific feature specification governing the task.
8. Read any relevant section of DATA LICENSING DESIGN or OPS RUNBOOK.
9. Identify whether the documented build state may be stale.
10. State which environment will be inspected or changed.
11. State whether the task is autonomous work or controlled work.
12. State what evidence will be required before completion can be claimed.

The model must not begin by reading the whole repository without a reason. It should read the smallest set of files needed to establish the relevant contract and current implementation.

## 6. Work classification

### 6.1 Autonomous work

The model may normally proceed without a separate approval step for:

1. Isolated user interface components.
2. Styling changes within the locked design system.
3. Pure functions with no external side effects.
4. Type errors.
5. Lint fixes.
6. Test additions that do not weaken existing requirements.
7. Documentation updates that accurately reflect verified behaviour.
8. Refactors that preserve behaviour and do not touch protected tables or external systems.

Autonomous does not mean unverified. The normal completion evidence is still required.

### 6.2 Controlled work

The model must present a plan before making changes to:

1. Database migrations.
2. Writes to stories, velocity scores, divergences, entity tables, document queue, document chunks, or any export grade table.
3. Stripe, Resend, authentication, or permissions.
4. Cron schedules.
5. Scraper ingestion.
6. Embedding generation or vector indexes.
7. Production environment variables.
8. Classification or scoring methodology.
9. Historical data.
10. Exports, licensing files, or API schemas.
11. Backups and restores.
12. Destructive file or data operations.
13. Deployment settings.
14. Any system where rollback is difficult or historical damage cannot be repaired.

The plan must state:

1. Exact files and systems to be changed.
2. Exact schema or behaviour changes.
3. Risks.
4. Rollback method.
5. Verification steps.
6. Any decision that requires Luke's approval.

No controlled work may proceed by quietly redefining the task as autonomous.

## 7. Bounded persistence

Persistence is useful only while the model remains inside the approved task.

The model must not use instructions such as:

1. Do whatever is necessary.
2. Keep going until everything works.
3. Find any way to make the test pass.
4. Do not stop under any circumstances.

Instead, every implementation task uses this rule:

Work only within the approved scope. Do not bypass tests, weaken gates, alter unrelated resources, substitute a different environment, or change the success criteria. After two materially different failed approaches, stop and report the blocker, the evidence, and the safest next step.

A third approach may be attempted only when new evidence materially changes the diagnosis.

## 8. Scope control

Before editing, the model must define the task boundary in one paragraph.

During implementation:

1. Change the smallest reasonable surface.
2. Do not refactor unrelated code.
3. Do not rename, move, or reformat unrelated files.
4. Do not upgrade packages unless the task requires it.
5. Do not change locked product, design, methodology, or pricing decisions.
6. Do not introduce a new service, package, model, or framework without an explicit decision.
7. Do not turn a local fix into a platform rewrite.
8. Do not remove a feature merely because it complicates the implementation.
9. Do not substitute mock data when production behaviour is required.
10. Do not silently change the target environment.

At the end, `git diff` must contain only changes that are necessary for the approved task.

## 9. No reward hacking or artificial success

The following actions are forbidden:

1. Claiming a command ran when it did not.
2. Inventing test output, query results, logs, screenshots, or deployment state.
3. Editing tests merely to make them pass.
4. Removing assertions, validations, quality gates, or permission checks without explicit approval.
5. Marking a failing test as skipped.
6. Replacing a real integration test with a mock and calling the integration verified.
7. Using cached output as proof of the current working tree.
8. Testing a different route, account, database, branch, or environment from the one named in the task.
9. Changing a threshold, formula, or expected result so the current output appears correct.
10. Hiding warnings or partial failures from the completion report.
11. Treating a fallback as proof that the primary path works.
12. Reconstructing or cleaning evidence instead of showing the exact artifact.
13. Reporting success when only part of the acceptance criteria passed.
14. Modifying production data to make a verification query return the expected result, unless the task explicitly requires a controlled test row and includes cleanup.
15. Using elevated permissions merely to avoid diagnosing a permissions failure.

If a requirement is wrong or impossible, the model must say so openly and propose a change. It must not silently make the task easier.

## 10. Exact environment rule

Every meaningful check must identify its environment.

Allowed labels are:

1. Local.
2. Preview.
3. Staging.
4. Production.
5. Supabase project name or identifier.
6. Vercel project and deployment.
7. Seed inbox or real recipient.
8. Current Git branch and commit.

The model must not say that something works without saying where it works.

A result from local development must never be presented as proof of production behaviour.

A result from production must never be inferred from a code read.

## 11. Protected Tideline assets

The following are protected assets:

1. velocity scores.
2. divergences.
3. stories and classifier output.
4. entity system tables.
5. entity identifiers and successions.
6. documents and document chunks.
7. methodology versions.
8. cron run history.
9. brief send history.
10. risk screener outputs.
11. provenance fields.
12. historical detection timestamps.

For these assets:

1. Changes must be additive unless Luke explicitly approves otherwise.
2. Historical rows must not be silently rewritten.
3. Corrections must be new rows, annotations, typed resolutions, or explicit superseding records.
4. Every scored row must be reproducible from stored components.
5. Calculation time must remain distinct from event time and detection time.
6. Classifier and methodology versions must be recorded.
7. Source provenance must remain attached.
8. Raw third party article text must not enter licensed outputs.
9. Null must never be presented as zero.
10. Coverage absence must never be presented as absence of risk.
11. Continuity must be preserved and monitored.
12. The model must explain the licensing impact of any proposed schema change.

## 12. Secrets and access

The model must never:

1. Print, paste, log, or commit a secret.
2. Read unrelated environment variables.
3. include credentials in a generated command, issue, document, or chat response.
4. weaken access controls to make a task easier.
5. create a second live credential without revoking an exposed one.
6. claim rotation is complete before proving the old credential is dead.

When a secret may have been exposed, follow OPS RUNBOOK in full:

1. Revoke or rotate at the source.
2. Update every consumer.
3. Redeploy.
4. Prove the old credential no longer works.
5. Check the exposure surface.
6. Record the incident.

## 13. Testing rules

Tests are evidence only when all of the following are true:

1. They ran against the current working tree.
2. The command is shown.
3. The exit code is known.
4. The relevant output is preserved.
5. The test covers the actual requirement.
6. No assertion or gate was weakened.
7. The environment is stated.
8. The test data is representative.
9. A passing unit test is not substituted for required runtime verification.

When a test fails, the model must report the failure before changing anything intended to make it pass.

## 14. Verification matrix

### 14.1 Database change

Required evidence:

1. Migration file diff.
2. Confirmation of the target database.
3. Pre change schema or row state where relevant.
4. Applied migration result.
5. Post change `SELECT` showing columns, indexes, constraints, or rows.
6. Row count checks where relevant.
7. Rollback or forward correction route.
8. Confirmation that no protected history was rewritten.
9. Confirmation that application code still works against the new schema.

### 14.2 API change

Required evidence:

1. Route diff.
2. Authentication and permission behaviour.
3. Real request using `curl` or equivalent.
4. Status code.
5. Response body.
6. Invalid input behaviour.
7. Unauthorised behaviour.
8. Server log check.
9. Production or preview environment stated.

### 14.3 User interface change

Required evidence:

1. Rendered route.
2. Browser console with no relevant errors.
3. Main interaction performed.
4. Loading, empty, error, and populated states where relevant.
5. Responsive check.
6. Screenshot or browser verification against the source design.
7. Confirmation that the live design rules were respected.
8. Confirmation that no hardcoded data is presented as live data.

### 14.4 Cron or pipeline change

Required evidence:

1. Schedule source.
2. Manual or scheduled invocation.
3. Start and finish record.
4. Rows affected.
5. Error field.
6. Resulting stories, documents, scores, alerts, or messages.
7. Idempotency check where relevant.
8. Failure path.
9. Heartbeat written to cron runs.
10. Exact environment.

### 14.5 Email change

Required evidence:

1. Generated HTML or text.
2. Provider send log.
3. Received seed email.
4. Gmail render.
5. Outlook render.
6. Mobile render where required.
7. Link checks.
8. Personalisation check.
9. Confirmation that assembled fields match their source data.
10. Confirmation that any mismatched assembled field is omitted rather than guessed.

### 14.6 RAG or Ask Tideline change

Required evidence:

1. Confirmed 768 dimension Jina embeddings.
2. Correct index and query path.
3. Four case behavioural verification.
4. Citations returned from the actual corpus.
5. No answer presented as sourced when the supporting chunk does not support it.
6. Refusal or uncertainty behaviour.
7. Permission filtering.
8. Query logging where required.
9. Runtime evidence rather than code inspection.

### 14.7 Score, classifier, or divergence change

Required evidence:

1. Published formula or classification contract.
2. Structured output schema.
3. Schema validation.
4. Stored component values.
5. Classifier version.
6. Methodology version.
7. Recalculation from the stored inputs.
8. Known failure cases.
9. Threshold boundary tests.
10. Confirmation that history was not rewritten.
11. Independent review before production use.

## 15. Completion contract

The model may use the word complete or done only when every acceptance criterion has corresponding evidence.

The final report must contain:

1. What changed.
2. Exact files changed.
3. Exact commands run.
4. Tests and exit codes.
5. Runtime verification.
6. Environment.
7. Remaining risks.
8. Anything not verified.
9. Any manual action still required.
10. Git status.
11. Commit identifier if a commit was requested and created.

Use these status labels precisely:

### VERIFIED

Directly observed in the named environment through the correct artifact.

### OBSERVED

Seen in code, logs, or data, but not yet proven through the full user path.

### INFERRED

A reasoned conclusion that has not been directly tested.

### BLOCKED

Cannot be completed safely with the current access, evidence, or system state.

### NOT TESTED

No claim of working behaviour is permitted.

The model must never convert OBSERVED or INFERRED into VERIFIED through confident wording.

## 16. Independent verification prompt

Use this prompt for controlled work:

Review this change as an independent verifier. Assume the implementation report may be incomplete or wrong. Start from the requirement, the relevant Tideline source files, and the exact diff. Look for scope drift, weakened checks, wrong environment, hidden assumptions, historical data risk, licensing damage, security issues, and claims that lack runtime proof. Do not edit anything. Return: critical failures, missing evidence, acceptance criteria that remain unproven, and the smallest verification sequence needed to reach VERIFIED.

## 17. Implementation prompt footer

Append this to every significant build task:

Work only within the stated scope. Follow TIDELINE AI EXECUTION RULES. Do not bypass tests, weaken validation, alter unrelated files, substitute another environment, or change the success criteria. Before editing, identify the governing source files, task boundary, risk class, and proof required. After two materially different failed approaches, stop and report the blocker. Do not claim completion without exact runtime evidence from the named environment.

## 18. Session end

Before ending a session, the model must:

1. Run `git diff --check`.
2. Run the relevant tests.
3. Run `git status --short`.
4. Review the full diff for unrelated changes.
5. Verify the user visible or production behaviour required by the task.
6. State the environment for every proof.
7. Update source documentation only to reflect verified state.
8. Do not mark TIDELINE MASTER FILE as updated when the build state is merely inferred.
9. Record a lesson when the session exposes a repeatable failure mode.
10. Produce a handoff that distinguishes verified facts from remaining assumptions.

## 19. Human approval gates

Luke must explicitly approve:

1. Production migrations.
2. Destructive operations.
3. Historical rewrites.
4. Changes to locked pricing, methodology, scoring weights, design rules, or product positioning.
5. New external services or major dependencies.
6. Permission expansions.
7. Changes to production secrets.
8. Data exports containing new classes of information.
9. Changes that could affect licensing rights.
10. Deployment when verification is incomplete.
11. Any decision where the model proposes trading correctness for speed.

Silence is not approval.

## 20. Governing principle

Tideline must not be safe because a model remembered to behave.

It must be safe because the workflow makes false success, hidden shortcuts, destructive changes, and unverified completion difficult to produce and easy to detect.
