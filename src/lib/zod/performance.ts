import { z } from 'zod'

export const createAppealSchema = z.object({
  logId: z.string().min(1, 'شناسه رکورد الزامی است'),
  reason: z.string().min(5, 'ذکر دلیل اعتراض (حداقل ۵ کاراکتر) الزامی است'),
})

export const createPerformanceLogSchema = z.object({
  employeeId: z.string().min(1, 'انتخاب پرسنل الزامی است'),
  actionTypeId: z.string().min(1, 'نوع اقدام عملکردی الزامی است'),
  severity: z.enum(['L1', 'L2', 'L3']).default('L1'),
  periodId: z.string().min(1, 'دوره الزامی است'),
})

export const reviewAppealSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().optional().nullable(),
})

export type CreateAppealInput = z.infer<typeof createAppealSchema>
export type CreatePerformanceLogInput = z.infer<typeof createPerformanceLogSchema>
export type ReviewAppealInput = z.infer<typeof reviewAppealSchema>
