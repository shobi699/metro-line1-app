import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { deletePart } from '@/server/modules/parts/service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Only fleet managers or admins can modify parts
  const err = requirePermission(user, 'fleet:manage')
  if (err) return authErrorResponse(err)

  try {
    const { id } = await params
    const body = await request.json()
    const { name, partNumber, trainType, description } = body

    if (!name) {
      return NextResponse.json({ error: 'نام قطعه الزامی است' }, { status: 400 })
    }
    if (trainType !== 'AC' && trainType !== 'DC' && trainType !== 'both') {
      return NextResponse.json({ error: 'نوع قطار نامعتبر است' }, { status: 400 })
    }

    // Check if name is taken by another part
    const existing = await prisma.part.findFirst({
      where: {
        name,
        id: { not: id },
        isActive: true,
      },
    })
    if (existing) {
      return NextResponse.json({ error: 'نام قطعه قبلا ثبت شده است.' }, { status: 400 })
    }

    const part = await prisma.part.update({
      where: { id },
      data: {
        name,
        partNumber: partNumber || null,
        trainType,
        description: description || null,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'Part',
        entityId: part.id,
        action: 'update',
        after: part,
      },
    })

    return NextResponse.json({ data: part })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در ویرایش قطعه' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Only fleet managers or admins can delete/deactivate parts
  const err = requirePermission(user, 'fleet:manage')
  if (err) return authErrorResponse(err)

  try {
    const { id } = await params
    const part = await deletePart(id, user.id)
    return NextResponse.json({ data: part })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'خطا در حذف قطعه' }, { status: 500 })
  }
}
