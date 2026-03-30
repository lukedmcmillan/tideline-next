create table project_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_name text not null,
  title text not null default 'Untitled document',
  content jsonb,
  content_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table project_documents enable row level security;
create policy "Users manage own documents" on project_documents
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
