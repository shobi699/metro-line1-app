import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { rescheduleMeetingRequest } from '@/server/modules/meetings/service'
import { z } from 'zod'

const rescheduleSchema = z.object({
  newSlot: z.string(),
}).strict()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { id: meetingId } = await params

  try {
    const body = await request.json()
    const parsed = rescheduleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'اسلات زمانی جدید نامعتبر است', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    const newMeeting = await rescheduleMeetingRequest(
      meetingId,
      new Date(parsed.data.newSlot),
      user.id
    )
    return NextResponse.json({ data: newMeeting })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در جابه‌جایی جلسه' } },
      { status: 500 }
    )
  }
}
