import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { listHolidays, createHoliday } from '@/server/modules/calendar/admin-service'
import { holidaySchema } from '@/lib/zod/calendar'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'calendar-admin:holidays')
  if (permErr) return authErrorResponse(permErr)

  const { searchParams } = new URL(request.url)
  const kind = searchParams.get('kind') ?? undefined
  const year = searchParams.get('year') ?? undefined

  const holidays = await listHolidays({ kind, year })
  return NextResponse.json({ data: holidays })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'calendar-admin:holidays')
  if (permErr) return authErrorResponse(permErr)

  const body = await request.json()
  const parsed = holidaySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION', message: parsed.error.issues[0].message } }, { status: 400 })
  }

  const holiday = await createHoliday(parsed.data, user.id)
  return NextResponse.json({ data: holiday }, { status: 201 })
}
