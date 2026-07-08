import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { getOrgEventSeenReport } from '@/server/modules/calendar/admin-service'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'calendar-admin:events')
  if (permErr) return authErrorResponse(permErr)

  const { id } = await params
  const report = await getOrgEventSeenReport(id)
  if (!report) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'رویداد یافت نشد' } }, { status: 404 })
  return NextResponse.json({ data: report })
}
