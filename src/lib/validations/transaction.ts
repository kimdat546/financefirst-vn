// FinanceFirst VN - Transaction Validation Schemas
// Vietnamese error messages for better UX

import { z } from 'zod'

// =====================================================
// TRANSACTION VALIDATION
// =====================================================

export const transactionSchema = z.object({
  amount: z
    .number({
      required_error: 'Số tiền là bắt buộc',
      invalid_type_error: 'Số tiền phải là một số',
    })
    .positive('Số tiền phải lớn hơn 0')
    .max(999999999999.99, 'Số tiền quá lớn')
    .refine(
      (val) => {
        // Check if number has at most 2 decimal places
        return Number.isInteger(val * 100)
      },
      {
        message: 'Số tiền chỉ được có tối đa 2 chữ số thập phân',
      }
    ),

  category_id: z
    .string({
      required_error: 'Danh mục là bắt buộc',
    })
    .uuid('ID danh mục không hợp lệ'),

  type: z.enum(['expense', 'income'], {
    required_error: 'Loại giao dịch là bắt buộc',
    invalid_type_error: 'Loại giao dịch phải là "expense" hoặc "income"',
  }),

  description: z
    .string()
    .max(500, 'Ghi chú không được vượt quá 500 ký tự')
    .optional()
    .nullable(),

  transaction_date: z.date({
    required_error: 'Ngày giao dịch là bắt buộc',
    invalid_type_error: 'Ngày giao dịch không hợp lệ',
  }),

  idempotency_key: z.string().uuid().optional(),

  metadata: z.record(z.any()).optional(),
})

export type TransactionInput = z.infer<typeof transactionSchema>

// =====================================================
// UPDATE TRANSACTION VALIDATION
// =====================================================

export const updateTransactionSchema = transactionSchema.partial().refine(
  (data) => {
    // At least one field must be provided for update
    return Object.keys(data).length > 0
  },
  {
    message: 'Phải có ít nhất một trường để cập nhật',
  }
)

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>

// =====================================================
// BULK TRANSACTION VALIDATION
// =====================================================

export const bulkTransactionSchema = z.object({
  transactions: z
    .array(transactionSchema)
    .min(1, 'Phải có ít nhất một giao dịch')
    .max(100, 'Không được vượt quá 100 giao dịch cùng lúc'),
})

export type BulkTransactionInput = z.infer<typeof bulkTransactionSchema>

// =====================================================
// TRANSACTION FILTERS VALIDATION
// =====================================================

export const transactionFiltersSchema = z.object({
  type: z.enum(['expense', 'income']).optional(),
  category_id: z.string().uuid().optional(),
  start_date: z
    .string()
    .datetime()
    .or(z.date())
    .optional()
    .transform((val) => (val instanceof Date ? val.toISOString() : val)),
  end_date: z
    .string()
    .datetime()
    .or(z.date())
    .optional()
    .transform((val) => (val instanceof Date ? val.toISOString() : val)),
  min_amount: z.number().nonnegative().optional(),
  max_amount: z.number().positive().optional(),
  search: z.string().max(100).optional(),
})

export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>

// =====================================================
// DATE RANGE VALIDATION
// =====================================================

export const dateRangeSchema = z
  .object({
    start: z.date({
      required_error: 'Ngày bắt đầu là bắt buộc',
    }),
    end: z.date({
      required_error: 'Ngày kết thúc là bắt buộc',
    }),
  })
  .refine(
    (data) => {
      return data.end >= data.start
    },
    {
      message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu',
      path: ['end'],
    }
  )

export type DateRangeInput = z.infer<typeof dateRangeSchema>

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Validate transaction data and return typed result
 */
export function validateTransaction(data: unknown) {
  return transactionSchema.safeParse(data)
}

/**
 * Validate and parse transaction, throw error if invalid
 */
export function parseTransaction(data: unknown): TransactionInput {
  return transactionSchema.parse(data)
}

/**
 * Generate idempotency key from transaction data
 * Helps prevent duplicate submissions
 */
export function generateIdempotencyKey(userId: string, data: TransactionInput): string {
  const key = `${userId}-${data.type}-${data.amount}-${data.category_id}-${data.transaction_date.getTime()}`
  return Buffer.from(key).toString('base64')
}

/**
 * Validate amount is within reasonable bounds for Vietnamese currency
 * VND typically ranges from 1,000 to billions
 */
export function isReasonableVNDAmount(amount: number): boolean {
  return amount >= 1000 && amount <= 1000000000000 // 1 trillion VND max
}

/**
 * Format amount for Vietnamese locale
 */
export function formatVNDAmount(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}
