import { z } from 'zod'

export const aiQuerySchema = z.object({
  prompt: z.string().min(1, 'متن درخواست نمی‌تواند خالی باشد'),
  conversationId: z.string().optional(),
  category: z.enum(['technical', 'safety', 'operation', 'general']).optional(),
  imageUrl: z.string().optional(),
})

export type AiQueryInput = z.infer<typeof aiQuerySchema>
