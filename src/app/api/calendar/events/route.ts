import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { createPersonalEvent, listPersonalEvents, personalEventSchema } from '@/server/modules/calendar'
import { writeAuditLog } from '@/server/modules/audit/service'

/** GET /api/calendar/events?from=&to= — رویدادهای شخصی کاربر در بازه */
export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'from و to الزامی است' } },
      { status: 400 },
    )
  }

  const events = await listPersonalEvents(user.id, new Date(from), new Date(to))
  return NextResponse.json({ data: events })
}

/** POST /api/calendar/events — ایجاد رویداد/کار/تولد/یادداشت شخصی */
export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = personalEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const event = await createPersonalEvent(user.id, parsed.data)
    await writeAuditLog({
      actorId: user.id,
      entity: 'PersonalEvent',
      entityId: event.id,
      action: 'create',
      after: { type: event.type, title: event.title, startAt: event.startAt },
      request,
    })
    return NextResponse.json({ data: event }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    )
  }
}
