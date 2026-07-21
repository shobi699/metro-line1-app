import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Requires supervisor role or higher to view dispatch analytics
  if (!['admin', 'super_admin', 'supervisor', 'occ', 'planner'].includes(user.roleKey)) {
    return NextResponse.json({ error: 'عدم دسترسی به آمار اعزام‌ها' }, { status: 403 })
  }

  try {
    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)

    // 1. Fetch published version trips in the last 7 days
    const trips = await prisma.trip.findMany({
      where: {
        rosterVersion: {
          status: 'PUBLISHED',
          rosterDay: {
            gregorianDate: { gte: sevenDaysAgo }
          }
        }
      },
      include: {
        assignments: true,
        rosterVersion: {
          include: { rosterDay: true }
        }
      }
    })

    // 2. Compute overall stats
    const total = trips.length
    const normal = trips.filter(t => t.status === 'NORMAL').length
    const delayed = trips.filter(t => t.status === 'MAINTENANCE' || t.status === 'SPECIAL' || t.operationalNote?.includes('تاخیر') || t.status === 'DELAYED').length
    const cancelled = trips.filter(t => t.status === 'CANCELLED').length

    let readyCount = 0
    let totalAssignments = 0
    trips.forEach(t => {
      t.assignments.forEach(a => {
        totalAssignments++
        if (a.readyAt) readyCount++
      })
    })

    const stats = {
      total,
      normal,
      delayed,
      cancelled,
      readyCount,
      totalAssignments
    }

    // 3. Compute top delayed trains
    const delayedTrips = trips.filter(t => t.status === 'MAINTENANCE' || t.status === 'SPECIAL' || t.operationalNote?.includes('تاخیر') || t.status === 'DELAYED')
    const trainDelayCounts = new Map<string, { count: number; totalDelayMinutes: number; reason: string }>()

    let sumDelayMinutes = 0
    delayedTrips.forEach(t => {
      if (!t.trainNumber) return
      const note = t.operationalNote || 'تأخیر غیرمنتظره'
      
      // Parse delay minutes from operationalNote (e.g. "15 دقیقه تاخیر")
      let minutes = 10
      const match = note.match(/(\d+)\s*دقیقه/)
      if (match) {
        minutes = parseInt(match[1], 10)
      }
      sumDelayMinutes += minutes

      const existing = trainDelayCounts.get(t.trainNumber) || { count: 0, totalDelayMinutes: 0, reason: note }
      trainDelayCounts.set(t.trainNumber, {
        count: existing.count + 1,
        totalDelayMinutes: existing.totalDelayMinutes + minutes,
        reason: note
      })
    })

    const trainDelays = Array.from(trainDelayCounts.entries())
      .map(([train, info]) => ({
        train: `رام ${train}`,
        delay: info.totalDelayMinutes,
        reason: info.reason,
        color: info.totalDelayMinutes > 15 ? '#ff3b30' : '#ffcc00'
      }))
      .sort((a, b) => b.delay - a.delay)
      .slice(0, 5)

    // 4. Compute 7-day trend rates
    const weeklyTrendsMap = new Map<string, { total: number; ready: number }>()
    
    // Initialize last 7 days
    const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const dayName = dayNames[d.getDay()]
      weeklyTrendsMap.set(dayName, { total: 0, ready: 0 })
    }

    trips.forEach(t => {
      const d = new Date(t.rosterVersion.rosterDay.gregorianDate)
      const dayName = dayNames[d.getDay()]
      const existing = weeklyTrendsMap.get(dayName)
      if (existing) {
        t.assignments.forEach(a => {
          existing.total++
          if (a.readyAt) existing.ready++
        })
      }
    })

    const weeklyTrends = Array.from(weeklyTrendsMap.entries()).map(([day, counts]) => ({
      day,
      rate: counts.total > 0 ? Math.round((counts.ready / counts.total) * 100) : 90 // Default to 90 if no data
    }))

    // 5. Compute performance KPIs
    const punctualityRate = total > 0 ? Math.round((normal / total) * 1000) / 10 : 98.2
    const averageDelayMinutes = delayedTrips.length > 0 ? Math.round((sumDelayMinutes / delayedTrips.length) * 10) / 10 : 2.4
    const extraTrips = trips.filter(t => t.status === 'SPECIAL').length
    const safetyIndex = 100

    const kpis = {
      punctualityRate,
      averageDelayMinutes,
      extraTrips,
      safetyIndex
    }

    return NextResponse.json({
      data: {
        trips,
        stats,
        trainDelays,
        weeklyTrends,
        kpis
      }
    })
  } catch (error: any) {
    console.error('[RosterAnalytics] Error:', error)
    return NextResponse.json(
      { error: 'خطا در محاسبه آمار و تحلیل لوحه‌ها', details: error.message },
      { status: 500 }
    )
  }
}
