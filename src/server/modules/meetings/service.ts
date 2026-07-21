import { prisma } from '@/server/db'
import { getSettingValue } from '@/server/modules/settings/service'
import { notifyEvent } from '@/server/modules/notifications/gateway'

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
  cancelReason?: string | null
  rescheduleOf?: string | null
  outcomeNote?: string | null
  requester?: { name: string; id: string }
  targetManager?: { name: string; id: string }
  room?: { id: string; name: string } | null
  meetingType?: { id: string; key: string; title: string } | null
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

function getShiftInterval(date: Date, code: string): { start: Date; end: Date } | null {
  if (code === 'off') return null
  const base = new Date(date)
  base.setHours(0, 0, 0, 0)
  const baseTime = base.getTime()
  let startOffset = 0
  let endOffset = 0
  if (code === 'morning') {
    startOffset = 6
    endOffset = 14
  } else if (code === 'evening') {
    startOffset = 14
    endOffset = 22
  } else if (code === 'night') {
    startOffset = 22
    endOffset = 30 // 06:00 next day
  } else if (code === 'office') {
    startOffset = 7.5
    endOffset = 16.25 // 16:15
  } else {
    return null
  }
  return {
    start: new Date(baseTime + startOffset * 60 * 60 * 1000),
    end: new Date(baseTime + endOffset * 60 * 60 * 1000),
  }
}

/** Check if host is available for a given slot, considering rules, shifts, meetings, exceptions. */
export async function isHostAvailable(
  userId: string,
  scheduledAt: Date,
  durationMinutes: number,
  typeKey: string
): Promise<{ available: boolean; reason?: string }> {
  const startOfDay = new Date(scheduledAt)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(scheduledAt)
  endOfDay.setHours(23, 59, 59, 999)

  const jsDay = scheduledAt.getDay()
  const rtlWeekday = (jsDay + 1) % 7

  const meetingType = await prisma.meetingType.findUnique({ where: { key: typeKey } })
  if (!meetingType) return { available: false, reason: 'نوع جلسه یافت نشد' }

  // 1. Rules
  let rules = await prisma.availabilityRule.findMany({
    where: { ownerType: 'user', ownerKey: userId, weekday: rtlWeekday, isActive: true },
  })
  if (rules.length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { key: true } } },
    })
    if (user?.role?.key) {
      rules = await prisma.availabilityRule.findMany({
        where: { ownerType: 'role', ownerKey: user.role.key, weekday: rtlWeekday, isActive: true },
      })
    }
  }
  if (rules.length === 0) return { available: false, reason: 'خارج از ساعت حضور' }

  const slotStartMin = scheduledAt.getHours() * 60 + scheduledAt.getMinutes()
  const slotEndMin = slotStartMin + durationMinutes

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  let inRule = false
  for (const rule of rules) {
    const startMin = timeToMinutes(rule.fromTime)
    const endMin = timeToMinutes(rule.toTime)
    if (slotStartMin >= startMin && slotEndMin <= endMin) {
      inRule = true
      break
    }
  }
  if (!inRule) return { available: false, reason: 'خارج از ساعت حضور تعریف شده' }

  // 2. Exceptions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { key: true } } },
  })
  const exceptions = await prisma.availabilityException.findMany({
    where: {
      OR: [
        { ownerType: 'user', ownerKey: userId },
        ...(user?.role?.key ? [{ ownerType: 'role', ownerKey: user.role.key }] : []),
      ],
      date: { gte: startOfDay, lte: endOfDay },
    },
  })
  if (exceptions.some((e) => !e.fromTime || !e.toTime)) {
    return { available: false, reason: 'بلاک زمانی کل روز' }
  }
  for (const ex of exceptions) {
    if (ex.fromTime && ex.toTime) {
      const exStart = timeToMinutes(ex.fromTime)
      const exEnd = timeToMinutes(ex.toTime)
      if (slotStartMin < exEnd && slotEndMin > exStart) {
        return { available: false, reason: 'بلاک زمانی ثبت شده توسط مدیر' }
      }
    }
  }

  // 3. Shift Deductions
  const autoDeduct = await getSettingValue('meetings.autoDeductShifts', true)
  if (autoDeduct) {
    // Night shift rest day check (No morning slots if night shift yesterday)
    const prevDate = new Date(scheduledAt)
    prevDate.setDate(prevDate.getDate() - 1)
    const startOfPrevDay = new Date(prevDate)
    startOfPrevDay.setHours(0, 0, 0, 0)
    const endOfPrevDay = new Date(prevDate)
    endOfPrevDay.setHours(23, 59, 59, 999)

    const shiftsYesterday = await prisma.shift.findMany({
      where: { userId, date: { gte: startOfPrevDay, lte: endOfPrevDay } },
    })
    if (shiftsYesterday.some((s) => s.code === 'night') && slotStartMin < 12 * 60) {
      return { available: false, reason: 'استراحت پس از شیفت شب (شبکار فردا صبح)' }
    }

    // Active shift today check
    const shiftsToday = await prisma.shift.findMany({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } },
    })
    for (const shift of shiftsToday) {
      const interval = getShiftInterval(scheduledAt, shift.code)
      if (interval) {
        const startMin = interval.start.getHours() * 60 + interval.start.getMinutes()
        const endMin = (interval.end.getTime() - interval.start.getTime()) / (60 * 1000) + startMin
        if (slotStartMin < endMin && slotEndMin > startMin) {
          return { available: false, reason: 'تداخل با شیفت کاری راهبر/مدیر' }
        }
      }
    }
  }

  // 4. Existing Meetings
  const existingMeetings = await prisma.meetingRequest.findMany({
    where: {
      targetManagerId: userId,
      status: { in: ['pending', 'approved'] },
      scheduledAt: { gte: startOfDay, lte: endOfDay },
    },
  })
  for (const m of existingMeetings) {
    const meetStart = m.scheduledAt.getHours() * 60 + m.scheduledAt.getMinutes()
    const meetEnd = meetStart + m.durationMinutes
    if (slotStartMin < meetEnd && slotEndMin > meetStart) {
      return { available: false, reason: 'تداخل با جلسه دیگر' }
    }
  }

  return { available: true }
}

