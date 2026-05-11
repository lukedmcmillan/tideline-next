-- Support HTML documents in the library (InforMEA/CITES CoP decisions are HTML-only)
--
-- canonical_url  : authoritative external URL shown to subscribers (e.g. cites.org/eng/node/...)
--                  Distinct from file_url which is the Supabase storage path for PDFs
--                  or the direct link for HTML docs.
-- subtitle       : descriptive title. Primary title = decision identifier (e.g. "CITES Decision 20.49").
-- source_format  : tracks document format. Prevents PDF-assumed processing (embedding, viewer).

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS canonical_url  text,
  ADD COLUMN IF NOT EXISTS subtitle       text,
  ADD COLUMN IF NOT EXISTS source_format  text
    CHECK (source_format IN ('pdf', 'html', 'mixed'));

-- Queue needs source_format so processor-agent can route HTML vs PDF at intake.
ALTER TABLE public.document_queue
  ADD COLUMN IF NOT EXISTS source_format  text
    CHECK (source_format IN ('pdf', 'html', 'mixed'));

COMMENT ON COLUMN public.documents.canonical_url  IS 'Authoritative external URL for this document (shown to subscribers, e.g. cites.org page)';
COMMENT ON COLUMN public.documents.subtitle       IS 'Descriptive title; documents.title holds the formal identifier (e.g. decision number)';
COMMENT ON COLUMN public.documents.source_format  IS 'pdf | html | mixed — drives viewer and embedding strategy';
COMMENT ON COLUMN public.document_queue.source_format IS 'pdf | html | mixed — set by scraper so processor-agent can route correctly';
