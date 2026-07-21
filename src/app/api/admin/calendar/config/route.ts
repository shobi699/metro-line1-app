import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { getCalendarConfig, updateCalendarConfig } from '@/server/modules/calendar/admin-service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'calendar-admin:config')
  if (permErr) return authErrorResponse(permErr)

  const config = await getCalendarConfig()
  return NextResponse.json({ data: config })
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'calendar-admin:config')
  if (permErr) return authErrorResponse(permErr)

  const body = await request.json()
  const config = await updateCalendarConfig(body, user.id)
  return NextResponse.json({ data: config })
}
