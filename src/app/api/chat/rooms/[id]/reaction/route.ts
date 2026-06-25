import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { toggleReaction } from '@/server/modules/chat/service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id: roomId } = await params
  const body = await request.json()
  const { messageId, emoji } = body

  if (!messageId || !emoji) {
    return NextResponse.json(
      { error: 'شناسه پیام و ایموجی الزامی هستند.' },
      { status: 400 },
    )
  }

  try {
    const reactions = await toggleReaction(
      roomId,
      messageId,
      user.id,
      user.name,
      emoji,
    )
    return NextResponse.json({ data: reactions })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای سیستمی'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
