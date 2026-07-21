import { z } from 'zod'

export const analyzeSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  description: z.string().optional(),
})

export type AnalyzeInput = z.infer<typeof analyzeSchema>
