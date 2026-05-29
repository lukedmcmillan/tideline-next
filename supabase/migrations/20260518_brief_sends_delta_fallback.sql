-- Track when the delta-test fallback fires in send-brief.
-- delta_fallback = true means no story passed the Haiku delta classification
-- and the brief fell back to the old significance-only lead selection.
-- Used to surface fallback rate in Checkpoint 1 logging and monitor feed coverage health.

ALTER TABLE public.brief_sends
  ADD COLUMN IF NOT EXISTS delta_fallback boolean DEFAULT false;

COMMENT ON COLUMN public.brief_sends.delta_fallback IS
  'true when no delta-eligible story was found and send-brief fell back to legacy significance-only lead selection';
