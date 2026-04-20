-- Soft-retire the divergences table. Feature removed from UI/cron/dashboard.
-- Historical data preserved for potential future adjacent features.
ALTER TABLE divergences ADD COLUMN IF NOT EXISTS retired_at timestamptz DEFAULT now();
