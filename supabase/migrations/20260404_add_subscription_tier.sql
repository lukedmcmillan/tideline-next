ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text;
