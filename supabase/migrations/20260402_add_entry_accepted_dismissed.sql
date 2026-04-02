-- Add accepted/dismissed columns to project_auto_entries

alter table project_auto_entries add column if not exists accepted boolean not null default false;
alter table project_auto_entries add column if not exists dismissed boolean not null default false;
