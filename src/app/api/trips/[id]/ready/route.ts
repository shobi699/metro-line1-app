import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { checkIn, checkOut } from '@/server/modules/attendance/service'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

// POST /api/trips/[id]/ready — اعلام آمادگی + ایجاد AttendanceRecord (§۱۳.۲)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const { id } = await params

    const assignment = await prisma.tripAssignment.findFirst({
      where: { tripId: id, matchedUserId: user.id },
      include: { trip: true },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'شما به این سفر تخصیص داده نشده‌اید' }, { status: 403 })
    }

    const updated = await prisma.tripAssignment.update({
      where: { id: assignment.id },
      data: { readyAt: new Date() },
    })

    // Enforce checklist completion before trip start (§۱۳.۳)
    try {
      const activeTemplate = await prisma.checklistTemplate.findFirst({
        where: { isActive: true }
      })
      if (activeTemplate) {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const completedChecklist = await prisma.checklistRecord.findFirst({
          where: {
            userId: user.id,
            trainId: assignment.trip?.trainNumber || undefined,
            templateId: activeTemplate.id,
            signedAt: { gte: todayStart }
          }
        })
        if (!completedChecklist) {
          return NextResponse.json({
            error: 'پر کردن چک‌لیست قبل از حرکت الزامی است',
            checklistRequired: true
          }, { status: 400 })
        }
      }
    } catch (checklistErr) {
      console.error('Checklist verification error:', checklistErr)
    }

    // اتصال به حضور و غیاب — ایجاد checkIn اگر هنوز نبوده (§۱۳.۲)
    const body = await request.clone().json().catch(() => ({}))
    const geoLocation = (body as Record<string, unknown>)?.geoLocation as string | undefined
    const stationId = assignment.trip?.originStation ?? undefined

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        userId: user.id,
        checkInTime: { gte: todayStart },
      },
    })

    if (!existingRecord) {
      await checkIn({
        userId: user.id,
        stationId,
        geoLocation,
        method: 'roster_ready',
      })
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'TripAssignment',
        entityId: assignment.id,
        action: 'update',
        after: { readyAt: updated.readyAt },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'اعلام آمادگی و حضور با موفقیت ثبت شد.',
      data: updated,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ثبت اعلام آمادگی: ' + (error.message || String(error)) },
      { status: 500 },
    )
  }
}
