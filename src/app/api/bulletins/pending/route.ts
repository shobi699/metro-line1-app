import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getPendingBulletins } from '@/server/modules/safety/bulletins'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const pending = await getPendingBulletins(user.id)
  return NextResponse.json({ data: pending })
}
