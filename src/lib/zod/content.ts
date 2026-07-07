import { z } from 'zod'

const postTypes = ['news', 'blog', 'training', 'circular', 'gallery', 'announcement', 'directive', 'form'] as const
const postStatuses = ['draft', 'review', 'approved', 'published', 'archived'] as const

export const createPostSchema = z.object({
  type: z.enum(postTypes).optional().default('news'),
  title: z.string().min(1, 'عنوان الزامی است').max(200, 'عنوان طولانی است'),
  excerpt: z.string().max(500, 'خلاصه طولانی است').optional().or(z.literal('')),
  body: z.string().min(1, 'متن الزامی است'),
  category: z.string().max(60).optional().or(z.literal('')),
  coverUrl: z.string().optional().or(z.literal('')),
  mediaUrl: z.string().optional().or(z.literal('')),
  mediaType: z.string().optional().or(z.literal('')),
  published: z.boolean().optional().default(true),
  mandatory: z.boolean().optional().default(false),
  status: z.enum(postStatuses).optional().default('draft'),
  publishAt: z.string().optional().or(z.literal('')),
  nextReviewAt: z.string().optional().or(z.literal('')),

  // New Announcements Platform fields
  kind: z.enum(['news', 'notice', 'must_read', 'urgent_banner', 'emergency']).optional().default('news'),
  audience: z.object({
    roles: z.array(z.string()).optional(),
    groups: z.array(z.string()).optional(),
    stations: z.array(z.string()).optional(),
    shiftCodes: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
  }).nullable().optional(),
  surfaces: z.array(z.string()).optional(),
  priority: z.number().optional().default(0),
  pinnedUntil: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  ackRequired: z.boolean().optional().default(false),
  ackDeadline: z.string().nullable().optional(),
  bannerStyle: z.object({
    color: z.enum(['red', 'amber', 'blue', 'green']),
    icon: z.string().optional(),
    dismissible: z.boolean().optional(),
  }).nullable().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
  })).nullable().optional(),
  notifyRuleKey: z.string().nullable().optional(),
})

export type CreatePostInput = z.infer<typeof createPostSchema>

export const updatePostSchema = createPostSchema.partial()

export type UpdatePostInput = z.infer<typeof updatePostSchema>

export const transitionPostStatusSchema = z.object({
  status: z.enum(postStatuses),
})

export type TransitionPostStatusInput = z.infer<typeof transitionPostStatusSchema>

export const createCommentSchema = z.object({
  body: z.string().min(1, 'متن نظر الزامی است').max(1000, 'متن نظر طولانی است'),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
