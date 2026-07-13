-- RISK-SCREENER-SPEC Part 5: P1-P7 additive-only migrations
-- All plan-mode-zone per CLAUDE-RULES 6 and DATA-LICENSING-DESIGN 3

-- P1: divergences dimension scores + provenance columns
ALTER TABLE public.divergences
  ADD COLUMN IF NOT EXISTS score_factual numeric(3,1),
  ADD COLUMN IF NOT EXISTS score_conclusion numeric(3,1),
  ADD COLUMN IF NOT EXISTS score_framing numeric(3,1),
  ADD COLUMN IF NOT EXISTS score_authority numeric(3,1),
  ADD COLUMN IF NOT EXISTS classifier_version text,
  ADD COLUMN IF NOT EXISTS resolution_type text
    CHECK (resolution_type IN ('SUPERSEDED', 'CONVERGED', 'EXPIRED', 'DISMISSED_MANUAL')),
  ADD COLUMN IF NOT EXISTS supersedes_id uuid;

-- P2: stories.classifier_version (source_type already exists; detected_at maps to fetched_at)
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS classifier_version text;

-- P3: entity_identifiers (buyer join key)
CREATE TABLE IF NOT EXISTS public.entity_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.entities(id),
  id_type text NOT NULL,
  id_value text NOT NULL,
  valid_from date,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id_type, id_value)
);
CREATE INDEX IF NOT EXISTS idx_entity_identifiers_entity ON public.entity_identifiers(entity_id);
ALTER TABLE public.entity_identifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_identifiers_read_all" ON public.entity_identifiers FOR SELECT USING (true);

-- P4: entity_successions (lineage: renames, mergers, acquisitions, spin-offs)
CREATE TABLE IF NOT EXISTS public.entity_successions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id uuid NOT NULL REFERENCES public.entities(id),
  successor_id uuid NOT NULL REFERENCES public.entities(id),
  relation text NOT NULL CHECK (relation IN ('RENAMED', 'MERGED', 'ACQUIRED', 'SPUN_OFF')),
  effective_date date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.entity_successions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_successions_read_all" ON public.entity_successions FOR SELECT USING (true);

-- P5: cron_runs already exists — no action

-- P6: velocity_scores.methodology_version
ALTER TABLE public.velocity_scores
  ADD COLUMN IF NOT EXISTS methodology_version text;
UPDATE public.velocity_scores SET methodology_version = 'v1.1' WHERE methodology_version IS NULL;
