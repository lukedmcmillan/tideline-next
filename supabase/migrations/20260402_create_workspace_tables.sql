-- 1. Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  project_type text,
  topic_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index idx_projects_user on projects(user_id);

-- 2. Project documents
create table if not exists project_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid references projects(id) on delete cascade,
  project_name text not null,
  title text not null default 'Untitled document',
  content jsonb,
  content_text text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_project_documents_user on project_documents(user_id);
create index idx_project_documents_project_id on project_documents(project_id);
create index idx_project_documents_project_name on project_documents(user_id, project_name);

-- 3. Saved stories
create table if not exists saved_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid references projects(id) on delete set null,
  project_name text not null,
  story_id uuid not null references stories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, story_id)
);

create index idx_saved_stories_user on saved_stories(user_id);
create index idx_saved_stories_project_id on saved_stories(project_id);
create index idx_saved_stories_project_name on saved_stories(user_id, project_name);

-- 4. Project auto entries
create table if not exists project_auto_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  story_id uuid not null references stories(id) on delete cascade,
  entry_type text not null,
  content text not null,
  auto_inserted boolean not null default true,
  reviewed boolean not null default false,
  inserted_at timestamptz not null default now(),
  unique (project_id, story_id)
);

create index idx_project_auto_entries_project on project_auto_entries(project_id);
