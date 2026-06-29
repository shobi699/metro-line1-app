import { z } from 'zod'

export const createAppealSchema = z.object({
  logId: z.string().min(1, 'شناسه رکورد الزامی است'),
  reason: z.string().min(5, 'ذکر دلیل اعتراض (حداقل ۵ کاراکتر) الزامی است'),
})

export type CreateAppealInput = z.infer<typeof createAppealSchema>
