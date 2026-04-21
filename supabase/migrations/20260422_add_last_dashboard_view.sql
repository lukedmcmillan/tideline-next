-- Track when a user last opened the dashboard.
-- Used by /api/dashboard/reveal to compute the "since last view" window.
-- Nullable: NULL is handled by the API with a 15h default fallback.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_dashboard_view timestamptz;
