import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { updateTrainSchema } from '@/lib/zod/faults'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fleet:read')
  if (err) return authErrorResponse(err)

  const { id } = await params
  const train = await prisma.train.findUnique({
    where: { id },
    include: {
      wagons: {
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!train || !train.isActive) {
    return NextResponse.json({ error: 'قطار یافت نشد' }, { status: 404 })
  }

  return NextResponse.json({ data: train })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fleet:manage')
  if (err) return authErrorResponse(err)

  const { id } = await params
  try {
    const body = await request.json()
    const parsed = updateTrainSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const train = await prisma.train.findUnique({ where: { id } })
    if (!train || !train.isActive) {
      return NextResponse.json({ error: 'قطار یافت نشد' }, { status: 404 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.train.update({
        where: { id },
        data: parsed.data,
      })

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'Train',
          entityId: id,
          action: 'update',
          before: train,
          after: u,
        },
      })

      return u
    })

    return NextResponse.json({ data: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در ویرایش قطار' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fleet:manage')
  if (err) return authErrorResponse(err)

  const { id } = await params
  try {
    const train = await prisma.train.findUnique({ where: { id } })
    if (!train || !train.isActive) {
      return NextResponse.json({ error: 'قطار یافت نشد' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.train.update({
        where: { id },
        data: { isActive: false },
      })

      // Soft delete wagons as well
      await tx.wagon.updateMany({
        where: { trainId: id },
        data: { isActive: false },
      })

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'Train',
          entityId: id,
          action: 'delete',
          reason: 'حذف نرم‌افزاری قطار و واگن‌ها',
        },
      })
    })

    return NextResponse.json({ data: { success: true } })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در حذف قطار' }, { status: 500 })
  }
}
