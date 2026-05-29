-- Research RAG: query history, audit trail, Mechanism 5 logging.
-- RESEARCH-RAG-SPEC.md Section 4.3.
-- Note: column name is source_tiers (not source_types as in spec draft)
--   to match the actual filter values PRIMARY/SECONDARY.
--   partial_citation_count added per approved gap decision.

CREATE TABLE IF NOT EXISTS research_queries (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        REFERENCES auth.users(id),
  query                 text        NOT NULL,
  source_surface        text        NOT NULL DEFAULT 'standalone_research',
                                    -- 'brief_reply' | 'workspace_ask' | 'standalone_research' | 'projects_ask'
  project_id            uuid,       -- nullable; populated when source_surface = 'projects_ask'
  source_tiers          text[],     -- filter applied: PRIMARY | SECONDARY. Empty array {} = both tiers (no filter). NULL is not used.
  date_from             date,
  date_to               date,
  scope                 text,       -- 'all_library' | 'my_uploads'
  chunks_retrieved      int,
  chunks_cited          int,
  abstained             boolean     DEFAULT false,
  faithfulness_stripped int         DEFAULT 0,   -- claims removed: Mechanism 4 UNSUPPORTED verdict
  partial_citation_count int        DEFAULT 0,   -- claims flagged PARTIAL by Mechanism 4 (kept, logged)
  answer                text,
  cited_chunk_ids       uuid[],
  latency_ms            int,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_user
  ON research_queries(user_id, created_at DESC);

COMMENT ON TABLE research_queries IS
  'Research query history, audit trail, and Mechanism 5 logging. '
  'RESEARCH-RAG-SPEC.md Section 4.3.';

COMMENT ON COLUMN research_queries.source_surface IS
  'brief_reply | workspace_ask | standalone_research | projects_ask';

COMMENT ON COLUMN research_queries.source_tiers IS
  'Source tier filter applied during retrieval: PRIMARY and/or SECONDARY. '
  'Empty array {} = both tiers (no filter). NULL is not used as a sentinel. '
  'Note: source_type (GOVERNMENT/NGO/etc.) is display metadata, not stored here.';

COMMENT ON COLUMN research_queries.faithfulness_stripped IS
  'Count of claims removed by Mechanism 4 (Haiku UNSUPPORTED verdict).';

COMMENT ON COLUMN research_queries.partial_citation_count IS
  'Count of claims flagged PARTIAL by Mechanism 4 (kept in answer but logged for review).';
