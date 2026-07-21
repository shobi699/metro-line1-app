import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-reports:view')
  if (err) return authErrorResponse(err)

  const { searchParams } = new URL(request.url)
  const trainId = searchParams.get('trainId')
  const faultCodeId = searchParams.get('faultCodeId')
  const categoryId = searchParams.get('categoryId')

  // Case 1: Pareto analysis for a specific Train
  if (trainId) {
    const train = await prisma.train.findUnique({ where: { id: trainId } })
    if (!train) return NextResponse.json({ error: 'قطار یافت نشد.' }, { status: 404 })

    const grouped = await prisma.faultReport.groupBy({
      by: ['faultCodeId'],
      where: { trainId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    const pareto = []
    let cumulative = 0
    const total = grouped.reduce((sum, g) => sum + g._count.id, 0)

    for (const group of grouped) {
      const faultCode = await prisma.faultCode.findUnique({
        where: { id: group.faultCodeId },
        include: { category: true },
      })
      if (!faultCode) continue

      cumulative += group._count.id
      const percentage = total > 0 ? (group._count.id / total) * 100 : 0
      const cumulativePercentage = total > 0 ? (cumulative / total) * 100 : 0

      pareto.push({
        faultCode,
        count: group._count.id,
        percentage: Math.round(percentage * 10) / 10,
        cumulativePercentage: Math.round(cumulativePercentage * 10) / 10,
      })
    }

    return NextResponse.json({ data: { type: 'pareto', train, total, pareto } })
  }

  // Case 2: Matrix for a specific Fault Code or Category
  if (faultCodeId || categoryId) {
    const filter: Record<string, any> = {}
    let descriptor = ''

    if (faultCodeId) {
      filter.faultCodeId = faultCodeId
      const fc = await prisma.faultCode.findUnique({ where: { id: faultCodeId } })
      descriptor = fc ? `کد خطای ${fc.code}` : ''
    } else if (categoryId) {
      filter.faultCode = { categoryId }
      const cat = await prisma.faultCategory.findUnique({ where: { id: categoryId } })
      descriptor = cat ? `دسته‌بندی ${cat.title}` : ''
    }

    const trains = await prisma.train.findMany({
      where: { isActive: true },
      orderBy: { trainNumber: 'asc' },
    })

    const matrix = []
    for (const t of trains) {
      const reports = await prisma.faultReport.findMany({
        where: {
          trainId: t.id,
          ...filter,
        },
        orderBy: { occurredAt: 'desc' },
      })

      const lastReport = reports[0] || null

      matrix.push({
        trainId: t.id,
        trainNumber: t.trainNumber,
        fleetSeries: t.fleetSeries,
        count: reports.length,
        lastOccurredAt: lastReport ? lastReport.occurredAt : null,
        lastStatus: lastReport ? lastReport.status : null,
      })
    }

    return NextResponse.json({ data: { type: 'matrix', descriptor, matrix } })
  }

  // Case 3: Overall Pareto (General most frequent faults)
  const grouped = await prisma.faultReport.groupBy({
    by: ['faultCodeId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  const total = grouped.reduce((sum, g) => sum + g._count.id, 0)
  const pareto = []
  let cumulative = 0

  for (const group of grouped) {
    const faultCode = await prisma.faultCode.findUnique({
      where: { id: group.faultCodeId },
      include: { category: true },
    })
    if (!faultCode) continue

    cumulative += group._count.id
    const percentage = total > 0 ? (group._count.id / total) * 100 : 0
    const cumulativePercentage = total > 0 ? (cumulative / total) * 100 : 0

    pareto.push({
      faultCode,
      count: group._count.id,
      percentage: Math.round(percentage * 10) / 10,
      cumulativePercentage: Math.round(cumulativePercentage * 10) / 10,
    })
  }

  return NextResponse.json({ data: { type: 'general_pareto', total, pareto } })
}
