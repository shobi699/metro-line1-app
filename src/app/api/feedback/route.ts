import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { createFeedback, listFeedback } from '@/server/modules/feedback/service'
import { z } from 'zod'

const createFeedbackSchema = z.object({
  type: z.enum(['criticism', 'suggestion', 'complaint', 'appreciation']),
  title: z.string(),
  body: z.string(),
  isAnonymous: z.boolean().optional(),
  categoryId: z.string().optional(),
  priority: z.string().optional(),
  formData: z.any().optional(),
  attachments: z.array(z.string()).optional(),
  isPublicIdea: z.boolean().optional(),
}).strict()

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? undefined
  const categoryId = searchParams.get('categoryId') ?? undefined
  const isPublicIdeaStr = searchParams.get('isPublicIdea')
  const isPublicIdea = isPublicIdeaStr !== null ? isPublicIdeaStr === 'true' : undefined
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = Number(searchParams.get('pageSize') ?? '20')

  // If normal user is listing, restrict to public ideas or their own feedbacks
  const userId = user.rank >= 2 ? undefined : user.id

  try {
    const result = await listFeedback({
      status,
      userId,
      categoryId,
      isPublicIdea,
      page,
      pageSize,
    })
    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در دریافت لیست بازخوردها' } },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = createFeedbackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'داده‌های ارسالی نامعتبر است', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    const isAnonymous = parsed.data.isAnonymous ?? false

    const feedback = await createFeedback({
      userId: isAnonymous ? undefined : user.id,
      type: parsed.data.type,
      title: parsed.data.title,
      body: parsed.data.body,
      isAnonymous,
      categoryId: parsed.data.categoryId,
      priority: parsed.data.priority,
      formData: parsed.data.formData,
      attachments: parsed.data.attachments,
      isPublicIdea: parsed.data.isPublicIdea,
    })

    return NextResponse.json({ data: feedback }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در ثبت بازخورد' } },
      { status: 500 }
    )
  }
}
