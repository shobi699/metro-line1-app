import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trainId: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-reports:view')
  if (err) return authErrorResponse(err)

  const { trainId } = await params

  const train = await prisma.train.findUnique({
    where: { id: trainId },
    include: {
      wagons: {
        where: { isActive: true },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!train || !train.isActive) {
    return NextResponse.json({ error: 'قطار یافت نشد.' }, { status: 404 })
  }

  // Get active faults
  const activeFaults = await prisma.faultReport.findMany({
    where: {
      trainId,
      status: {
        in: ['submitted', 'under_review', 'approved', 'in_repair', 'needs_info', 'reopened', 'deferred'],
      },
    },
    include: {
      wagon: true,
      faultCode: true,
    },
    orderBy: { occurredAt: 'desc' },
  })

  // Get historical faults (last 50)
  const history = await prisma.faultReport.findMany({
    where: { trainId },
    include: {
      wagon: true,
      faultCode: true,
      reporter: { select: { name: true } },
    },
    orderBy: { occurredAt: 'desc' },
    take: 50,
  })

  // Calculate Wagon stats: which wagon has the most issues?
  const wagonFaultCounts: Record<string, number> = {}
  history.forEach((h) => {
    if (h.wagonId) {
      const code = h.wagon?.wagonCode || `واگن ${h.wagonId}`
      wagonFaultCounts[code] = (wagonFaultCounts[code] || 0) + 1
    }
  })

  const topWagonFaults = Object.entries(wagonFaultCounts)
    .map(([wagonCode, count]) => ({ wagonCode, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({
    data: {
      train,
      activeFaults,
      topWagonFaults,
      history,
    },
  })
}
