// FinanceFirst VN - TypeScript Type Definitions
// All types match the Supabase database schema

// =====================================================
// ENUM TYPES
// =====================================================

export type TransactionType = 'expense' | 'income'
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

// =====================================================
// DATABASE ENTITIES
// =====================================================

export interface User {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface Category {
  id: string
  user_id: string
  name_vi: string
  name_en?: string | null
  type: TransactionType
  icon: string
  color: string
  is_default: boolean
  parent_category_id?: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  category?: Category // Joined data
  amount: number
  type: TransactionType
  description?: string | null
  transaction_date: string
  created_at: string
  updated_at: string
  idempotency_key?: string | null
  metadata?: Record<string, any>
  deleted_at?: string | null
}

export interface Budget {
  id: string
  user_id: string
  category_id?: string | null
  category?: Category // Joined data
  amount: number
  period: BudgetPeriod
  start_date: string
  end_date?: string | null
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  table_name: string
  record_id: string
  action: AuditAction
  old_data?: Record<string, any> | null
  new_data?: Record<string, any> | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// =====================================================
// FORM INPUT TYPES
// =====================================================

export interface TransactionFormData {
  amount: number
  category_id: string
  type: TransactionType
  description?: string
  transaction_date: Date
}

export interface CategoryFormData {
  name_vi: string
  name_en?: string
  type: TransactionType
  icon: string
  color: string
  parent_category_id?: string
}

export interface BudgetFormData {
  category_id?: string
  amount: number
  period: BudgetPeriod
  start_date: Date
  end_date?: Date
}

// =====================================================
// SUMMARY & ANALYTICS TYPES
// =====================================================

export interface TransactionSummary {
  total_income: number
  total_expense: number
  net_amount: number
  transaction_count: number
}

export interface CategorySpending {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  total_amount: number
  transaction_count: number
}

export interface BudgetUsage {
  budget_id: string
  user_id: string
  budget_name: string
  budget_amount: number
  currency_code: string
  period: BudgetPeriod
  start_date: string
  end_date: string | null
  spent_amount: number
  remaining_amount: number
  usage_percentage: number
}

// =====================================================
// FILTER & QUERY TYPES
// =====================================================

export interface TransactionFilters {
  type?: TransactionType
  category_id?: string
  start_date?: string
  end_date?: string
  min_amount?: number
  max_amount?: number
  search?: string
}

export interface DateRange {
  start: Date
  end: Date
}

// =====================================================
// UI STATE TYPES
// =====================================================

export interface TransactionListState {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  filters: TransactionFilters
}

export interface CategoryState {
  categories: Category[]
  loading: boolean
  error: string | null
  selectedCategory: Category | null
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type CreateTransactionInput = Omit<
  Transaction,
  'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'category'
>

export type UpdateTransactionInput = Partial<CreateTransactionInput>

export type CreateCategoryInput = Omit<Category, 'id' | 'created_at'>

export type UpdateCategoryInput = Partial<CreateCategoryInput>

export type CreateBudgetInput = Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'category'>

export type UpdateBudgetInput = Partial<CreateBudgetInput>
