import { z } from 'zod'

export const createGroupRoomSchema = z.object({
  name: z.string().min(1, 'نام روم الزامی است').max(100, 'نام روم طولانی است'),
  kind: z
    .enum(['general', 'operators', 'occ', 'shift', 'station', 'announcement', 'emergency', 'training', 'management', 'custom'])
    .optional()
    .default('custom'),
  memberIds: z.array(z.string()).optional().default([]),
})

export type CreateGroupRoomInput = z.infer<typeof createGroupRoomSchema>

export const directRoomSchema = z.object({
  userId: z.string().min(1, 'شناسه کاربر الزامی است'),
})

export type DirectRoomInput = z.infer<typeof directRoomSchema>

/** اولویت پیام — بخش ۵.۳ */
export const messagePrioritySchema = z.enum(['normal', 'important', 'urgent', 'emergency', 'critical']).default('normal')

export const sendMessageSchema = z
  .object({
    body: z.string().max(4000, 'متن پیام طولانی است').optional(),
    attachmentUrl: z.string().optional(),
    attachmentType: z.string().optional(),
    priority: messagePrioritySchema.optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
  })
  .refine((d) => (d.body && d.body.trim().length > 0) || d.attachmentUrl, {
    message: 'متن یا پیوست پیام الزامی است',
  })

export type SendMessageInput = z.infer<typeof sendMessageSchema>

export const pinMessageSchema = z.object({
  messageId: z.string().min(1, 'شناسه پیام الزامی است'),
  pinned: z.boolean(),
})

export type PinMessageInput = z.infer<typeof pinMessageSchema>
