import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const cacheThreshold = await prisma.setting.findUnique({ where: { key: 'ai.cache.threshold' } })
    const faqThreshold = await prisma.setting.findUnique({ where: { key: 'ai.faq.threshold' } })

    return NextResponse.json({
      data: {
        cacheThreshold: cacheThreshold ? Number(cacheThreshold.value) : 0.92,
        faqThreshold: faqThreshold ? Number(faqThreshold.value) : 0.90,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت تنظیمات لایه‌ها' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { cacheThreshold, faqThreshold } = await request.json()

    if (cacheThreshold !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'ai.cache.threshold' },
        update: { value: String(cacheThreshold) },
        create: {
          key: 'ai.cache.threshold',
          value: String(cacheThreshold),
          category: 'ai',
          label: 'آستانه شباهت کش معنایی',
          type: 'number',
          defaultValue: '0.92'
        }
      })
    }

    if (faqThreshold !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'ai.faq.threshold' },
        update: { value: String(faqThreshold) },
        create: {
          key: 'ai.faq.threshold',
          value: String(faqThreshold),
          category: 'ai',
          label: 'آستانه شباهت پرسش‌های متداول',
          type: 'number',
          defaultValue: '0.90'
        }
      })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ثبت تنظیمات لایه‌ها' }, { status: 500 })
  }
}
