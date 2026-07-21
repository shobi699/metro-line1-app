import { z } from 'zod'

export const createBulletinSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  body: z.string().min(1, 'متن بخشنامه الزامی است'),
  active: z.boolean().optional().default(true),
})

export type CreateBulletinInput = z.infer<typeof createBulletinSchema>

export const createTicketSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  wagonCode: z.string().max(20, 'کد واگن حداکثر ۲۰ کاراکتر').optional().or(z.literal('')),
  photoUrl: z.string().url('آدرس تصویر نامعتبر است').optional().or(z.literal('')),
  annotations: z.array(z.object({
    x: z.number(),
    y: z.number(),
    text: z.string(),
  })).optional().default([]),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>

export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed'], {
    error: 'وضعیت نامعتبر است',
  }),
  note: z.string().max(500).optional(),
})

export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>