export async function isUserBannedFromBooking(userId: string): Promise<{ banned: boolean; reason?: string }> {
  const lateCancelHours = await getSettingValue<number>('meetings.lateCancelHours', 24)
  const maxLateCancellations = await getSettingValue<number>('meetings.maxLateCancellations', 3)
  const banDurationDays = await getSettingValue<number>('meetings.banDurationDays', 14)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const cancelledMeetings = await prisma.meetingRequest.findMany({
    where: {
      requesterId: userId,
      cancelReason: { not: null },
      updatedAt: { gte: thirtyDaysAgo },
    },
  })

  let lateCancelsCount = 0
  let lastLateCancelDate: Date | null = null

  for (const m of cancelledMeetings) {
    const limit = m.scheduledAt.getTime() - lateCancelHours * 60 * 60 * 1000
    if (m.updatedAt.getTime() > limit) {
      lateCancelsCount++
      if (!lastLateCancelDate || m.updatedAt > lastLateCancelDate) {
        lastLateCancelDate = m.updatedAt
      }
    }
  }

  if (lateCancelsCount >= maxLateCancellations && lastLateCancelDate) {
    const banEndDate = new Date(lastLateCancelDate)
    banEndDate.setDate(banEndDate.getDate() + banDurationDays)
    
    if (new Date() < banEndDate) {
      const banDaysLeft = Math.ceil((banEndDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
      return {
        banned: true,
        reason: `محرومیت به دلیل لغو دیرهنگام بیش از حد مجاز (${lateCancelsCount} بار). ${banDaysLeft} روز از محرومیت باقی مانده است.`
      }
    }
  }

  return { banned: false }
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
  // 1. Discipline Ban Check
  const banStatus = await isUserBannedFromBooking(data.requesterId)
  if (banStatus.banned) {
    throw new Error(banStatus.reason)
  }

  let finalHostId = data.targetManagerId
  let resolvedRoleKey: string | null = null

  // 2. Fetch Meeting Type
  const meetingType = data.typeId
    ? await prisma.meetingType.findUnique({ where: { id: data.typeId } })
    : null

  const duration = data.durationMinutes ?? meetingType?.durationMin ?? 30
  const endAt = new Date(data.scheduledAt.getTime() + duration * 60 * 1000)

  // 3. Resolve Role Host (Round-Robin with shift matching)
  if (data.targetManagerId.startsWith('role:') || (meetingType && meetingType.hostMode === 'role')) {
    const roleKey = data.targetManagerId.startsWith('role:')
      ? data.targetManagerId.split(':')[1]
      : meetingType!.hostRoleKey!

    resolvedRoleKey = roleKey

    // Get all active users of this role
    const candidateHosts = await prisma.user.findMany({
      where: { role: { key: roleKey }, status: 'active' },
    })

    if (candidateHosts.length === 0) {
      throw new Error('هیچ کاربری با این نقش در سامانه فعال نیست')
    }

    const availableCandidates: { userId: string; isOnShift: boolean; meetingCount: number }[] = []

    for (const candidate of candidateHosts) {
      const avail = await isHostAvailable(candidate.id, data.scheduledAt, duration, meetingType?.key || 'public_visit')
      if (avail.available) {
        // Check if candidate is currently on shift at this time
        let isOnShift = false
        const dayStart = new Date(data.scheduledAt)
        dayStart.setHours(0,0,0,0)
        const dayEnd = new Date(data.scheduledAt)
        dayEnd.setHours(23,59,59,999)

        const shiftsToday = await prisma.shift.findMany({
          where: { userId: candidate.id, date: { gte: dayStart, lte: dayEnd } },
        })
        for (const shift of shiftsToday) {
          const interval = getShiftInterval(data.scheduledAt, shift.code)
          if (interval && data.scheduledAt >= interval.start && endAt <= interval.end) {
            isOnShift = true
            break
          }
        }

        // Count meetings in current Gregorian week
        const startOfWeek = new Date(data.scheduledAt)
        startOfWeek.setDate(startOfWeek.getDate() - 3)
        const endOfWeek = new Date(data.scheduledAt)
        endOfWeek.setDate(endOfWeek.getDate() + 3)

        const meetingCount = await prisma.meetingRequest.count({
          where: {
            targetManagerId: candidate.id,
            status: { in: ['approved', 'pending'] },
            scheduledAt: { gte: startOfWeek, lte: endOfWeek },
          },
        })

        availableCandidates.push({ userId: candidate.id, isOnShift, meetingCount })
      }
    }

    if (availableCandidates.length === 0) {
      throw new Error('هیچ کارشناس یا مدیری در این بازه زمانی آزاد نیست')
    }

    // Sort: Shift-active first, then less meeting count
    availableCandidates.sort((a, b) => {
      if (a.isOnShift && !b.isOnShift) return -1
      if (!a.isOnShift && b.isOnShift) return 1
      return a.meetingCount - b.meetingCount
    })

    finalHostId = availableCandidates[0].userId
  } else {
    // Direct User Host Check
    const avail = await isHostAvailable(finalHostId, data.scheduledAt, duration, meetingType?.key || 'public_visit')
    if (!avail.available) {
      throw new Error(avail.reason || 'میزبان انتخابی در این بازه زمانی در دسترس نیست')
    }
  }

  // 4. Validate Room Conflict
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

  // 5. Check user weekly limit if configured in MeetingType
  if (meetingType && meetingType.maxPerWeek) {
    const startOfWeek = new Date(data.scheduledAt)
    startOfWeek.setDate(startOfWeek.getDate() - 6)
    const userMeetingCount = await prisma.meetingRequest.count({
      where: {
        requesterId: data.requesterId,
        typeId: data.typeId,
        createdAt: { gte: startOfWeek },
      },
    })
    if (userMeetingCount >= meetingType.maxPerWeek) {
      throw new Error(`شما سقف رزرو هفتگی خود برای این نوع جلسه (${meetingType.maxPerWeek} بار) را پر کرده‌اید`)
    }
  }

  // 6. Set status based on meeting approval rule
  const status = meetingType?.approval === 'auto' ? 'approved' : 'pending'

  const meeting = await prisma.meetingRequest.create({
    data: {
      requesterId: data.requesterId,
      targetManagerId: finalHostId,
      hostRoleKey: resolvedRoleKey,
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt,
      durationMinutes: duration,
      endAt,
      typeId: data.typeId,
      roomId: data.roomId,
      status,
      formData: data.formData ?? undefined,
      attendees: data.attendees ?? undefined,
    },
    include: {
      requester: { select: { name: true, id: true } },
      targetManager: { select: { name: true, id: true } },
    },
  })

  // 7. Write Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: data.requesterId,
      entity: 'MeetingRequest',
      entityId: meeting.id,
      action: 'create',
      after: { title: data.title, scheduledAt: data.scheduledAt },
    },
  })

  // 8. Trigger notifications
  try {
    await notifyEvent(status === 'approved' ? 'meeting.approved' : 'meeting.booked', [finalHostId, data.requesterId], {
      title: data.title,
      date: data.scheduledAt.toLocaleDateString('fa-IR'),
    })
  } catch {
    // Ignore notification failures
  }

  return meeting as any
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
  const meeting = await prisma.meetingRequest.findUnique({
    where: { id: meetingId },
  })
  if (!meeting) throw new Error('جلسه یافت نشد')

  const before = { status: meeting.status }

  await prisma.meetingRequest.update({
    where: { id: meetingId },
    data: {
      status,
      reviewedBy,
      reviewedAt: new Date(),
      note,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: reviewedBy,
      entity: 'MeetingRequest',
      entityId: meetingId,
      action: 'update',
      before,
      after: { status, note },
    },
  })

  // Notify parties
  try {
    await notifyEvent(status === 'approved' ? 'meeting.approved' : 'meeting.rejected', [meeting.requesterId, meeting.targetManagerId], {
      title: meeting.title,
      note: note || '',
    })
  } catch {
    // Ignore notification error
  }
}

