import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/server/db'

// POST /api/trips/[id]/approve-delay — تأیید تأخیر توسط سرشیفت (§۱۴)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: assignmentId } = await params

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

  // RBAC: only admin, super_admin, or operator
  if (!['admin', 'super_admin', 'operator'].includes(userRole)) {
    return NextResponse.json({ error: 'فقط سرشیفت یا مدیر مجاز به تأیید تأخیر است' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { reason, delayMinutes } = body as { reason?: string; delayMinutes?: number }

    // Find the assignment
    const assignment = await prisma.tripAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        trip: {
          include: {
            rosterVersion: {
              include: { rosterDay: true },
            },
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json({ error: 'تخصیص یافت نشد' }, { status: 404 })
    }

    // Update the dispute as approved delay
    await prisma.tripAssignment.update({
      where: { id: assignmentId },
      data: {
        disputed: false,
        disputeNote: `تأخیر تأیید شد${delayMinutes ? ` (${delayMinutes} دقیقه)` : ''}${reason ? `: ${reason}` : ''} — توسط سرشیفت`,
        confirmedById: userId,
        confirmedAt: new Date(),
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        entity: 'TripAssignment',
        entityId: assignmentId,
        action: 'update',
        after: {
          action: 'approve_delay',
          delayMinutes: delayMinutes ?? null,
          reason: reason ?? null,
        },
      },
    })

    // Notify the driver if matched
    if (assignment.matchedUserId) {
      const { createNotification } = await import('@/server/modules/notifications/service')
      await createNotification({
        userId: assignment.matchedUserId,
        type: 'info',
        title: 'تأخیر تأیید شد',
        body: `تأخیر شما در سفر قطار ${assignment.trip.trainNumber ?? 'نامشخص'} توسط سرشیفت تأیید شد.`,
        link: `/roster`,
      })
    }

    return NextResponse.json({
      data: { success: true, message: 'تأخیر با موفقیت تأیید شد' },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'خطای سرور' },
      { status: 500 },
    )
  }
}
