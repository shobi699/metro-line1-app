import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { updateOrgEvent, deleteOrgEvent } from '@/server/modules/calendar/admin-service'
import { orgEventAdminUpdateSchema } from '@/lib/zod/calendar'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'calendar-admin:events')
  if (permErr) return authErrorResponse(permErr)

  const { id } = await params
  const body = await request.json()
  const parsed = orgEventAdminUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION', message: parsed.error.issues[0].message } }, { status: 400 })
  }

  const updated = await updateOrgEvent(id, parsed.data, user.id)
  if (!updated) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'رویداد یافت نشد' } }, { status: 404 })
  return NextResponse.json({ data: updated })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'calendar-admin:events')
  if (permErr) return authErrorResponse(permErr)

  const { id } = await params
  const deleted = await deleteOrgEvent(id, user.id)
  if (!deleted) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'رویداد یافت نشد' } }, { status: 404 })
  return NextResponse.json({ data: deleted })
}
