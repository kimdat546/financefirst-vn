// FinanceFirst VN - Category Validation Schemas
// Vietnamese error messages for better UX

import { z } from 'zod'

// =====================================================
// CATEGORY VALIDATION
// =====================================================

export const categorySchema = z.object({
  user_id: z
    .string({
      required_error: 'ID người dùng là bắt buộc',
    })
    .uuid('ID người dùng không hợp lệ'),

  name_vi: z
    .string({
      required_error: 'Tên danh mục (tiếng Việt) là bắt buộc',
    })
    .min(1, 'Tên danh mục không được để trống')
    .max(100, 'Tên danh mục không được vượt quá 100 ký tự')
    .trim(),

  name_en: z
    .string()
    .max(100, 'Tên danh mục (tiếng Anh) không được vượt quá 100 ký tự')
    .trim()
    .optional()
    .nullable(),

  type: z.enum(['expense', 'income'], {
    required_error: 'Loại danh mục là bắt buộc',
    invalid_type_error: 'Loại danh mục phải là "expense" hoặc "income"',
  }),

  icon: z
    .string({
      required_error: 'Icon là bắt buộc',
    })
    .min(1, 'Icon không được để trống')
    .max(10, 'Icon không hợp lệ'),

  color: z
    .string({
      required_error: 'Màu sắc là bắt buộc',
    })
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Màu sắc phải ở định dạng hex (#RRGGBB)'),

  is_default: z.boolean().default(false),

  parent_category_id: z.string().uuid('ID danh mục cha không hợp lệ').optional().nullable(),
})

export type CategoryInput = z.infer<typeof categorySchema>

// =====================================================
// CREATE CATEGORY VALIDATION (without user_id)
// =====================================================

export const createCategorySchema = categorySchema.omit({ user_id: true })

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

// =====================================================
// UPDATE CATEGORY VALIDATION
// =====================================================

export const updateCategorySchema = categorySchema
  .omit({ user_id: true, is_default: true })
  .partial()
  .refine(
    (data) => {
      return Object.keys(data).length > 0
    },
    {
      message: 'Phải có ít nhất một trường để cập nhật',
    }
  )

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

// =====================================================
// PREDEFINED CATEGORY COLORS (Vietnamese palette)
// =====================================================

export const CATEGORY_COLORS = [
  { name: 'Đỏ', hex: '#FF6B6B' },
  { name: 'Cam', hex: '#FFA94D' },
  { name: 'Vàng', hex: '#FFE66D' },
  { name: 'Xanh lá', hex: '#6BCB77' },
  { name: 'Xanh dương', hex: '#4ECDC4' },
  { name: 'Xanh da trời', hex: '#4D96FF' },
  { name: 'Tím', hex: '#8B5CF6' },
  { name: 'Hồng', hex: '#F472B6' },
  { name: 'Xám', hex: '#6B7280' },
] as const

// =====================================================
// PREDEFINED CATEGORY ICONS (Vietnamese context)
// =====================================================

export const EXPENSE_ICONS = [
  { emoji: '🍜', name: 'Ăn uống' },
  { emoji: '🚗', name: 'Di chuyển' },
  { emoji: '🏠', name: 'Nhà ở' },
  { emoji: '💡', name: 'Tiện ích' },
  { emoji: '🛍️', name: 'Mua sắm' },
  { emoji: '🎮', name: 'Giải trí' },
  { emoji: '👤', name: 'Cá nhân' },
  { emoji: '🏥', name: 'Y tế' },
  { emoji: '📚', name: 'Giáo dục' },
  { emoji: '💰', name: 'Tiết kiệm' },
  { emoji: '📈', name: 'Đầu tư' },
  { emoji: '📦', name: 'Khác' },
] as const

export const INCOME_ICONS = [
  { emoji: '💰', name: 'Lương' },
  { emoji: '🎁', name: 'Thưởng' },
  { emoji: '💼', name: 'Thu nhập phụ' },
  { emoji: '📈', name: 'Đầu tư' },
  { emoji: '🎀', name: 'Quà tặng' },
  { emoji: '💵', name: 'Khác' },
] as const

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Validate category data and return typed result
 */
export function validateCategory(data: unknown) {
  return categorySchema.safeParse(data)
}

/**
 * Validate and parse category, throw error if invalid
 */
export function parseCategory(data: unknown): CategoryInput {
  return categorySchema.parse(data)
}

/**
 * Check if a color is in the predefined palette
 */
export function isValidCategoryColor(color: string): boolean {
  return CATEGORY_COLORS.some((c) => c.hex.toLowerCase() === color.toLowerCase())
}

/**
 * Check if an icon is in the predefined list
 */
export function isValidCategoryIcon(icon: string, type: 'expense' | 'income'): boolean {
  const icons = type === 'expense' ? EXPENSE_ICONS : INCOME_ICONS
  return icons.some((i) => i.emoji === icon)
}

/**
 * Get random color from palette
 */
export function getRandomCategoryColor(): string {
  const randomIndex = Math.floor(Math.random() * CATEGORY_COLORS.length)
  return CATEGORY_COLORS[randomIndex].hex
}

/**
 * Get default icon for a category type
 */
export function getDefaultIcon(type: 'expense' | 'income'): string {
  return type === 'expense' ? '📦' : '💵'
}
