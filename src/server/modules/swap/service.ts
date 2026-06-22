import { prisma } from '@/server/db'
import type { ShiftCode, SwapRequestStatus } from '@/generated/prisma/client'

export interface SwapRequestWithRelations {
  id: string
  status: SwapRequestStatus
  note: string | null
  createdAt: Date
  requester: { id: string; name: string; nationalId: string }
  target: { id: string; name: string; nationalId: string }
  sourceShift: { id: string; date: Date; code: ShiftCode }
  targetShift: { id: string; date: Date; code: ShiftCode }
  reviewedBy: string | null
}

export interface RuleViolation {
  rule: string
  message: string
}

const MIN_REST_HOURS = 10
const MAX_CONSECUTIVE_SHIFTS = 6

function hoursBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60)
}

export async function validateSwapRules(
  requesterId: string,
  targetId: string,
  sourceShiftId: string,
  targetShiftId: string,
): Promise<RuleViolation[]> {
  const violations: RuleViolation[] = []

  const [sourceShift, targetShift] = await Promise.all([
    prisma.shift.findUnique({ where: { id: sourceShiftId } }),
    prisma.shift.findUnique({ where: { id: targetShiftId } }),
  ])

  if (!sourceShift || !targetShift) {
    violations.push({ rule: 'invalid_shift', message: 'یکی از شیفت‌ها یافت نشد' })
    return violations
  }

  if (sourceShift.userId !== requesterId) {
    violations.push({ rule: 'not_your_shift', message: 'شیفت مبدا متعلق به شما نیست' })
  }

  if (targetShift.userId !== targetId) {
    violations.push({ rule: 'not_their_shift', message: 'شیفت مقصد متعلق به کاربر مقصد نیست' })
  }

  // Check min rest hours for requester after accepting target shift
  const requesterShifts = await prisma.shift.findMany({
    where: { userId: requesterId, id: { not: sourceShiftId } },
    orderBy: { date: 'asc' },
  })

  const targetDate = new Date(targetShift.date)
  const nearShifts = requesterShifts.filter(
    (s) => hoursBetween(s.date, targetDate) < MIN_REST_HOURS * 1.5,
  )

  for (const s of nearShifts) {
    const gap = hoursBetween(s.date, targetDate)
    if (gap < MIN_REST_HOURS && gap > 0) {
      violations.push({
        rule: 'min_rest',
        message: `فاصله استراحت کمتر از ${String(MIN_REST_HOURS)} ساعت است`,
      })
      break
    }
  }

  // Check max consecutive shifts
  const allRequesterShifts = await prisma.shift.findMany({
    where: { userId: requesterId, id: { not: sourceShiftId } },
    orderBy: { date: 'asc' },
  })

  let consecutive = 0
  for (let i = 0; i < allRequesterShifts.length; i++) {
    if (allRequesterShifts[i].code === 'off') {
      consecutive = 0
      continue
    }
    consecutive++
    if (consecutive >= MAX_CONSECUTIVE_SHIFTS) {
      violations.push({
        rule: 'max_consecutive',
        message: `بیش از ${String(MAX_CONSECUTIVE_SHIFTS)} شیفت متوالی مجاز نیست`,
      })
      break
    }
  }

  return violations
}

export async function createSwapRequest(
  requesterId: string,
  targetUserId: string,
  sourceShiftId: string,
  targetShiftId: string,
  note?: string,
): Promise<{ swapRequest?: SwapRequestWithRelations; violations: RuleViolation[] }> {
  const violations = await validateSwapRules(
    requesterId,
    targetUserId,
    sourceShiftId,
    targetShiftId,
  )

  if (violations.length > 0) {
    return { violations }
  }

  const swapRequest = await prisma.swapRequest.create({
    data: {
      requesterId,
      targetId: targetUserId,
      sourceShiftId,
      targetShiftId,
      note: note ?? null,
    },
    include: {
      requester: { select: { id: true, name: true, nationalId: true } },
      target: { select: { id: true, name: true, nationalId: true } },
      sourceShift: true,
      targetShift: true,
    },
  })

  return { swapRequest, violations: [] }
}

