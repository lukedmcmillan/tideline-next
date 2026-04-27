-- Add source tier and metadata columns to stories table
alter table stories add column if not exists source_tier text not null default 'secondary'
  check (source_tier in ('primary', 'secondary'));
alter table stories add column if not exists issuing_body text;
alter table stories add column if not exists document_type text;
alter table stories add column if not exists source_url text;

-- Story chunks: Jina 768-dim embeddings for RAG over feed stories (secondary sources)
create table story_chunks (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id) on delete cascade,
  chunk_text text not null,
  chunk_index integer not null,
  embedding vector(1536),
  issuing_body text,
  document_type text,
  date_issued date,
  source_url text,
  created_at timestamptz default now()
);

create index on story_chunks
  using ivfflat (embedding vector_cosine_ops);

alter table story_chunks enable row level security;
create policy "Authenticated users can read chunks"
  on story_chunks for select
  to authenticated
  using (true);
