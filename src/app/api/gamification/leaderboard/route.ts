import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getLeaderboard } from '@/server/modules/gamification/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? new Date().toISOString().slice(0, 7)
  const limit = Number(searchParams.get('limit') ?? '10')

  const leaderboard = await getLeaderboard(period, limit)
  return NextResponse.json({ data: leaderboard })
}
