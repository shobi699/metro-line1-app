import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/rbac/guard'
import { getLeaderboard } from '@/server/modules/learning/gamification-service'

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return NextResponse.json(user, { status: user.status })

    const url = new URL(request.url)
    const period = url.searchParams.get('period') || undefined

    const leaderboard = await getLeaderboard(period)
    return NextResponse.json({ data: leaderboard })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}
