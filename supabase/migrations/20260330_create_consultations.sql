create table consultations (
  id uuid primary key default gen_random_uuid(),
  organisation text not null,
  title text not null,
  description text,
  deadline timestamptz not null,
  type text not null check (type in ('consultation', 'event', 'deadline')),
  covered boolean default false,
  story_count int default 0,
  tracker_tags text[],
  source_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on consultations (deadline);
alter table consultations enable row level security;
create policy "Authenticated users can read consultations"
  on consultations for select
  to authenticated
  using (true);
