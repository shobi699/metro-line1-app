import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { createMeetingRequest, getUserMeetings, getManagerMeetings } from '@/server/modules/meetings/service'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') ?? 'mine'

  if (view === 'manager' && user.rank >= 3) {
    const meetings = await getManagerMeetings(user.id)
    return NextResponse.json({ data: meetings })
  }

  const meetings = await getUserMeetings(user.id)
  return NextResponse.json({ data: meetings })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const body = await request.json()
  const { targetManagerId, title, description, scheduledAt, durationMinutes } = body

  if (!targetManagerId || !title || !scheduledAt) {
    return NextResponse.json(
      { error: 'فیلدهای الزامی را پر کنید' },
      { status: 400 },
    )
  }

  const meeting = await createMeetingRequest({
    requesterId: user.id,
    targetManagerId,
    title,
    description,
    scheduledAt: new Date(scheduledAt),
    durationMinutes,
  })

  return NextResponse.json({ data: meeting }, { status: 201 })
}
