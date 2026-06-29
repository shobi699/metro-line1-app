import { z } from 'zod'

export const userSearchSchema = z.object({
  q: z.string().optional().default(''),
  role: z.string().optional().default(''),
  status: z.string().optional().default(''),
  plate: z.string().optional().default(''),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export type UserSearchParams = z.infer<typeof userSearchSchema>

export const customFieldDefSchema = z.object({
  entityType: z.string().min(1, 'نوع موجودیت الزامی است'),
  name: z.string().min(1, 'نام فیلد الزامی است'),
  label: z.string().min(1, 'برچسب فیلد الزامی است'),
  type: z.enum(['text', 'number', 'select', 'date', 'boolean'], {
    error: 'نوع فیلد نامعتبر است',
  }),
  options: z
    .array(z.string())
    .optional()
    .default([]),
  required: z.boolean().optional().default(false),
  defaultValue: z.string().optional().nullable(),
  sortOrder: z.number().int().optional().default(0),
})

export type CustomFieldDefInput = z.infer<typeof customFieldDefSchema>

export const customFieldDefUpdateSchema = customFieldDefSchema.partial()

export const userImportRowSchema = z.object({
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
  role: z.string().optional().default('operator'),
  password: z.string().min(6, 'رمز عبور حداقل ۶ کاراکتر باشد').optional(),
})

export type UserImportRow = z.infer<typeof userImportRowSchema>
