import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getUserAttendance } from '@/server/modules/attendance/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') ?? '30')

  const records = await getUserAttendance(user.id, { limit })
  return NextResponse.json({ data: records })
}
