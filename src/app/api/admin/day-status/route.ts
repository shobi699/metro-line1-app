import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { Prisma } from '@/generated/prisma/client'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { dayjs } from '@/lib/dayjs'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if ('error' in user) return authErrorResponse(user)
    if (!['admin', 'super_admin'].includes(user.roleKey)) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'شما دسترسی مدیر ندارید.' } }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')))

    const where: Prisma.PersonalEventWhereInput = {}

    if (from || to) {
      where.startAt = {}
      if (from) where.startAt.gte = dayjs(from).toDate()
      if (to) where.startAt.lte = dayjs(to).endOf('day').toDate()
    }

    if (type) {
      where.type = type as any
    } else {
      where.type = { in: ['on_call', 'overtime', 'leave_sick', 'leave_daily', 'leave_hourly', 'note', 'other', 'reminder'] }
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search } },
          { personnelCode: { contains: search } },
        ]
      }
    }

    const [total, events] = await Promise.all([
      prisma.personalEvent.count({ where }),
      prisma.personalEvent.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, personnelCode: true } }
        },
        orderBy: { startAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    ])

    return NextResponse.json({
      data: {
        items: events,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 })
  }
}
