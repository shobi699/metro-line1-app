import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { reviewPerformanceAppeal } from '@/server/modules/performance/service'
import { reviewAppealSchema } from '@/lib/zod/admin'

// PATCH /api/admin/performance/appeal/[id] - Review appeal (Admin/HR Only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  // Enforce admin/manager role
  const roleErr = await requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id: appealId } = await params

  try {
    const body = await request.json()
    const parsed = reviewAppealSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { status, note } = parsed.data

    const appeal = await reviewPerformanceAppeal(
      appealId,
      sessionUser.id,
      status,
      note || undefined
    )

    return NextResponse.json({
      data: appeal,
      message: status === 'approved' ? 'اعتراض تایید شد و امتیاز خطا حذف گردید' : 'اعتراض رد شد',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در بررسی اعتراض: ' + message },
      { status: 500 }
    )
  }
}
