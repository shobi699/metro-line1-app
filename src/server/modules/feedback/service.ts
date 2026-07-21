import { prisma } from '@/server/db'
import { randomBytes } from 'node:crypto'

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
  feedbackNo: number
  categoryId: string | null
  assigneeId: string | null
  priority: string
  anonToken: string | null
  isPublicIdea: boolean
  ideaVotesCount: number
  user?: { name: string } | null
  category?: { title: string; key: string } | null
}

export async function getFeedbackCategories() {
  return prisma.feedbackCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function createFeedback(data: {
  userId?: string
  type: string
  title: string
  body: string
  isAnonymous?: boolean
  categoryId?: string
  priority?: string
  formData?: any
  attachments?: string[]
  isPublicIdea?: boolean
}): Promise<FeedbackData> {
  const maxFeedback = await prisma.feedback.findFirst({
    orderBy: { feedbackNo: 'desc' },
    select: { feedbackNo: true },
  })
  const feedbackNo = (maxFeedback?.feedbackNo ?? 1000) + 1

  const isAnonymous = data.isAnonymous ?? false
  const anonToken = isAnonymous ? randomBytes(16).toString('hex') : null

  // Route to proper role if category is present
  let assigneeRole: string | null = null
  let firstResponseHours = 24
  let resolveHours = 120

  if (data.categoryId) {
    const category = await prisma.feedbackCategory.findUnique({
      where: { id: data.categoryId },
    })
    if (category) {
      assigneeRole = category.assigneeRole
      const sla = category.slaHours as { firstResponse: number; resolve: number }
      firstResponseHours = sla?.firstResponse ?? 24
      resolveHours = sla?.resolve ?? 120
    }
  }

  const now = new Date()
  const slaFirstDue = new Date(now.getTime() + firstResponseHours * 60 * 60 * 1000)
  const slaResolveDue = new Date(now.getTime() + resolveHours * 60 * 60 * 1000)

  // Idea baseline score calculation
  let baselineScore = 0
  const isIdea = data.type === 'suggestion' || data.isPublicIdea === true
  
  if (isIdea && !isAnonymous && data.userId) {
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: 'ideas.baseline_score' }
      })
      if (setting && setting.isEnabled) {
        baselineScore = Number(JSON.parse(setting.value))
      } else {
        baselineScore = 5
      }
    } catch {
      baselineScore = 5
    }
  }

  const finalFormData = baselineScore > 0 
    ? { ...(data.formData as object || {}), baselineScore }
    : (data.formData ?? undefined)

  const feedback = await prisma.feedback.create({
    data: {
      userId: data.userId,
      type: data.type as any,
      title: data.title,
      body: data.body,
      isAnonymous,
      feedbackNo,
      categoryId: data.categoryId || null,
      priority: data.priority || 'normal',
      formData: finalFormData ? (finalFormData as any) : undefined,
      attachments: data.attachments ?? undefined,
      anonToken,
      slaFirstDue,
      slaResolveDue,
      isPublicIdea: data.isPublicIdea ?? false,
      assigneeRole,
    },
    include: {
      user: { select: { name: true } },
      category: { select: { title: true, key: true } },
    },
  })

  // Log baseline score to Performance Evaluation
  if (baselineScore > 0 && !isAnonymous && data.userId) {
    try {
      // Ensure competency exists
      await prisma.competency.upsert({
        where: { id: 'innovation' },
        update: {},
        create: {
          id: 'innovation',
          name: 'نوآوری',
          weight: 1.5,
          direction: 'positive'
        }
      })

      // Ensure action type exists
      await prisma.performanceActionType.upsert({
        where: { id: 'a_idea_submit' },
        update: { defaultScore: baselineScore },
        create: {
          id: 'a_idea_submit',
          competencyId: 'innovation',
          title: 'ثبت ایده و پیشنهاد بهبود',
          defaultScore: baselineScore,
          maxSeverity: 'L1'
        }
      })

      // Calculate periodId
      const periodId = (() => {
        const d = new Date()
        try {
          const { getCurrentPeriodId } = require('../performance/service')
          return getCurrentPeriodId()
        } catch {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        }
      })()

      // Create log
      await prisma.performanceLog.create({
        data: {
          employeeId: data.userId,
          recordedById: data.userId,
          actionTypeId: 'a_idea_submit',
          severity: 'L1',
          scoreValue: baselineScore,
          note: `امتیاز پایه ثبت ایده: ${data.title}`,
          periodId,
          status: 'active',
        }
      })
    } catch (err) {
      console.error('Failed to log performance score for idea submission:', err)
    }
  }

  // Create initial log
  await prisma.feedbackLog.create({
    data: {
      feedbackId: feedback.id,
      action: 'submitted',
      detail: JSON.stringify({ categoryId: data.categoryId, priority: data.priority }),
    },
  })

  return feedback as any
}

