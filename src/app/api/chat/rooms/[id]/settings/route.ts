import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { changeRoomSettings } from '@/server/modules/chat/service'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id: roomId } = await params
  const body = await request.json()
  const { readOnly, blockAttachments, maxLength } = body

  if (typeof readOnly !== 'boolean' || typeof blockAttachments !== 'boolean' || typeof maxLength !== 'number') {
    return NextResponse.json(
      { error: 'تنظیمات نامعتبر است.' },
      { status: 400 },
    )
  }

  try {
    await changeRoomSettings(roomId, user.id, { readOnly, blockAttachments, maxLength })
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای سیستمی'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
