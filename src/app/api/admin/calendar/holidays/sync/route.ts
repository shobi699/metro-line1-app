import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { syncPersianHolidays } from '@/server/modules/calendar/admin-sync-service'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  console.log('USER PERMISSIONS:', user.permissions, 'ROLE:', user.roleKey)
  const permErr = requirePermission(user, 'calendar-admin:holidays')
  if (permErr) return authErrorResponse(permErr)

  try {
    const body = await request.json().catch(() => ({}))
    const fromYear = body?.fromYear ? Number(body.fromYear) : 1400

    const result = await syncPersianHolidays(user.id, fromYear)
    return NextResponse.json({ data: result })
    } catch (err: any) {
    console.error('SYNC ERROR:', err)
    return NextResponse.json(
      { error: { code: 'SYNC_FAILED', message: err?.message || String(err) || 'خطا در هماهنگ‌سازی دیتابیس' } },
      { status: 500 }
    )
  }
}