export async function acceptSwapRequest(
  swapRequestId: string,
  targetUserId: string,
): Promise<SwapRequestWithRelations> {
  const swapRequest = await prisma.swapRequest.findUnique({
    where: { id: swapRequestId },
  })

  if (!swapRequest) throw new Error('درخواست یافت نشد')
  if (swapRequest.targetId !== targetUserId) throw new Error('شما طرف این درخواست نیستید')
  if (swapRequest.status !== 'pending') throw new Error('این درخواست قبلاً بررسی شده')

  // Swap the shifts
  const [sourceShift, targetShift] = await Promise.all([
    prisma.shift.findUnique({ where: { id: swapRequest.sourceShiftId } }),
    prisma.shift.findUnique({ where: { id: swapRequest.targetShiftId } }),
  ])

  if (!sourceShift || !targetShift) throw new Error('شیفت یافت نشد')

  await prisma.$transaction([
    prisma.shift.update({
      where: { id: sourceShift.id },
      data: { userId: targetUserId },
    }),
    prisma.shift.update({
      where: { id: targetShift.id },
      data: { userId: swapRequest.requesterId },
    }),
    prisma.swapRequest.update({
      where: { id: swapRequestId },
      data: { status: 'approved' },
    }),
  ])

  return prisma.swapRequest.findUnique({
    where: { id: swapRequestId },
    include: {
      requester: { select: { id: true, name: true, nationalId: true } },
      target: { select: { id: true, name: true, nationalId: true } },
      sourceShift: true,
      targetShift: true,
    },
  }) as Promise<SwapRequestWithRelations>
}

export async function approveSwapRequest(
  swapRequestId: string,
  reviewerId: string,
  decision: 'approved' | 'rejected',
): Promise<SwapRequestWithRelations> {
  const swapRequest = await prisma.swapRequest.findUnique({
    where: { id: swapRequestId },
  })

  if (!swapRequest) throw new Error('درخواست یافت نشد')
  if (swapRequest.status !== 'pending') throw new Error('این درخواست قبلاً بررسی شده')

  if (decision === 'approved') {
    const [sourceShift, targetShift] = await Promise.all([
      prisma.shift.findUnique({ where: { id: swapRequest.sourceShiftId } }),
      prisma.shift.findUnique({ where: { id: swapRequest.targetShiftId } }),
    ])

    if (!sourceShift || !targetShift) throw new Error('شیفت یافت نشد')

    await prisma.$transaction([
      prisma.shift.update({
        where: { id: sourceShift.id },
        data: { userId: swapRequest.targetId },
      }),
      prisma.shift.update({
        where: { id: targetShift.id },
        data: { userId: swapRequest.requesterId },
      }),
      prisma.swapRequest.update({
        where: { id: swapRequestId },
        data: { status: decision, reviewedBy: reviewerId },
      }),
    ])
  } else {
    await prisma.swapRequest.update({
      where: { id: swapRequestId },
      data: { status: decision, reviewedBy: reviewerId },
    })
  }

  return prisma.swapRequest.findUnique({
    where: { id: swapRequestId },
    include: {
      requester: { select: { id: true, name: true, nationalId: true } },
      target: { select: { id: true, name: true, nationalId: true } },
      sourceShift: true,
      targetShift: true,
    },
  }) as Promise<SwapRequestWithRelations>
}

export async function getSwapInbox(
  userId: string,
  roleKey: string,
): Promise<SwapRequestWithRelations[]> {
  const where: Record<string, unknown> = { status: 'pending' }

  if (roleKey === 'super_admin' || roleKey === 'admin') {
    // Admin sees all pending
  } else {
    // Operator sees only requests targeting them
    where.targetId = userId
  }

  return prisma.swapRequest.findMany({
    where: where as never,
    include: {
      requester: { select: { id: true, name: true, nationalId: true } },
      target: { select: { id: true, name: true, nationalId: true } },
      sourceShift: true,
      targetShift: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getUserSwapRequests(userId: string) {
  return prisma.swapRequest.findMany({
    where: {
      OR: [{ requesterId: userId }, { targetId: userId }],
    },
    include: {
      requester: { select: { id: true, name: true, nationalId: true } },
      target: { select: { id: true, name: true, nationalId: true } },
      sourceShift: true,
      targetShift: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
