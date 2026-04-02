-- First login experience flag

alter table users add column if not exists first_login_completed boolean not null default false;

-- Existing users should not see the welcome state
update users set first_login_completed = true where first_login_completed = false;
