import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { updateVideoProgress } from '@/server/modules/learning/service'
import { z } from 'zod'

const progressSchema = z.object({
  videoId: z.string(),
  watchedPct: z.number().min(0).max(100),
  completed: z.boolean().optional(),
  quizScore: z.number().optional(),
}).strict()

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = progressSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'داده‌های ارسالی نامعتبر است', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    const progress = await updateVideoProgress({
      userId: user.id,
      videoId: parsed.data.videoId,
      watchedPct: parsed.data.watchedPct,
      completed: parsed.data.completed,
      quizScore: parsed.data.quizScore,
    })

    return NextResponse.json({ data: progress })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در ثبت پیشرفت تماشای ویدیو' } },
      { status: 500 }
    )
  }
}
