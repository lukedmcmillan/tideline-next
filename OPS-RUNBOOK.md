
Operational procedures for a solo-founder production system
Version 1.0, July 2026. The runbook is the on-call. Referenced by TIDELINE-MASTER.md 2.2.
Items marked [CONFIRM] must be verified against production (vercel.json, Supabase dashboard, Resend dashboard) in the next session and this file updated. Do not treat unconfirmed schedules as fact; that is the exact failure mode the master file exists to prevent.

1. Immediate open incidents (July 2026)

Exposed database credential. Procedure in Section 2, run it in full, not just the password reset.
Supabase pooler authentication failures. Procedure in Section 3.
Cron liveness unknown across pipeline. Audit in Section 4 is an open priority item.


2. Secrets rotation procedure (run now for the exposed credential; reuse for any future exposure)

Rotate at source first. Supabase dashboard → Settings → Database → reset password. For API keys (Anthropic, Jina, Resend, Stripe, Firecrawl): revoke and reissue in the provider dashboard. Revoke, do not just add a new key alongside the old one.
Update every consumer. Vercel → project → Settings → Environment Variables → update the value in ALL environments (Production, Preview, Development). Then check: local .env files, GitHub Actions secrets, and any script or notebook with a hardcoded value.
Redeploy. Vercel env changes do not apply to running deployments. Trigger a redeploy and confirm the new deployment is serving.
Verify the old credential is dead. Attempt a connection with the old value; it must fail. A rotation is not complete until the old secret is proven dead.
Check exposure blast radius. If the credential was in a git commit: it is in history forever; rotation is the only fix, plus confirm the repo is private. If it was in a pasted log or chat: rotate and move on.
Log it in Section 7.

Standing rule: secrets never appear in code, commits, spec files, or pasted Claude Code output. If Claude Code echoes a secret in a session log, that counts as exposure; rotate.

3. Supabase pooler failure procedure
Symptoms: intermittent auth failures on pooled connections while direct connections work, or crons failing with connection errors.

Supabase dashboard → project → Restart project (Settings → General). This clears pooler state.
After restart, verify: run one read query through the pooled connection string and one through direct. State which environment each check ran against (per verification rules, TIDELINE-MASTER.md 5.3).
If failures recur within days: check whether crons are exhausting the pool (connections not released). Vercel serverless + Supabase should use the transaction pooler port (6543) with ?pgbouncer=true semantics, not the session pooler, for short-lived function connections. [CONFIRM current connection strings match this]
If the credential was rotated (Section 2) and pooler failures started after: the pooler can cache old auth; the restart is the fix, do it after every rotation.


4. Cron and pipeline inventory
This table is the liveness audit target. Fill the confirmed columns from vercel.json and provider dashboards, then keep it current.
JobExpected schedule (UTC)WhereEvidence it ranStatusStory ingestion (RSS, 89+ feeds)Nightly ~02:00 [CONFIRM]Vercel cronNew stories rows dated today[CONFIRM]Nightly scrapers (ISA, DOALOS, OSPAR, IMO, CBD, FAO, IWC, InforMEA)Nightly [CONFIRM per scraper]Vercel cron / GitHub Actions [CONFIRM which]New document_queue/documents rows[CONFIRM]Category classifier (Haiku)On ingestPipeline stepClassified categories on today's stories[CONFIRM]Pulse Score calculationWeekly, Monday 06:00Vercel cron → lib/velocity.tsNew velocity_scores rows each Monday[CONFIRM]Threshold alertsEvent-driven on score calculationFollows Pulse calcResend send log on band crossings[CONFIRM]Morning briefDaily ~07:00 local send [CONFIRM exact UTC]Vercel cron + ResendResend dashboard delivery log[CONFIRM]Divergence detection04:04 daily (planned, per spec)Not yet built (priority 4)n/aNot liveEmbedding of new documents[CONFIRM: on ingest or batch?]Pipeline stepChunk coverage holding ~98.5%[CONFIRM]
Liveness principle: every cron needs a heartbeat you can check in under a minute. The cheapest version: a cron_runs table (job name, started_at, finished_at, rows_affected, error) written by every cron. One query answers "did everything run last night?" This is a small build item; add it to the backlog under the cron liveness audit.

5. Triage: "the brief did not send" (adapt the pattern for any pipeline failure)
Work backwards from the user-visible failure:

Resend dashboard: was a send attempted? If yes and it failed → Resend-side issue (domain, quota, API key). If no attempt → upstream.
Vercel: did the brief cron fire? Functions log for the route. If it fired and errored → read the error. If it never fired → check vercel.json schedule and Vercel cron status page.
Data: did the cron fire but find nothing eligible? Check today's stories rows and their classifications. No GOVERNANCE_CHANGE stories can mean the classifier failed, ingestion failed, or the ingestion gate quarantined everything (remember: the gate silently quarantines non-ocean-dedicated sources; skipGate: true is the fix for general-domain sources).
Quality gate: did content exist but fail the gate or the synthesis pre-send check? An omitted synthesis line is by design; a fully blocked brief means the gate rejected the lead. Read the gate log.
State the environment for every check. Production vs localhost confusion has burned whole sessions before.

The same backwards-walk applies to missing alerts (Resend → alert cron → score calc → band data) and stale feeds (feed page → ingestion cron → source).

6. Backups and recovery

Supabase: confirm the backup tier and schedule on the current plan [CONFIRM: daily backups included?]. Point-in-time recovery availability depends on plan; know the answer before it matters.
Quarterly ritual (calendar it): restore one table from the latest backup to a scratch schema and diff row counts. A backup that has never been restored is a hope, not a backup. The export-grade tables (see DATA-LICENSING-DESIGN.md) are the priority: velocity_scores, divergences, stories, entity tables. They are the company's asset; losing their history is losing the exit thesis.
Repo: private GitHub is the code backup. Governing spec files live in the repo, so they are covered; the Obsidian vault is secondary and not critical-path.


7. Incident log
One line per incident: date, what broke, user-visible impact, root cause, fix, lesson (and whether the lesson went into tasks/lessons-MERGED.md).
DateWhatImpactRoot causeFixLesson captured?Jul 2026Database credential exposedNone known[fill in on resolution]Rotation per Section 2pendingJul 2026Supabase pooler auth failuresIntermittent connection errors[fill in]Project restart per Section 3pending