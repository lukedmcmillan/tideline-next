-- Step B: Category classifier columns for delta_classifications.
--
-- Adds two new columns for the CATEGORY gate redesign:
--   category                — low-cardinality story type (GOVERNANCE_CHANGE etc.)
--   governance_significance — 0-100 advisory score, never load-bearing
--
-- Old columns (is_delta, actor, delta_verb, object) remain nullable and intact.
-- Rows classified under the old DELTA prompt version keep their values.
-- Rows classified under the new CATEGORY prompt version populate the new columns.
-- Old columns dropped after one stable production week.
--
-- Apply in Supabase Studio, then run the verification SELECT below
-- before writing any code that reads or writes the new columns.

ALTER TABLE public.delta_classifications
  ADD COLUMN IF NOT EXISTS category                text,
  ADD COLUMN IF NOT EXISTS governance_significance integer;

COMMENT ON COLUMN public.delta_classifications.category IS
  'Story category from CATEGORY classifier: GOVERNANCE_CHANGE | ANALYSIS_OR_FINDING | '
  'COMMERCIAL_BUSINESS | EXPLAINER_OR_DISCUSSION | OTHER. '
  'Populated by the category gate (brief-category-gate-redesign.md). '
  'NULL for rows classified under the old DELTA prompt version.';

COMMENT ON COLUMN public.delta_classifications.governance_significance IS
  'Advisory 0-100 significance score from CATEGORY classifier. '
  'NEVER used for gating or lead ordering — significance_score (stories table) orders leads. '
  'Logged for diagnostic purposes only. NULL for old DELTA rows.';

-- Verification SELECT — run immediately after applying, before any code changes.
-- Expected: four rows for delta_classifications, including category and governance_significance,
-- both nullable, with correct data_type (text and integer respectively).
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name   = 'delta_classifications'
-- ORDER BY ordinal_position;
--
-- Expected output includes:
--   story_id                | uuid    | NO
--   prompt_version          | varchar | NO
--   is_delta                | boolean | NO   (old, kept for rollback)
--   actor                   | text    | YES  (old, nullable)
--   delta_verb              | text    | YES  (old, nullable)
--   object                  | text    | YES  (old, nullable)
--   classified_at           | timestamptz | NO
--   category                | text    | YES  (new)
--   governance_significance | integer | YES  (new)
