import { z } from 'zod'

export const trainStatusSchema = z.enum(['active', 'standby', 'maintenance', 'out_of_service'])
export const ticketPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])
export const faultStatusSchema = z.enum([
  'submitted',
  'under_review',
  'needs_info',
  'rejected',
  'approved',
  'in_repair',
  'repaired',
  'verified_closed',
  'deferred',
  'reopened',
])

export const createTrainSchema = z.object({
  trainNumber: z.string().min(1, 'شماره قطار الزامی است'),
  fleetSeries: z.string().optional(),
  manufacturer: z.string().optional(),
  wagonCount: z.number().int().min(1).default(7),
  status: trainStatusSchema.default('active'),
  notes: z.string().optional(),
})

export const updateTrainSchema = createTrainSchema.partial()

export const createWagonSchema = z.object({
  wagonCode: z.string().min(1, 'کد واگن الزامی است'),
  position: z.number().int().min(1).max(10),
  wagonType: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const createFaultCategorySchema = z.object({
  code: z.string().min(1, 'کد دسته‌بندی الزامی است'),
  title: z.string().min(1, 'عنوان دسته‌بندی الزامی است'),
  sortOrder: z.number().int().default(0),
})

export const createFaultCodeSchema = z.object({
  code: z.string().min(1, 'کد خطا الزامی است'),
  categoryId: z.string().min(1, 'شناسه دسته‌بندی الزامی است'),
  title: z.string().min(1, 'عنوان خطا الزامی است'),
  description: z.string().optional(),
  defaultPriority: ticketPrioritySchema.default('medium'),
  safetyCritical: z.boolean().default(false),
  requiresWagon: z.boolean().default(true),
  operatorGuide: z.string().optional(),
  keywords: z.string().optional(),
  aliases: z.string().optional(),
})

export const createFaultReportSchema = z.object({
  trainId: z.string().min(1, 'انتخاب قطار الزامی است'),
  wagonId: z.string().optional().nullable(),
  faultCodeId: z.string().min(1, 'انتخاب کد خطا الزامی است'),
  description: z.string().min(1, 'شرح خرابی الزامی است'),
  locationNote: z.string().optional().nullable(),
  occurredAt: z.string().transform((str) => new Date(str)),
  serviceImpact: z.enum(['none', 'delay', 'evacuated', 'removed_from_service']).default('none'),
  photoUrls: z.array(z.string()).optional().default([]),
  annotations: z.array(z.any()).optional().default([]),
})

export const reviewFaultReportSchema = z.object({
  action: z.enum(['approve', 'reject', 'needs_info']),
  reviewNote: z.string().optional(),
  priority: ticketPrioritySchema.optional(),
  assigneeId: z.string().optional().nullable(),
})

export const repairFaultReportSchema = z.object({
  actionsTaken: z.string().min(5, 'شرح اقدامات انجام‌شده الزامی است و باید حداقل ۵ کاراکتر باشد'),
  rootCause: z.string().min(3, 'علت ریشه‌ای خرابی الزامی است'),
  partsUsed: z
    .array(
      z.object({
        name: z.string().min(1, 'نام قطعه الزامی است'),
        qty: z.number().positive('تعداد باید مثبت باشد'),
        partNo: z.string().optional(),
      })
    )
    .optional()
    .default([]),
})

export const deferFaultReportSchema = z.object({
  deferReason: z.string().min(5, 'علت به تعویق انداختن الزامی است'),
  deferUntil: z.string().transform((str) => new Date(str)),
})

export const reopenFaultReportSchema = z.object({
  note: z.string().min(5, 'علت بازگشایی الزامی است'),
})

export const transitionSchema = z.object({
  action: z.enum([
    'approve',
    'reject',
    'needs_info',
    'resolve_info',
    'start_repair',
    'complete_repair',
    'verify',
    'defer',
    'reopen',
  ]),
  note: z.string().optional(),
  payload: z.any().optional(),
})

export type CreateTrainInput = z.infer<typeof createTrainSchema>
export type UpdateTrainInput = z.infer<typeof updateTrainSchema>
export type CreateWagonInput = z.infer<typeof createWagonSchema>
export type CreateFaultCategoryInput = z.infer<typeof createFaultCategorySchema>
export type CreateFaultCodeInput = z.infer<typeof createFaultCodeSchema>
export type CreateFaultReportInput = z.infer<typeof createFaultReportSchema>
export type ReviewFaultReportInput = z.infer<typeof reviewFaultReportSchema>
export type RepairFaultReportInput = z.infer<typeof repairFaultReportSchema>
export type DeferFaultReportInput = z.infer<typeof deferFaultReportSchema>
export type ReopenFaultReportInput = z.infer<typeof reopenFaultReportSchema>
export type TransitionInput = z.infer<typeof transitionSchema>
