import { prisma } from '@/server/db'

export interface FeedbackData {
  id: string
  type: string
  title: string
  body: string
  isAnonymous: boolean
  status: string
  reply: string | null
  repliedAt: Date | null
  createdAt: Date
  user?: { name: string } | null
}

export async function createFeedback(data: {
  userId?: string
  type: string
  title: string
  body: string
  isAnonymous?: boolean
}): Promise<FeedbackData> {
  return prisma.feedback.create({
    data: {
      userId: data.userId,
      type: data.type as 'criticism' | 'suggestion' | 'complaint' | 'appreciation',
      title: data.title,
      body: data.body,
      isAnonymous: data.isAnonymous ?? false,
    },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      isAnonymous: true,
      status: true,
      reply: true,
      repliedAt: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  })
}

export async function listFeedback(options?: {
  status?: string
  page?: number
  pageSize?: number
}): Promise<{ items: FeedbackData[]; total: number }> {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const where: Record<string, unknown> = {}
  if (options?.status) where.status = options.status

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        isAnonymous: true,
        status: true,
        reply: true,
        repliedAt: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.feedback.count({ where }),
  ])

  return { items, total }
}

export async function replyToFeedback(
  feedbackId: string,
  repliedBy: string,
  reply: string,
): Promise<void> {
  await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      reply,
      repliedBy,
      repliedAt: new Date(),
      status: 'responded',
    },
  })
}

export async function getFeedbackStats(): Promise<{
  total: number
  submitted: number
  underReview: number
  responded: number
}> {
  const [total, submitted, underReview, responded] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.count({ where: { status: 'submitted' } }),
    prisma.feedback.count({ where: { status: 'under_review' } }),
    prisma.feedback.count({ where: { status: 'responded' } }),
  ])
  return { total, submitted, underReview, responded }
}
