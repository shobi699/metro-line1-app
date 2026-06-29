import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const rosterDays = await prisma.rosterDay.findMany({
      orderBy: { gregorianDate: 'desc' },
      take: 10,
    })
    return NextResponse.json({ data: rosterDays })
  } catch {
    return NextResponse.json({ error: 'خطا در دریافت تاریخچه لوحه‌ها' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'این مسیر منسوخ شده است. لطفا از مسیر جدید /api/rosters/upload استفاده کنید.' },
    { status: 410 }
  )
}
