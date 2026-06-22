import { prisma } from '@/server/db'
import type { CreateTicketInput, UpdateTicketStatusInput } from '@/server/dto/safety'

export async function createTicket(data: CreateTicketInput, creatorId: string) {
  const ticket = await prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      priority: data.priority,
      wagonCode: data.wagonCode || null,
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
      note: data.description ?? null,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: creatorId,
      entity: 'Ticket',
      entityId: ticket.id,
      action: 'create',
      after: { title: data.title, priority: data.priority, wagonCode: data.wagonCode },
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
      creator: { select: { id: true, name: true, nationalId: true } },
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
      creator: { select: { id: true, name: true, nationalId: true } },
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
