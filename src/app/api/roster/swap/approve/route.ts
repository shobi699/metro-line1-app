import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'

const approveSwapSchema = z.object({
  swapRequestId: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  note: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if ('error' in user) return authErrorResponse(user)
    
    // Only admins/managers can approve swaps
    const roleErr = await requireRole(user, 'admin')
    if (roleErr) return authErrorResponse(roleErr)

    const body = await req.json()
    const result = approveSwapSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid payload', details: result.error.flatten().fieldErrors }, { status: 400 })
    }

    const { swapRequestId, action, note } = result.data

    const swapRequest = await prisma.tripSwapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        sourceAssignment: true,
        targetAssignment: true
      }
    })

    if (!swapRequest) {
      return NextResponse.json({ error: 'درخواست یافت نشد.' }, { status: 404 })
    }

    if (swapRequest.status !== 'pending') {
      return NextResponse.json({ error: 'این درخواست قبلاً تعیین تکلیف شده است.' }, { status: 400 })
    }

    if (action === 'reject') {
      await prisma.tripSwapRequest.update({
        where: { id: swapRequestId },
        data: {
          status: 'rejected',
          reviewedBy: user.id,
          note: note ? `${swapRequest.note || ''}\nیادداشت مدیر: ${note}` : swapRequest.note
        }
      })

      // Notify requester
      await prisma.notification.create({
        data: {
          userId: swapRequest.requesterId,
          type: 'warning' as any,
          title: 'رد درخواست جابه‌جایی',
          body: 'درخواست جابه‌جایی شیفت شما توسط مدیر رد شد.',
          link: '/roster/my-day'
        }
      })

      return NextResponse.json({ success: true, message: 'درخواست رد شد.' })
    }

    // Approve Action
    await prisma.$transaction(async (tx) => {
      // 1. Update swap status
      await tx.tripSwapRequest.update({
        where: { id: swapRequestId },
        data: {
          status: 'approved',
          reviewedBy: user.id,
          note: note ? `${swapRequest.note || ''}\nیادداشت تایید مدیر: ${note}` : swapRequest.note
        }
      })

      // 2. Swap Users in Assignments
      const reqUserId = swapRequest.sourceAssignment.matchedUserId
      const tgtUserId = swapRequest.targetAssignment.matchedUserId

      await tx.tripAssignment.update({
        where: { id: swapRequest.sourceAssignmentId },
        data: { matchedUserId: tgtUserId }
      })

      await tx.tripAssignment.update({
        where: { id: swapRequest.targetAssignmentId },
        data: { matchedUserId: reqUserId }
      })

      // 3. Notify Both
      await tx.notification.createMany({
        data: [
          {
            userId: swapRequest.requesterId,
            type: 'success' as any,
            title: 'تایید درخواست جابه‌جایی',
            body: 'درخواست جابه‌جایی شیفت شما توسط مدیر تایید و اعمال شد.',
            link: '/roster/my-day'
          },
          {
            userId: swapRequest.targetId,
            type: 'info' as any,
            title: 'تایید درخواست جابه‌جایی',
            body: 'یک جابه‌جایی شیفت برای شما تایید و اعمال شد. لطفاً لوحه خود را چک کنید.',
            link: '/roster/my-day'
          }
        ]
      })
    })

    return NextResponse.json({ success: true, message: 'درخواست تایید و جابه‌جایی انجام شد.' })

  } catch (error: any) {
    console.error('Swap approve error:', error)
    return NextResponse.json(
      { error: 'خطای سرور', details: error.message },
      { status: 500 }
    )
  }
}
