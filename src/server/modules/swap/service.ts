import { prisma } from '@/server/db'
import type { ShiftCode, SwapRequestStatus } from '@/generated/prisma/client'
import { jalali } from '@/lib/fa'
import { getSettingValue } from '@/server/modules/settings'

export interface SwapRequestWithRelations {
  id: string
  status: SwapRequestStatus
  note: string | null
  createdAt: Date
  requester: { id: string; name: string; personnelCode: string }
  target: { id: string; name: string; personnelCode: string }
  sourceShift: { id: string; date: Date; code: ShiftCode }
  targetShift: { id: string; date: Date; code: ShiftCode }
  reviewedBy: string | null
  violations?: RuleViolation[]
}

export interface RuleViolation {
  rule: string
  message: string
}


function getShiftInterval(date: Date, code: ShiftCode): { start: Date; end: Date } | null {
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
  }
  return {
    start: new Date(baseTime + startOffset * 60 * 60 * 1000),
    end: new Date(baseTime + endOffset * 60 * 60 * 1000),
  }
}

export async function validateUserRules(
  userId: string,
  proposedShift: { date: Date; code: ShiftCode },
  excludeShiftId?: string,
): Promise<RuleViolation[]> {
  const violations: RuleViolation[] = []
  if (proposedShift.code === 'off') {
    return violations
  }

  const proposedInterval = getShiftInterval(proposedShift.date, proposedShift.code)
  if (!proposedInterval) return violations

  // Get other shifts
  const existingShifts = await prisma.shift.findMany({
    where: {
      userId,
      id: excludeShiftId ? { not: excludeShiftId } : undefined,
      code: { not: 'off' },
    },
  })

  // 1. Check rest hours
  for (const s of existingShifts) {
    const sInterval = getShiftInterval(s.date, s.code)
    if (!sInterval) continue

    // Check overlap
    if (sInterval.start < proposedInterval.end && proposedInterval.start < sInterval.end) {
      violations.push({
        rule: 'min_rest',
        message: `تداخل با شیفت کاری دیگر در تاریخ ${jalali(s.date)} (${s.code})`,
      })
      break
    }

    // Check gap
    let gapMs = 0
    if (sInterval.end <= proposedInterval.start) {
      gapMs = proposedInterval.start.getTime() - sInterval.end.getTime()
    } else if (proposedInterval.end <= sInterval.start) {
      gapMs = sInterval.start.getTime() - proposedInterval.end.getTime()
    }

    const gapHours = gapMs / (1000 * 60 * 60)
    const daysDiff = Math.abs(proposedShift.date.getTime() - s.date.getTime()) / (1000 * 60 * 60 * 24)
    const minRestHours = await getSettingValue('shifts.minRestHours', 12)
    if (daysDiff <= 2.0 && gapHours < minRestHours) {
      violations.push({
        rule: 'min_rest',
        message: `فاصله استراحت با شیفت ${jalali(s.date)} کمتر از ${String(minRestHours)} ساعت است (${String(Math.round(gapHours * 10) / 10)} ساعت)`,
      })
      break
    }
  }

  // 2. Check max consecutive shifts
  const allUserShifts = await prisma.shift.findMany({
    where: {
      userId,
      id: excludeShiftId ? { not: excludeShiftId } : undefined,
    },
    orderBy: { date: 'asc' },
  })

  const mergedShifts = [...allUserShifts]
  const proposedDateStr = new Date(proposedShift.date).toDateString()
  const existingIndex = mergedShifts.findIndex(s => new Date(s.date).toDateString() === proposedDateStr)
  if (existingIndex >= 0) {
    mergedShifts[existingIndex] = {
      ...mergedShifts[existingIndex],
      code: proposedShift.code,
    }
  } else {
    mergedShifts.push({
      id: 'proposed',
      date: proposedShift.date,
      code: proposedShift.code,
      source: 'manual',
      note: null,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mergedShifts.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  const maxConsecutiveDays = await getSettingValue('shifts.maxConsecutiveDays', 6)
  let consecutive = 0
  for (const s of mergedShifts) {
    if (s.code === 'off') {
      consecutive = 0
      continue
    }
    consecutive++
    if (consecutive >= maxConsecutiveDays) {
      violations.push({
        rule: 'max_consecutive',
        message: `بیش از ${String(maxConsecutiveDays)} شیفت متوالی مجاز نیست`,
      })
      break
    }
  }

  return violations
}

export async function validateSwapRules(
  requesterId: string,
  targetId: string,
  sourceShiftId: string,
  targetShiftId: string,
): Promise<RuleViolation[]> {
  const violations: RuleViolation[] = []

  const [sourceShift, targetShift, requester, target] = await Promise.all([
    prisma.shift.findUnique({ where: { id: sourceShiftId } }),
    prisma.shift.findUnique({ where: { id: targetShiftId } }),
    prisma.user.findUnique({ where: { id: requesterId }, include: { role: true } }),
    prisma.user.findUnique({ where: { id: targetId }, include: { role: true } }),
  ])

  if (!sourceShift || !targetShift) {
    violations.push({ rule: 'invalid_shift', message: 'یکی از شیفت‌ها یافت نشد' })
    return violations
  }

  if (!requester || !target) {
    violations.push({ rule: 'invalid_user', message: 'کاربر متقاضی یا مقصد یافت نشد' })
    return violations
  }

  // Check role parity
  if (requester.roleId !== target.roleId) {
    violations.push({
      rule: 'role_parity',
      message: `عدم انطباق نقش: نقش متقاضی (${requester.role.title}) با نقش کاربر مقصد (${target.role.title}) یکسان نیست`,
    })
  }

  if (sourceShift.userId !== requesterId) {
    violations.push({ rule: 'not_your_shift', message: 'شیفت مبدا متعلق به شما نیست' })
  }

  if (targetShift.userId !== targetId) {
    violations.push({ rule: 'not_their_shift', message: 'شیفت مقصد متعلق به کاربر مقصد نیست' })
  }

  if (violations.length > 0) return violations

  // Validate rules for requester (gets targetShift, loses sourceShift)
  const requesterViolations = await validateUserRules(requesterId, targetShift, sourceShiftId)
  violations.push(...requesterViolations)

  // Validate rules for target (gets sourceShift, loses targetShift)
  const targetViolations = await validateUserRules(targetId, sourceShift, targetShiftId)
  violations.push(
    ...targetViolations.map((v) => ({
      rule: v.rule,
      message: `برای کاربر مقصد: ${v.message}`,
    })),
  )

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
      requester: { select: { id: true, name: true, personnelCode: true } },
      target: { select: { id: true, name: true, personnelCode: true } },
      sourceShift: true,
      targetShift: true,
    },
  })

  // Write audit log
  await prisma.auditLog.create({
    data: {
      actorId: requesterId,
      entity: 'SwapRequest',
      entityId: swapRequest.id,
      action: 'create',
      after: {
        requesterId,
        targetId: targetUserId,
        sourceShiftId,
        targetShiftId,
        note: note ?? null,
      },
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

  // Run the rule engine before any swap or approval
  const violations = await validateSwapRules(
    swapRequest.requesterId,
    swapRequest.targetId,
    swapRequest.sourceShiftId,
    swapRequest.targetShiftId,
  )

  if (violations.length > 0) {
    throw new Error(`مغایرت با قوانین شیفت کاری: ${violations.map((v) => v.message).join(' | ')}`)
  }

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
    prisma.auditLog.create({
      data: {
        actorId: targetUserId,
        entity: 'SwapRequest',
        entityId: swapRequestId,
        action: 'update',
        before: { status: swapRequest.status },
        after: { status: 'approved' },
      },
    }),
  ])

  return prisma.swapRequest.findUnique({
    where: { id: swapRequestId },
    include: {
      requester: { select: { id: true, name: true, personnelCode: true } },
      target: { select: { id: true, name: true, personnelCode: true } },
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

    // Run the rule engine before any swap or approval
    const violations = await validateSwapRules(
      swapRequest.requesterId,
      swapRequest.targetId,
      swapRequest.sourceShiftId,
      swapRequest.targetShiftId,
    )

    if (violations.length > 0) {
      throw new Error(`مغایرت با قوانین شیفت کاری: ${violations.map((v) => v.message).join(' | ')}`)
    }

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
      prisma.auditLog.create({
        data: {
          actorId: reviewerId,
          entity: 'SwapRequest',
          entityId: swapRequestId,
          action: 'update',
          before: { status: swapRequest.status },
          after: { status: decision, reviewedBy: reviewerId },
        },
      }),
    ])
  } else {
    await prisma.$transaction([
      prisma.swapRequest.update({
        where: { id: swapRequestId },
        data: { status: decision, reviewedBy: reviewerId },
      }),
      prisma.auditLog.create({
        data: {
          actorId: reviewerId,
          entity: 'SwapRequest',
          entityId: swapRequestId,
          action: 'update',
          before: { status: swapRequest.status },
          after: { status: decision, reviewedBy: reviewerId },
        },
      }),
    ])
  }

  return prisma.swapRequest.findUnique({
    where: { id: swapRequestId },
    include: {
      requester: { select: { id: true, name: true, personnelCode: true } },
      target: { select: { id: true, name: true, personnelCode: true } },
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

  const requests = await prisma.swapRequest.findMany({
    where: where as never,
    include: {
      requester: { select: { id: true, name: true, personnelCode: true } },
      target: { select: { id: true, name: true, personnelCode: true } },
      sourceShift: true,
      targetShift: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const results = await Promise.all(
    requests.map(async (req) => {
      let violations: RuleViolation[] = []
      try {
        violations = await validateSwapRules(
          req.requesterId,
          req.targetId,
          req.sourceShiftId,
          req.targetShiftId,
        )
      } catch (err) {
        // silent fallback for draft/incomplete data
      }
      return {
        ...req,
        violations,
      } as SwapRequestWithRelations
    })
  )

  return results
}

export async function getUserSwapRequests(userId: string) {
  return prisma.swapRequest.findMany({
    where: {
      OR: [{ requesterId: userId }, { targetId: userId }],
    },
    include: {
      requester: { select: { id: true, name: true, personnelCode: true } },
      target: { select: { id: true, name: true, personnelCode: true } },
      sourceShift: true,
      targetShift: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

// ── Trip-Level Swap Requests (Roster Integration) ─────────────────────────

import { validateRoster } from '@/server/modules/roster/service'

export async function validateTripSwapRules(
  requesterId: string,
  targetId: string,
  sourceAssignmentId: string,
  targetAssignmentId: string,
): Promise<RuleViolation[]> {
  const violations: RuleViolation[] = []

  const [sourceAssign, targetAssign, requester, target] = await Promise.all([
    prisma.tripAssignment.findUnique({ where: { id: sourceAssignmentId }, include: { trip: true } }),
    prisma.tripAssignment.findUnique({ where: { id: targetAssignmentId }, include: { trip: true } }),
    prisma.user.findUnique({ where: { id: requesterId }, include: { role: true } }),
    prisma.user.findUnique({ where: { id: targetId }, include: { role: true } }),
  ])

  if (!sourceAssign || !targetAssign) {
    violations.push({ rule: 'invalid_assignment', message: 'یکی از نوبت‌های اعزام یافت نشد' })
    return violations
  }

  if (!requester || !target) {
    violations.push({ rule: 'invalid_user', message: 'کاربر متقاضی یا مقصد یافت نشد' })
    return violations
  }

  // Check role parity
  if (requester.roleId !== target.roleId) {
    violations.push({
      rule: 'role_parity',
      message: `عدم انطباق نقش: نقش متقاضی (${requester.role.title}) با نقش کاربر مقصد (${target.role.title}) یکسان نیست`,
    })
  }

  if (sourceAssign.matchedUserId !== requesterId) {
    violations.push({ rule: 'not_your_trip', message: 'نوبت اعزام مبدا متعلق به شما نیست' })
  }

  if (targetAssign.matchedUserId !== targetId) {
    violations.push({ rule: 'not_their_trip', message: 'نوبت اعزام مقصد متعلق به کاربر مقصد نیست' })
  }

  if (violations.length > 0) return violations

  // Simulate the swap on the day's roster and check fatigue and overlap rules
  const rosterVersionId = sourceAssign.trip.rosterVersionId
  const allTrips = await prisma.trip.findMany({
    where: { rosterVersionId },
    include: { assignments: true },
  })

  const simulatedAssignments = allTrips.flatMap((t) =>
    t.assignments.map((a) => {
      let matchedUserId = a.matchedUserId
      if (a.id === sourceAssignmentId) {
        matchedUserId = targetId
      } else if (a.id === targetAssignmentId) {
        matchedUserId = requesterId
      }
      return {
        ...a,
        matchedUserId,
      }
    })
  )

  const rosterIssues = await validateRoster(allTrips, simulatedAssignments)
  const criticalIssues = rosterIssues.filter(
    (issue) => issue.severity === 'CRITICAL' || issue.severity === 'ERROR'
  )

  criticalIssues.forEach((issue) => {
    violations.push({
      rule: 'fatigue_or_overlap',
      message: issue.message,
    })
  })

  return violations
}

export async function createTripSwapRequest(
  requesterId: string,
  targetId: string,
  sourceAssignmentId: string,
  targetAssignmentId: string,
  note?: string,
): Promise<{ tripSwapRequest?: any; violations: RuleViolation[] }> {
  // Check if allowSwapRequests setting is enabled
  const allowSwaps = await getSettingValue('shifts.allowSwapRequests', true)
  if (!allowSwaps) {
    return { violations: [{ rule: 'swaps_disabled', message: 'ثبت درخواست جابجایی شیفت در تنظیمات سیستم غیرفعال است.' }] }
  }

  const violations = await validateTripSwapRules(
    requesterId,
    targetId,
    sourceAssignmentId,
    targetAssignmentId,
  )

  if (violations.length > 0) {
    return { violations }
  }

  const tripSwapRequest = await prisma.tripSwapRequest.create({
    data: {
      requesterId,
      targetId,
      sourceAssignmentId,
      targetAssignmentId,
      note: note || null,
      status: 'pending',
    },
    include: {
      requester: { select: { id: true, name: true, personnelCode: true } },
      target: { select: { id: true, name: true, personnelCode: true } },
      sourceAssignment: { include: { trip: true } },
      targetAssignment: { include: { trip: true } },
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: requesterId,
      entity: 'TripSwapRequest',
      entityId: tripSwapRequest.id,
      action: 'create',
      after: tripSwapRequest,
    },
  })

  return { tripSwapRequest, violations: [] }
}

export async function acceptTripSwapRequest(
  swapRequestId: string,
  targetUserId: string,
): Promise<any> {
  const swapRequest = await prisma.tripSwapRequest.findUnique({
    where: { id: swapRequestId },
  })

  if (!swapRequest) throw new Error('درخواست یافت نشد')
  if (swapRequest.targetId !== targetUserId) throw new Error('شما طرف این درخواست نیستید')
  if (swapRequest.status !== 'pending') throw new Error('این درخواست قبلاً بررسی شده')

  // Run the rule engine before colleague acceptance
  const violations = await validateTripSwapRules(
    swapRequest.requesterId,
    swapRequest.targetId,
    swapRequest.sourceAssignmentId,
    swapRequest.targetAssignmentId,
  )

  if (violations.length > 0) {
    throw new Error(`مغایرت با قوانین نوبت اعزام: ${violations.map((v) => v.message).join(' | ')}`)
  }

  // Update TripSwapRequest to show colleague accepted (store as "accepted:targetUserId" in reviewedBy)
  await prisma.$transaction([
    prisma.tripSwapRequest.update({
      where: { id: swapRequestId },
      data: {
        reviewedBy: `accepted:${targetUserId}`,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: targetUserId,
        entity: 'TripSwapRequest',
        entityId: swapRequestId,
        action: 'update',
        before: { status: swapRequest.status, reviewedBy: swapRequest.reviewedBy } as any,
        after: { status: 'pending', reviewedBy: `accepted:${targetUserId}` } as any,
      },
    }),
  ])

  return prisma.tripSwapRequest.findUnique({
    where: { id: swapRequestId },
    include: {
      requester: { select: { id: true, name: true, personnelCode: true } },
      target: { select: { id: true, name: true, personnelCode: true } },
      sourceAssignment: { include: { trip: true } },
      targetAssignment: { include: { trip: true } },
    },
  })
}

export async function approveTripSwapRequest(
  swapRequestId: string,
  reviewerId: string,
  decision: 'approved' | 'rejected',
): Promise<any> {
  const swapRequest = await prisma.tripSwapRequest.findUnique({
    where: { id: swapRequestId },
  })

  if (!swapRequest) throw new Error('درخواست یافت نشد')
  if (swapRequest.status !== 'pending') throw new Error('این درخواست قبلاً بررسی شده')

  // Enforce: Colleague must accept first before admin can approve!
  if (decision === 'approved' && (!swapRequest.reviewedBy || !swapRequest.reviewedBy.startsWith('accepted:'))) {
    throw new Error('این درخواست ابتدا باید توسط همکار تایید (پذیرش) شود.')
  }

  if (decision === 'approved') {
    const violations = await validateTripSwapRules(
      swapRequest.requesterId,
      swapRequest.targetId,
      swapRequest.sourceAssignmentId,
      swapRequest.targetAssignmentId,
    )

    if (violations.length > 0) {
      throw new Error(`مغایرت با قوانین نوبت اعزام: ${violations.map((v) => v.message).join(' | ')}`)
    }

    const [reqUser, tarUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: swapRequest.requesterId } }),
      prisma.user.findUnique({ where: { id: swapRequest.targetId } }),
    ])

    if (!reqUser || !tarUser) throw new Error('راهبر یافت نشد')

    await prisma.$transaction([
      prisma.tripAssignment.update({
        where: { id: swapRequest.sourceAssignmentId },
        data: {
          matchedUserId: swapRequest.targetId,
          personnelNo: tarUser.personnelCode || null,
          rawName: tarUser.name,
        },
      }),
      prisma.tripAssignment.update({
        where: { id: swapRequest.targetAssignmentId },
        data: {
          matchedUserId: swapRequest.requesterId,
          personnelNo: reqUser.personnelCode || null,
          rawName: reqUser.name,
        },
      }),
      prisma.tripSwapRequest.update({
        where: { id: swapRequestId },
        data: { status: 'approved', reviewedBy: reviewerId },
      }),
      prisma.auditLog.create({
        data: {
          actorId: reviewerId,
          entity: 'TripSwapRequest',
          entityId: swapRequestId,
          action: 'update',
          before: { status: swapRequest.status, reviewedBy: swapRequest.reviewedBy } as any,
          after: { status: 'approved', reviewedBy: reviewerId } as any,
        },
      }),
    ])
  } else {
    await prisma.$transaction([
      prisma.tripSwapRequest.update({
        where: { id: swapRequestId },
        data: { status: 'rejected', reviewedBy: reviewerId },
      }),
      prisma.auditLog.create({
        data: {
          actorId: reviewerId,
          entity: 'TripSwapRequest',
          entityId: swapRequestId,
          action: 'update',
          before: { status: swapRequest.status, reviewedBy: swapRequest.reviewedBy } as any,
          after: { status: 'rejected', reviewedBy: reviewerId } as any,
        },
      }),
    ])
  }

  return prisma.tripSwapRequest.findUnique({
    where: { id: swapRequestId },
    include: {
      requester: { select: { id: true, name: true, personnelCode: true } },
      target: { select: { id: true, name: true, personnelCode: true } },
      sourceAssignment: { include: { trip: true } },
      targetAssignment: { include: { trip: true } },
    },
  })
}

export async function getTripSwaps(
  userId: string,
  roleKey: string,
): Promise<any[]> {
  const where: Record<string, unknown> = {}

  if (roleKey === 'super_admin' || roleKey === 'admin') {
    // Admin sees all
  } else {
    // Operator/driver sees requests involving them
    where.OR = [{ requesterId: userId }, { targetId: userId }]
  }

  const requests = await prisma.tripSwapRequest.findMany({
    where: where as never,
    include: {
      requester: { select: { id: true, name: true, personnelCode: true } },
      target: { select: { id: true, name: true, personnelCode: true } },
      sourceAssignment: { include: { trip: true } },
      targetAssignment: { include: { trip: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const results = await Promise.all(
    requests.map(async (req) => {
      let violations: RuleViolation[] = []
      if (req.status === 'pending') {
        try {
          violations = await validateTripSwapRules(
            req.requesterId,
            req.targetId,
            req.sourceAssignmentId,
            req.targetAssignmentId,
          )
        } catch (err) {
          // silent fallback
        }
      }
      return {
        ...req,
        violations,
      }
    })
  )

  return results
}

