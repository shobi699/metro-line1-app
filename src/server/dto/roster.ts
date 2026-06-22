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
