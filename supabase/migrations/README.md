# Supabase Database Migrations

This directory contains all database migrations for FinanceFirst VN.

## 📋 Migration Files

### 001_initial_schema.sql
**Initial Database Schema with ACID Compliance**

Creates the foundational database structure:
- ✅ 5 core tables: `users`, `categories`, `transactions`, `budgets`, `audit_logs`
- ✅ Comprehensive indexes for performance optimization
- ✅ Row-Level Security (RLS) policies for data isolation
- ✅ Audit logging triggers for compliance
- ✅ Auto-update `updated_at` triggers
- ✅ Helper functions for transaction summaries and spending analysis

**Key Features:**
- ACID compliance on transactions table
- Soft delete functionality (never lose data)
- Idempotency keys to prevent duplicate submissions
- Vietnamese localization support

### 002_seed_categories.sql
**Default Vietnamese Categories**

Automatically creates default categories for new users:
- 🔴 **12 Expense Categories**: Ăn uống, Di chuyển, Nhà ở, Tiện ích, Mua sắm, Giải trí, Cá nhân, Y tế, Giáo dục, Tiết kiệm, Đầu tư, Khác
- 🟢 **6 Income Categories**: Lương, Thưởng, Thu nhập phụ, Đầu tư, Quà tặng, Khác

**Trigger Behavior:**
- Automatically runs when a new user is created
- Categories are marked as `is_default = true` (cannot be deleted)
- Includes Vietnamese and English names, icons, and color codes

---

## 🚀 How to Run Migrations

### Option 1: Supabase CLI (Recommended)

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Run migrations:**
   ```bash
   supabase db push
   ```

### Option 2: Supabase Dashboard (Manual)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of each migration file in order:
   - First: `001_initial_schema.sql`
   - Second: `002_seed_categories.sql`
4. Execute each migration

### Option 3: Direct Database Connection

If you have direct database access:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/migrations/001_initial_schema.sql \
  -f supabase/migrations/002_seed_categories.sql
```

---

## 🔍 Verify Migrations

After running migrations, verify they were successful:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'categories', 'transactions', 'budgets', 'audit_logs');

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check default categories were created (run after first user signs up)
SELECT name_vi, type, icon, color
FROM categories
WHERE is_default = true
ORDER BY type, created_at;
```

---

## 🗄️ Database Schema Overview

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       ├─────────────┬─────────────┬─────────────┐
       │             │             │             │
       ▼             ▼             ▼             ▼
┌────────────┐ ┌──────────────┐ ┌──────────┐ ┌─────────────┐
│ categories │ │ transactions │ │ budgets  │ │ audit_logs  │
└────────────┘ └──────────────┘ └──────────┘ └─────────────┘
       │             │
       └──────┬──────┘
              │
        (foreign key)
```

### Key Relationships

- `users` → `categories` (1:many)
- `users` → `transactions` (1:many)
- `users` → `budgets` (1:many)
- `users` → `audit_logs` (1:many)
- `categories` → `transactions` (1:many)
- `categories` → `budgets` (1:many)
- `categories` → `categories` (parent-child for subcategories)

---

## 🔒 Security Features

### Row-Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- ✅ Users can only view/modify their own data
- ✅ Default categories cannot be deleted
- ✅ Audit logs are read-only for users
- ✅ Transactions maintain ACID properties

### Audit Trail

Every transaction change is automatically logged:
- **INSERT**: Captures new transaction data
- **UPDATE**: Records old and new values
- **DELETE**: Preserves deleted transaction data

---

## 📊 Helper Functions

### get_transaction_summary()
Get income, expense, and net totals for a date range:

```sql
SELECT * FROM get_transaction_summary(
  'user-uuid-here',
  '2025-01-01'::timestamptz,
  '2025-01-31'::timestamptz
);
```

### get_spending_by_category()
Get spending breakdown by category:

```sql
SELECT * FROM get_spending_by_category(
  'user-uuid-here',
  '2025-01-01'::timestamptz,
  '2025-01-31'::timestamptz
);
```

### get_default_categories()
Get all default categories for a user:

```sql
SELECT * FROM get_default_categories('user-uuid-here');
```

---

## 🧪 Test Data (Development Only)

For testing purposes, you can manually insert a user and verify categories:

```sql
-- Insert test user (if not using auth)
INSERT INTO users (id, email, full_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 'Test User');

-- Check that default categories were created
SELECT name_vi, type, icon FROM categories
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY type DESC, name_vi;

-- Insert test transaction
INSERT INTO transactions (user_id, category_id, amount, type, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM categories WHERE user_id = '00000000-0000-0000-0000-000000000001' AND name_vi = 'Ăn uống' LIMIT 1),
  50000,
  'expense',
  'Cơm trưa'
);
```

---

## 🔄 Rolling Back Migrations

To rollback migrations, you'll need to create down migrations:

```sql
-- Drop in reverse order
DROP TRIGGER IF EXISTS create_categories_on_user_registration ON users;
DROP FUNCTION IF EXISTS create_default_categories_for_user();
DROP FUNCTION IF EXISTS get_default_categories(UUID);

DROP TRIGGER IF EXISTS audit_transactions_changes ON transactions;
DROP FUNCTION IF EXISTS audit_transaction_changes();
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

---

## 📝 Notes

- **Never modify existing migration files** - create new ones instead
- **Always test migrations locally** before running in production
- **Backup your database** before running migrations in production
- **Keep migrations atomic** - each should be independently runnable
- **Document breaking changes** clearly in migration comments

---

## 🆘 Troubleshooting

### Migration fails with "relation already exists"
The table already exists. Either:
1. Drop the existing table (⚠️ **data loss**)
2. Skip this migration
3. Modify the migration to use `IF NOT EXISTS`

### RLS blocks all queries
Make sure you're authenticated and `auth.uid()` returns the correct user ID:

```sql
SELECT auth.uid(); -- Should return your user UUID
```

### Trigger doesn't fire
Check if the trigger exists and is enabled:

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

---

## 📚 Additional Resources

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [SQL Triggers Documentation](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [ACID Properties](https://en.wikipedia.org/wiki/ACID)

---

**Last Updated**: 2025-11-12
**Schema Version**: 002
**Project**: FinanceFirst VN
