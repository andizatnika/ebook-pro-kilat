-- Subscription Management System untuk Pro Ebook Kilat

-- 1. Create Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free', -- 'free', 'basic', 'pro', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled', 'paused'
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  duration_days INTEGER DEFAULT 30,
  price_paid DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Create Payment History Table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT, -- 'credit_card', 'bank_transfer', 'ewallet', etc
  status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
  transaction_id TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create Plan Details Table (Master Data)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT UNIQUE NOT NULL, -- 'free', 'basic', 'pro', 'enterprise'
  display_name TEXT NOT NULL, -- 'Gratis', 'Basic', 'Professional', 'Enterprise'
  description TEXT,
  price_per_month DECIMAL(10, 2) NOT NULL,
  price_per_year DECIMAL(10, 2),
  max_projects INTEGER DEFAULT 5,
  max_images_per_chapter INTEGER DEFAULT 5,
  max_chapters INTEGER DEFAULT 20,
  storage_gb INTEGER DEFAULT 1,
  priority_support BOOLEAN DEFAULT false,
  features JSONB DEFAULT '{}', -- {'feature1': true, 'feature2': false}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create Indexes for Performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Subscriptions
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only system can insert subscriptions"
  ON subscriptions
  FOR INSERT
  WITH CHECK (false); -- Require backend to insert

-- 7. RLS Policies for Payment History
CREATE POLICY "Users can view their own payment history"
  ON payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- 8. RLS Policies for Plans (Public Read)
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- 9. Create Auto-update Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_history_updated_at ON payment_history;
CREATE TRIGGER update_payment_history_updated_at
  BEFORE UPDATE ON payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Insert Default Plans
INSERT INTO subscription_plans (plan_name, display_name, description, price_per_month, price_per_year, max_projects, max_images_per_chapter, max_chapters, storage_gb, priority_support, features)
VALUES
  ('free', 'Gratis', 'Paket gratis untuk mencoba', 0, 0, 3, 2, 5, 0.5, false, '{"basic_generation": true, "limited_features": true}'),
  ('basic', 'Basic', 'Paket dasar untuk pengguna individual', 49000, 490000, 10, 5, 20, 5, false, '{"full_generation": true, "ai_images": true, "cloud_sync": true}'),
  ('pro', 'Professional', 'Paket profesional dengan fitur lengkap', 99000, 990000, 50, 10, 100, 50, true, '{"full_generation": true, "ai_images": true, "cloud_sync": true, "priority_support": true, "advanced_analytics": true}'),
  ('enterprise', 'Enterprise', 'Paket enterprise dengan support dedicated', 299000, 2990000, -1, -1, -1, 500, true, '{"full_generation": true, "ai_images": true, "cloud_sync": true, "priority_support": true, "advanced_analytics": true, "api_access": true, "custom_domain": true}')
ON CONFLICT (plan_name) DO NOTHING;

-- 11. Create Function to Check Subscription Status
CREATE OR REPLACE FUNCTION check_subscription_status(user_id UUID)
RETURNS TABLE (
  is_active BOOLEAN,
  plan_type TEXT,
  days_remaining INTEGER,
  end_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (s.status = 'active' AND s.end_date > now())::BOOLEAN as is_active,
    s.plan_type,
    EXTRACT(DAY FROM (s.end_date - now()))::INTEGER as days_remaining,
    s.end_date
  FROM subscriptions s
  WHERE s.user_id = user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 12. Create Function to Auto-expire Subscriptions
CREATE OR REPLACE FUNCTION auto_expire_subscriptions()
RETURNS TABLE (expired_count INTEGER) AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE subscriptions
  SET status = 'expired'
  WHERE status = 'active' AND end_date <= now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- 13. Create Webhook for Payment Processing
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed);
