import { NextResponse } from 'next/server'
import { getSettings, updateSettings } from '@/server/modules/settings/service'
import {
  getSessionUser,
  requirePermission,
  authErrorResponse,
} from '@/server/rbac/guard'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  updates: z.array(
    z.object({
      key: z.string().min(1, 'کلید تنظیم الزامی است'),
      value: z.any(),
    })
  ).min(1, 'لیست تغییرات نمی‌تواند خالی باشد'),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:read')
  if (permErr) return authErrorResponse(permErr)

  try {
    const settings = await getSettings()
    return NextResponse.json({ data: settings })
  } catch (error: unknown) {
    console.error('Error fetching settings:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: `خطا در دریافت تنظیمات: ${message}` },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:update')
  if (permErr) return authErrorResponse(permErr)

  try {
    const body = await request.json()
    const parsed = updateSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const updated = await updateSettings(parsed.data.updates, user.id)
    return NextResponse.json({
      message: 'تنظیمات با موفقیت بروزرسانی شد',
      data: updated,
    })
  } catch (error: unknown) {
    console.error('Error updating settings:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: message || 'خطا در بروزرسانی تنظیمات' },
      { status: 400 }
    )
  }
}
