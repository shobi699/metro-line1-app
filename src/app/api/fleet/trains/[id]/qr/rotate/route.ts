import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fleet:manage')
  if (err) return authErrorResponse(err)

  const { id } = await params
  const newQrToken = randomUUID()

  try {
    const train = await prisma.train.findUnique({ where: { id } })
    if (!train || !train.isActive) {
      return NextResponse.json({ error: 'قطار یافت نشد' }, { status: 404 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.train.update({
        where: { id },
        data: { qrToken: newQrToken },
      })

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'Train',
          entityId: id,
          action: 'update',
          reason: 'چرخش توکن QR قطار',
          before: { qrToken: train.qrToken },
          after: { qrToken: newQrToken },
        },
      })

      return u
    })

    return NextResponse.json({ data: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در بازتولید توکن' }, { status: 500 })
  }
}
