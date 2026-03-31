-- Change embedding dimension from 1536 to 768 for Jina v2
drop index if exists primary_source_chunks_embedding_idx;

alter table primary_source_chunks
  alter column embedding type vector(768);

create index on primary_source_chunks
  using ivfflat (embedding vector_cosine_ops);

-- RPC function for cosine similarity search
create or replace function match_primary_chunks(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  chunk_text text,
  issuing_body text,
  document_type text,
  date_issued date,
  source_url text,
  similarity float
)
language sql stable
as $$
  select
    chunk_text,
    issuing_body,
    document_type,
    date_issued,
    source_url,
    1 - (embedding <=> query_embedding) as similarity
  from primary_source_chunks
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
