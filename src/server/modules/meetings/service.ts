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
  typeId?: string | null
  roomId?: string | null
  requester?: { name: string; id: string }
  targetManager?: { name: string; id: string }
}

export async function getMeetingTypes() {
  return prisma.meetingType.findMany({
    where: { isActive: true },
    orderBy: { key: 'asc' },
  })
}

export async function getMeetingRooms() {
  return prisma.meetingRoom.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

export async function createMeetingRequest(data: {
  requesterId: string
  targetManagerId: string
  title: string
  description?: string
  scheduledAt: Date
  durationMinutes?: number
  typeId?: string
  roomId?: string
  formData?: any
  attendees?: string[]
}): Promise<MeetingData> {
  const duration = data.durationMinutes ?? 30
  const endAt = new Date(data.scheduledAt.getTime() + duration * 60 * 1000)

  // Validate room availability if roomId is specified
  if (data.roomId) {
    const conflict = await prisma.meetingRequest.findFirst({
      where: {
        roomId: data.roomId,
        status: { in: ['pending', 'approved'] },
        OR: [
          {
            scheduledAt: { lt: endAt },
            endAt: { gt: data.scheduledAt },
          },
        ],
      },
    })
    if (conflict) {
      throw new Error('اتاق جلسه در این زمان قبلاً رزرو شده است')
    }
  }

  return prisma.meetingRequest.create({
    data: {
      requesterId: data.requesterId,
      targetManagerId: data.targetManagerId,
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt,
      durationMinutes: duration,
      endAt,
      typeId: data.typeId,
      roomId: data.roomId,
      formData: data.formData ?? undefined,
      attendees: data.attendees ?? undefined,
    },
    include: {
      requester: { select: { name: true, id: true } },
      targetManager: { select: { name: true, id: true } },
    },
  }) as any
}

export async function getManagerMeetings(
  managerId: string,
  options?: { status?: string; startDate?: Date; endDate?: Date }
): Promise<MeetingData[]> {
  const where: Record<string, any> = { targetManagerId: managerId }
  if (options?.status) where.status = options.status
  if (options?.startDate || options?.endDate) {
    where.scheduledAt = {}
    if (options.startDate) where.scheduledAt.gte = options.startDate
    if (options.endDate) where.scheduledAt.lte = options.endDate
  }

  return prisma.meetingRequest.findMany({
    where,
    include: {
      requester: { select: { name: true, id: true } },
      targetManager: { select: { name: true, id: true } },
      room: true,
      meetingType: true,
    },
    orderBy: { scheduledAt: 'asc' },
  }) as any
}

export async function getUserMeetings(userId: string): Promise<MeetingData[]> {
  return prisma.meetingRequest.findMany({
    where: { requesterId: userId },
    include: {
      requester: { select: { name: true, id: true } },
      targetManager: { select: { name: true, id: true } },
      room: true,
      meetingType: true,
    },
    orderBy: { scheduledAt: 'desc' },
  }) as any
}

export async function reviewMeeting(
  meetingId: string,
  reviewedBy: string,
  status: 'approved' | 'rejected' | 'rescheduled',
  note?: string
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

/**
 * Smart engine to calculate slots
 */
export async function getAvailableSlots(
  hostId: string,
  date: Date,
  typeKey: string
): Promise<{ time: string; available: boolean; reason?: string }[]> {
  // 1. Get meeting type configurations
  const meetingType = await prisma.meetingType.findUnique({ where: { key: typeKey } })
  if (!meetingType) {
    throw new Error('نوع جلسه یافت نشد')
  }

  const duration = meetingType.durationMin
  const buffer = meetingType.bufferMin
  const totalSlotDuration = duration + buffer

  // 2. Map date to RTL weekday (0=Saturday ... 6=Friday)
  const jsDay = date.getDay()
  const rtlWeekday = (jsDay + 1) % 7

  // 3. Retrieve AvailabilityRules for this host
  const rules = await prisma.availabilityRule.findMany({
    where: {
      ownerType: 'user',
      ownerKey: hostId,
      weekday: rtlWeekday,
      isActive: true,
    },
  })

  if (rules.length === 0) {
    return [] // No availability rule set for this day
  }

  // 4. Check for full day or partial exceptions
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const exceptions = await prisma.availabilityException.findMany({
    where: {
      ownerType: 'user',
      ownerKey: hostId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  })

  const isFullDayException = exceptions.some((e) => !e.fromTime || !e.toTime)
  if (isFullDayException) {
    return [] // Blocked the whole day
  }

  // 5. Retrieve existing approved/pending meetings for this host on this day
  const existingMeetings = await prisma.meetingRequest.findMany({
    where: {
      targetManagerId: hostId,
      status: { in: ['pending', 'approved'] },
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      scheduledAt: true,
      durationMinutes: true,
    },
  })

  // Helper to convert time string (HH:MM) to minutes from midnight
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  // Helper to check if a slot overlaps with existing meetings or exceptions
  const hasOverlap = (startMin: number, endMin: number) => {
    // Check against existing meetings
    for (const m of existingMeetings) {
      const meetStart = m.scheduledAt.getHours() * 60 + m.scheduledAt.getMinutes()
      const meetEnd = meetStart + m.durationMinutes
      if (startMin < meetEnd && endMin > meetStart) {
        return { overlapped: true, reason: 'تداخل با جلسه دیگر' }
      }
    }

    // Check against exceptions
    for (const ex of exceptions) {
      if (ex.fromTime && ex.toTime) {
        const exStart = timeToMinutes(ex.fromTime)
        const exEnd = timeToMinutes(ex.toTime)
        if (startMin < exEnd && endMin > exStart) {
          return { overlapped: true, reason: 'بلاک زمانی ثبت شده توسط مدیر' }
        }
      }
    }

    return { overlapped: false }
  }

  const slots: { time: string; available: boolean; reason?: string }[] = []

  // 6. Generate slots based on rules
  for (const rule of rules) {
    const startMin = timeToMinutes(rule.fromTime)
    const endMin = timeToMinutes(rule.toTime)

    for (let current = startMin; current + duration <= endMin; current += totalSlotDuration) {
      const slotHour = Math.floor(current / 60)
      const slotMin = current % 60
      const timeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`

      const overlapCheck = hasOverlap(current, current + duration)
      slots.push({
        time: timeStr,
        available: !overlapCheck.overlapped,
        reason: overlapCheck.reason,
      })
    }
  }

  return slots.sort((a, b) => a.time.localeCompare(b.time))
}
