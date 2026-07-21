import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getOrCreateIcsToken, rotateIcsToken } from '@/server/modules/calendar'
import { writeAuditLog } from '@/server/modules/audit/service'

/** GET /api/calendar/ics/rotate — دریافت توکن فعلی (در نبود، ساخته می‌شود) */
export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const token = await getOrCreateIcsToken(user.id)
  return NextResponse.json({ data: { token } })
}

/** POST /api/calendar/ics/rotate — بازتولید توکن؛ لینک قبلی باطل می‌شود */
export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const token = await rotateIcsToken(user.id)
  await writeAuditLog({
    actorId: user.id,
    entity: 'CalendarPreference',
    entityId: user.id,
    action: 'update',
    reason: 'بازتولید توکن اشتراک ICS',
    request,
  })
  return NextResponse.json({ data: { token } })
}
