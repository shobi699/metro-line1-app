import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { createMeetingRequest, getUserMeetings, getManagerMeetings, reviewMeeting } from '@/server/modules/meetings/service'
import { z } from 'zod'

const createMeetingSchema = z.object({
  targetManagerId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  scheduledAt: z.string(),
  durationMinutes: z.number().optional(),
  typeId: z.string().optional(),
  roomId: z.string().optional(),
  formData: z.any().optional(),
  attendees: z.array(z.string()).optional(),
}).strict()

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') ?? 'mine'

  if (view === 'manager' && user.rank >= 1) {
    const meetings = await getManagerMeetings(user.id)
    return NextResponse.json({ data: meetings })
  }

  const meetings = await getUserMeetings(user.id)
  return NextResponse.json({ data: meetings })
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = createMeetingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'داده‌های ارسالی نامعتبر است', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    const meeting = await createMeetingRequest({
      requesterId: user.id,
      targetManagerId: parsed.data.targetManagerId,
      title: parsed.data.title,
      description: parsed.data.description,
      scheduledAt: new Date(parsed.data.scheduledAt),
      durationMinutes: parsed.data.durationMinutes,
      typeId: parsed.data.typeId,
      roomId: parsed.data.roomId,
      formData: parsed.data.formData,
      attendees: parsed.data.attendees,
    })

    return NextResponse.json({ data: meeting }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در ثبت درخواست جلسه' } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  if (user.rank < 1) {
    return NextResponse.json({ error: { message: 'شما دسترسی کافی ندارید' } }, { status: 403 })
  }

  const body = await request.json()
  const { meetingId, status, note } = body

  if (!meetingId || !status) {
    return NextResponse.json(
      { error: { message: 'شناسه جلسه و وضعیت الزامی است' } },
      { status: 400 }
    )
  }

  try {
    await reviewMeeting(meetingId, user.id, status, note)
    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err?.message || 'خطا در ثبت تغییرات' } }, { status: 500 })
  }
}
