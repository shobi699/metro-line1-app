import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'faults:read')
  if (err) return authErrorResponse(err)

  const filter: Record<string, any> = {}

  // Queue sorting based on Role
  if (user.roleKey === 'operator' || user.roleKey === 'driver') {
    filter.reporterId = user.id
  } else if (user.roleKey === 'supervisor' || user.roleKey === 'shift_lead') {
    filter.status = { in: ['submitted', 'under_review', 'needs_info'] }
  } else if (user.roleKey === 'expert' || user.roleKey === 'dispatch_tech') {
    // Technical maintenance queue
    filter.status = { in: ['approved', 'in_repair'] }
    // Or if specifically assigned to this user
    filter.OR = [
      { assigneeId: user.id },
      { assigneeId: null, status: 'approved' }
    ]
  } else {
    // Managers/Admins see everything by default
  }

  const reports = await prisma.faultReport.findMany({
    where: filter,
    include: {
      train: true,
      wagon: true,
      faultCode: true,
      reporter: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
      _count: { select: { logs: true } },
    },
    orderBy: { occurredAt: 'desc' },
  })

  return NextResponse.json({ data: reports })
}
