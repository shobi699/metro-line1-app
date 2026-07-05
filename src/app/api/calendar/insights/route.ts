import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getCalendarInsights } from '@/server/modules/calendar'
import { jdate } from '@/lib/dayjs'

/**
 * GET /api/calendar/insights?year=1405&month=4 (جلالی)
 * آمار ماه + مقایسه با ماه قبل + پل تعطیلات + شمارش معکوس.
 */
export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const now = jdate()
  const jYear = Number(searchParams.get('year') ?? now.year())
  const jMonth = Number(searchParams.get('month') ?? now.month() + 1)

  if (!Number.isInteger(jYear) || !Number.isInteger(jMonth) || jMonth < 1 || jMonth > 12 || jYear < 1300 || jYear > 1500) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'سال یا ماه جلالی نامعتبر است' } },
      { status: 400 },
    )
  }

  const insights = await getCalendarInsights({
    userId: user.id,
    roleKey: user.roleKey,
    jYear,
    jMonth,
  })
  return NextResponse.json({ data: insights })
}
