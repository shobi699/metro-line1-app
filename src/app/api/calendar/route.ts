import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getCalendarRange, calendarRangeSchema } from '@/server/modules/calendar'

/**
 * GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&layers=shift,holidays,personal,org
 * داده تجمیعی همه لایه‌های تقویم برای بازه — یک درخواست، یک پاسخ.
 */
export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const parsed = calendarRangeSchema.safeParse({
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
    layers: searchParams.get('layers') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 },
    )
  }

  try {
    const data = await getCalendarRange({
      userId: user.id,
      roleKey: user.roleKey,
      from: parsed.data.from,
      to: parsed.data.to,
      layers: parsed.data.layers?.split(',').filter(Boolean),
    })
    return NextResponse.json({ data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message } },
      { status: 400 },
    )
  }
}
