import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { cancelMeeting } from '@/server/modules/meetings/service'
import { z } from 'zod'

const cancelSchema = z.object({
  reason: z.string().min(1, 'ارائه علت لغو الزامی است'),
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
    const parsed = cancelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'علت لغو نامعتبر است', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    await cancelMeeting(meetingId, user.id, parsed.data.reason)
    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در لغو جلسه' } },
      { status: 500 }
    )
  }
}
