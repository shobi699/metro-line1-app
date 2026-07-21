import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import {
  updateCustomFieldDef,
  deleteCustomFieldDef,
  getCustomFieldDef,
} from '@/server/modules/custom-fields/service'
import { customFieldDefSchema } from '@/lib/zod/directory'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id } = await params
  const existing = await getCustomFieldDef(id)
  if (!existing) {
    return NextResponse.json({ error: 'فیلد یافت نشد' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = customFieldDefSchema.partial().safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const field = await updateCustomFieldDef(id, parsed.data)
  return NextResponse.json({ data: field })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const { id } = await params
  const existing = await getCustomFieldDef(id)
  if (!existing) {
    return NextResponse.json({ error: 'فیلد یافت نشد' }, { status: 404 })
  }

  await deleteCustomFieldDef(id)
  return NextResponse.json({ message: 'فیلد حذف شد' })
}
