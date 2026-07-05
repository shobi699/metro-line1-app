import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { exportMonthToExcel } from '@/server/modules/calendar'
import { jdate } from '@/lib/dayjs'

/** GET /api/calendar/export?year=1405&month=4&format=xlsx — خروجی ماهانه */
export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const now = jdate()
  const jYear = Number(searchParams.get('year') ?? now.year())
  const jMonth = Number(searchParams.get('month') ?? now.month() + 1)
  const format = searchParams.get('format') ?? 'xlsx'

  if (!Number.isInteger(jYear) || !Number.isInteger(jMonth) || jMonth < 1 || jMonth > 12 || jYear < 1300 || jYear > 1500) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'سال یا ماه جلالی نامعتبر است' } },
      { status: 400 },
    )
  }

  if (format !== 'xlsx') {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'فعلاً فقط خروجی xlsx پشتیبانی می‌شود' } },
      { status: 400 },
    )
  }

  const buffer = await exportMonthToExcel({
    userId: user.id,
    roleKey: user.roleKey,
    jYear,
    jMonth,
  })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="calendar-${jYear}-${String(jMonth).padStart(2, '0')}.xlsx"`,
    },
  })
}
