-- Add significance scoring columns to stories table

alter table stories add column if not exists significance_score integer not null default 0;
alter table stories add column if not exists cross_tracker_flags text[] not null default '{}';
alter table stories add column if not exists is_featured boolean not null default false;

create index idx_stories_significance_score on stories(significance_score);
create index idx_stories_is_featured on stories(is_featured) where is_featured = true;
