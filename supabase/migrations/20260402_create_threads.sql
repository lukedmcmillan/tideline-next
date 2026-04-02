-- Thread Intelligence System
-- Three tables: threads, thread_evidence, thread_status_log

create table if not exists threads (
  id integer primary key generated always as identity,
  thread_number integer not null unique,
  title text not null,
  category text not null,
  status text not null default 'OPEN'
    check (status in ('ACTIVE', 'OPEN', 'WATCH', 'DORMANT', 'STRUCTURAL')),
  horizon text not null default 'MEDIUM'
    check (horizon in ('SHORT', 'MEDIUM', 'LONG', 'STRUCTURAL')),
  hypothesis text not null,
  resolution_condition text not null,
  audience text,
  connects_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists thread_evidence (
  id uuid primary key default gen_random_uuid(),
  thread_id integer not null references threads(id) on delete cascade,
  story_id uuid not null references stories(id) on delete cascade,
  added_at timestamptz not null default now(),
  evidence_note text,
  confidence text not null default 'MODERATE'
    check (confidence in ('STRONG', 'MODERATE', 'WEAK')),
  added_by text not null default 'AI'
    check (added_by in ('AI', 'HUMAN')),
  reviewed boolean not null default false,
  unique (thread_id, story_id)
);

create table if not exists thread_status_log (
  id uuid primary key default gen_random_uuid(),
  thread_id integer not null references threads(id) on delete cascade,
  changed_at timestamptz not null default now(),
  previous_status text
    check (previous_status in ('ACTIVE', 'OPEN', 'WATCH', 'DORMANT', 'STRUCTURAL')),
  new_status text not null
    check (new_status in ('ACTIVE', 'OPEN', 'WATCH', 'DORMANT', 'STRUCTURAL')),
  note text,
  changed_by text not null default 'AI'
    check (changed_by in ('AI', 'HUMAN'))
);

-- Indexes for common query patterns
create index idx_threads_status on threads(status);
create index idx_threads_category on threads(category);
create index idx_thread_evidence_thread_id on thread_evidence(thread_id);
create index idx_thread_evidence_story_id on thread_evidence(story_id);
create index idx_thread_status_log_thread_id on thread_status_log(thread_id);

-- Auto-update updated_at on threads
create or replace function update_threads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger threads_updated_at
  before update on threads
  for each row
  execute function update_threads_updated_at();