export async function cancelMeeting(meetingId: string, userId: string, reason: string): Promise<void> {
  const meeting = await prisma.meetingRequest.findUnique({
    where: { id: meetingId },
  })
  if (!meeting) throw new Error('جلسه یافت نشد')

  // Set cancel reason, set status to rejected (since rejected serves as cancel)
  await prisma.meetingRequest.update({
    where: { id: meetingId },
    data: {
      status: 'rejected',
      cancelReason: reason,
      note: `لغو شده توسط کاربر: ${reason}`,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      entity: 'MeetingRequest',
      entityId: meetingId,
      action: 'update',
      before: { status: meeting.status },
      after: { status: 'rejected', cancelReason: reason },
    },
  })

  try {
    await notifyEvent('meeting.cancelled', [meeting.targetManagerId, meeting.requesterId], {
      title: meeting.title,
      reason,
    })
  } catch {
    // Ignore notification error
  }
}

export async function rescheduleMeetingRequest(
  meetingId: string,
  newSlot: Date,
  requesterId: string
): Promise<MeetingData> {
  const meeting = await prisma.meetingRequest.findUnique({
    where: { id: meetingId },
    include: { meetingType: true },
  })
  if (!meeting) throw new Error('جلسه یافت نشد')

  // Set original meeting as rescheduled
  await prisma.meetingRequest.update({
    where: { id: meetingId },
    data: { status: 'rescheduled' },
  })

  // Create new meeting
  const newMeeting = await createMeetingRequest({
    requesterId: meeting.requesterId,
    targetManagerId: meeting.targetManagerId,
    title: meeting.title,
    description: meeting.description || undefined,
    scheduledAt: newSlot,
    durationMinutes: meeting.durationMinutes,
    typeId: meeting.typeId || undefined,
    roomId: meeting.roomId || undefined,
    formData: meeting.formData,
  })

  // Link them
  await prisma.meetingRequest.update({
    where: { id: newMeeting.id },
    data: { rescheduleOf: meetingId },
  })

  try {
    await notifyEvent('meeting.rescheduled', [meeting.targetManagerId, meeting.requesterId], {
      title: meeting.title,
      date: newSlot.toLocaleDateString('fa-IR'),
    })
  } catch {
    // Ignore notification error
  }

  return newMeeting
}

