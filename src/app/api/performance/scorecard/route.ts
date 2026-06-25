import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getEmployeeScorecard, getCurrentPeriodId } from '@/server/modules/performance/service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const { searchParams } = new URL(request.url)
  const targetPeriodId = searchParams.get('periodId') || getCurrentPeriodId()
  const targetEmployeeId = searchParams.get('employeeId') || sessionUser.id

  // Security: operators can only view their own scorecard.
  // Admins, managers, super_admins can view anyone's scorecard.
  const isAdmin = ['admin', 'super_admin', 'manager', 'chief', 'supervisor'].includes(sessionUser.roleKey || '')
  if (!isAdmin && targetEmployeeId !== sessionUser.id) {
    return NextResponse.json(
      { error: 'شما مجاز به مشاهده کارنامه سایر پرسنل نیستید' },
      { status: 403 }
    )
  }

  try {
    const scorecard = await getEmployeeScorecard(targetEmployeeId, targetPeriodId)
    return NextResponse.json({ data: scorecard })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در دریافت کارنامه عملکرد: ' + message },
      { status: 500 }
    )
  }
}
