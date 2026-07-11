import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = await requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const monthlyTotal = await prisma.setting.findUnique({ where: { key: 'ai.budget.monthlyTotal' } })
    const userMonthlyCap = await prisma.setting.findUnique({ where: { key: 'ai.budget.userMonthlyCap' } })

    return NextResponse.json({
      data: {
        monthlyTotal: monthlyTotal ? Number(monthlyTotal.value) : 1000000,
        userMonthlyCap: userMonthlyCap ? Number(userMonthlyCap.value) : 100000,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در دریافت تنظیمات بودجه' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = await requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { monthlyTotal, userMonthlyCap } = await request.json()

    if (monthlyTotal !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'ai.budget.monthlyTotal' },
        update: { value: String(monthlyTotal) },
        create: {
          key: 'ai.budget.monthlyTotal',
          value: String(monthlyTotal),
          category: 'ai',
          label: 'سقف کل بودجه ماهانه توکن',
          type: 'number',
          defaultValue: '1000000'
        }
      })
    }

    if (userMonthlyCap !== undefined) {
      await prisma.setting.upsert({
        where: { key: 'ai.budget.userMonthlyCap' },
        update: { value: String(userMonthlyCap) },
        create: {
          key: 'ai.budget.userMonthlyCap',
          value: String(userMonthlyCap),
          category: 'ai',
          label: 'سقف مصرف ماهانه توکن هر کاربر',
          type: 'number',
          defaultValue: '100000'
        }
      })
    }

    return NextResponse.json({ data: { success: true } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در ثبت تنظیمات بودجه' }, { status: 500 })
  }
}
