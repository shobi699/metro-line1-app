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
    const widgets = await prisma.uiDashboardWidget.findMany({
      orderBy: { orderIndex: 'asc' },
    })
    return NextResponse.json({ data: widgets })
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
    const { widgets } = body

    if (!Array.isArray(widgets)) {
      return NextResponse.json({ error: 'آرایه ابزارک‌ها معتبر نیست' }, { status: 400 })
    }

    const before = await prisma.uiDashboardWidget.findMany()

    // Run transaction to replace widgets
    await prisma.$transaction(async (tx) => {
      await tx.uiDashboardWidget.deleteMany()
      await tx.uiDashboardWidget.createMany({
        data: widgets.map((w: any, idx: number) => ({
          widgetType: w.widgetType,
          title: w.title || null,
          size: w.size || 'md',
          orderIndex: typeof w.orderIndex === 'number' ? w.orderIndex : idx,
          isVisible: typeof w.isVisible === 'boolean' ? w.isVisible : true,
          configJson: w.configJson || {},
          requiredPermission: w.requiredPermission || null,
        }))
      })
    })

    const after = await prisma.uiDashboardWidget.findMany({
      orderBy: { orderIndex: 'asc' },
    })

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        entity: 'UiDashboardWidget',
        entityId: 'dashboard',
        action: 'update',
        before: before as any,
        after: after as any,
        reason: 'به‌روزرسانی و شخصی‌سازی ابزارک‌های داشبورد موبایل',
      },
    })

    return NextResponse.json({
      message: 'ابزارک‌های داشبورد با موفقیت بروزرسانی شدند',
      data: after,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
