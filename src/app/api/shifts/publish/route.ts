import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { materializePeriod } from '@/server/modules/roster'
import { publishSchema } from '@/lib/zod/shifts'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const body = await request.json()
    const parsed = publishSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const startDate = new Date(parsed.data.startDate)
    const endDate = new Date(parsed.data.endDate)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    if (startDate > endDate) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'تاریخ شروع باید قبل از تاریخ پایان باشد' } },
        { status: 400 },
      )
    }

    const result = await materializePeriod(startDate, endDate, user.id)
    return NextResponse.json({ data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    )
  }
}
