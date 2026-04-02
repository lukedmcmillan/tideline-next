-- Brief quality gate: add review flag and quality log table

alter table brief_buffer add column if not exists needs_review boolean not null default false;

create table if not exists brief_quality_log (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  overall_quality text not null,
  failed_count integer not null default 0,
  raw_feedback text,
  created_at timestamptz not null default now()
);
