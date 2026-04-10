-- 1. Daily editorial signal
CREATE TABLE IF NOT EXISTS daily_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_text text NOT NULL,
  meaning_text text NOT NULL,
  meeting_note text,
  authored_by text DEFAULT 'Luke McMillan',
  signal_date date NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 2. Tracker page view tracking
CREATE TABLE IF NOT EXISTS tracker_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_slug text NOT NULL,
  user_id uuid,
  viewed_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tracker_page_views_slug_date
  ON tracker_page_views(tracker_slug, viewed_at);

-- 3. Streak + last_seen on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
