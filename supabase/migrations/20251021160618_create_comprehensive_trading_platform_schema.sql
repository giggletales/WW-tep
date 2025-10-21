/*
  # Comprehensive Trading Platform Database Schema
  
  ## Overview
  This migration creates a complete database schema for a trading platform with two sections:
  - Main Section: Regular users and subscription management
  - MT5 Section: MetaTrader 5 trading accounts and data
  
  ## Tables Created
  
  ### Authentication & User Management
  1. `users` - Core user accounts with authentication data
  2. `user_profiles` - Extended user profile information
  3. `user_subscriptions` - Subscription plans and status
  
  ### Trading Signals
  4. `trading_signals` - Signals from admin (crypto bot)
  5. `user_signal_access` - Track which users can see which signals
  
  ### MT5 Trading Section
  6. `mt5_accounts` - MT5 trading account configurations
  7. `mt5_trades` - Individual MT5 trades tracking
  8. `mt5_performance` - Performance metrics for MT5 accounts
  
  ### Purchase & Notifications
  9. `purchases` - All purchase transactions
  10. `admin_notifications` - Purchase alerts for admin dashboard
  
  ### Email System
  11. `email_logs` - Track all sent emails for auditing
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies ensure users can only access their own data
  - Admin-only access for sensitive operations
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'customer_service')),
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  unique_id text UNIQUE,
  account_type text DEFAULT 'personal' CHECK (account_type IN ('personal', 'professional', 'enterprise')),
  risk_tolerance text DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  setup_complete boolean DEFAULT false,
  phone text,
  country text,
  timezone text DEFAULT 'UTC',
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- USER SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('kickstarter', 'starter', 'pro', 'enterprise')),
  plan_name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  period text NOT NULL DEFAULT 'month',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  features jsonb DEFAULT '[]',
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- =====================================================
-- TRADING SIGNALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS trading_signals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_type text NOT NULL DEFAULT 'crypto' CHECK (signal_type IN ('crypto', 'forex', 'stocks', 'commodities')),
  symbol text NOT NULL,
  currency_pair text,
  timeframe text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  entry_price decimal(20,8) NOT NULL,
  stop_loss decimal(20,8) NOT NULL,
  take_profit text NOT NULL,
  pips_at_risk text,
  confidence integer CHECK (confidence >= 0 AND confidence <= 100),
  analysis text,
  ict_concepts jsonb DEFAULT '[]',
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscribed users can read signals"
  ON trading_signals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_subscriptions.user_id = auth.uid()
      AND user_subscriptions.status = 'active'
      AND user_subscriptions.expires_at > now()
    )
  );

CREATE POLICY "Admins can manage all signals"
  ON trading_signals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- =====================================================
-- USER SIGNAL ACCESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_signal_access (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  signal_id uuid REFERENCES trading_signals(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, signal_id)
);

ALTER TABLE user_signal_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own signal access"
  ON user_signal_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own signal access"
  ON user_signal_access FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- MT5 ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mt5_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  account_number text NOT NULL,
  account_name text NOT NULL,
  broker text NOT NULL,
  account_type text DEFAULT 'demo' CHECK (account_type IN ('demo', 'live')),
  balance decimal(15,2) DEFAULT 0,
  equity decimal(15,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  leverage integer DEFAULT 100,
  is_active boolean DEFAULT true,
  api_credentials jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mt5_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own MT5 accounts"
  ON mt5_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own MT5 accounts"
  ON mt5_accounts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- MT5 TRADES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mt5_trades (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  mt5_account_id uuid REFERENCES mt5_accounts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ticket_number text,
  symbol text NOT NULL,
  trade_type text NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  volume decimal(10,2) NOT NULL,
  open_price decimal(20,8) NOT NULL,
  close_price decimal(20,8),
  stop_loss decimal(20,8),
  take_profit decimal(20,8),
  profit decimal(15,2),
  commission decimal(15,2) DEFAULT 0,
  swap decimal(15,2) DEFAULT 0,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mt5_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own MT5 trades"
  ON mt5_trades FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own MT5 trades"
  ON mt5_trades FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- MT5 PERFORMANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS mt5_performance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  mt5_account_id uuid REFERENCES mt5_accounts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_trades integer DEFAULT 0,
  winning_trades integer DEFAULT 0,
  losing_trades integer DEFAULT 0,
  total_profit decimal(15,2) DEFAULT 0,
  win_rate decimal(5,2) DEFAULT 0,
  profit_factor decimal(10,2) DEFAULT 0,
  max_drawdown decimal(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(mt5_account_id, date)
);

ALTER TABLE mt5_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own MT5 performance"
  ON mt5_performance FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- PURCHASES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  plan_type text NOT NULL,
  plan_name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_method text NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'crypto')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  payment_details jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- =====================================================
-- ADMIN NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type text NOT NULL CHECK (notification_type IN ('purchase', 'signup', 'support', 'system')),
  title text NOT NULL,
  message text NOT NULL,
  related_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  related_purchase_id uuid REFERENCES purchases(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- =====================================================
-- EMAIL LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  email_to text NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('welcome', 'payment_confirmation', 'password_reset', 'notification')),
  subject text NOT NULL,
  body text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON trading_signals(status);
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_user_id ON mt5_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_mt5_trades_user_id ON mt5_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_mt5_trades_status ON mt5_trades(status);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mt5_accounts_updated_at BEFORE UPDATE ON mt5_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notification trigger for purchases
CREATE OR REPLACE FUNCTION notify_admin_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (
    notification_type,
    title,
    message,
    related_user_id,
    related_purchase_id,
    metadata
  )
  SELECT 
    'purchase',
    'New Purchase: ' || NEW.plan_name,
    'User ' || u.email || ' purchased ' || NEW.plan_name || ' for $' || NEW.amount,
    NEW.user_id,
    NEW.id,
    jsonb_build_object(
      'user_email', u.email,
      'user_name', u.first_name || ' ' || u.last_name,
      'plan_name', NEW.plan_name,
      'amount', NEW.amount,
      'payment_method', NEW.payment_method
    )
  FROM users u
  WHERE u.id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_admin_on_purchase
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_purchase();
