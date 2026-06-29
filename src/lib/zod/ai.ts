import { z } from 'zod'

export const aiQuerySchema = z.object({
  prompt: z.string().min(1, 'متن درخواست نمی‌تواند خالی باشد'),
})

export type AiQueryInput = z.infer<typeof aiQuerySchema>
