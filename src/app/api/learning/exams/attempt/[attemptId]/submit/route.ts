import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { submitExam } from '@/server/modules/learning/exam-service'
import { z } from 'zod'

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()) // { questionId: "answer", ... }
}).strict()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const resolvedParams = await params

  try {
    const body = await request.json()
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'داده‌های ارسالی نامعتبر است', details: parsed.error.format() } },
        { status: 400 }
      )
    }

    const updatedAttempt = await submitExam(user.id, resolvedParams.attemptId, parsed.data.answers as Record<string, string>)
    
    return NextResponse.json({ data: updatedAttempt })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در ثبت آزمون' } },
      { status: 400 }
    )
  }
}
