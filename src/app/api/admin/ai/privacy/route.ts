import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const maskEnabled = await prisma.setting.findUnique({ where: { key: 'ai.privacy.maskEnabled' } })
    const restrictedCats = await prisma.setting.findUnique({ where: { key: 'ai.privacy.restrictedCategories' } })

    return NextResponse.json({
      data: {
        maskEnabled: maskEnabled ? maskEnabled.value === 'true' : true,
        restrictedCategories: restrictedCats ? JSON.parse(restrictedCats.value) : [],
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت تنظیمات حریم خصوصی' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { maskEnabled, restrictedCategories } = await request.json()

    if (maskEnabled !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'ai.privacy.maskEnabled' },
        update: { value: String(maskEnabled) },
        create: {
          key: 'ai.privacy.maskEnabled',
          value: String(maskEnabled),
          category: 'ai',
          label: 'فعال بودن ماسک کردن داده‌های حساس',
          type: 'boolean',
          defaultValue: 'true'
        }
      })
    }

    if (restrictedCategories !== undefined) {
      const valStr = JSON.stringify(restrictedCategories)
      await prisma.setting.upsert({
        where: { key: 'ai.privacy.restrictedCategories' },
        update: { value: valStr },
        create: {
          key: 'ai.privacy.restrictedCategories',
          value: valStr,
          category: 'ai',
          label: 'دسته‌های اطلاعات محرمانه محدود شده RAG',
          type: 'json',
          defaultValue: '[]'
        }
      })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ثبت تنظیمات حریم خصوصی' }, { status: 500 })
  }
}
