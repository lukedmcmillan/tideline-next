-- Add interpretation cache column to alert_sends.
-- Stores the Haiku-generated band-crossing paragraph so it is generated
-- once per crossing and reused on repeat sends (e.g. per-user fan-out).
ALTER TABLE public.alert_sends
  ADD COLUMN IF NOT EXISTS interpretation text;
