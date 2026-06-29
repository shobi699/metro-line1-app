import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import {
  listCustomFieldDefs,
  createCustomFieldDef,
} from '@/server/modules/custom-fields/service'
import { customFieldDefSchema } from '@/lib/zod/directory'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const entityType = searchParams.get('entityType') ?? undefined

  const fields = await listCustomFieldDefs(entityType)
  return NextResponse.json({ data: fields })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const body = await request.json()
  const parsed = customFieldDefSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const field = await createCustomFieldDef(parsed.data)
  return NextResponse.json({ data: field }, { status: 201 })
}
