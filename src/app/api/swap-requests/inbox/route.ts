import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getSwapInbox } from '@/server/modules/swap/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const requests = await getSwapInbox(user.id, user.roleKey)
  return NextResponse.json({ data: requests })
}
