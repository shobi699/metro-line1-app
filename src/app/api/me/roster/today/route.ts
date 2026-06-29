import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const url = new URL(request.url)
    const dateParam = url.searchParams.get('date')
    
    let targetDate = new Date()
    if (dateParam) {
      targetDate = new Date(dateParam)
    }

    // SQLite date matching requires start and end of day comparison
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999)

    // Find the roster day
    const rosterDay = await prisma.rosterDay.findFirst({
      where: {
        gregorianDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { versionNo: 'desc' },
          take: 1,
          include: {
            trips: {
              include: {
                assignments: {
                  where: { matchedUserId: user.id }
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
          trips: []
        }
      })
    }

    const publishedVersion = rosterDay.versions[0]
    
    // Extract trips that this driver is assigned to
    const driverTrips = publishedVersion.trips
      .filter(trip => trip.assignments.length > 0)
      .map(trip => {
        const myAssignment = trip.assignments[0] // Since we filtered assignments by matchedUserId: user.id, there's only one
        return {
          id: trip.id,
          rowNo: trip.rowNo,
          trainNumber: trip.trainNumber,
          direction: trip.direction,
          originStation: trip.originStation,
          destinationStation: trip.destinationStation,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          status: trip.status,
          operationalNote: trip.operationalNote,
          assignment: {
            id: myAssignment.id,
            role: myAssignment.role,
            acknowledgedAt: myAssignment.acknowledgedAt,
            readyAt: myAssignment.readyAt,
            handoverAt: myAssignment.handoverAt,
            disputed: myAssignment.disputed,
            disputeNote: myAssignment.disputeNote,
            confirmedAt: myAssignment.confirmedAt
          }
        }
      })

    // Sort trips by departure time
    driverTrips.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''))

    return NextResponse.json({
      data: {
        rosterDay: {
          id: rosterDay.id,
          jalaliDate: rosterDay.jalaliDate,
          gregorianDate: rosterDay.gregorianDate,
          title: rosterDay.title,
          schedulingTitle: rosterDay.schedulingTitle,
          versionNo: publishedVersion.versionNo,
          rosterVersionId: publishedVersion.id
        },
        trips: driverTrips
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت برنامه لوحه راننده: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
