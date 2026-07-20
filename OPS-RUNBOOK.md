
Operational procedures for a solo-founder production system
Version 1.0, July 2026. The runbook is the on-call. Referenced by TIDELINE-MASTER.md 2.2.
Items marked [CONFIRM] must be verified against production (vercel.json, Supabase dashboard, Resend dashboard) in the next session and this file updated. Do not treat unconfirmed schedules as fact; that is the exact failure mode the master file exists to prevent.

1. Current incidents and priorities (July 2026)

Resolved 20 July 2026: the exposed Tideline database credential was rotated and independently verified. The incident record is in Section 7.
Open: Supabase pooler authentication failures. Use the evidence based procedure in Section 3.
Open: cron liveness remains unknown across parts of the pipeline. The audit in Section 4 is a priority.

2. Secrets rotation procedure

1. Rotate at source first. In Supabase, use Database Settings to reset the database password. For provider API keys, revoke and reissue the key in the provider dashboard. Do not create a second live credential while leaving the exposed one active.
2. Identify every real consumer before changing environments. Check Vercel Production, Preview and Development variables, shared variables, local environment files, GitHub Actions secrets, scripts, notebooks and external services. Record consumers that do not hold the credential. Do not invent a new environment variable merely to satisfy the checklist.
3. Update each confirmed consumer. A consumer that uses only a Supabase API URL and service role key does not need updating when the separate Postgres database password changes.
4. Redeploy only deployments whose environment variables changed. Environment changes do not affect an existing Vercel deployment until it is redeployed.
5. Prove the previous credential is dead by attempting the correct authentication path with the previous value. It must fail with an authentication error. A timeout, DNS error or refused connection does not prove invalidation.
6. Prove the current credential works through the intended connection path.
7. Check the exposure surface. Search tracked files, Git history, local environment variable names, workflow references and provider environments without printing secret values.
8. Record the incident in Section 7.

Standing rule: secrets must never appear in code, commits, specifications, pasted AI output or session logs. If an AI tool prints a secret, treat that as exposure and rotate it.

3. Supabase pooler failure procedure

Symptoms: authentication failures on pooled connections, direct connections behaving differently, or scheduled jobs reporting database connection errors.

1. Confirm the exact Supabase project name and project reference before testing. Do not substitute another project with a similar name.
2. Test the previous password against the same pooler endpoint used for the current password. A password authentication failure proves that previous credential is invalid.
3. Test the current password with a read only query such as `select 1;`. Record the host type, port, project reference and result without recording the password.
4. Current hosted Supabase behaviour, verified on 20 July 2026, does not expose a safe Restart project control under General Settings. Supabase documentation also states that managed services are automatically updated after a database password change. Do not use Pause project, restore, a compute change or another disruptive action as a substitute for a missing restart control.
5. Verify one read through the Session pooler. Verify one direct database connection when the network supports the direct IPv6 endpoint. If the local network cannot resolve the direct host, record that limitation and perform an account authenticated SQL read against the exact named Supabase project as independent confirmation. Do not describe that management connection as a direct network connection.
6. If authentication failures continue after the old password fails and the current password succeeds, inspect connection logs and external consumers. For any serverless function that connects directly to Postgres, confirm whether the transaction pooler on port 6543 is the appropriate connection path. Do not assume this applies to an application using only the Supabase API client.
7. If the hosted dashboard or official guidance changes, update this section from current evidence before using a restart procedure.

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

Each incident record must include the date, what happened, user impact, root cause, fix, verification evidence and lesson.

20 July 2026

What happened: A Tideline Postgres database password had previously been exposed in working material.

User impact: None observed.

Root cause: The credential had appeared outside its password manager. The exact original exposure surface was not retained in this session.

Fix: The password was rotated in the Tideline Supabase project. A previous Tideline password was rejected by the Session pooler. The current password successfully returned `select 1`. An account authenticated production SQL read against project `fmrtogpogcpfsdlfzqwd` also returned `1`.

Consumer check: Vercel Production, Pre production and Shared variables contained no database password or Postgres connection string. Local environment files contained no database password variable. No Vercel environment update or redeployment was required.

Repository check: The tracked Supabase temporary files contained project metadata and a passwordless pooler address only. They contained no password, token or key. They were removed from Git tracking and remain ignored as local cache files.

Lesson: Confirm the project reference before rotating or testing. Distinguish the Postgres password from Supabase API keys. Do not force a stale restart instruction when the current hosted platform provides no safe restart control. Never track `supabase/.temp/`.

Status: Resolved and verified.

July 2026

What happened: Intermittent Supabase pooler authentication failures were previously reported.

User impact: Intermittent connection errors.

Root cause: Not yet established.

Current action: Use the evidence based diagnostic sequence in Section 3.

Status: Open.
