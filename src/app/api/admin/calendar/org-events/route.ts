import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { listOrgEvents, createOrgEvent } from '@/server/modules/calendar/admin-service'
import { orgEventAdminSchema } from '@/lib/zod/calendar'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'calendar-admin:events')
  if (permErr) return authErrorResponse(permErr)

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const mandatory = searchParams.has('mandatory') ? searchParams.get('mandatory') === 'true' : undefined

  const events = await listOrgEvents({ from, to, mandatory })
  return NextResponse.json({ data: events })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'calendar-admin:events')
  if (permErr) return authErrorResponse(permErr)

  const body = await request.json()
  const parsed = orgEventAdminSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION', message: parsed.error.issues[0].message } }, { status: 400 })
  }

  const event = await createOrgEvent(parsed.data, user.id)
  return NextResponse.json({ data: event }, { status: 201 })
}
