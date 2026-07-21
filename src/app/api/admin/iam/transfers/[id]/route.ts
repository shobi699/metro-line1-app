import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, authErrorResponse, can } from '@/server/rbac/guard'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const { status } = body // 'approved' | 'rejected'

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'وضعیت نامعتبر است' }, { status: 400 })
    }

    const transfer = await prisma.transferRequest.findUnique({
      where: { id }
    })

    if (!transfer) {
      return NextResponse.json({ error: 'درخواست یافت نشد' }, { status: 404 })
    }

    if (transfer.status !== 'pending') {
      return NextResponse.json({ error: 'این درخواست قبلا تعیین وضعیت شده است' }, { status: 400 })
    }

    // Update status
    const updated = await prisma.$transaction(async (tx) => {
      const updatedTransfer = await tx.transferRequest.update({
        where: { id },
        data: {
          status,
          approvedById: user.id
        }
      })

      // If approved, update user's homeUnitId immediately (or we could wait until effectiveDate, but for simplicity we do it now)
      if (status === 'approved') {
        await tx.user.update({
          where: { id: transfer.userId },
          data: { homeUnitId: transfer.toUnitId }
        })

        // Also add a lifecycle event
        await tx.userLifecycleEvent.create({
          data: {
            userId: transfer.userId,
            kind: 'transferred',
            actorId: user.id,
            detail: {
              fromUnitId: transfer.fromUnitId,
              toUnitId: transfer.toUnitId,
              transferRequestId: id,
              effectiveDate: transfer.effectiveDate
            }
          }
        })
      }

      return updatedTransfer
    })

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
