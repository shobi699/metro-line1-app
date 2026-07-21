import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import {
  calculatePeriodScoresAndNormalize,
  nominatePersonnel,
  getCurrentPeriodId
} from '@/server/modules/performance/service'

export const dynamic = 'force-dynamic'

// POST /api/admin/performance/nominate - Run calculation and nomination for a period
export async function POST(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = await requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const { searchParams } = new URL(request.url)
    const periodId = searchParams.get('periodId') || getCurrentPeriodId()

    // 1. Run scoring calculation and department Z-score normalization
    await calculatePeriodScoresAndNormalize(periodId)

    // 2. Run auto-nomination engine
    const nominationResult = await nominatePersonnel(periodId)

    return NextResponse.json({
      data: nominationResult,
      message: 'فرآیند تجمیع، نرمال‌سازی و انتخاب پرسنل نمونه با موفقیت به پایان رسید',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در اجرای فرآیند ارزیابی: ' + message },
      { status: 500 }
    )
  }
}

// GET /api/admin/performance/nominate - Fetch nominations history and pending appeals for the admin queue
export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = await requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    // 1. Fetch recent nominations
    const nominations = await prisma.nomination.findMany({
      include: {
        periodEmployee: {
          select: { name: true, customFields: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // 2. Fetch pending appeals for the HR queue
    const pendingAppeals = await prisma.performanceAppeal.findMany({
      where: { status: 'pending' },
      include: {
        employee: { select: { name: true, customFields: true } },
        log: {
          include: {
            actionType: { include: { competency: true } },
            recordedBy: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      data: {
        nominations,
        pendingAppeals,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در دریافت صف ارزیابی: ' + message },
      { status: 500 }
    )
  }
}
