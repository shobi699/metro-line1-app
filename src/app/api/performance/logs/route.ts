import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/auth'
import { requireRole } from '@/server/rbac/guard'
import { createLogSchema } from '@/lib/zod'
import { logPerformanceAction } from '@/server/modules/performance/service'

export async function GET(req: NextRequest) {
  try {
    const { user } = await authenticate(req)
    if (!user) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')
    const isAdmin = ['admin', 'super_admin'].includes(user.roleKey)

    const where: any = {}
    if (!isAdmin) {
      where.employeeId = user.id
    } else if (employeeId) {
      where.employeeId = employeeId
    }

    const logs = await prisma.performanceLog.findMany({
      where,
      include: {
        actionType: { include: { competency: true } },
        recordedBy: { select: { name: true,  } },
        appeals: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: logs })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authenticate(req)
    if (!user) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
    await requireRole(user, 'admin')

    const body = await req.json()
    const parsed = createLogSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: parsed.error.issues[0].message } }, { status: 400 })
    }

    const data = parsed.data

    const actionType = await prisma.performanceActionType.findUnique({
      where: { id: data.actionTypeId },
      include: { competency: true }
    })

    if (!actionType) {
      return NextResponse.json({ error: { message: 'ActionType not found' } }, { status: 404 })
    }

    const log = await logPerformanceAction({
      employeeId: data.employeeId,
      recordedById: user.id,
      actionTypeId: data.actionTypeId,
      severity: data.severity,
      note: data.note || undefined,
      evidenceUrl: data.evidenceUrl || undefined,
    })

    // Gamification Hook: Automatic points for positive actions
    if (actionType.competency.direction === 'positive' || actionType.competency.direction === 'both') {
      const points = actionType.defaultScore * (data.severity === 'L3' ? 3 : data.severity === 'L2' ? 2 : 1)
      if (points > 0) {
        await prisma.gamificationScore.create({
          data: {
            userId: data.employeeId,
            points,
            reason: `عملکرد مثبت: ${actionType.title}`,
            period: log.periodId,
          }
        }).catch(() => {})
      }
    }

    return NextResponse.json({ data: log })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}


