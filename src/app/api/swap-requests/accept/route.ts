import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { acceptSwapRequest } from '@/server/modules/swap/service'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const body = await request.json()
  const { swapRequestId } = body as { swapRequestId: string }

  if (!swapRequestId) {
    return NextResponse.json(
      { error: 'شناسه درخواست الزامی است' },
      { status: 400 },
    )
  }

  try {
    const result = await acceptSwapRequest(swapRequestId, user.id)
    return NextResponse.json({ data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای سیستمی'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
