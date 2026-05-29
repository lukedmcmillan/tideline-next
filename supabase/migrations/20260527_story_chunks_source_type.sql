-- Add source_type column to story_chunks for RAG retrieval filtering.
-- Values: GOVERNMENT | NGO | ACADEMIC | PRESS
-- Populated by embed-stories.ts via lib/source-classifier.ts on insert.
-- Backfill UPDATE below covers existing rows using joined stories.source_name.

ALTER TABLE story_chunks
  ADD COLUMN IF NOT EXISTS source_type text
  CHECK (source_type IN ('GOVERNMENT', 'NGO', 'ACADEMIC', 'PRESS'));

CREATE INDEX IF NOT EXISTS idx_story_chunks_source_type
  ON story_chunks(source_type);

-- Backfill existing rows.
-- Classification mirrors lib/source-classifier.ts exact-match sets.
-- Rows not matched by any WHEN clause default to 'PRESS'.

UPDATE story_chunks sc
SET source_type = CASE
  -- GOVERNMENT: national agencies + intergovernmental bodies
  WHEN s.source_name IN (
    'NOAA', 'Fisheries and Oceans Canada (DFO)', 'UK DEFRA', 'UK MMO',
    'ISA', 'UNEP', 'HELCOM', 'CCAMLR', 'IPCC',
    'IMO', 'IMO Press Briefings', 'FAO', 'CBD', 'CITES', 'IWC',
    'Ramsar Convention', 'CMS', 'OSPAR', 'ITLOS', 'UNCLOS',
    'UN BBNJ', 'BBNJ Secretariat', 'UN Environment', 'InforMEA', 'PSMA'
  ) THEN 'GOVERNMENT'

  -- NGO: conservation and advocacy organisations
  WHEN s.source_name IN (
    'Oceana', 'Ocean Conservancy', 'Sea Shepherd', 'Blue Marine Foundation',
    'Global Fishing Watch', 'High Seas Alliance', 'WWF', 'Greenpeace',
    'WDC', 'Whale and Dolphin Conservation', 'DSCC',
    'Deep Sea Conservation Coalition', 'ClientEarth', 'Earthjustice',
    'Environmental Defense Fund', 'Pew Charitable Trusts',
    'Marine Conservation Society', 'MSC', 'Marine Stewardship Council',
    'IUCN', 'Surfrider Foundation', '5 Gyres'
  ) THEN 'NGO'

  -- ACADEMIC: peer-reviewed journals and research institutions
  WHEN s.source_name IN (
    'Nature Climate Change', 'Nature Sustainability',
    'Nature Ecology & Evolution', 'Science Ocean Research',
    'Scripps Oceanography', 'WHOI', 'MBARI', 'British Antarctic Survey',
    'ICES', 'Frontiers in Marine Science', 'Marine Policy',
    'Ocean & Coastal Management', 'Deep-Sea Research', 'Oceanography'
  ) THEN 'ACADEMIC'

  -- Partial name heuristics for government bodies not in exact list
  WHEN lower(s.source_name) LIKE 'un %'
    OR lower(s.source_name) LIKE 'united nations%'
    OR lower(s.source_name) LIKE '%ministry of%'
    OR lower(s.source_name) LIKE '%department of%'
    OR lower(s.source_name) LIKE '%government of%'
    OR lower(s.source_name) LIKE '%secretariat%'
  THEN 'GOVERNMENT'

  ELSE 'PRESS'
END
FROM stories s
WHERE sc.story_id = s.id
  AND sc.source_type IS NULL;

COMMENT ON COLUMN story_chunks.source_type IS
  'Source classification from lib/source-classifier.ts. GOVERNMENT | NGO | ACADEMIC | PRESS.';
