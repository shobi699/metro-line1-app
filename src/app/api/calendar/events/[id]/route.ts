import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import {
  updatePersonalEvent,
  deletePersonalEvent,
  personalEventUpdateSchema,
} from '@/server/modules/calendar'
import { writeAuditLog } from '@/server/modules/audit/service'

/** PATCH /api/calendar/events/[id] — ویرایش رویداد شخصی (فقط مالک) */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id } = await params

  try {
    const body = await request.json()
    const parsed = personalEventUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const result = await updatePersonalEvent(id, user.id, parsed.data)
    if (!result) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'رویداد یافت نشد' } },
        { status: 404 },
      )
    }

    await writeAuditLog({
      actorId: user.id,
      entity: 'PersonalEvent',
      entityId: id,
      action: 'update',
      before: { title: result.before.title, startAt: result.before.startAt, isDone: result.before.isDone },
      after: { title: result.after.title, startAt: result.after.startAt, isDone: result.after.isDone },
      request,
    })
    return NextResponse.json({ data: result.after })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    )
  }
}

/** DELETE /api/calendar/events/[id] — حذف رویداد شخصی (فقط مالک) */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id } = await params

  const deleted = await deletePersonalEvent(id, user.id)
  if (!deleted) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'رویداد یافت نشد' } },
      { status: 404 },
    )
  }

  await writeAuditLog({
    actorId: user.id,
    entity: 'PersonalEvent',
    entityId: id,
    action: 'delete',
    before: { type: deleted.type, title: deleted.title, startAt: deleted.startAt },
    request,
  })
  return NextResponse.json({ data: { success: true } })
}
