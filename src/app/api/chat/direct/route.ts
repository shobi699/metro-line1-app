import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { directRoomSchema } from '@/lib/zod/chat'
import { getOrCreateDirectRoom } from '@/server/modules/chat/service'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const body = await request.json()
  const parsed = directRoomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  try {
    const room = await getOrCreateDirectRoom(user.id, parsed.data.userId)
    return NextResponse.json({ data: room }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای سیستمی'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
