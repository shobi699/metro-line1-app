import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { replyToFeedback } from '@/server/modules/feedback/service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (user.rank < 3) {
    return NextResponse.json({ error: 'شما دسترسی کافی ندارید' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { reply } = body

  if (!reply) {
    return NextResponse.json({ error: 'متن پاسخ الزامی است' }, { status: 400 })
  }

  await replyToFeedback(id, user.id, reply)
  return NextResponse.json({ data: { success: true } })
}
