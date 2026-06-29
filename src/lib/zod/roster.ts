import { z } from 'zod'

export const rosterUploadSchema = z.object({
  period: z.string().min(1, 'دوره زمانی الزامی است'),
})

export type RosterUploadInput = z.infer<typeof rosterUploadSchema>

export const swapRequestSchema = z.object({
  targetUserId: z.string().cuid('شناسه کاربر نامعتبر است'),
  sourceShiftId: z.string().cuid('شناسه شیفت مبدا نامعتبر است'),
  targetShiftId: z.string().cuid('شناسه شیفت مقصد نامعتبر است'),
  note: z.string().max(500, 'یادداشت حداکثر ۵۰۰ کاراکتر باشد').optional(),
})

export type SwapRequestInput = z.infer<typeof swapRequestSchema>

export const swapActionSchema = z.object({
  swapRequestId: z.string().cuid('شناسه درخواست نامعتبر است'),
})

export type SwapActionInput = z.infer<typeof swapActionSchema>

export const shiftNoteSchema = z.object({
  date: z.string().min(1, 'تاریخ الزامی است'),
  content: z.string().min(1, 'محتوای یادداشت الزامی است'),
})

export const shiftTaskSchema = z.object({
  date: z.string().min(1, 'تاریخ الزامی است'),
  title: z.string().min(1, 'عنوان الزامی است'),
  time: z.string().default('08:00'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  type: z.enum(['personal', 'system']).default('personal'),
  overtime: z.number().optional(),
  extraData: z.record(z.string(), z.unknown()).optional(),
})

export const shiftTemplateSchema = z.object({
  name: z.string().min(1, 'نام قالب الزامی است'),
  type: z.enum(['rotational', 'staff']),
  length: z.number().int().min(1, 'طول چرخه باید حداقل ۱ باشد'),
  shifts: z.array(
    z.object({
      day: z.number().int().min(1),
      code: z.enum(['morning', 'evening', 'night', 'off', 'office']),
      label: z.string(),
      hours: z.number(),
      startTime: z.string(),
      endTime: z.string(),
    }),
  ),
})

export const shiftAssignmentSchema = z
  .object({
    templateId: z.string().min(1),
    targetType: z.enum(['user', 'group']),
    targetId: z.string().min(1),
    anchorDate: z.string().min(1),
  })
  .refine(
    (data) => {
      if (data.targetType !== 'group') return true
      // کلید گروه یا ساده (A/B/C/ستادی) یا ترکیبی ({نوع}:{گروه}) پذیرفته می‌شود
      const simple = /^(A|B|C|ستادی|Staff)$/
      const composite = /^(9-15|12-24|ستادی):(A|B|C|ستادی|Staff)$/
      return simple.test(data.targetId) || composite.test(data.targetId)
    },
    { message: 'کلید گروه نامعتبر است؛ باید گروه ساده یا ترکیبی «نوع:گروه» باشد', path: ['targetId'] },
  )
