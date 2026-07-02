import { z } from 'zod'

export const createUserSchema = z.object({
  nationalId: z
    .string()
    .length(10, 'کد ملی باید ۱۰ رقم باشد')
    .regex(/^\d+$/, 'کد ملی فقط شامل اعداد باشد'),
  name: z.string().min(2, 'نام حداقل ۲ کاراکتر باشد'),
  phone: z
    .string()
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است')
    .optional()
    .or(z.literal('')),
  email: z.string().email('ایمیل نامعتبر است').optional().or(z.literal('')),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر باشد'),
  roleId: z.string().min(1, 'انتخاب نقش الزامی است'),
  status: z.enum(['pending', 'active', 'suspended']).default('active'),
  customFields: z.record(z.string(), z.any()).optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  name: z.string().min(2, 'نام حداقل ۲ کاراکتر باشد').optional(),
  phone: z
    .string()
    .regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  email: z
    .string()
    .email('ایمیل نامعتبر است')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  roleId: z.string().optional(),
  status: z.enum(['pending', 'active', 'suspended']).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر باشد').optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const updateSettingsSchema = z.object({
  updates: z.array(
    z.object({
      key: z.string().min(1, 'کلید تنظیم الزامی است'),
      value: z.any(),
    })
  ).min(1, 'لیست تغییرات نمی‌تواند خالی باشد'),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>

export const resetSettingSchema = z.object({
  key: z.string().min(1, 'کلید تنظیم الزامی است'),
})

export type ResetSettingInput = z.infer<typeof resetSettingSchema>

export const createSettingSchema = z.object({
  key: z.string().min(1, 'کلید تنظیم الزامی است'),
  label: z.string().min(1, 'عنوان تنظیم الزامی است'),
  description: z.string().optional(),
  type: z.enum(['text', 'number', 'boolean', 'select', 'color']),
  value: z.any(),
  category: z.string().default('general'),
  isEnabled: z.boolean().default(true),
})

export type CreateSettingInput = z.infer<typeof createSettingSchema>

export const deleteSettingSchema = z.object({
  key: z.string().min(1, 'کلید تنظیم الزامی است'),
})

export type DeleteSettingInput = z.infer<typeof deleteSettingSchema>


export const createActionTypeSchema = z.object({
  competencyId: z.string().min(1, 'انتخاب محور شایستگی الزامی است'),
  title: z.string().min(1, 'عنوان عملکرد الزامی است'),
  defaultScore: z.number(),
  maxSeverity: z.enum(['L1', 'L2', 'L3']).default('L1'),
})

export type CreateActionTypeInput = z.infer<typeof createActionTypeSchema>

export const createLogSchema = z.object({
  employeeId: z.string().min(1, 'انتخاب کارمند الزامی است'),
  actionTypeId: z.string().min(1, 'انتخاب نوع عملکرد الزامی است'),
  severity: z.enum(['L1', 'L2', 'L3']).default('L1'),
  note: z.string().optional().or(z.literal('')),
  evidenceUrl: z.string().optional().or(z.literal('')),
})

export type CreateLogInput = z.infer<typeof createLogSchema>

export const reviewAppealSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().optional().or(z.literal('')),
})

export type ReviewAppealInput = z.infer<typeof reviewAppealSchema>

export const createRoleSchema = z.object({
  key: z
    .string()
    .min(2, 'شناسه نقش حداقل ۲ کاراکتر باشد')
    .regex(/^[a-z_]+$/, 'شناسه نقش فقط باید شامل حروف انگلیسی کوچک و خط تیره پایین (underscore) باشد'),
  name: z.string().min(2, 'نام نقش حداقل ۲ کاراکتر باشد'),
  permissions: z.array(z.string()),
  rank: z.number().int().min(0).max(100).default(0),
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>

export const updateRoleSchema = z.object({
  name: z.string().min(2, 'نام نقش حداقل ۲ کاراکتر باشد').optional(),
  permissions: z.array(z.string()).optional(),
  rank: z.number().int().min(0).max(100).optional(),
})

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
