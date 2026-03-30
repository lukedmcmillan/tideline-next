create table story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  comment text not null,
  created_at timestamptz default now()
);
alter table story_comments enable row level security;
create policy "Users can read all comments" on story_comments for select to authenticated using (true);
create policy "Users can insert own comments" on story_comments for insert to authenticated with check (auth.uid() = user_id);
