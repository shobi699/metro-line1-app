import { z } from 'zod'

const postTypes = ['news', 'blog', 'training', 'circular', 'gallery'] as const

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
})

export type CreatePostInput = z.infer<typeof createPostSchema>

export const updatePostSchema = createPostSchema.partial()

export type UpdatePostInput = z.infer<typeof updatePostSchema>

export const createCommentSchema = z.object({
  body: z.string().min(1, 'متن نظر الزامی است').max(1000, 'متن نظر طولانی است'),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
