import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getLeaderboard, getCurrentPeriodId } from '@/server/modules/performance/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const { searchParams } = new URL(request.url)
  const targetPeriodId = searchParams.get('periodId') || getCurrentPeriodId()

  try {
    const leaderboard = await getLeaderboard(targetPeriodId, sessionUser.id)
    return NextResponse.json({ data: leaderboard })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در دریافت جدول رده‌بندی: ' + message },
      { status: 500 }
    )
  }
}
