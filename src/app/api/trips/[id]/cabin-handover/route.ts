import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const { id } = await params
    
    const assignment = await prisma.tripAssignment.findFirst({
      where: {
        tripId: id,
        matchedUserId: user.id
      },
      include: { trip: true }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'شما به این سفر تخصیص داده نشده‌اید' }, { status: 403 })
    }

    const updated = await prisma.tripAssignment.update({
      where: { id: assignment.id },
      data: {
        handoverAt: new Date()
      }
    })

    // Auto-checkout if last trip of day (§۱۳.۲)
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const tomorrow = new Date(todayStart)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const allTodayTrips = await prisma.trip.findMany({
        where: {
          rosterVersionId: assignment.trip.rosterVersionId,
          assignments: {
            some: { matchedUserId: user.id }
          }
        },
        orderBy: { departureTime: 'asc' }
      })

      const lastTrip = allTodayTrips[allTodayTrips.length - 1]
      const isLastTrip = lastTrip && lastTrip.id === assignment.tripId

      if (isLastTrip) {
        const activeRecord = await prisma.attendanceRecord.findFirst({
          where: {
            userId: user.id,
            checkOutTime: null,
            checkInTime: { gte: todayStart, lt: tomorrow }
          }
        })
        if (activeRecord) {
          const { checkOut } = await import('@/server/modules/attendance/service')
          const body = await request.clone().json().catch(() => ({}))
          const geoLocation = (body as Record<string, unknown>)?.geoLocation as string | undefined
          await checkOut(user.id, geoLocation)
        }
      }
    } catch (attendanceErr) {
      // Non-blocking log, continue assignment update
      console.error('Error linking attendance checkOut:', attendanceErr)
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'TripAssignment',
        entityId: assignment.id,
        action: 'update',
        after: { handoverAt: updated.handoverAt }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تحویل کابین با موفقیت ثبت شد.',
      data: updated
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ثبت تحویل کابین: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
