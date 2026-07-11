import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { createGroupRoomSchema } from '@/lib/zod/chat'
import { listRoomsForUser, createGroupRoom } from '@/server/modules/chat/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const rooms = await listRoomsForUser(user.id)
  return NextResponse.json({ data: rooms })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // ساخت روم گروهی فقط برای مدیر و بالاتر
  const roleErr = await requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const body = await request.json()
  const parsed = createGroupRoomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const room = await createGroupRoom(parsed.data, user.id)
  return NextResponse.json({ data: room }, { status: 201 })
}
