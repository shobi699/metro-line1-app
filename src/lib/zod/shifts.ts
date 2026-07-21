import { z } from 'zod'

export const assignShiftSchema = z.object({
  userId: z.string().min(1, 'شناسه کاربر الزامی است'),
  date: z.string().min(1, 'تاریخ الزامی است'),
  code: z.enum(['morning', 'evening', 'night', 'off', 'office']),
  source: z.enum(['cycle', 'roster', 'manual']).optional(),
  note: z.string().optional().nullable(),
})

export type AssignShiftInput = z.infer<typeof assignShiftSchema>

export const publishSchema = z.object({
  startDate: z.string().min(1, 'تاریخ شروع الزامی است'),
  endDate: z.string().min(1, 'تاریخ پایان الزامی است'),
})

export type PublishInput = z.infer<typeof publishSchema>

export const resolvedSchema = z.object({
  userId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
})

export type ResolvedInput = z.infer<typeof resolvedSchema>

export const updateTaskSchema = z.object({
  id: z.string().min(1),
  updates: z.record(z.string(), z.unknown()),
})

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
