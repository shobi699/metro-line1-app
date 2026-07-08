import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { updateEnrollmentProgress } from '@/server/modules/learning/service'
import { z } from 'zod'

const progressSchema = z.object({
  courseId: z.string(),
  progressPct: z.number().min(0).max(100),
  completed: z.boolean().optional(),
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

    const progress = await updateEnrollmentProgress({
      userId: user.id,
      courseId: parsed.data.courseId,
      progressPct: parsed.data.progressPct,
      completed: parsed.data.completed,
    })

    return NextResponse.json({ data: progress })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در ثبت پیشرفت دوره' } },
      { status: 500 }
    )
  }
}
