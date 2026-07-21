import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { togglePersonalTaskDone } from '@/server/modules/calendar'

const doneSchema = z.object({ isDone: z.boolean().default(true) }).strict()

/** POST /api/calendar/events/[id]/done — تیک/برداشتن تیک انجام کار */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id } = await params

  let isDone = true
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = doneSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }
    isDone = parsed.data.isDone
  } catch {
    // بدنه خالی = تیک زدن
  }

  const updated = await togglePersonalTaskDone(id, user.id, isDone)
  if (!updated) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'رویداد یافت نشد' } },
      { status: 404 },
    )
  }

  return NextResponse.json({ data: updated })
}
