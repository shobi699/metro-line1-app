import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getAvailableSlots } from '@/server/modules/meetings/service'
import { z } from 'zod'

const querySchema = z.object({
  hostId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'فرمت تاریخ باید YYYY-MM-DD باشد'),
  typeKey: z.string(),
})

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const { searchParams } = new URL(request.url)
  const hostId = searchParams.get('hostId')
  const dateStr = searchParams.get('date')
  const typeKey = searchParams.get('typeKey')

  const parsed = querySchema.safeParse({ hostId, date: dateStr, typeKey })
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'پارامترهای ارسالی نامعتبر است', details: parsed.error.format() } },
      { status: 400 }
    )
  }

  try {
    const slots = await getAvailableSlots(
      parsed.data.hostId,
      new Date(parsed.data.date),
      parsed.data.typeKey
    )
    return NextResponse.json({ data: slots })
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err?.message || 'خطا در محاسبه زمان‌های آزاد' } },
      { status: 500 }
    )
  }
}
