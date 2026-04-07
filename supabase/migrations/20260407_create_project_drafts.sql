create table if not exists public.project_drafts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text,
  content text not null default '',
  format text,
  tone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id)
);

create index if not exists project_drafts_project_id_idx on public.project_drafts(project_id);
