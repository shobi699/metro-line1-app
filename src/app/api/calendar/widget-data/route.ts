import { NextResponse } from 'next/server'
import dayjs from 'dayjs'
import { getSessionUser, authErrorResponse } from '@/server/rbac/guard'
import { getCalendarRange } from '@/server/modules/calendar'

/**
 * GET /api/calendar/widget-data
 * بسته فشرده ۳۰ روزه برای ویجت صفحه اصلی موبایل + یادآورها — یک درخواست، چند کیلوبایت.
 * کلیدهای کوتاه عمداً انتخاب شده‌اند تا حجم Shared Storage ویجت کوچک بماند.
 */
export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const from = dayjs().format('YYYY-MM-DD')
  const to = dayjs().add(29, 'day').format('YYYY-MM-DD')

  const range = await getCalendarRange({
    userId: user.id,
    roleKey: user.roleKey,
    from,
    to,
  })

  const days = range.days.map((d) => ({
    d: d.date, // میلادی YYYY-MM-DD
    j: d.jalali, // جلالی YYYY-MM-DD
    w: d.weekday, // شنبه=۰ ... جمعه=۶
    s: d.shift?.code ?? null,
    st: d.shift?.startTime ?? null,
    en: d.shift?.endTime ?? null,
    f: d.shift?.forecast ?? false,
    h: d.holidays.length > 0 ? d.holidays.map((h) => h.title).join('، ') : null,
    ho: d.holidays.some((h) => h.isOffDay),
    e: d.events.length + d.orgEvents.length,
    t: d.events.slice(0, 2).map((e) => e.title),
  }))

  // رویدادهای دارای یادآور برای زمان‌بندی اعلان محلی روی دستگاه
  const reminders = range.days.flatMap((d) =>
    d.events
      .filter((e) => Array.isArray(e.reminders) && (e.reminders as unknown[]).length > 0)
      .map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        startAt: e.startAt,
        allDay: e.allDay,
        reminders: e.reminders as { minutesBefore: number }[],
      })),
  )

  return NextResponse.json({
    data: { generatedAt: new Date().toISOString(), from, to, days, reminders },
  })
}
