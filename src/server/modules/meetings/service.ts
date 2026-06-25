import { prisma } from '@/server/db'

export interface MeetingData {
  id: string
  title: string
  description: string | null
  scheduledAt: Date
  durationMinutes: number
  status: string
  note: string | null
  createdAt: Date
  requester?: { name: string; id: string }
  targetManager?: { name: string; id: string }
}

export async function createMeetingRequest(data: {
  requesterId: string
  targetManagerId: string
  title: string
  description?: string
  scheduledAt: Date
  durationMinutes?: number
}): Promise<MeetingData> {
  return prisma.meetingRequest.create({
    data: {
      requesterId: data.requesterId,
      targetManagerId: data.targetManagerId,
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt,
      durationMinutes: data.durationMinutes ?? 30,
    },
    include: {
      requester: { select: { name: true, id: true } },
      targetManager: { select: { name: true, id: true } },
    },
  })
}

export async function getManagerMeetings(
  managerId: string,
  options?: { status?: string; startDate?: Date; endDate?: Date },
): Promise<MeetingData[]> {
  const where: Record<string, unknown> = { targetManagerId: managerId }
  if (options?.status) where.status = options.status
  if (options?.startDate || options?.endDate) {
    where.scheduledAt = {}
    if (options.startDate) (where.scheduledAt as Record<string, Date>).gte = options.startDate
    if (options.endDate) (where.scheduledAt as Record<string, Date>).lte = options.endDate
  }

  return prisma.meetingRequest.findMany({
    where,
    include: {
      requester: { select: { name: true, id: true } },
      targetManager: { select: { name: true, id: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  })
}

export async function getUserMeetings(userId: string): Promise<MeetingData[]> {
  return prisma.meetingRequest.findMany({
    where: { requesterId: userId },
    include: {
      requester: { select: { name: true, id: true } },
      targetManager: { select: { name: true, id: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  })
}

export async function reviewMeeting(
  meetingId: string,
  reviewedBy: string,
  status: 'approved' | 'rejected' | 'rescheduled',
  note?: string,
): Promise<void> {
  await prisma.meetingRequest.update({
    where: { id: meetingId },
    data: {
      status,
      reviewedBy,
      reviewedAt: new Date(),
      note,
    },
  })
}
