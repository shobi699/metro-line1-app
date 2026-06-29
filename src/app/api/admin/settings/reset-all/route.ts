import { NextResponse } from 'next/server'
import { resetAllSettings } from '@/server/modules/settings/service'
import {
  getSessionUser,
  requirePermission,
  authErrorResponse,
} from '@/server/rbac/guard'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:update')
  if (permErr) return authErrorResponse(permErr)

  try {
    const updated = await resetAllSettings(user.id)
    return NextResponse.json({
      message: 'تمامی تنظیمات با موفقیت به مقادیر پیش‌فرض بازگردانده شدند',
      data: updated,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: message || 'خطا در بازگردانی تنظیمات به پیش‌فرض' },
      { status: 400 }
    )
  }
}
