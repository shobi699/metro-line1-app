import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { swapRequestSchema } from '@/lib/zod/roster'
import { createSwapRequest } from '@/server/modules/swap/service'
import { getSettingValue } from '@/server/modules/settings/service'

export async function POST(request: Request) {
  const allowSwapRequests = await getSettingValue('shifts.allowSwapRequests', true)
  if (!allowSwapRequests) {
    return NextResponse.json(
      { error: 'ثبت درخواست تعویض شیفت در حال حاضر توسط مدیریت غیرفعال شده است.' },
      { status: 403 }
    )
  }

  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const body = await request.json()
  const parsed = swapRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  const { targetUserId, sourceShiftId, targetShiftId, note } = parsed.data

  const result = await createSwapRequest(
    user.id,
    targetUserId,
    sourceShiftId,
    targetShiftId,
    note,
  )

  if (result.violations.length > 0) {
    return NextResponse.json(
      {
        error: 'قانون‌های شیفت نقض شد',
        violations: result.violations,
      },
      { status: 422 },
    )
  }

  return NextResponse.json({ data: result.swapRequest }, { status: 201 })
}
