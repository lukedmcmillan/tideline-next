-- Source health log: weekly monitoring results
create table source_health_log (
  id uuid primary key default gen_random_uuid(),
  checked_at timestamptz default now(),
  total int not null,
  healthy_count int not null,
  stale_count int not null,
  dead_count int not null
);

create index on source_health_log (checked_at);
alter table source_health_log enable row level security;

-- Per-source health results: individual check records
create table source_health_checks (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  rss_url text not null,
  http_status int,
  response_time_ms int,
  items_returned int default 0,
  most_recent_item timestamptz,
  health text not null default 'healthy' check (health in ('healthy', 'stale', 'dead')),
  error_message text,
  checked_at timestamptz default now()
);

create index on source_health_checks (source_name, checked_at);
alter table source_health_checks enable row level security;
