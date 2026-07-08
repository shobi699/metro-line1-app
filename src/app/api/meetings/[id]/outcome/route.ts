import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { saveMeetingOutcome } from '@/server/modules/meetings/service'
import { z } from 'zod'

const outcomeSchema = z.object({
  outcomeNote: z.string().min(1, 'صورت‌جلسه نمی‌تواند خالی باشد'),
}).strict()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  // Enforce host or admin role
  if (user.rank < 1) {
    return NextResponse.json({ error: { message: 'شما دسترسی کافی ندارید' } }, { status: 403 })
  }

  const { id: meetingId } = await params

  try {
    const body = await request.json()
    const parsed = outcomeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'متن صورت‌جلسه نامعتبر است', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    await saveMeetingOutcome(meetingId, parsed.data.outcomeNote)
    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در ثبت صورت‌جلسه' } },
      { status: 500 }
    )
  }
}
