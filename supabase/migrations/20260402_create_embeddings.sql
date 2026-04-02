-- Embeddings table for semantic search via pgvector

create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id) unique,
  content text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index on embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
