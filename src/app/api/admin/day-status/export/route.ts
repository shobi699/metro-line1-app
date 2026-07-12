import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { dayjs } from '@/lib/dayjs'
import { exportDayStatusToExcel } from '@/server/modules/calendar/export'

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

    const buffer = await exportDayStatusToExcel(where)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="day-status-report.xlsx"',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: { code: 'INTERNAL', message: e.message } }, { status: 500 })
  }
}
