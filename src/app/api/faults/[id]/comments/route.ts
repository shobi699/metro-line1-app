import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'faults:read')
  if (err) return authErrorResponse(err)

  const { id } = await params
  try {
    const { note } = await request.json()
    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'متن نظر نمی‌تواند خالی باشد.' }, { status: 400 })
    }

    const log = await prisma.$transaction(async (tx) => {
      const commentLog = await tx.faultLog.create({
        data: {
          faultId: id,
          actorId: user.id,
          action: 'comment',
          note: note.trim(),
        },
        include: {
          actor: { select: { id: true, name: true } },
        },
      })

      // Add to audit trail
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FaultReportComment',
          entityId: id,
          action: 'create',
          after: { note: note.trim() },
        },
      })

      return commentLog
    })

    return NextResponse.json({ data: log })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در ثبت نظر' }, { status: 500 })
  }
}
