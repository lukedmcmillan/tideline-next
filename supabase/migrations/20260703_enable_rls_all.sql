-- =============================================================
-- RLS LOCKDOWN — Enable Row Level Security on all public tables
-- =============================================================
-- Applied: 2026-07-03 via Supabase SQL Editor (manual)
-- Committed: for repo parity only; RLS already enabled in prod
--
-- CONTEXT:
-- Zero code paths use the Supabase anon key. Every createClient
-- call uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- Enabling RLS with NO policies therefore:
--   - Blocks all PostgREST anon-key access (read and write)
--   - Has zero impact on application functionality
--   - Is the correct lockdown for a service-role-only architecture
--
-- If a browser-side Supabase client is ever added, explicit
-- policies must be created BEFORE it ships. Until then,
-- RLS-with-no-policies is the intended state.
--
-- EXCLUDED (views, not tables — RLS cannot be enabled on views):
--   lp_briefing
--
-- VERIFICATION:
-- After applying, run behavioural checks:
--   1. Magic-link login (writes magic_links, reads users)
--   2. Survey submit (writes survey_responses)
--   3. Feed load (reads stories)
--   4. Research Ask query (reads document_chunks, writes research_queries)
-- All use service role → should pass. Any failure = missed anon path.
-- =============================================================

-- P0: User PII tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_reply_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- P1: Content / proprietary data tables
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_starter_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.velocity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divergences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delta_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_bodies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expected_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_status_log ENABLE ROW LEVEL SECURITY;

-- P2: Infrastructure / operational tables
ALTER TABLE public.scraped_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embedding_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_buffer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_pulse_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_quality_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.morning_brief_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treaty_ratifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories_quarantine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_auto_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lp_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.isa_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iuu_carding_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psma_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- No policies created intentionally. Service role bypasses RLS.
-- PostgREST anon access is now fully blocked on all tables.
