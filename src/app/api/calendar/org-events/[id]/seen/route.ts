import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { markOrgEventSeen } from '@/server/modules/calendar/admin-service'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id } = await params
  const record = await markOrgEventSeen(id, user.id)
  return NextResponse.json({ data: record })
}
