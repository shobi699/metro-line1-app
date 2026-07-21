import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse, requireRole } from '@/server/rbac/guard'
import { pushDrivers } from '@/server/modules/notifications/gateway'

export async function POST(
  request: Request,
  props: { params: Promise<{ key: string }> }
) {
  const params = await props.params
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const isDenied = await requireRole(user, 'admin')
  if (isDenied) return authErrorResponse(isDenied)

  const { key } = params
  const driver = pushDrivers[key as 'pushe' | 'najva' | 'selfhosted']

  if (!driver) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'درایور مورد نظر یافت نشد' } }, { status: 404 })
  }

  try {
    // Reset errors first to clear circuit breaker if blocked
    if ('resetErrors' in driver) {
      (driver as any).resetErrors()
    }

    const report = await driver.send(
      {
        title: '🔔 تست اتصال موفقیت‌آمیز',
        body: 'این یک اعلان آزمایشی جهت تایید صحت عملکرد دروازه اعلان است.',
        severity: 'info',
      },
      [{ userId: user.id, token: 'test-token', platform: 'web' }]
    )

    if (report.success) {
      return NextResponse.json({ data: { success: true, messageId: report.driverMessageId } })
    } else {
      return NextResponse.json({ error: { code: 'DRIVER_ERROR', message: report.error || 'خطا در ارسال پیام تستی' } }, { status: 500 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: err.message } }, { status: 500 })
  }
}
