import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { approveSwapRequest } from '@/server/modules/swap/service'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const body = await request.json()
  const { swapRequestId, decision } = body as {
    swapRequestId: string
    decision: 'approved' | 'rejected'
  }

  if (!swapRequestId || !decision) {
    return NextResponse.json(
      { error: 'شناسه درخواست و تصمیم الزامی است' },
      { status: 400 },
    )
  }

  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json(
      { error: 'تصمیم نامعتبر است' },
      { status: 400 },
    )
  }

  try {
    const result = await approveSwapRequest(swapRequestId, user.id, decision)
    return NextResponse.json({ data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطای سیستمی'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
