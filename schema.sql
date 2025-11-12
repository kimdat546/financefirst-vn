-- FinanceFirst VN Database Schema
-- PostgreSQL with Row-Level Security and Audit Logging

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional security features
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled', 'failed');
CREATE TYPE budget_period AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE budget_status AS ENUM ('active', 'paused', 'completed');

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (synced with Clerk)
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  date_of_birth DATE,
  country_code TEXT DEFAULT 'VN',
  currency_code TEXT DEFAULT 'VND' NOT NULL,
  language_preference TEXT DEFAULT 'vi',
  timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  is_active BOOLEAN DEFAULT true NOT NULL,
  email_verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ,

  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT currency_code_length CHECK (LENGTH(currency_code) = 3)
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_vi TEXT, -- Vietnamese translation
  description TEXT,
  icon TEXT,
  color TEXT,
  type transaction_type NOT NULL,
  is_system BOOLEAN DEFAULT false NOT NULL, -- System categories can't be deleted
  parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT category_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT category_color_format CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT no_self_reference CHECK (id != parent_category_id),
  UNIQUE(user_id, name, type)
);

-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  currency_code TEXT DEFAULT 'VND' NOT NULL,
  period budget_period NOT NULL DEFAULT 'monthly',
  status budget_status NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  alert_threshold DECIMAL(5, 2) DEFAULT 80.00, -- Alert at 80% by default
  rollover_unused BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT budget_amount_positive CHECK (amount > 0),
  CONSTRAINT budget_alert_threshold CHECK (alert_threshold > 0 AND alert_threshold <= 100),
  CONSTRAINT budget_date_range CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT budget_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Transactions table (ACID compliant)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'completed',
  amount DECIMAL(15, 2) NOT NULL,
  currency_code TEXT DEFAULT 'VND' NOT NULL,
  exchange_rate DECIMAL(15, 6) DEFAULT 1.0,
  amount_in_base_currency DECIMAL(15, 2) NOT NULL, -- Amount in user's default currency
  description TEXT NOT NULL,
  notes TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  merchant_name TEXT,
  location TEXT,
  receipt_url TEXT,
  reference_number TEXT,

  -- For transfer transactions
  related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  from_account TEXT,
  to_account TEXT,

  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Soft delete
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT transaction_amount_positive CHECK (amount > 0),
  CONSTRAINT transaction_exchange_rate_positive CHECK (exchange_rate > 0),
  CONSTRAINT transaction_description_not_empty CHECK (LENGTH(TRIM(description)) > 0),
  CONSTRAINT transaction_date_not_future CHECK (transaction_date <= NOW() + INTERVAL '1 day'),
  CONSTRAINT deleted_at_set_when_deleted CHECK (
    (is_deleted = false AND deleted_at IS NULL) OR
    (is_deleted = true AND deleted_at IS NOT NULL)
  )
);

