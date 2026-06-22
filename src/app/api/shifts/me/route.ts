import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getUserShifts } from '@/server/modules/roster/shifts'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const month = Number(searchParams.get('month') ?? now.getMonth() + 1)
  const year = Number(searchParams.get('year') ?? now.getFullYear())

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const shifts = await getUserShifts(user.id, startDate, endDate)
  return NextResponse.json({ data: shifts })
}
