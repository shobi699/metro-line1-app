import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-reports:view')
  if (err) return authErrorResponse(err)

  // Group by trainId and faultCodeId to count occurrences
  const grouped = await prisma.faultReport.groupBy({
    by: ['trainId', 'faultCodeId'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  })

  // Fetch relations for groups with count >= 2
  const recurringGroups = grouped.filter((g) => g._count.id >= 2)
  const data = []

  for (const group of recurringGroups) {
    const train = await prisma.train.findUnique({ where: { id: group.trainId } })
    const faultCode = await prisma.faultCode.findUnique({
      where: { id: group.faultCodeId },
      include: { category: true },
    })

    if (!train || !faultCode) continue

    // Get individual reports for this group
    const reports = await prisma.faultReport.findMany({
      where: {
        trainId: group.trainId,
        faultCodeId: group.faultCodeId,
      },
      include: {
        reporter: { select: { name: true } },
        logs: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { occurredAt: 'desc' },
    })

    data.push({
      train,
      faultCode,
      count: group._count.id,
      reports,
    })
  }

  return NextResponse.json({ data })
}
