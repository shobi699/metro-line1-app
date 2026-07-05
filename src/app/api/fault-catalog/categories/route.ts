import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { createFaultCategorySchema } from '@/lib/zod/faults'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-catalog:read')
  if (err) return authErrorResponse(err)

  const categories = await prisma.faultCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ data: categories })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const err = requirePermission(user, 'fault-catalog:manage')
  if (err) return authErrorResponse(err)

  try {
    const body = await request.json()
    const parsed = createFaultCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { code, title, sortOrder } = parsed.data

    const existing = await prisma.faultCategory.findUnique({
      where: { code },
    })

    if (existing) {
      return NextResponse.json({ error: 'کد دسته‌بندی تکراری است.' }, { status: 400 })
    }

    const category = await prisma.$transaction(async (tx) => {
      const cat = await tx.faultCategory.create({
        data: { code, title, sortOrder },
      })

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          entity: 'FaultCategory',
          entityId: cat.id,
          action: 'create',
          after: parsed.data,
        },
      })

      return cat
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'خطا در ثبت دسته‌بندی' }, { status: 500 })
  }
}
