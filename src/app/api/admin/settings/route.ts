import { NextResponse } from 'next/server'
import { getSettings, updateSettings, createSetting, deleteSetting } from '@/server/modules/settings/service'
import {
  getSessionUser,
  requirePermission,
  authErrorResponse,
} from '@/server/rbac/guard'
import { updateSettingsSchema, createSettingSchema, deleteSettingSchema } from '@/lib/zod/admin'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:read')
  if (permErr) return authErrorResponse(permErr)

  try {
    const settings = await getSettings()
    return NextResponse.json({ data: settings })
  } catch (error: unknown) {
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
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: message || 'خطا در بروزرسانی تنظیمات' },
      { status: 400 }
    )
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:update')
  if (permErr) return authErrorResponse(permErr)

  try {
    const body = await request.json()
    const parsed = createSettingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const created = await createSetting(parsed.data, user.id)
    return NextResponse.json({
      message: 'تنظیم جدید با موفقیت ایجاد شد',
      data: created,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: message || 'خطا در ایجاد تنظیم' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const permErr = requirePermission(user, 'settings:update')
  if (permErr) return authErrorResponse(permErr)

  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    
    if (!key) {
       return NextResponse.json(
        { error: 'کلید تنظیم الزامی است' },
        { status: 400 }
      )
    }

    const parsed = deleteSettingSchema.safeParse({ key })

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const deleted = await deleteSetting(parsed.data.key, user.id)
    return NextResponse.json({
      message: 'تنظیم با موفقیت حذف شد',
      data: deleted,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: message || 'خطا در حذف تنظیم' },
      { status: 400 }
    )
  }
}
