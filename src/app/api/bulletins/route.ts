import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { createBulletinSchema } from '@/server/dto/safety'
import { createBulletin, getAllBulletins } from '@/server/modules/safety/bulletins'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const bulletins = await getAllBulletins()
  return NextResponse.json({ data: bulletins })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const body = await request.json()
  const parsed = createBulletinSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const bulletin = await createBulletin(parsed.data, user.id)
  return NextResponse.json({ data: bulletin }, { status: 201 })
}