export async function saveMeetingOutcome(meetingId: string, outcomeNote: string): Promise<void> {
  await prisma.meetingRequest.update({
    where: { id: meetingId },
    data: {
      outcomeNote,
      status: 'completed',
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: 'system',
      entity: 'MeetingRequest',
      entityId: meetingId,
      action: 'update',
      after: { outcomeNote, status: 'completed' },
    },
  })
}

/** Visual Availability slots engine */
export async function getAvailableSlots(
  hostId: string,
  date: Date,
  typeKey: string,
  roomId?: string
): Promise<{ time: string; available: boolean; reason?: string; availableHosts?: string[] }[]> {
  const meetingType = await prisma.meetingType.findUnique({ where: { key: typeKey } })
  if (!meetingType) {
    throw new Error('نوع جلسه یافت نشد')
  }

  // Resolve role vs user
  let isRole = hostId.startsWith('role:')
  const roleKey = isRole ? hostId.split(':')[1] : hostId

  if (!isRole) {
    const userExists = await prisma.user.findUnique({ where: { id: hostId } })
    if (!userExists) {
      const roleExists = await prisma.role.findUnique({ where: { key: hostId } })
      if (roleExists) {
        isRole = true
      }
    }
  }

  let hostUserIds: string[] = []
  if (isRole) {
    const users = await prisma.user.findMany({
      where: { role: { key: roleKey }, status: 'active' },
      select: { id: true },
    })
    hostUserIds = users.map((u) => u.id)
    if (hostUserIds.length === 0) return []
  } else {
    hostUserIds = [hostId]
  }

  const allHostSlots = await Promise.all(
    hostUserIds.map((uid) => getUserAvailableSlots(uid, date, typeKey, meetingType, roomId))
  )

  const mergedMap = new Map<string, { time: string; available: boolean; reasons: string[]; availableHosts: string[] }>()

  for (const userSlots of allHostSlots) {
    for (const s of userSlots) {
      const existing = mergedMap.get(s.time)
      if (!existing) {
        mergedMap.set(s.time, {
          time: s.time,
          available: s.available,
          reasons: s.reason ? [s.reason] : [],
          availableHosts: s.available ? [s.hostId] : [],
        })
      } else {
        if (s.available) {
          existing.available = true
          existing.availableHosts.push(s.hostId)
        } else if (s.reason) {
          existing.reasons.push(s.reason)
        }
      }
    }
  }

  const resultSlots = Array.from(mergedMap.values()).map((item) => ({
    time: item.time,
    available: item.available,
    reason: item.available ? undefined : (item.reasons[0] || 'غیر قابل رزرو'),
    availableHosts: item.availableHosts,
  }))

  return resultSlots.sort((a, b) => a.time.localeCompare(b.time))
}

