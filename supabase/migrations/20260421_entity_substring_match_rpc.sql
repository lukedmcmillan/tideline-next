-- Add 'fuzzy' to match_method CHECK constraint (was: exact, semantic, alias)
ALTER TABLE entity_mentions DROP CONSTRAINT IF EXISTS entity_mentions_match_method_check;
ALTER TABLE entity_mentions ADD CONSTRAINT entity_mentions_match_method_check
  CHECK (match_method IN ('exact','semantic','alias','fuzzy'));

-- RPC for Pass 1: exact substring matching of entity names/aliases in story text.
-- Handles short aliases (< 4 chars) with word-boundary checks to prevent false positives.
-- Used by lib/entity-matching.ts

CREATE OR REPLACE FUNCTION match_entities_in_text(
  story_title text,
  story_summary text DEFAULT ''
)
RETURNS TABLE(entity_id uuid, entity_name text, entity_type text, matched_on text) AS $$
DECLARE
  combined text;
BEGIN
  -- Pad with spaces for word-boundary matching
  combined := ' ' || COALESCE(story_title, '') || ' ' || COALESCE(story_summary, '') || ' ';

  RETURN QUERY
  SELECT DISTINCT ON (e.id)
    e.id AS entity_id,
    e.name AS entity_name,
    e.entity_type,
    COALESCE(a.alias_text, e.name) AS matched_on
  FROM entities e
  LEFT JOIN entity_aliases a ON a.entity_id = e.id
  WHERE
    -- Tier 1: Long names/aliases (>= 7 chars): bare ILIKE substring (low false-positive risk)
    (
      (length(e.name) >= 7 AND combined ILIKE '%' || e.name || '%')
      OR
      (a.alias_text IS NOT NULL AND length(a.alias_text) >= 7 AND combined ILIKE '%' || a.alias_text || '%')
    )
    OR
    -- Tier 2: Medium names/aliases (4-6 chars): require word boundaries
    -- Prevents 'DEME' matching 'condemned', 'Peru' matching 'perusal', etc.
    (
      (length(e.name) BETWEEN 4 AND 6 AND (
        combined ILIKE '% ' || e.name || ' %'
        OR combined ILIKE '% ' || e.name || ',%'
        OR combined ILIKE '% ' || e.name || '.%'
        OR combined ILIKE '% ' || e.name || '''%'
        OR combined ILIKE '% ' || e.name || '-%'
        OR combined ILIKE '%(' || e.name || ')%'
        OR combined ILIKE '% ' || e.name || ':%'
      ))
      OR
      (a.alias_text IS NOT NULL AND length(a.alias_text) BETWEEN 4 AND 6 AND (
        combined ILIKE '% ' || a.alias_text || ' %'
        OR combined ILIKE '% ' || a.alias_text || ',%'
        OR combined ILIKE '% ' || a.alias_text || '.%'
        OR combined ILIKE '% ' || a.alias_text || '''%'
        OR combined ILIKE '% ' || a.alias_text || '-%'
        OR combined ILIKE '%(' || a.alias_text || ')%'
        OR combined ILIKE '% ' || a.alias_text || ':%'
      ))
    )
    OR
    -- Tier 3: Short names/aliases (2-3 chars): strict word boundaries
    (
      (length(e.name) BETWEEN 2 AND 3 AND (
        combined ILIKE '% ' || e.name || ' %'
        OR combined ILIKE '% ' || e.name || ',%'
        OR combined ILIKE '% ' || e.name || '.%'
        OR combined ILIKE '% ' || e.name || '''%'
        OR combined ILIKE '%(' || e.name || ')%'
      ))
      OR
      (a.alias_text IS NOT NULL AND length(a.alias_text) BETWEEN 2 AND 3 AND (
        combined ILIKE '% ' || a.alias_text || ' %'
        OR combined ILIKE '% ' || a.alias_text || ',%'
        OR combined ILIKE '% ' || a.alias_text || '.%'
        OR combined ILIKE '% ' || a.alias_text || '''%'
        OR combined ILIKE '%(' || a.alias_text || ')%'
      ))
    )
  ORDER BY e.id, length(COALESCE(a.alias_text, e.name)) DESC;
END;
$$ LANGUAGE plpgsql STABLE;
