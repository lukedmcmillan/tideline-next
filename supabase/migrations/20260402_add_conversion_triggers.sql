-- Conversion trigger columns on users table

alter table users add column if not exists day5_modal_shown boolean not null default false;
alter table users add column if not exists has_dismissed_day5_modal boolean not null default false;
alter table users add column if not exists expiry_email_sent boolean not null default false;
