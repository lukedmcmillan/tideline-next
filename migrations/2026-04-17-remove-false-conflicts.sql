-- Remove false conflicts inserted during the first divergence detection run.
-- Preserves the three valid seed rows (isa, bbnj, iuu).
-- Run manually in Supabase SQL Editor.

DELETE FROM divergences
WHERE detected_at > now() - interval '2 hours'
AND dismissed_at IS NULL
AND tracker_tag NOT IN ('isa', 'bbnj', 'iuu');
