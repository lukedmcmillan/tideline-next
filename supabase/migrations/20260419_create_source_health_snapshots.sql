create table if not exists public.source_health_snapshots (
  id bigint generated always as identity primary key,
  source_name text not null,
  stories_7d int not null default 0,
  stories_prior_7d int not null default 0,
  stories_30d int not null default 0,
  last_story_at timestamptz,
  flag text not null default 'healthy',
  checked_at timestamptz not null default now()
);

create index idx_source_health_snapshots_checked on public.source_health_snapshots (checked_at desc);
create index idx_source_health_snapshots_source on public.source_health_snapshots (source_name);