-- Audit logs table (for compliance)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL, -- Can be UUID or TEXT
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT audit_action_valid CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  CONSTRAINT audit_table_name_not_empty CHECK (LENGTH(TRIM(table_name)) > 0)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Categories indexes
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_parent ON categories(parent_category_id) WHERE parent_category_id IS NOT NULL;
CREATE INDEX idx_categories_active ON categories(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_categories_display_order ON categories(user_id, display_order);

-- Budgets indexes
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_budgets_status ON budgets(status) WHERE status = 'active';
CREATE INDEX idx_budgets_date_range ON budgets(start_date, end_date);
CREATE INDEX idx_budgets_active ON budgets(user_id, is_active) WHERE is_active = true;

-- Transactions indexes (critical for performance)
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_budget_id ON transactions(budget_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id, transaction_date DESC);
CREATE INDEX idx_transactions_not_deleted ON transactions(user_id) WHERE is_deleted = false;
CREATE INDEX idx_transactions_tags ON transactions USING GIN(tags);
CREATE INDEX idx_transactions_metadata ON transactions USING GIN(metadata);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to audit table changes
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
  changed_fields TEXT[];
  record_id TEXT;
BEGIN
  -- Get record ID
  IF TG_OP = 'DELETE' THEN
    record_id := OLD.id::TEXT;
  ELSE
    record_id := NEW.id::TEXT;
  END IF;

  -- Convert OLD and NEW to JSONB
  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSE -- UPDATE
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);

    -- Identify changed fields
    SELECT ARRAY_AGG(key)
    INTO changed_fields
    FROM jsonb_each(new_data)
    WHERE new_data->key IS DISTINCT FROM old_data->key;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    table_name,
    record_id,
    user_id,
    action,
    old_data,
    new_data,
    changed_fields
  ) VALUES (
    TG_TABLE_NAME,
    record_id,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END,
    TG_OP,
    old_data,
    new_data,
    changed_fields
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate amount in base currency
CREATE OR REPLACE FUNCTION calculate_base_currency_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amount_in_base_currency := NEW.amount * NEW.exchange_rate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate budget spending
CREATE OR REPLACE FUNCTION check_budget_limit()
RETURNS TRIGGER AS $$
DECLARE
  budget_amount DECIMAL(15, 2);
  total_spent DECIMAL(15, 2);
  budget_alert_threshold DECIMAL(5, 2);
BEGIN
  -- Only check for expense transactions
  IF NEW.type = 'expense' AND NEW.budget_id IS NOT NULL THEN
    -- Get budget details
    SELECT amount, alert_threshold
    INTO budget_amount, budget_alert_threshold
    FROM budgets
    WHERE id = NEW.budget_id AND is_active = true;

    IF FOUND THEN
      -- Calculate total spent for this budget
      SELECT COALESCE(SUM(amount_in_base_currency), 0)
      INTO total_spent
      FROM transactions
      WHERE budget_id = NEW.budget_id
        AND status = 'completed'
        AND is_deleted = false
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

      -- Add current transaction amount
      total_spent := total_spent + NEW.amount_in_base_currency;

      -- Check if over budget (just log, don't block)
      IF total_spent > budget_amount THEN
        RAISE NOTICE 'Budget exceeded: % / % (%.2f%%)',
          total_spent, budget_amount, (total_spent / budget_amount * 100);
      ELSIF total_spent > (budget_amount * budget_alert_threshold / 100) THEN
        RAISE NOTICE 'Budget alert threshold reached: % / % (%.2f%%)',
          total_spent, budget_amount, (total_spent / budget_amount * 100);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_users_changes AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_transactions_changes AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_budgets_changes AFTER INSERT OR UPDATE OR DELETE ON budgets
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

-- Base currency calculation trigger
CREATE TRIGGER calculate_transaction_base_amount
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION calculate_base_currency_amount();

-- Budget validation trigger
CREATE TRIGGER check_transaction_budget
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION check_budget_limit();

-- =====================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::TEXT = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::TEXT = id);

-- Categories policies
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid()::TEXT = user_id AND is_system = false);

CREATE POLICY "Users can delete own non-system categories" ON categories
  FOR DELETE USING (auth.uid()::TEXT = user_id AND is_system = false);

-- Budgets policies
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can insert own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE USING (auth.uid()::TEXT = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid()::TEXT = user_id AND is_deleted = false);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can soft delete own transactions" ON transactions
  FOR UPDATE USING (auth.uid()::TEXT = user_id)
  WITH CHECK (auth.uid()::TEXT = user_id);

-- Audit logs policies (read-only for users)
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid()::TEXT = user_id);

-- =====================================================
-- HELPER FUNCTIONS & VIEWS
-- =====================================================

-- View for transaction summaries
CREATE OR REPLACE VIEW transaction_summaries AS
SELECT
  t.user_id,
  t.type,
  t.category_id,
  c.name as category_name,
  DATE_TRUNC('month', t.transaction_date) as month,
  COUNT(*) as transaction_count,
  SUM(t.amount_in_base_currency) as total_amount,
  AVG(t.amount_in_base_currency) as avg_amount,
  MIN(t.amount_in_base_currency) as min_amount,
  MAX(t.amount_in_base_currency) as max_amount
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.is_deleted = false AND t.status = 'completed'
GROUP BY t.user_id, t.type, t.category_id, c.name, DATE_TRUNC('month', t.transaction_date);

