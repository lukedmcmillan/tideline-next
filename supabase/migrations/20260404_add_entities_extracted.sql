-- Track whether entity extraction has been run on each story
ALTER TABLE stories ADD COLUMN IF NOT EXISTS entities_extracted boolean DEFAULT false;
