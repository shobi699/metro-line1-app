import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-reports:view')
  if (err) return authErrorResponse(err)

  // Current month bounds
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // 1. Open Faults Count
  const openCount = await prisma.faultReport.count({
    where: {
      status: {
        in: ['submitted', 'under_review', 'approved', 'in_repair', 'needs_info', 'reopened'],
      },
    },
  })

  // 2. Critical Open Faults
  const criticalOpenCount = await prisma.faultReport.count({
    where: {
      priority: 'critical',
      status: {
        in: ['submitted', 'under_review', 'approved', 'in_repair', 'needs_info', 'reopened'],
      },
    },
  })

  // 3. SLA Breached this month
  const slaBreachedCount = await prisma.faultReport.count({
    where: {
      slaBreached: true,
      createdAt: { gte: startOfMonth },
    },
  })

  // 4. MTTR Month Average
  const resolvedThisMonth = await prisma.faultReport.findMany({
    where: {
      status: { in: ['repaired', 'verified_closed'] },
      closedAt: { gte: startOfMonth },
      repairStartAt: { not: null },
      repairEndAt: { not: null },
    },
    select: { repairStartAt: true, repairEndAt: true },
  })

  let totalMs = 0
  resolvedThisMonth.forEach((f) => {
    totalMs += f.repairEndAt!.getTime() - f.repairStartAt!.getTime()
  })

  const mttrMonth = resolvedThisMonth.length > 0 
    ? (totalMs / (1000 * 60 * 60)) / resolvedThisMonth.length 
    : 0

  // 5. Trends (last 6 months)
  const monthlyTrend = []
  const today = new Date()

  for (let i = 5; i >= 0; i--) {
    const d1 = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const d2 = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999)

    const created = await prisma.faultReport.count({
      where: {
        createdAt: { gte: d1, lte: d2 },
      },
    })

    const closed = await prisma.faultReport.count({
      where: {
        closedAt: { gte: d1, lte: d2 },
      },
    })

    const label = d1.toLocaleDateString('fa-IR', { month: 'long', year: '2-digit' })

    monthlyTrend.push({
      label,
      created,
      closed,
    })
  }

  // 6. Top 5 Faulty Trains
  const groupedTrains = await prisma.faultReport.groupBy({
    by: ['trainId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  })

  const topTrains = []
  for (const item of groupedTrains) {
    const train = await prisma.train.findUnique({ where: { id: item.trainId }, select: { trainNumber: true } })
    if (train) {
      topTrains.push({
        trainNumber: train.trainNumber,
        count: item._count.id,
      })
    }
  }

  // 7. Top 5 Fault Categories
  const groupedCategories = await prisma.faultReport.groupBy({
    by: ['faultCodeId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  const categoryCounts = new Map<string, number>()
  for (const item of groupedCategories) {
    const code = await prisma.faultCode.findUnique({
      where: { id: item.faultCodeId },
      include: { category: true },
    })
    if (code) {
      const catTitle = code.category.title
      categoryCounts.set(catTitle, (categoryCounts.get(catTitle) || 0) + item._count.id)
    }
  }

  const topCategories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return NextResponse.json({
    data: {
      stats: {
        open: openCount,
        criticalOpen: criticalOpenCount,
        slaBreached: slaBreachedCount,
        mttrHours: Math.round(mttrMonth * 10) / 10,
      },
      monthlyTrend,
      topTrains,
      topCategories,
    },
  })
}
