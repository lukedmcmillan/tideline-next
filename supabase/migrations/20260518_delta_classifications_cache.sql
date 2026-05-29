-- Permanent cache for Haiku delta gate classifications.
--
-- A story is classified ONCE, ever, for a given prompt version.
-- When the classifier prompt changes, DELTA_PROMPT_VERSION (a SHA-256 hash
-- of the prompt text) changes automatically — old rows are superseded and
-- new classifications are stored under the new hash.
--
-- This is the structural determinism fix for the Delta Test gate:
-- no re-rolls, no flicker, same answer every time for the same input.
-- Implements BRIEF-LEAD-SPEC.md gate determinism requirement.

CREATE TABLE IF NOT EXISTS public.delta_classifications (
  story_id        uuid        NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  prompt_version  varchar(16) NOT NULL,
  is_delta        boolean     NOT NULL,
  actor           text,
  delta_verb      text,
  object          text,
  classified_at   timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (story_id, prompt_version)
);

COMMENT ON TABLE public.delta_classifications IS
  'Permanent cache for Haiku delta gate classifications. '
  'Keyed by (story_id, prompt_version_hash). A story is classified once per '
  'prompt version and never re-rolled. Prompt changes invalidate via new hash prefix. '
  'Implements the gate determinism requirement from BRIEF-LEAD-SPEC.md.';

COMMENT ON COLUMN public.delta_classifications.prompt_version IS
  'First 16 hex chars of SHA-256(DELTA_CLASSIFICATION_SYSTEM prompt). '
  'Changes automatically when the prompt changes, invalidating cached results.';

CREATE INDEX IF NOT EXISTS delta_classifications_story_id_idx
  ON public.delta_classifications(story_id);
