import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getModuleFlags, updateModuleFlags } from '@/server/modules/modules/service'

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if ('error' in user) return authErrorResponse(user)

  if (!['super_admin', 'admin'].includes(user.roleKey)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'دسترسی فقط برای مدیران ارشد سیستم امکان‌پذیر است' } },
      { status: 403 }
    )
  }

  try {
    const flags = await getModuleFlags()
    return NextResponse.json({ data: { flags } })
  } catch (err) {
    console.error('[GET /api/admin/modules] Error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'خطا در بارگذاری وضعیت ماژول‌ها' } },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req)
  if ('error' in user) return authErrorResponse(user)

  if (!['super_admin', 'admin'].includes(user.roleKey)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'تنها سوپر ادمین اجازه تغییر وضعیت ماژول‌های سامانه را دارد' } },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    if (!body || !Array.isArray(body.flags)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'ساختار ورودی ماژول‌ها نامعتبر است' } },
        { status: 400 }
      )
    }

    const updated = await updateModuleFlags(body.flags, user.id)
    return NextResponse.json({ data: { flags: updated } })
  } catch (err) {
    console.error('[PUT /api/admin/modules] Error:', err)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'خطا در ثبت تغییرات ماژول‌ها' } },
      { status: 500 }
    )
  }
}
