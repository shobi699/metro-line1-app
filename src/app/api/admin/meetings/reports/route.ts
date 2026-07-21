import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  if (user.roleKey !== 'admin' && user.roleKey !== 'super_admin' && user.roleKey !== 'manager') {
    return NextResponse.json({ error: { message: 'دسترسی غیرمجاز' } }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const typeId = searchParams.get('typeId') || undefined
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const where: any = {}
  if (typeId) where.typeId = typeId
  if (fromStr || toStr) {
    where.scheduledAt = {}
    if (fromStr) where.scheduledAt.gte = new Date(fromStr)
    if (toStr) where.scheduledAt.lte = new Date(toStr)
  }

  // 1. Fetch meeting requests
  const meetings = await prisma.meetingRequest.findMany({
    where,
    include: {
      requester: { select: { name: true, id: true, personnelCode: true } },
      targetManager: { select: { name: true, id: true } },
      room: { select: { name: true } },
      meetingType: { select: { title: true } }
    },
    orderBy: { scheduledAt: 'desc' }
  })

  // 2. Fetch stats
  const total = meetings.length
  const approved = meetings.filter(m => m.status === 'approved').length
  const pending = meetings.filter(m => m.status === 'pending').length
  const completed = meetings.filter(m => m.status === 'completed').length
  const rescheduled = meetings.filter(m => m.status === 'rescheduled').length
  const cancelled = meetings.filter(m => m.cancelReason !== null).length

  // Calculate cancellation rate
  const cancelRate = total > 0 ? Number(((cancelled / total) * 100).toFixed(1)) : 0

  // Host loads
  const hostLoadsMap: Record<string, number> = {}
  for (const m of meetings) {
    const hostName = m.targetManager?.name || 'نامشخص'
    hostLoadsMap[hostName] = (hostLoadsMap[hostName] || 0) + 1
  }
  const hostLoads = Object.entries(hostLoadsMap).map(([name, count]) => ({ name, count }))

  return NextResponse.json({
    data: {
      meetings,
      stats: {
        total,
        approved,
        pending,
        completed,
        rescheduled,
        cancelled,
        cancelRate,
        hostLoads,
      }
    }
  })
}
