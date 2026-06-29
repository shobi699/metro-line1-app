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
    const { id } = await params // tripId
    
    // Find the assignment for the current user and trip
    const assignment = await prisma.tripAssignment.findFirst({
      where: {
        tripId: id,
        matchedUserId: user.id
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'شما به این سفر تخصیص داده نشده‌اید' }, { status: 403 })
    }

    const updated = await prisma.tripAssignment.update({
      where: { id: assignment.id },
      data: {
        acknowledgedAt: new Date()
      }
    })

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'TripAssignment',
        entityId: assignment.id,
        action: 'update',
        after: { acknowledgedAt: updated.acknowledgedAt }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'تأیید رؤیت سفر با موفقیت ثبت شد.',
      data: updated
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ثبت تایید رویت: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
