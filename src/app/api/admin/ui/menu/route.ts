import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:read')
  if (permErr) return authErrorResponse(permErr)

  try {
    const menuItems = await prisma.uiMenuItem.findMany({
      orderBy: { orderIndex: 'asc' },
    })
    return NextResponse.json({ data: menuItems })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:update')
  if (permErr) return authErrorResponse(permErr)

  try {
    const body = await request.json()
    const { menuItems } = body

    if (!Array.isArray(menuItems)) {
      return NextResponse.json({ error: 'آرایه منوها معتبر نیست' }, { status: 400 })
    }

    const before = await prisma.uiMenuItem.findMany()

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Clear old menu items
      await tx.uiMenuItem.deleteMany()

      // 2. Create new ones
      return tx.uiMenuItem.createMany({
        data: menuItems.map((item: any, idx: number) => ({
          label: item.label,
          icon: item.icon,
          route: item.route,
          orderIndex: typeof item.orderIndex === 'number' ? item.orderIndex : idx,
          isVisible: typeof item.isVisible === 'boolean' ? item.isVisible : true,
          requiredPermission: item.requiredPermission || null,
        }))
      })
    })

    const after = await prisma.uiMenuItem.findMany({
      orderBy: { orderIndex: 'asc' },
    })

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'UiMenuItem',
        entityId: 'menu',
        action: 'update',
        before: before as any,
        after: after as any,
        reason: 'به‌روزرسانی و تغییر چیدمان منوی ناوبری موبایل',
      },
    })

    return NextResponse.json({
      message: 'منوی ناوبری با موفقیت بروزرسانی شد',
      data: after,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
