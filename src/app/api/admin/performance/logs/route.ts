import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { prisma } from '@/server/db'
import { logPerformanceAction } from '@/server/modules/performance/service'
import { z } from 'zod'

const createLogSchema = z.object({
  employeeId: z.string().min(1, 'انتخاب کارمند الزامی است'),
  actionTypeId: z.string().min(1, 'انتخاب نوع عملکرد الزامی است'),
  severity: z.enum(['L1', 'L2', 'L3']).default('L1'),
  note: z.string().optional().or(z.literal('')),
  evidenceUrl: z.string().optional().or(z.literal('')),
})

// GET /api/admin/performance/logs - Fetch all action types and competencies for dropdowns, plus recent logs
export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId')
  const periodId = searchParams.get('periodId')

  try {
    // 1. Fetch action types and competencies to populate manager dropdowns
    const competencies = await prisma.competency.findMany({
      include: {
        actionTypes: true,
      },
    })

    // 2. Fetch all active employees for selection
    const employees = await prisma.user.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        customFields: true,
      },
    })

    // 3. Fetch recent performance logs with filters if provided
    const whereClause: any = {}
    if (employeeId) whereClause.employeeId = employeeId
    if (periodId) whereClause.periodId = periodId

    const logs = await prisma.performanceLog.findMany({
      where: whereClause,
      include: {
        employee: { select: { name: true, customFields: true } },
        recordedBy: { select: { name: true } },
        actionType: { include: { competency: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      data: {
        competencies,
        employees,
        logs,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات عملکرد: ' + message },
      { status: 500 }
    )
  }
}

// POST /api/admin/performance/logs - Log a new action (Manager Only)
export async function POST(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  // Enforce manager or admin role
  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = createLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { employeeId, actionTypeId, severity, note, evidenceUrl } = parsed.data

    const log = await logPerformanceAction({
      employeeId,
      recordedById: sessionUser.id,
      actionTypeId,
      severity,
      note: note || undefined,
      evidenceUrl: evidenceUrl || undefined,
    })

    return NextResponse.json({
      data: log,
      message: 'رویداد عملکرد با موفقیت ثبت شد',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در ثبت رویداد عملکرد: ' + message },
      { status: 500 }
    )
  }
}
