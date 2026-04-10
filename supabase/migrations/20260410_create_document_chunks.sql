-- Document chunks for library RAG (semantic search over PDFs)
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  chunk_text text not null,
  chunk_index integer not null,
  embedding vector(768),
  created_at timestamptz default now()
);

create index idx_document_chunks_document on document_chunks(document_id);
create index on document_chunks using ivfflat (embedding vector_cosine_ops);

alter table document_chunks enable row level security;
create policy "Authenticated users can read document chunks"
  on document_chunks for select
  to authenticated
  using (true);

-- RPC function for cosine similarity search over library documents
create or replace function match_document_chunks(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  chunk_text text,
  chunk_index integer,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.chunk_text,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
