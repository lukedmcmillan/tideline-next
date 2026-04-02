-- Tracker events table for timeline sections on tracker pages

create table if not exists tracker_events (
  id uuid primary key default gen_random_uuid(),
  tracker_slug text not null,
  event_date date not null,
  title text not null,
  summary text,
  source_url text,
  event_type text not null default 'update'
    check (event_type in ('milestone', 'setback', 'update')),
  created_at timestamptz not null default now()
);

create index idx_tracker_events_slug on tracker_events(tracker_slug);
create index idx_tracker_events_date on tracker_events(event_date desc);
