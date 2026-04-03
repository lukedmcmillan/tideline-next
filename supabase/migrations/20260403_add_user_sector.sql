-- Add sector column to users table for onboarding
ALTER TABLE users ADD COLUMN IF NOT EXISTS sector text;
