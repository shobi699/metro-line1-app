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
    const body = await request.json()
    const disputeNote = body.disputeNote as string | undefined

    if (!disputeNote?.trim()) {
      return NextResponse.json({ error: 'شرح مغایرت الزامی است' }, { status: 400 })
    }
    
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
        disputed: true,
        disputeNote: disputeNote.trim()
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'TripAssignment',
        entityId: assignment.id,
        action: 'update',
        after: {
          disputed: true,
          disputeNote: updated.disputeNote
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'گزارش مغایرت با موفقیت ثبت شد و به اطلاع سرشیفت خواهد رسید.',
      data: updated
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ثبت گزارش مغایرت: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
