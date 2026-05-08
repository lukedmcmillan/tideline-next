-- Entity alias system for picker acronym search.
-- Aliases are stored lowercase. The search_entities RPC matches on
-- name ILIKE '%q%' OR aliases @> ARRAY[lower(q)] (exact match).
-- GIN index makes the @> check O(log n).

-- 1. Add aliases column
ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}';

-- 2. GIN index for fast array containment queries
CREATE INDEX IF NOT EXISTS entities_aliases_gin
  ON entities USING gin (aliases);

-- 3. Populate aliases (22 entities, 13 distinct alias keys)
UPDATE entities SET aliases = ARRAY['isa'] WHERE id = '1db8e960-b91a-4c63-b07f-fc73bb35e234'; -- International Seabed Authority
UPDATE entities SET aliases = ARRAY['isa'] WHERE id = 'f4e80e38-4ffc-4d4b-b4a3-c5ad97a02cfd'; -- ISA Council
UPDATE entities SET aliases = ARRAY['isa'] WHERE id = '4a7b62dc-f2c4-4f35-8a7b-1e2a3d9c4f87'; -- ISA Legal and Technical Commission
UPDATE entities SET aliases = ARRAY['cites'] WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; -- CITES
UPDATE entities SET aliases = ARRAY['cites'] WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'; -- CITES Secretariat
UPDATE entities SET aliases = ARRAY['cites'] WHERE id = 'c3d4e5f6-a7b8-9012-cdef-123456789012'; -- CITES Standing Committee
UPDATE entities SET aliases = ARRAY['bbnj'] WHERE id = 'd4e5f6a7-b8c9-0123-defa-234567890123'; -- BBNJ Agreement
UPDATE entities SET aliases = ARRAY['bbnj'] WHERE id = 'e5f6a7b8-c9d0-1234-efab-345678901234'; -- BBNJ Secretariat
UPDATE entities SET aliases = ARRAY['imo'] WHERE id = 'f6a7b8c9-d0e1-2345-fabc-456789012345'; -- International Maritime Organization
UPDATE entities SET aliases = ARRAY['mepc'] WHERE id = 'a7b8c9d0-e1f2-3456-abcd-567890123456'; -- Marine Environment Protection Committee
UPDATE entities SET aliases = ARRAY['msc'] WHERE id = 'b8c9d0e1-f2a3-4567-bcde-678901234567'; -- Maritime Safety Committee
UPDATE entities SET aliases = ARRAY['iwc'] WHERE id = 'c9d0e1f2-a3b4-5678-cdef-789012345678'; -- International Whaling Commission
UPDATE entities SET aliases = ARRAY['iucn'] WHERE id = 'd0e1f2a3-b4c5-6789-defa-890123456789'; -- IUCN
UPDATE entities SET aliases = ARRAY['ccamlr'] WHERE id = 'e1f2a3b4-c5d6-7890-efab-901234567890'; -- CCAMLR
UPDATE entities SET aliases = ARRAY['iccat'] WHERE id = 'f2a3b4c5-d6e7-8901-fabc-012345678901'; -- ICCAT
UPDATE entities SET aliases = ARRAY['ospar'] WHERE id = 'a3b4c5d6-e7f8-9012-abcd-123456789012'; -- OSPAR Commission
UPDATE entities SET aliases = ARRAY['cbd'] WHERE id = 'b4c5d6e7-f8a9-0123-bcde-234567890123'; -- Convention on Biological Diversity
UPDATE entities SET aliases = ARRAY['wto'] WHERE id = 'c5d6e7f8-a9b0-1234-cdef-345678901234'; -- WTO Committee on Fisheries Subsidies
UPDATE entities SET aliases = ARRAY['unoc'] WHERE id = 'd6e7f8a9-b0c1-2345-defa-456789012345'; -- UN Ocean Conference
UPDATE entities SET aliases = ARRAY['tnfd'] WHERE id = 'e7f8a9b0-c1d2-3456-efab-567890123456'; -- TNFD
UPDATE entities SET aliases = ARRAY['fao'] WHERE id = 'f8a9b0c1-d2e3-4567-fabc-678901234567'; -- FAO Committee on Fisheries
UPDATE entities SET aliases = ARRAY['cofi'] WHERE id = 'a9b0c1d2-e3f4-5678-abcd-789012345678'; -- COFI

-- 4. RPC function for picker search
-- Returns: id, name, entity_type, mention_count (same shape as old direct query)
-- Matches on name ILIKE '%q%' OR aliases @> ARRAY[lower(q)]
-- Aliases use exact match (GIN-indexed); name uses ILIKE (seq scan on small table)
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