-- View for budget usage
CREATE OR REPLACE VIEW budget_usage AS
SELECT
  b.id as budget_id,
  b.user_id,
  b.name as budget_name,
  b.amount as budget_amount,
  b.currency_code,
  b.period,
  b.start_date,
  b.end_date,
  COALESCE(SUM(t.amount_in_base_currency), 0) as spent_amount,
  b.amount - COALESCE(SUM(t.amount_in_base_currency), 0) as remaining_amount,
  CASE
    WHEN b.amount > 0 THEN
      ROUND((COALESCE(SUM(t.amount_in_base_currency), 0) / b.amount * 100)::NUMERIC, 2)
    ELSE 0
  END as usage_percentage
FROM budgets b
LEFT JOIN transactions t ON
  b.id = t.budget_id
  AND t.status = 'completed'
  AND t.is_deleted = false
  AND t.type = 'expense'
WHERE b.is_active = true
GROUP BY b.id, b.user_id, b.name, b.amount, b.currency_code, b.period, b.start_date, b.end_date;

-- Function to get monthly spending by category
CREATE OR REPLACE FUNCTION get_monthly_spending_by_category(
  p_user_id TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  total_amount DECIMAL(15, 2),
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.category_id,
    COALESCE(c.name, 'Uncategorized') as category_name,
    SUM(t.amount_in_base_currency)::DECIMAL(15, 2) as total_amount,
    COUNT(*)::BIGINT as transaction_count
  FROM transactions t
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE t.user_id = p_user_id
    AND t.type = 'expense'
    AND t.status = 'completed'
    AND t.is_deleted = false
    AND t.transaction_date >= p_start_date
    AND t.transaction_date <= p_end_date
  GROUP BY t.category_id, c.name
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INITIAL DATA - System Categories
-- =====================================================

-- Note: Insert system categories after user creation
-- Example system categories for Vietnamese users:
-- INSERT INTO categories (user_id, name, name_vi, type, is_system, icon, color) VALUES
-- ('system', 'Food & Dining', 'Ăn uống', 'expense', true, '🍜', '#FF6B6B'),
-- ('system', 'Transportation', 'Đi lại', 'expense', true, '🚗', '#4ECDC4'),
-- ('system', 'Shopping', 'Mua sắm', 'expense', true, '🛍️', '#95E1D3'),
-- ('system', 'Healthcare', 'Y tế', 'expense', true, '🏥', '#F38181'),
-- ('system', 'Entertainment', 'Giải trí', 'expense', true, '🎬', '#AA96DA'),
-- ('system', 'Education', 'Giáo dục', 'expense', true, '📚', '#FCBAD3'),
-- ('system', 'Bills & Utilities', 'Hóa đơn', 'expense', true, '📄', '#A8D8EA'),
-- ('system', 'Salary', 'Lương', 'income', true, '💰', '#48C9B0'),
-- ('system', 'Investment', 'Đầu tư', 'income', true, '📈', '#52B788');

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'User accounts synced with Clerk authentication';
COMMENT ON TABLE categories IS 'Transaction categories with support for Vietnamese translations';
COMMENT ON TABLE budgets IS 'User budgets with period-based tracking and alerts';
COMMENT ON TABLE transactions IS 'Financial transactions with ACID compliance and soft delete';
COMMENT ON TABLE audit_logs IS 'Audit trail for compliance and security monitoring';

COMMENT ON COLUMN transactions.amount_in_base_currency IS 'Calculated amount in user default currency using exchange_rate';
COMMENT ON COLUMN transactions.is_deleted IS 'Soft delete flag - never actually delete financial records';
COMMENT ON COLUMN budgets.alert_threshold IS 'Percentage (0-100) at which to alert user of budget usage';
COMMENT ON COLUMN categories.is_system IS 'System categories cannot be modified or deleted by users';
