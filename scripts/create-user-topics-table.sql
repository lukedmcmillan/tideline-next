-- One-time table creation for user tracker domain preferences.
-- Run in Supabase SQL editor before the personalisation feature goes live.
--
-- Each subscriber can select 1-5 tracker domains. If no rows exist
-- for a user, all 10 domains are shown (default-all behaviour).
-- The 1-5 limit is enforced server-side in /api/user/topics, not at DB level.

CREATE TABLE IF NOT EXISTS public.user_topics (
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tracker_slug text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tracker_slug)
);

CREATE INDEX IF NOT EXISTS user_topics_user_idx ON public.user_topics (user_id);
