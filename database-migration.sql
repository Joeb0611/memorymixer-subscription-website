-- MemoryMixer Pricing Model Database Migration
-- Run this in your Supabase SQL Editor

-- 1. Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  storage_gb INTEGER NOT NULL,
  included_guests INTEGER NOT NULL,
  includes_qr_code BOOLEAN DEFAULT false,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Insert subscription plans
INSERT INTO subscription_plans (name, price_monthly, price_yearly, storage_gb, included_guests, includes_qr_code, features)
VALUES 
('free', 0.00, 0.00, 5, 2, false, '{"unlimited_events": true, "unlimited_retention": true}'),
('essential', 10.00, 99.00, 50, 10, false, '{"unlimited_events": true, "unlimited_retention": true, "priority_support": true, "event_package_discount": true}')
ON CONFLICT (name) DO NOTHING;

-- 3. Create event packages table
CREATE TABLE IF NOT EXISTS event_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  max_guests INTEGER NOT NULL,
  price_regular DECIMAL(10,2) NOT NULL,
  price_subscriber DECIMAL(10,2) NOT NULL,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Insert event packages
INSERT INTO event_packages (name, max_guests, price_regular, price_subscriber, features)
VALUES 
('small', 25, 15.00, 12.00, '{"qr_code": true, "unlimited_uploads": true, "event_gallery": true}'),
('medium', 50, 25.00, 20.00, '{"qr_code": true, "unlimited_uploads": true, "event_gallery": true}'),
('large', 100, 45.00, 35.00, '{"qr_code": true, "unlimited_uploads": true, "event_gallery": true}'),
('xl', 200, 75.00, 55.00, '{"qr_code": true, "unlimited_uploads": true, "event_gallery": true}'),
('mega', 999, 120.00, 85.00, '{"qr_code": true, "unlimited_uploads": true, "event_gallery": true}')
ON CONFLICT (name) DO NOTHING;

-- 5. Create event purchases table
CREATE TABLE IF NOT EXISTS event_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_id UUID REFERENCES events(id),
  package_type TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  amount INTEGER, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Update user_profiles table for new subscription model
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'essential'));

-- 7. Update events table to track QR code status
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS has_qr_code BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS qr_code_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 2;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_purchases_user_id ON event_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_event_purchases_event_id ON event_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_events_has_qr_code ON events(has_qr_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan_type ON user_profiles(plan_type);

-- 9. Create RLS policies for event_purchases
ALTER TABLE event_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases" ON event_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON event_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. Create RLS policies for subscription_plans and event_packages (read-only)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view event packages" ON event_packages
  FOR SELECT USING (true);

-- 11. Create a function to check if user has purchased event package
CREATE OR REPLACE FUNCTION has_event_package(user_id UUID, event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM event_purchases 
    WHERE event_purchases.user_id = $1 
    AND event_purchases.event_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create a function to get user's effective guest limit for an event
CREATE OR REPLACE FUNCTION get_user_guest_limit(user_id UUID, event_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_plan TEXT;
  base_limit INTEGER;
  has_package BOOLEAN;
BEGIN
  -- Get user's subscription plan
  SELECT plan_type INTO user_plan
  FROM user_profiles
  WHERE id = user_id;
  
  -- Get base limit from subscription plan
  SELECT included_guests INTO base_limit
  FROM subscription_plans
  WHERE name = COALESCE(user_plan, 'free');
  
  -- Check if user has purchased event package
  SELECT has_event_package(user_id, event_id) INTO has_package;
  
  -- If user has event package, return the package limit
  IF has_package THEN
    SELECT ep.max_guests INTO base_limit
    FROM event_purchases epu
    JOIN event_packages ep ON ep.name = epu.package_type
    WHERE epu.user_id = user_id AND epu.event_id = event_id
    ORDER BY epu.purchased_at DESC
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(base_limit, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Update existing events to set default max_guests based on current structure
UPDATE events 
SET max_guests = 2 
WHERE max_guests IS NULL;

COMMENT ON TABLE subscription_plans IS 'Defines available subscription plans with pricing and features';
COMMENT ON TABLE event_packages IS 'Defines one-time event packages with guest limits and pricing';
COMMENT ON TABLE event_purchases IS 'Records event package purchases by users';
COMMENT ON FUNCTION has_event_package(UUID, UUID) IS 'Checks if a user has purchased an event package for a specific event';
COMMENT ON FUNCTION get_user_guest_limit(UUID, UUID) IS 'Returns the effective guest limit for a user on a specific event';