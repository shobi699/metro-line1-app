import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { filePerformanceAppeal } from '@/server/modules/performance/service'
import { z } from 'zod'

const createAppealSchema = z.object({
  logId: z.string().min(1, 'شناسه رکورد الزامی است'),
  reason: z.string().min(5, 'ذکر دلیل اعتراض (حداقل ۵ کاراکتر) الزامی است'),
})

// POST /api/performance/appeal - File an appeal
export async function POST(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  try {
    const body = await request.json()
    const parsed = createAppealSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { logId, reason } = parsed.data

    const appeal = await filePerformanceAppeal(logId, sessionUser.id, reason)

    return NextResponse.json({
      data: appeal,
      message: 'اعتراض شما با موفقیت ثبت شد و به منابع انسانی ارجاع گردید',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطای سرور'
    return NextResponse.json(
      { error: 'خطا در ثبت اعتراض: ' + message },
      { status: 500 }
    )
  }
}
