import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { addFeedbackMessage, getFeedbackDetail } from '@/server/modules/feedback/service'
import { z } from 'zod'

const messageSchema = z.object({
  body: z.string(),
  isInternal: z.boolean().optional(),
}).strict()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const resolvedParams = await params
  const { searchParams } = new URL(request.url)
  const anonToken = searchParams.get('anonToken') ?? undefined

  try {
    // 1. Fetch feedback to check ownership / authorization
    const feedback = await getFeedbackDetail(resolvedParams.id, user.id, anonToken)

    const json = await request.json()
    const parsed = messageSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'متن پیام معتبر نیست', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    // Determine sender kind: staff or submitter
    // Submitter can only be the original user (if not anonymous) or if they hold the correct anonToken.
    // If user is admin/supervisor, they act as staff.
    const isStaff = user.rank >= 2 // Manager/Supervisor/Admin are staff
    const senderKind = isStaff ? 'staff' : 'submitter'

    const message = await addFeedbackMessage(resolvedParams.id, {
      senderKind,
      senderId: isStaff || feedback.userId === user.id ? user.id : undefined,
      body: parsed.data.body,
      isInternal: isStaff ? parsed.data.isInternal : false,
    })

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در ثبت پیام' } },
      { status: 403 }
    )
  }
}
