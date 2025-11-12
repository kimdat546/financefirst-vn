-- FinanceFirst VN - Seed Default Categories
-- Migration: 002_seed_categories.sql
-- Description: Create default Vietnamese categories for new users

-- =====================================================
-- FUNCTION: Auto-assign default categories to new users
-- =====================================================

CREATE OR REPLACE FUNCTION create_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default EXPENSE categories
  INSERT INTO categories (user_id, name_vi, name_en, type, icon, color, is_default) VALUES
  -- Essential living expenses
  (NEW.id, 'Ăn uống', 'Food & Drinks', 'expense', '🍜', '#FF6B6B', true),
  (NEW.id, 'Di chuyển', 'Transportation', 'expense', '🚗', '#4ECDC4', true),
  (NEW.id, 'Nhà ở', 'Housing', 'expense', '🏠', '#FCBAD3', true),
  (NEW.id, 'Tiện ích', 'Utilities', 'expense', '💡', '#A8D8EA', true),

  -- Personal & lifestyle
  (NEW.id, 'Mua sắm', 'Shopping', 'expense', '🛍️', '#FFE66D', true),
  (NEW.id, 'Giải trí', 'Entertainment', 'expense', '🎮', '#95E1D3', true),
  (NEW.id, 'Cá nhân', 'Personal', 'expense', '👤', '#FFAAA5', true),

  -- Health & education
  (NEW.id, 'Y tế', 'Healthcare', 'expense', '🏥', '#F38181', true),
  (NEW.id, 'Giáo dục', 'Education', 'expense', '📚', '#AA96DA', true),

  -- Financial
  (NEW.id, 'Tiết kiệm', 'Savings', 'expense', '💰', '#6BCB77', true),
  (NEW.id, 'Đầu tư', 'Investment', 'expense', '📈', '#4D96FF', true),

  -- Other
  (NEW.id, 'Khác', 'Others', 'expense', '📦', '#6B7280', true);

  -- Insert default INCOME categories
  INSERT INTO categories (user_id, name_vi, name_en, type, icon, color, is_default) VALUES
  (NEW.id, 'Lương', 'Salary', 'income', '💰', '#10B981', true),
  (NEW.id, 'Thưởng', 'Bonus', 'income', '🎁', '#FFD93D', true),
  (NEW.id, 'Thu nhập phụ', 'Side Income', 'income', '💼', '#8B5CF6', true),
  (NEW.id, 'Đầu tư', 'Investment Returns', 'income', '📈', '#6BCB77', true),
  (NEW.id, 'Quà tặng', 'Gifts', 'income', '🎀', '#F472B6', true),
  (NEW.id, 'Khác', 'Others', 'income', '💵', '#4D96FF', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_default_categories_for_user() IS
  'Automatically creates Vietnamese default categories when a new user is created';

-- =====================================================
-- TRIGGER: Create categories on user registration
-- =====================================================

CREATE TRIGGER create_categories_on_user_registration
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories_for_user();

COMMENT ON TRIGGER create_categories_on_user_registration ON users IS
  'Triggers automatic creation of default Vietnamese categories for new users';

-- =====================================================
-- REFERENCE: Vietnamese Category Structure
-- =====================================================

/*
EXPENSE CATEGORIES (Chi tiêu):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Essential Living (Nhu cầu thiết yếu):
  🍜  Ăn uống          - Food & Drinks          - #FF6B6B
  🚗  Di chuyển        - Transportation         - #4ECDC4
  🏠  Nhà ở            - Housing                - #FCBAD3
  💡  Tiện ích         - Utilities              - #A8D8EA

Personal & Lifestyle (Cá nhân & Phong cách sống):
  🛍️  Mua sắm          - Shopping               - #FFE66D
  🎮  Giải trí         - Entertainment          - #95E1D3
  👤  Cá nhân          - Personal               - #FFAAA5

Health & Education (Sức khỏe & Giáo dục):
  🏥  Y tế             - Healthcare             - #F38181
  📚  Giáo dục         - Education              - #AA96DA

Financial (Tài chính):
  💰  Tiết kiệm        - Savings                - #6BCB77
  📈  Đầu tư           - Investment             - #4D96FF

Other (Khác):
  📦  Khác             - Others                 - #6B7280

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INCOME CATEGORIES (Thu nhập):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  💰  Lương            - Salary                 - #10B981
  🎁  Thưởng           - Bonus                  - #FFD93D
  💼  Thu nhập phụ     - Side Income            - #8B5CF6
  📈  Đầu tư           - Investment Returns     - #6BCB77
  🎀  Quà tặng         - Gifts                  - #F472B6
  💵  Khác             - Others                 - #4D96FF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLOR PALETTE RATIONALE:
- Red tones (#FF6B6B, #F38181): Food, Healthcare - urgent/vital
- Blue/Cyan (#4ECDC4, #A8D8EA, #4D96FF): Transportation, Utilities - calm/essential
- Yellow (#FFE66D, #FFD93D): Shopping, Bonus - joy/excitement
- Green (#95E1D3, #10B981, #6BCB77): Entertainment, Salary, Investment - growth/money
- Purple/Pink (#AA96DA, #FCBAD3, #8B5CF6, #F472B6): Education, Housing, Side Income, Gifts - premium/special
- Orange (#FFAAA5): Personal - warm/individual
- Gray (#6B7280): Others - neutral/catch-all
*/

-- =====================================================
-- HELPER FUNCTION: Get user's default categories
-- =====================================================

CREATE OR REPLACE FUNCTION get_default_categories(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name_vi TEXT,
  name_en TEXT,
  type TEXT,
  icon TEXT,
  color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name_vi,
    c.name_en,
    c.type,
    c.icon,
    c.color
  FROM categories c
  WHERE c.user_id = p_user_id
    AND c.is_default = true
  ORDER BY
    c.type DESC, -- income first, then expense
    c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_default_categories(UUID) IS
  'Returns all default categories for a given user, sorted by type and creation date';
