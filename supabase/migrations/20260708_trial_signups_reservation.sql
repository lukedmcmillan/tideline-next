-- Add reservation columns to trial_signups
-- Apply via Supabase Studio
ALTER TABLE public.trial_signups
  ADD COLUMN IF NOT EXISTS reserved_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;
