-- =============================================================
-- Add quarantine columns to stories table
-- =============================================================
-- Applied: 2026-07-08 via Supabase SQL Editor (manual)
-- Purpose: Flag non-ocean stories that leaked through before the
-- ocean relevance gate went to blocking mode (April 21 2026).
-- ~27 stories from PLOS ONE Marine, Bloomberg Green, BBC Science,
-- Phys.org Ocean, New Scientist, Nature Sustainability.
--
-- Flagged stories remain queryable. No rows are deleted.
-- Wrong topic tags stay as-is on flagged rows (no rewrites).
-- =============================================================

-- Additive columns only
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS quarantined_at timestamptz,
  ADD COLUMN IF NOT EXISTS quarantine_reason text;

-- Flag the known non-ocean stories from April 2-14 pre-gate period.
-- Identified by entity link to confirmed junk entities (medical,
-- educational, non-ocean science content).
UPDATE public.stories
SET quarantined_at = NOW(),
    quarantine_reason = 'pre-gate non-ocean content (April 2026 audit)'
WHERE id IN (
  SELECT DISTINCT s.id
  FROM stories s
  JOIN entity_mentions em ON em.story_id = s.id
  JOIN entities e ON em.entity_id = e.id
  WHERE e.name IN (
    'tirzepatide','trastuzumab','Cognitive Behaviour Therapy',
    'ADHD','Orion capsule','student loan','Bloom''s Taxonomy',
    'electric minibus taxis','Golden eagles','Bargain Car Hunters',
    'Zambian Blood Donor Cohort','stone tool','endothelial progenitor cells',
    'electroretinograms','chlorin e6','Terror Management Theory',
    'UltraStyle','Superconductors'
  )
);
