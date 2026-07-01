import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/server/db'

// GET /api/supervisor/trips/live — سفرهای در حال اجرا (§۱۴)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'احراز هویت الزامی است' }, { status: 401 })
  }

  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }

  let userId: string
  let userRole: string
  try {
    const { payload } = await jwtVerify(
      authHeader.slice(7),
      new TextEncoder().encode(secret),
    )
    userId = payload.sub as string
    userRole = (payload as any).roleKey ?? ''
  } catch {
    return NextResponse.json({ error: 'توکن نامعتبر' }, { status: 401 })
  }

  // RBAC: only admin, super_admin, or operator can access
  if (!['admin', 'super_admin', 'operator'].includes(userRole)) {
    return NextResponse.json({ error: 'دسترسی مجاز نیست' }, { status: 403 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Find today's RosterDay
    const rosterDay = await prisma.rosterDay.findFirst({
      where: {
        gregorianDate: {
          gte: today,
          lt: tomorrow,
        },
        status: 'PUBLISHED',
      },
    })

    if (!rosterDay) {
      return NextResponse.json({ data: { trips: [], message: 'لوحه منتشرشده‌ای برای امروز یافت نشد' } })
    }

    // Get latest published version
    const version = await prisma.rosterVersion.findFirst({
      where: {
        rosterDayId: rosterDay.id,
        status: 'PUBLISHED',
      },
      orderBy: { versionNo: 'desc' },
      include: {
        trips: {
          orderBy: { departureTime: 'asc' },
          include: {
            assignments: {
              include: {
                matchedUser: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    })

    if (!version) {
      return NextResponse.json({ data: { trips: [] } })
    }

    // Determine current time to classify trips
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()

    const liveTrips = version.trips.map((trip) => {
      const depParts = trip.departureTime?.split(':').map(Number)
      const arrParts = trip.arrivalTime?.split(':').map(Number)
      const depMin = depParts ? depParts[0] * 60 + depParts[1] : null
      const arrMin = arrParts ? arrParts[0] * 60 + arrParts[1] : null

      let liveStatus: 'completed' | 'in_progress' | 'upcoming' | 'unknown' = 'unknown'
      if (depMin !== null && arrMin !== null) {
        if (nowMinutes >= arrMin) liveStatus = 'completed'
        else if (nowMinutes >= depMin) liveStatus = 'in_progress'
        else liveStatus = 'upcoming'
      }

      return {
        id: trip.id,
        rowNo: trip.rowNo,
        trainNumber: trip.trainNumber,
        direction: trip.direction,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        status: trip.status,
        liveStatus,
        assignments: trip.assignments.map((a) => ({
          id: a.id,
          role: a.role,
          rawName: a.rawName,
          matchedUserId: a.matchedUserId,
          matchedUserName: a.matchedUser?.name ?? null,
          acknowledgedAt: a.acknowledgedAt,
          readyAt: a.readyAt,
          handoverAt: a.handoverAt,
          disputed: a.disputed,
        })),
      }
    })

    return NextResponse.json({
      data: {
        jalaliDate: rosterDay.jalaliDate,
        versionNo: version.versionNo,
        trips: liveTrips,
        summary: {
          total: liveTrips.length,
          completed: liveTrips.filter((t) => t.liveStatus === 'completed').length,
          inProgress: liveTrips.filter((t) => t.liveStatus === 'in_progress').length,
          upcoming: liveTrips.filter((t) => t.liveStatus === 'upcoming').length,
          withoutAck: liveTrips.filter((t) =>
            t.assignments.some((a) => (a.role === 'H1' || a.role === 'H2') && !a.acknowledgedAt),
          ).length,
          disputed: liveTrips.filter((t) => t.assignments.some((a) => a.disputed)).length,
        },
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'خطای سرور' },
      { status: 500 },
    )
  }
}
