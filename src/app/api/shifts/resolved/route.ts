import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { resolveShiftForUser } from '@/server/modules/roster'
import dayjs from 'dayjs'
import { z } from 'zod'

const resolvedSchema = z.object({
  userId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
})

/**
 * GET /api/shifts/resolved?userId=&startDate=&endDate=
 * شیفت نهایی resolve‌شده (cycle + override) برای کاربر در بازه
 */
export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'operator')
  if (roleErr) return authErrorResponse(roleErr)

  const { searchParams } = new URL(request.url)
  const userIdParam = searchParams.get('userId') ?? user.id
  const startDateParam = searchParams.get('startDate')
  const endDateParam = searchParams.get('endDate')

  if (!startDateParam || !endDateParam) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'startDate و endDate الزامی است' } },
      { status: 400 },
    )
  }

  const parsed = resolvedSchema.safeParse({
    userId: userIdParam,
    startDate: startDateParam,
    endDate: endDateParam,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
      { status: 400 },
    )
  }

  const start = dayjs(parsed.data.startDate)
  const end = dayjs(parsed.data.endDate)
  const totalDays = end.diff(start, 'day') + 1

  const resolved: Array<{
    date: string
    shift: unknown
    source: string
    templateName: string
  }> = []

  for (let i = 0; i < totalDays; i++) {
    const date = start.add(i, 'day')
    const result = await resolveShiftForUser(parsed.data.userId, date, undefined)
    resolved.push({
      date: date.format('YYYY-MM-DD'),
      shift: result.shift,
      source: result.source,
      templateName: result.templateName,
    })
  }

  return NextResponse.json({ data: resolved })
}
