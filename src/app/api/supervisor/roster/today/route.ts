import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { validateRoster } from '@/server/modules/roster/service'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const url = new URL(request.url)
    const dateParam = url.searchParams.get('date')
    
    let targetDateStr = dateParam
    if (!targetDateStr) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      targetDateStr = `${year}-${month}-${day}`
    } else if (targetDateStr.includes('T')) {
      targetDateStr = targetDateStr.split('T')[0]
    }

    const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`)

    const rosterDay = await prisma.rosterDay.findFirst({
      where: {
        gregorianDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 1,
          include: {
            trips: {
              include: {
                assignments: {
                  include: {
                    matchedUser: {
                      select: { id: true, name: true, personnelCode: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!rosterDay || rosterDay.versions.length === 0) {
      return NextResponse.json({
        data: {
          rosterDay: null,
          trips: [],
          issues: [],
          stats: {
            totalTrips: 0,
            acknowledgedCount: 0,
            readyCount: 0,
            disputeCount: 0,
            unassignedCount: 0
          }
        }
      })
    }

    const publishedVersion = rosterDay.versions[0]
    const trips = publishedVersion.trips
    
    // Sort trips by departureTime
    trips.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''))

    const issues = await validateRoster(trips, trips.flatMap(t => t.assignments))

    // Calculate metrics
    const totalTrips = trips.length
    let acknowledgedCount = 0
    let readyCount = 0
    let disputeCount = 0
    let unassignedCount = 0

    trips.forEach(trip => {
      let isUnassigned = true
      trip.assignments.forEach(assign => {
        if (assign.matchedUserId) {
          isUnassigned = false
        }
        if (assign.acknowledgedAt) acknowledgedCount++
        if (assign.readyAt) readyCount++
        if (assign.disputed) disputeCount++
      })
      if (isUnassigned) unassignedCount++
    })

    const resultPayload = {
      rosterDay: {
        id: rosterDay.id,
        jalaliDate: rosterDay.jalaliDate,
        gregorianDate: rosterDay.gregorianDate,
        title: rosterDay.title,
        schedulingTitle: rosterDay.schedulingTitle,
        status: rosterDay.status,
        versionId: publishedVersion.id,
        versionNo: publishedVersion.versionNo
      },
      trips,
      issues,
      stats: {
        totalTrips,
        acknowledgedCount,
        readyCount,
        disputeCount,
        unassignedCount
      }
    }

    const { applyVisibilityMatrix } = await import('@/server/modules/roster/visibility-filter')
    const filteredPayload = await applyVisibilityMatrix(resultPayload, user.roleKey)

    return NextResponse.json({
      data: filteredPayload
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات داشبورد سرشیفت: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
