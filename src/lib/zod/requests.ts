import { z } from 'zod'

export const requestCategoryEnum = z.enum(['leave', 'duty', 'overtime', 'mission'])
export const requestUnitEnum = z.enum(['hours', 'days', 'count'])

export const requestTypeConfigSchema = z.object({
  id: z.string().min(1, 'شناسه الزامی است'),
  label: z.string().min(1, 'عنوان الزامی است'),
  category: requestCategoryEnum,
  unit: requestUnitEnum,
  multiplier: z.number().min(0),
  requiresApproval: z.boolean().default(true),
  isEnabled: z.boolean().default(true),
})

export type RequestTypeConfig = z.infer<typeof requestTypeConfigSchema>

export const submitRequestSchema = z.object({
  typeId: z.string().min(1, 'نوع درخواست الزامی است'),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  amount: z.number().positive('مقدار باید مثبت باشد'),
  reason: z.string().optional(),
})

export type SubmitRequestInput = z.infer<typeof submitRequestSchema>

export const reviewRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().optional(),
})

export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>
