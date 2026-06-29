import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import type { Prisma } from '@/generated/prisma/client'
import { createActionTypeSchema } from '@/lib/zod/admin'

// POST /api/admin/performance/action-types - Create a new action type dynamically
export async function POST(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  // Gated for admins, managers, and super-admins
  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = createActionTypeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { competencyId, title, defaultScore, maxSeverity } = parsed.data

    // Verify competency exists
    const competency = await prisma.competency.findUnique({
      where: { id: competencyId },
    })
    if (!competency) {
      return NextResponse.json(
        { error: 'محور شایستگی انتخاب شده وجود ندارد' },
        { status: 400 }
      )
    }

    // Generate a unique ID prefixed with 'c-' to prevent conflicts with seeded IDs
    const id = 'c-' + Math.random().toString(36).substring(2, 10)

    const newActionType = await prisma.performanceActionType.create({
      data: {
        id,
        competencyId,
        title,
        defaultScore,
        maxSeverity,
      },
    })

    // Log this creation to audit logs
    await prisma.auditLog.create({
      data: {
        actorId: sessionUser.id,
        entity: 'PerformanceActionType',
        entityId: id,
        action: 'create',
        after: newActionType as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      data: newActionType,
      message: 'نوع عملکرد جدید با موفقیت به کاتالوگ سازمان افزوده شد',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در ثبت نوع عملکرد جدید: ' + message },
      { status: 500 }
    )
  }
}