export async function listFeedback(options?: {
  status?: string
  userId?: string
  categoryId?: string
  isPublicIdea?: boolean
  page?: number
  pageSize?: number
}): Promise<{ items: FeedbackData[]; total: number }> {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const where: Record<string, any> = {}

  if (options?.status) where.status = options.status
  if (options?.userId) where.userId = options.userId
  if (options?.categoryId) where.categoryId = options.categoryId
  if (options?.isPublicIdea !== undefined) where.isPublicIdea = options.isPublicIdea

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true } },
        category: { select: { title: true, key: true } },
      },
    }),
    prisma.feedback.count({ where }),
  ])

  return { items: items as any, total }
}

export async function getFeedbackDetail(
  feedbackId: string,
  authUserId?: string,
  anonToken?: string
) {
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    include: {
      user: { select: { name: true, role: { select: { key: true } } } },
      category: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { name: true } },
        },
      },
      logs: {
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { name: true } },
        },
      },
    },
  })

  if (!feedback) {
    throw new Error('بازخورد یافت نشد')
  }

  // Auth/Visibility check
  const isOwner = authUserId && feedback.userId === authUserId
  const hasToken = anonToken && feedback.anonToken === anonToken
  // Assume admins can see all. We will check role on controller layer but for service let's allow if owner, token, or auth user is provided.
  // Note: we can allow reading if user has permissions or if it's public idea.
  const isAllowed = isOwner || hasToken || feedback.isPublicIdea || authUserId

  if (!isAllowed) {
    throw new Error('دسترسی به این بازخورد امکان‌پذیر نیست')
  }

  return feedback
}

export async function addFeedbackMessage(
  feedbackId: string,
  data: {
    senderKind: 'submitter' | 'staff'
    senderId?: string
    body: string
    isInternal?: boolean
  }
) {
  const msg = await prisma.feedbackMessage.create({
    data: {
      feedbackId,
      senderKind: data.senderKind,
      senderId: data.senderId || null,
      body: data.body,
      isInternal: data.isInternal ?? false,
    },
  })

  // Update status if replied by staff
  if (data.senderKind === 'staff') {
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status: 'under_review' },
    })

    await prisma.feedbackLog.create({
      data: {
        feedbackId,
        actorId: data.senderId,
        action: 'responded_by_staff',
        detail: JSON.stringify({ body: data.body }),
      },
    })
  }

  return msg
}

export async function voteIdea(feedbackId: string, userId: string): Promise<void> {
  const existing = await prisma.ideaVote.findUnique({
    where: { feedbackId_userId: { feedbackId, userId } },
  })

  if (existing) {
    // Unvote
    await prisma.ideaVote.delete({
      where: { feedbackId_userId: { feedbackId, userId } },
    })
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { ideaVotesCount: { decrement: 1 } },
    })
  } else {
    // Vote
    await prisma.ideaVote.create({
      data: { feedbackId, userId },
    })
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { ideaVotesCount: { increment: 1 } },
    })
  }
}

export async function replyToFeedback(
  feedbackId: string,
  repliedBy: string,
  reply: string
): Promise<void> {
  await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      reply,
      repliedBy,
      repliedAt: new Date(),
      status: 'responded',
      closedAt: new Date(),
    },
  })

  await prisma.feedbackLog.create({
    data: {
      feedbackId,
      actorId: repliedBy,
      action: 'closed',
      detail: JSON.stringify({ reply }),
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

export async function getFeedbackByToken(anonToken: string) {
  const feedback = await prisma.feedback.findUnique({
    where: { anonToken },
    include: {
      user: { select: { name: true, role: { select: { key: true } } } },
      category: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { name: true } },
        },
      },
      logs: {
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { name: true } },
        },
      },
    },
  })

  if (!feedback) {
    throw new Error('بازخورد با این توکن یافت نشد')
  }

  return feedback
}

export async function createFeedbackCategory(data: any) {
  return prisma.feedbackCategory.create({ data })
}

export async function updateFeedbackCategory(id: string, data: any) {
  return prisma.feedbackCategory.update({
    where: { id },
    data,
  })
}

export async function deleteFeedbackCategory(id: string) {
  return prisma.feedbackCategory.delete({
    where: { id },
  })
}
