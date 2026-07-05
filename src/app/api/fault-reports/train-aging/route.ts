import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-reports:view')
  if (err) return authErrorResponse(err)

  const { searchParams } = new URL(request.url)
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  const filter: Record<string, any> = {}
  let intervalDays = 30 // Default interval window

  if (fromParam && toParam) {
    const fromDate = new Date(fromParam)
    const toDate = new Date(toParam)
    filter.occurredAt = { gte: fromDate, lte: toDate }
    intervalDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)))
  }

  const trains = await prisma.train.findMany({
    where: { isActive: true },
    include: {
      faults: {
        where: filter,
      },
    },
  })

  const stats = trains.map((t) => {
    const totalFaults = t.faults.length
    const openFaults = t.faults.filter((f) =>
      ['submitted', 'under_review', 'approved', 'in_repair', 'needs_info', 'reopened'].includes(f.status)
    )
    const closedOrRepaired = t.faults.filter((f) =>
      ['repaired', 'verified_closed'].includes(f.status) && f.repairStartAt && f.repairEndAt
    )

    // Calculate MTTR in hours
    let totalRepairTimeMs = 0
    closedOrRepaired.forEach((f) => {
      totalRepairTimeMs += f.repairEndAt!.getTime() - f.repairStartAt!.getTime()
    })

    const mttrHours = closedOrRepaired.length > 0 
      ? (totalRepairTimeMs / (1000 * 60 * 60)) / closedOrRepaired.length 
      : 0

    // Approximate MTBF (interval in hours / total faults)
    const intervalHours = intervalDays * 24
    const mtbfHours = totalFaults > 0 ? intervalHours / totalFaults : null

    // SLA breach count
    const slaBreaches = t.faults.filter((f) => f.slaBreached).length

    // Max open duration for currently open faults
    let maxOpenDays = 0
    const now = new Date()
    openFaults.forEach((f) => {
      const openTime = now.getTime() - f.createdAt.getTime()
      const openDays = openTime / (1000 * 60 * 60 * 24)
      if (openDays > maxOpenDays) {
        maxOpenDays = openDays
      }
    })

    return {
      trainId: t.id,
      trainNumber: t.trainNumber,
      fleetSeries: t.fleetSeries,
      status: t.status,
      totalFaults,
      openFaultsCount: openFaults.length,
      mttrHours: Math.round(mttrHours * 10) / 10,
      mtbfHours: mtbfHours ? Math.round(mtbfHours * 10) / 10 : null,
      downtimeHours: Math.round((totalRepairTimeMs / (1000 * 60 * 60)) * 10) / 10,
      slaBreachCount: slaBreaches,
      maxOpenDays: Math.round(maxOpenDays * 10) / 10,
    }
  })

  return NextResponse.json({ data: stats })
}
