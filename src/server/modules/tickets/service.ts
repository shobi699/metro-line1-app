import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/server/db'
import type { CreateTicketInput, UpdateTicketStatusInput } from '@/lib/zod/safety'
import { getSettingValue } from '@/server/modules/settings/service'

export async function predictTicketPriority(title: string, description?: string) {
  const isAiEnabled = await getSettingValue<boolean>('tickets.aiPriorityEnabled', true)
  if (!isAiEnabled) {
    return {
      priority: 'medium' as const,
      matchedKeywords: [] as string[],
      reasons: ['تحلیلگر هوشمند AI غیرفعال است.']
    }
  }

  const criticalKeywords = (await getSettingValue<string>('tickets.criticalKeywords', ''))
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  const highKeywords = (await getSettingValue<string>('tickets.highKeywords', ''))
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  const mediumKeywords = (await getSettingValue<string>('tickets.mediumKeywords', ''))
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  const lowKeywords = (await getSettingValue<string>('tickets.lowKeywords', ''))
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  const fullText = `${title} ${description ?? ''}`.toLowerCase()

  const criticalMatches = criticalKeywords.filter((k) => fullText.includes(k.toLowerCase()))
  const highMatches = highKeywords.filter((k) => fullText.includes(k.toLowerCase()))
  const mediumMatches = mediumKeywords.filter((k) => fullText.includes(k.toLowerCase()))
  const lowMatches = lowKeywords.filter((k) => fullText.includes(k.toLowerCase()))

  if (criticalMatches.length > 0) {
    return {
      priority: 'critical' as const,
      matchedKeywords: criticalMatches,
      reasons: [`تشخیص اولویت بحرانی به دلیل وجود کلمات کلیدی: ${criticalMatches.join('، ')}`],
    }
  }

  if (highMatches.length > 0) {
    return {
      priority: 'high' as const,
      matchedKeywords: highMatches,
      reasons: [`تشخیص اولویت عمده به دلیل وجود کلمات کلیدی: ${highMatches.join('، ')}`],
    }
  }

  if (mediumMatches.length > 0) {
    return {
      priority: 'medium' as const,
      matchedKeywords: mediumMatches,
      reasons: [`تشخیص اولویت جزئی به دلیل وجود کلمات کلیدی: ${mediumMatches.join('، ')}`],
    }
  }

  if (lowMatches.length > 0) {
    return {
      priority: 'low' as const,
      matchedKeywords: lowMatches,
      reasons: [`تشخیص اولویت کم‌اهمیت به دلیل وجود کلمات کلیدی: ${lowMatches.join('، ')}`],
    }
  }

  return {
    priority: 'medium' as const,
    matchedKeywords: [] as string[],
    reasons: ['کلمه کلیدی خاصی یافت نشد. اولویت متوسط پیش‌فرض تعیین شد.'],
  }
}

export async function createTicket(data: CreateTicketInput, creatorId: string) {
  const allowNoWagon = await getSettingValue('tickets.allowNoWagon', true)
  if (!allowNoWagon && !data.wagonCode?.trim()) {
    throw new Error('وارد کردن شماره واگن الزامی است.')
  }

  const requireImage = await getSettingValue('tickets.requireImage', false)
  if (requireImage && !data.photoUrl?.trim()) {
    throw new Error('بارگذاری تصویر نقص فنی برای ثبت تیکت الزامی است.')
  }

  // AI priority prediction
  let finalPriority = data.priority || 'medium'
  let aiLogNote = ''
  const isAiEnabled = await getSettingValue('tickets.aiPriorityEnabled', true)
  if (isAiEnabled) {
    const aiPrediction = await predictTicketPriority(data.title, data.description ?? undefined)
    if (data.priority === 'medium') {
      finalPriority = aiPrediction.priority
    }
    if (aiPrediction.matchedKeywords.length > 0) {
      aiLogNote = ` [تحلیل خودکار AI: اولویت پیش‌بینی شده ${aiPrediction.priority} به دلیل کلمات کلیدی: ${aiPrediction.matchedKeywords.join('، ')}]`
    }
  }

  const ticket = await prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      priority: finalPriority,
      wagonCode: data.wagonCode || null,
      photoUrl: data.photoUrl || null,
      annotations: data.annotations?.length
        ? JSON.stringify(data.annotations)
        : Prisma.JsonNull,
      creatorId,
      status: 'open',
    },
  })

  // Create initial log entry
  await prisma.ticketLog.create({
    data: {
      ticketId: ticket.id,
      actorId: creatorId,
      action: 'created',
      note: `${data.description ?? ''}${aiLogNote}`.trim() || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: creatorId,
      entity: 'Ticket',
      entityId: ticket.id,
      action: 'create',
      after: { title: data.title, priority: finalPriority, wagonCode: data.wagonCode },
    },
  })

  return ticket
}

export async function listTickets(
  userId: string,
  roleKey: string,
  status?: string,
) {
  const where: Record<string, unknown> = {}

  if (status) {
    where.status = status
  }

  // Operators only see their own tickets
  if (roleKey === 'operator') {
    where.creatorId = userId
  }

  return prisma.ticket.findMany({
    where: where as never,
    include: {
      creator: { select: { id: true, name: true, personnelCode: true } },
      logs: {
        include: {
          actor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateTicketStatus(
  ticketId: string,
  data: UpdateTicketStatusInput,
  actorId: string,
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } })
  if (!ticket) throw new Error('تیکت یافت نشد')

  const oldStatus = ticket.status
  const newStatus = data.status

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    open: ['in_progress', 'closed'],
    in_progress: ['resolved', 'closed'],
    resolved: ['closed', 'open'],
    closed: ['open'],
  }

  if (!validTransitions[oldStatus]?.includes(newStatus)) {
    throw new Error(`تغییر وضعیت از ${oldStatus} به ${newStatus} مجاز نیست`)
  }

  const [updatedTicket] = await prisma.$transaction([
    prisma.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus },
    }),
    prisma.ticketLog.create({
      data: {
        ticketId,
        actorId,
        action: 'status_changed',
        note: data.note ?? `وضعیت از ${oldStatus} به ${newStatus} تغییر یافت`,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId,
        entity: 'Ticket',
        entityId: ticketId,
        action: 'update',
        before: { status: oldStatus },
        after: { status: newStatus },
      },
    }),
  ])

  return updatedTicket
}

export async function getTicketById(ticketId: string) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      creator: { select: { id: true, name: true, personnelCode: true } },
      logs: {
        include: {
          actor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function getTicketStats() {
  const [open, inProgress, resolved, closed] = await Promise.all([
    prisma.ticket.count({ where: { status: 'open' } }),
    prisma.ticket.count({ where: { status: 'in_progress' } }),
    prisma.ticket.count({ where: { status: 'resolved' } }),
    prisma.ticket.count({ where: { status: 'closed' } }),
  ])

  return { open, inProgress, resolved, closed, total: open + inProgress + resolved + closed }
}
