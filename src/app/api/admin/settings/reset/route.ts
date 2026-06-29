import { NextResponse } from 'next/server'
import { resetSetting } from '@/server/modules/settings/service'
import {
  getSessionUser,
  requirePermission,
  authErrorResponse,
} from '@/server/rbac/guard'
import { resetSettingSchema } from '@/lib/zod/admin'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:update')
  if (permErr) return authErrorResponse(permErr)

  try {
    const body = await request.json()
    const parsed = resetSettingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const updated = await resetSetting(parsed.data.key, user.id)
    return NextResponse.json({
      message: 'تنظیم با موفقیت به مقدار پیش‌فرض بازگردانده شد',
      data: updated,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: message || 'خطا در بازگردانی تنظیم به پیش‌فرض' },
      { status: 400 }
    )
  }
}
