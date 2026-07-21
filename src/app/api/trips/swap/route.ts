import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { createTripSwapRequest, getTripSwaps } from '@/server/modules/swap/service'
import { z } from 'zod'

const tripSwapInputSchema = z.object({
  targetUserId: z.string().min(1, 'شناسه کاربر هدف الزامی است'),
  sourceAssignmentId: z.string().min(1, 'شناسه نوبت اعزام مبدا الزامی است'),
  targetAssignmentId: z.string().min(1, 'شناسه نوبت اعزام مقصد الزامی است'),
  note: z.string().max(500, 'توضیحات حداکثر ۵۰۰ کاراکتر باشد').optional(),
})

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = tripSwapInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { targetUserId, sourceAssignmentId, targetAssignmentId, note } = parsed.data

    const result = await createTripSwapRequest(
      user.id,
      targetUserId,
      sourceAssignmentId,
      targetAssignmentId,
      note
    )

    if (result.violations.length > 0) {
      return NextResponse.json(
        {
          error: 'قوانین و محدودیت‌های اعزام نقض شدند',
          violations: result.violations,
        },
        { status: 422 }
      )
    }

    return NextResponse.json({ data: result.tripSwapRequest }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در ثبت درخواست جابجایی سفر: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const list = await getTripSwaps(user.id, user.roleKey)
    return NextResponse.json({ data: list })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت لیست درخواست‌ها: ' + (error.message || String(error)) },
      { status: 500 }
    )
  }
}