async function getUserAvailableSlots(
  userId: string,
  date: Date,
  typeKey: string,
  meetingType: any,
  roomId?: string
): Promise<{ time: string; available: boolean; reason?: string; hostId: string }[]> {
  const duration = meetingType.durationMin
  const buffer = meetingType.bufferMin
  const totalSlotDuration = duration + buffer

  const jsDay = date.getDay()
  const rtlWeekday = (jsDay + 1) % 7

  // 1. Availability Rules
  let rules = await prisma.availabilityRule.findMany({
    where: { ownerType: 'user', ownerKey: userId, weekday: rtlWeekday, isActive: true },
  })
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { key: true } } },
  })
  if (rules.length === 0 && user?.role?.key) {
    rules = await prisma.availabilityRule.findMany({
      where: { ownerType: 'role', ownerKey: user.role.key, weekday: rtlWeekday, isActive: true },
    })
  }

  if (rules.length === 0) return []

  // 2. Availability Exceptions
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const exceptions = await prisma.availabilityException.findMany({
    where: {
      OR: [
        { ownerType: 'user', ownerKey: userId },
        ...(user?.role?.key ? [{ ownerType: 'role', ownerKey: user.role.key }] : []),
      ],
      date: { gte: startOfDay, lte: endOfDay },
    },
  })

  if (exceptions.some((e) => !e.fromTime || !e.toTime)) {
    return [] // Blocked the whole day
  }

  // 3. Shift Deductions
  const autoDeduct = await getSettingValue('meetings.autoDeductShifts', true)
  const activeShiftIntervals: { start: number; end: number }[] = []
  let isNightShiftRestDay = false

  if (autoDeduct) {
    const shiftsToday = await prisma.shift.findMany({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } },
    })
    for (const shift of shiftsToday) {
      const interval = getShiftInterval(date, shift.code)
      if (interval) {
        const startMin = interval.start.getHours() * 60 + interval.start.getMinutes()
        const endMin = (interval.end.getTime() - interval.start.getTime()) / (60 * 1000) + startMin
        activeShiftIntervals.push({ start: startMin, end: endMin })
      }
    }

    const prevDate = new Date(date)
    prevDate.setDate(prevDate.getDate() - 1)
    const startOfPrevDay = new Date(prevDate)
    startOfPrevDay.setHours(0, 0, 0, 0)
    const endOfPrevDay = new Date(prevDate)
    endOfPrevDay.setHours(23, 59, 59, 999)

    const shiftsYesterday = await prisma.shift.findMany({
      where: { userId, date: { gte: startOfPrevDay, lte: endOfPrevDay } },
    })
    if (shiftsYesterday.some((s) => s.code === 'night')) {
      isNightShiftRestDay = true
    }
  }

  // 4. Room Blocking Check
  const blockedRoomTimes: { start: number; end: number }[] = []
  if (roomId) {
    const roomMeetings = await prisma.meetingRequest.findMany({
      where: {
        roomId,
        status: { in: ['pending', 'approved'] },
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
      select: { scheduledAt: true, durationMinutes: true },
    })
    for (const rm of roomMeetings) {
      const startMin = rm.scheduledAt.getHours() * 60 + rm.scheduledAt.getMinutes()
      blockedRoomTimes.push({ start: startMin, end: startMin + rm.durationMinutes })
    }
  }

  // 5. Existing Host Meetings
  const existingMeetings = await prisma.meetingRequest.findMany({
    where: {
      targetManagerId: userId,
      status: { in: ['pending', 'approved'] },
      scheduledAt: { gte: startOfDay, lte: endOfDay },
    },
    select: { scheduledAt: true, durationMinutes: true },
  })

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const hasOverlap = (startMin: number, endMin: number) => {
    if (isNightShiftRestDay && startMin < 12 * 60) {
      return { overlapped: true, reason: 'استراحت پس از شیفت شب (شبکار فردا صبح)' }
    }

    for (const shift of activeShiftIntervals) {
      if (startMin < shift.end && endMin > shift.start) {
        return { overlapped: true, reason: 'تداخل با شیفت کاری راهبر/مدیر' }
      }
    }

    for (const ex of exceptions) {
      if (ex.fromTime && ex.toTime) {
        const exStart = timeToMinutes(ex.fromTime)
        const exEnd = timeToMinutes(ex.toTime)
        if (startMin < exEnd && endMin > exStart) {
          return { overlapped: true, reason: 'بلاک زمانی ثبت شده توسط مدیر' }
        }
      }
    }

    for (const r of blockedRoomTimes) {
      if (startMin < r.end && endMin > r.start) {
        return { overlapped: true, reason: 'اتاق جلسه در این زمان رزرو شده است' }
      }
    }

    for (const m of existingMeetings) {
      const meetStart = m.scheduledAt.getHours() * 60 + m.scheduledAt.getMinutes()
      const meetEnd = meetStart + m.durationMinutes
      if (startMin < meetEnd && endMin > meetStart) {
        return { overlapped: true, reason: 'تداخل با جلسه دیگر' }
      }
    }

    return { overlapped: false }
  }

  const slots: { time: string; available: boolean; reason?: string; hostId: string }[] = []
  const minNoticeHrs = meetingType.minNoticeHrs ?? 4

  for (const rule of rules) {
    const startMin = timeToMinutes(rule.fromTime)
    const endMin = timeToMinutes(rule.toTime)

    for (let current = startMin; current + duration <= endMin; current += totalSlotDuration) {
      const slotHour = Math.floor(current / 60)
      const slotMin = current % 60
      const timeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`

      const slotDate = new Date(date)
      slotDate.setHours(slotHour, slotMin, 0, 0)
      const now = new Date()
      const noticeLimit = now.getTime() + minNoticeHrs * 60 * 60 * 1000
      const isBlockedByNotice = slotDate.getTime() <= noticeLimit

      const overlapCheck = hasOverlap(current, current + duration)
      const available = !overlapCheck.overlapped && !isBlockedByNotice
      const reason = overlapCheck.reason || (isBlockedByNotice ? `رعایت حداقل زمان هماهنگی (${minNoticeHrs} ساعت)` : undefined)

      slots.push({
        time: timeStr,
        available,
        reason,
        hostId: userId,
      })
    }
  }

  return slots
}

export async function checkForMeetingShiftConflicts(userId: string, date: Date): Promise<void> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const shift = await prisma.shift.findFirst({
    where: { userId, date: { gte: startOfDay, lte: endOfDay } }
  })
  if (!shift || shift.code === 'off') return

  const shiftInterval = getShiftInterval(date, shift.code)
  if (!shiftInterval) return

  const meetings = await prisma.meetingRequest.findMany({
    where: {
      OR: [
        { requesterId: userId },
        { targetManagerId: userId }
      ],
      status: { in: ['approved', 'pending'] },
      scheduledAt: { gte: startOfDay, lte: endOfDay }
    }
  })

  for (const m of meetings) {
    const meetStart = m.scheduledAt
    const meetEnd = new Date(meetStart.getTime() + m.durationMinutes * 60 * 1000)

    if (meetStart < shiftInterval.end && meetEnd > shiftInterval.start) {
      try {
        await notifyEvent('meeting.conflict', [m.requesterId, m.targetManagerId], {
          title: m.title,
          date: m.scheduledAt.toLocaleDateString('fa-IR'),
        })
      } catch {
        // Ignore notification errors
      }
    }
  }
}

