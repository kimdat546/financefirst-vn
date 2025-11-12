// FinanceFirst VN - Budget Validation Schemas
// Vietnamese error messages for better UX

import { z } from 'zod'

// =====================================================
// BUDGET VALIDATION
// =====================================================

export const budgetSchema = z.object({
  user_id: z
    .string({
      required_error: 'ID người dùng là bắt buộc',
    })
    .uuid('ID người dùng không hợp lệ'),

  category_id: z.string().uuid('ID danh mục không hợp lệ').optional().nullable(),

  amount: z
    .number({
      required_error: 'Số tiền ngân sách là bắt buộc',
      invalid_type_error: 'Số tiền phải là một số',
    })
    .positive('Số tiền ngân sách phải lớn hơn 0')
    .max(999999999999.99, 'Số tiền ngân sách quá lớn')
    .refine(
      (val) => {
        return Number.isInteger(val * 100)
      },
      {
        message: 'Số tiền chỉ được có tối đa 2 chữ số thập phân',
      }
    ),

  period: z.enum(['daily', 'weekly', 'monthly', 'yearly'], {
    required_error: 'Chu kỳ ngân sách là bắt buộc',
    invalid_type_error: 'Chu kỳ không hợp lệ',
  }),

  start_date: z.date({
    required_error: 'Ngày bắt đầu là bắt buộc',
    invalid_type_error: 'Ngày bắt đầu không hợp lệ',
  }),

  end_date: z
    .date({
      invalid_type_error: 'Ngày kết thúc không hợp lệ',
    })
    .optional()
    .nullable(),
})

// Add custom validation for date range
export const budgetSchemaWithDateValidation = budgetSchema.refine(
  (data) => {
    if (data.end_date) {
      return data.end_date >= data.start_date
    }
    return true
  },
  {
    message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
    path: ['end_date'],
  }
)

export type BudgetInput = z.infer<typeof budgetSchema>

// =====================================================
// CREATE BUDGET VALIDATION (without user_id)
// =====================================================

export const createBudgetSchema = budgetSchema
  .omit({ user_id: true })
  .refine(
    (data) => {
      if (data.end_date) {
        return data.end_date >= data.start_date
      }
      return true
    },
    {
      message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
      path: ['end_date'],
    }
  )

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>

// =====================================================
// UPDATE BUDGET VALIDATION
// =====================================================

export const updateBudgetSchema = budgetSchema.omit({ user_id: true }).partial().refine(
  (data) => {
    return Object.keys(data).length > 0
  },
  {
    message: 'Phải có ít nhất một trường để cập nhật',
  }
)

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>

// =====================================================
// BUDGET PERIOD HELPERS
// =====================================================

export const BUDGET_PERIODS = [
  { value: 'daily', label: 'Hàng ngày', labelEn: 'Daily' },
  { value: 'weekly', label: 'Hàng tuần', labelEn: 'Weekly' },
  { value: 'monthly', label: 'Hàng tháng', labelEn: 'Monthly' },
  { value: 'yearly', label: 'Hàng năm', labelEn: 'Yearly' },
] as const

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Validate budget data and return typed result
 */
export function validateBudget(data: unknown) {
  return budgetSchemaWithDateValidation.safeParse(data)
}

/**
 * Validate and parse budget, throw error if invalid
 */
export function parseBudget(data: unknown): BudgetInput {
  return budgetSchemaWithDateValidation.parse(data)
}

/**
 * Calculate budget end date based on period
 */
export function calculateEndDate(startDate: Date, period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date {
  const endDate = new Date(startDate)

  switch (period) {
    case 'daily':
      endDate.setDate(endDate.getDate() + 1)
      break
    case 'weekly':
      endDate.setDate(endDate.getDate() + 7)
      break
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1)
      break
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1)
      break
  }

  return endDate
}

/**
 * Check if budget is currently active
 */
export function isBudgetActive(startDate: Date | string, endDate?: Date | string | null): boolean {
  const now = new Date()
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate

  if (!endDate) {
    return start <= now
  }

  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  return start <= now && now <= end
}

/**
 * Calculate days remaining in budget period
 */
export function getDaysRemaining(endDate: Date | string): number {
  const now = new Date()
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

/**
 * Calculate budget usage percentage
 */
export function calculateBudgetUsage(spent: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((spent / total) * 100)
}

/**
 * Get budget status based on usage
 */
export function getBudgetStatus(usagePercentage: number): {
  status: 'safe' | 'warning' | 'danger' | 'exceeded'
  label: string
  color: string
} {
  if (usagePercentage >= 100) {
    return {
      status: 'exceeded',
      label: 'Vượt ngân sách',
      color: '#EF4444', // red-500
    }
  } else if (usagePercentage >= 80) {
    return {
      status: 'danger',
      label: 'Gần hết ngân sách',
      color: '#F59E0B', // amber-500
    }
  } else if (usagePercentage >= 50) {
    return {
      status: 'warning',
      label: 'Cẩn thận',
      color: '#EAB308', // yellow-500
    }
  } else {
    return {
      status: 'safe',
      label: 'An toàn',
      color: '#10B981', // green-500
    }
  }
}

/**
 * Get Vietnamese label for budget period
 */
export function getBudgetPeriodLabel(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): string {
  const periodObj = BUDGET_PERIODS.find((p) => p.value === period)
  return periodObj?.label || period
}

/**
 * Suggest budget amount based on historical spending
 */
export function suggestBudgetAmount(
  historicalSpending: number[],
  multiplier: number = 1.1
): number {
  if (historicalSpending.length === 0) return 0

  const avgSpending = historicalSpending.reduce((sum, val) => sum + val, 0) / historicalSpending.length

  // Add 10% buffer by default
  return Math.round(avgSpending * multiplier)
}
