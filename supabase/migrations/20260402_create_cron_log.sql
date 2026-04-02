-- Cron run logging table

create table if not exists cron_log (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  run_at timestamptz not null default now(),
  stories_processed integer not null default 0,
  events_created integer not null default 0,
  errors text,
  created_at timestamptz not null default now()
);

create index idx_cron_log_agent on cron_log(agent_name, run_at desc);
