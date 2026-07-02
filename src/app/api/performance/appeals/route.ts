import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/auth'
import { createAppealSchema } from '@/lib/zod/performance'

export async function GET(req: NextRequest) {
  try {
    const { user } = await authenticate(req)
    if (!user) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    const isAdmin = ['admin', 'super_admin'].includes(user.roleKey)
    const where = isAdmin ? {} : { employeeId: user.id }

    const appeals = await prisma.performanceAppeal.findMany({
      where,
      include: {
        employee: { select: { name: true,  } },
        log: { include: { actionType: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: appeals })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await authenticate(req)
    if (!user) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    const body = await req.json()
    const parsed = createAppealSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: { message: parsed.error.issues[0].message } }, { status: 400 })
    }

    const { logId, reason } = parsed.data

    const log = await prisma.performanceLog.findUnique({ where: { id: logId } })
    if (!log || log.employeeId !== user.id) {
      return NextResponse.json({ error: { message: 'Log not found or unauthorized' } }, { status: 404 })
    }

    if (log.status !== 'active') {
      return NextResponse.json({ error: { message: 'Cannot appeal this log' } }, { status: 400 })
    }

    const existingAppeal = await prisma.performanceAppeal.findFirst({ where: { logId, status: 'pending' } })
    if (existingAppeal) {
      return NextResponse.json({ error: { message: 'An appeal is already pending' } }, { status: 400 })
    }

    const appeal = await prisma.performanceAppeal.create({
      data: {
        logId,
        employeeId: user.id,
        reason,
        status: 'pending'
      }
    })

    await prisma.performanceLog.update({
      where: { id: logId },
      data: { status: 'appealed' }
    })

    return NextResponse.json({ data: appeal })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}


