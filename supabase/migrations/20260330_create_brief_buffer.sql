create table brief_buffer (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  subject_line text not null,
  html_content text not null,
  story_count int not null default 0,
  created_at timestamptz default now()
);

create index on brief_buffer (date);
alter table brief_buffer enable row level security;
