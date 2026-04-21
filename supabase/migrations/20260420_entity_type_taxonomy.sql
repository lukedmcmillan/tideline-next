-- Expand entity_type to include approved taxonomy: ngo, fund, standards
-- Legacy types (organisation, individual, instrument, vessel) remain valid
-- for existing scraper-extracted rows

ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_entity_type_check;
ALTER TABLE entities ADD CONSTRAINT entities_entity_type_check
  CHECK (entity_type IN (
    'organisation','individual','instrument','vessel',
    'company','person','regulator','issue',
    'ngo','fund','standards'
  ));

-- Migrate existing 'individual' rows to 'person'
UPDATE entities SET entity_type = 'person' WHERE entity_type = 'individual';
