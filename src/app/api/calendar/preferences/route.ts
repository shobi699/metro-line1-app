import { NextResponse } from 'next/server'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import {
  getCalendarPreference,
  updateCalendarPreference,
  calendarPreferenceSchema,
} from '@/server/modules/calendar'

/** GET /api/calendar/preferences — ترجیحات تقویم کاربر (در نبود، پیش‌فرض ساخته می‌شود) */
export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const pref = await getCalendarPreference(user.id)
  return NextResponse.json({ data: pref })
}

/** PATCH /api/calendar/preferences — به‌روزرسانی لایه‌ها، نمای پیش‌فرض و تنظیم ویجت */
export async function PATCH(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  try {
    const body = await request.json()
    const parsed = calendarPreferenceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      )
    }

    const pref = await updateCalendarPreference(user.id, parsed.data)
    return NextResponse.json({ data: pref })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    )
  }
}
