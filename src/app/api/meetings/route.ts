import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { createMeetingRequest, getUserMeetings, getManagerMeetings, reviewMeeting } from '@/server/modules/meetings/service'

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

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (user.rank < 3) {
    return NextResponse.json({ error: 'شما دسترسی کافی ندارید' }, { status: 403 })
  }

  const body = await request.json()
  const { meetingId, status, note } = body

  if (!meetingId || !status) {
    return NextResponse.json(
      { error: 'شناسه جلسه و وضعیت الزامی است' },
      { status: 400 },
    )
  }

  try {
    await reviewMeeting(meetingId, user.id, status, note)
    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'خطا در ثبت تغییرات' }, { status: 500 })
  }
}
