-- Entity alias system for picker acronym search.
--
-- CONVENTIONS:
--   - Aliases MUST be stored lowercase. The search_entities RPC calls lower(q) before
--     matching against aliases, so uppercase aliases will never match.
--   - UPDATEs match by canonical entity name, not by UUID. UUIDs are instance-specific;
--     names are portable. If a canonical name is changed in the entities table in future,
--     this file MUST be updated in the same commit.
--   - UPDATEs are idempotent and no-op on instances that don't yet have a named entity
--     scraped — safe to run at any time.
--
-- GIN index makes aliases @> ARRAY[lower(q)] O(log n).
-- ILIKE on name remains a seq scan but the entities table is small (~hundreds of rows).

-- 1. Add aliases column
ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}';

-- 2. GIN index for fast array containment queries
CREATE INDEX IF NOT EXISTS entities_aliases_gin
  ON entities USING gin (aliases);

-- 3. Seed aliases by canonical name

-- ISA-related
UPDATE entities SET aliases = ARRAY['isa']
  WHERE name IN ('International Seabed Authority', 'ISA Council', 'ISA Secretariat');

-- CITES-related
UPDATE entities SET aliases = ARRAY['cites']
  WHERE name IN ('CITES Animals Committee', 'CITES Secretariat', 'CITES Standing Committee');

-- BBNJ-related
UPDATE entities SET aliases = ARRAY['bbnj']
  WHERE name IN ('BBNJ Agreement', 'BBNJ PrepCom');

-- Single-entity aliases
UPDATE entities SET aliases = ARRAY['imo']    WHERE name = 'International Maritime Organization';
UPDATE entities SET aliases = ARRAY['iwc']    WHERE name = 'International Whaling Commission';
UPDATE entities SET aliases = ARRAY['cbd']    WHERE name = 'Convention on Biological Diversity';
UPDATE entities SET aliases = ARRAY['fao']    WHERE name = 'Food and Agriculture Organization';
UPDATE entities SET aliases = ARRAY['ospar']  WHERE name = 'OSPAR Commission';
UPDATE entities SET aliases = ARRAY['ec']     WHERE name = 'European Commission';
UPDATE entities SET aliases = ARRAY['gfw']    WHERE name = 'Global Fishing Watch';
UPDATE entities SET aliases = ARRAY['tnc']    WHERE name = 'The Nature Conservancy';
UPDATE entities SET aliases = ARRAY['unep']   WHERE name = 'United Nations Environment Programme';
UPDATE entities SET aliases = ARRAY['wto']    WHERE name = 'World Trade Organization';
UPDATE entities SET aliases = ARRAY['iccat']  WHERE name = 'International Commission for the Conservation of Atlantic Tunas';
UPDATE entities SET aliases = ARRAY['itlos']  WHERE name = 'International Tribunal for the Law of the Sea';
UPDATE entities SET aliases = ARRAY['doalos'] WHERE name = 'UN Division for Ocean Affairs and the Law of the Sea';
UPDATE entities SET aliases = ARRAY['ioc']    WHERE name = 'UNESCO Intergovernmental Oceanographic Commission';

-- 4. RPC function for picker search
-- Returns: id, name, entity_type, mention_count (same shape as old direct query)
-- Matches on name ILIKE '%q%' OR aliases @> ARRAY[lower(q)] (exact alias match)
CREATE OR REPLACE FUNCTION search_entities(q text, lim int DEFAULT 20)
RETURNS TABLE(id uuid, name text, entity_type text, mention_count int)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT e.id, e.name, e.entity_type, e.mention_count
  FROM entities e
  WHERE
    e.name ILIKE '%' || q || '%'
    OR e.aliases @> ARRAY[lower(q)]
  ORDER BY e.mention_count DESC NULLS LAST
  LIMIT lim;
$$;
