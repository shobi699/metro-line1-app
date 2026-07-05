/**
 * فید ICS شخصی (فاز ۳ — SHIFT_CALENDAR_DESIGN.md §۴.۴):
 * لینک امن فقط‌خواندنی برای Subscribe در تقویم گوگل/اپل/اوت‌لوک.
 * فقط لایه‌های روشنِ کاربر export می‌شوند؛ توکن قابل باطل‌کردن است.
 */
import { randomUUID } from 'node:crypto'
import dayjs from 'dayjs'
import { prisma } from '@/server/db'
import { getCalendarRange, getCalendarPreference } from './service'

const FEED_PAST_DAYS = 30
const FEED_FUTURE_DAYS = 180

const SHIFT_FA: Record<string, string> = {
  morning: 'شیفت صبح',
  evening: 'شیفت عصر',
  night: 'شیفت شب',
  off: 'آف (استراحت)',
  office: 'شیفت اداری',
}

export async function getOrCreateIcsToken(userId: string): Promise<string> {
  const pref = await getCalendarPreference(userId)
  if (pref.icsToken) return pref.icsToken
  const token = randomUUID().replace(/-/g, '')
  await prisma.calendarPreference.update({ where: { userId }, data: { icsToken: token } })
  return token
}

/** بازتولید توکن — لینک قبلی بلافاصله باطل می‌شود. */
export async function rotateIcsToken(userId: string): Promise<string> {
  await getCalendarPreference(userId) // اطمینان از وجود رکورد
  const token = randomUUID().replace(/-/g, '')
  await prisma.calendarPreference.update({ where: { userId }, data: { icsToken: token } })
  return token
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icsDate(d: dayjs.Dayjs): string {
  return d.format('YYYYMMDD')
}

function icsDateTimeUtc(d: Date): string {
  return dayjs(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

interface IcsEvent {
  uid: string
  summary: string
  description?: string
  /** all-day: تاریخ شروع (DTEND روز بعد) */
  allDayDate?: dayjs.Dayjs
  /** timed */
  startAt?: Date
  endAt?: Date
}

function renderEvent(e: IcsEvent, now: string): string[] {
  const lines = ['BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${now}`, `SUMMARY:${icsEscape(e.summary)}`]
  if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`)
  if (e.allDayDate) {
    lines.push(`DTSTART;VALUE=DATE:${icsDate(e.allDayDate)}`)
    lines.push(`DTEND;VALUE=DATE:${icsDate(e.allDayDate.add(1, 'day'))}`)
  } else if (e.startAt) {
    lines.push(`DTSTART:${icsDateTimeUtc(e.startAt)}`)
    lines.push(`DTEND:${icsDateTimeUtc(e.endAt ?? new Date(e.startAt.getTime() + 60 * 60_000))}`)
  }
  lines.push('END:VEVENT')
  return lines
}

/** ساخت فید کامل بر اساس توکن؛ در نبود توکن null برمی‌گرداند. */
export async function buildIcsFeed(token: string): Promise<string | null> {
  const pref = await prisma.calendarPreference.findUnique({ where: { icsToken: token } })
  if (!pref) return null

  const user = await prisma.user.findUnique({
    where: { id: pref.userId },
    select: { id: true, role: { select: { key: true } } },
  })
  if (!user) return null

  const layers = (pref.layers as Record<string, { on?: boolean }> | null) ?? {}
  const layerOn = (key: string) => layers[key]?.on !== false

  const from = dayjs().subtract(FEED_PAST_DAYS, 'day')
  const to = dayjs().add(FEED_FUTURE_DAYS, 'day')

  const activeLayers = ['shift', 'holidays', 'personal', 'org'].filter(layerOn)
  const range = await getCalendarRange({
    userId: user.id,
    roleKey: user.role.key,
    from: from.format('YYYY-MM-DD'),
    to: to.format('YYYY-MM-DD'),
    layers: activeLayers,
  })

  const now = icsDateTimeUtc(new Date())
  const events: IcsEvent[] = []
  const seenHolidays = new Set<string>()
  const seenEvents = new Set<string>()

  for (const day of range.days) {
    const dayD = dayjs(day.date)

    if (day.shift && day.shift.code !== 'off') {
      const summary = `${SHIFT_FA[day.shift.code] ?? day.shift.code}${day.shift.forecast ? ' (پیش‌بینی)' : ''}`
      if (day.shift.startTime && day.shift.endTime) {
        const start = dayjs(`${day.date}T${day.shift.startTime}`)
        let end = dayjs(`${day.date}T${day.shift.endTime}`)
        if (!end.isAfter(start)) end = end.add(1, 'day') // شیفت شب از نیمه‌شب عبور می‌کند
        events.push({
          uid: `shift-${day.date}@metro-line1`,
          summary,
          startAt: start.toDate(),
          endAt: end.toDate(),
        })
      } else {
        events.push({ uid: `shift-${day.date}@metro-line1`, summary, allDayDate: dayD })
      }
    }

    for (const h of day.holidays) {
      const uid = `holiday-${day.date}-${h.id}@metro-line1`
      if (seenHolidays.has(uid)) continue
      seenHolidays.add(uid)
      events.push({ uid, summary: h.title, allDayDate: dayD })
    }

    for (const e of day.events) {
      const uid = `event-${e.id}-${day.date}@metro-line1`
      if (seenEvents.has(uid)) continue
      seenEvents.add(uid)
      if (e.allDay) {
        events.push({ uid, summary: e.title, description: e.description ?? undefined, allDayDate: dayD })
      } else {
        events.push({
          uid,
          summary: e.title,
          description: e.description ?? undefined,
          startAt: new Date(e.startAt),
          endAt: e.endAt ? new Date(e.endAt) : undefined,
        })
      }
    }

    for (const o of day.orgEvents) {
      const uid = `org-${o.id}@metro-line1`
      if (seenEvents.has(uid)) continue
      seenEvents.add(uid)
      events.push({
        uid,
        summary: `${o.mandatory ? '⛔ ' : ''}${o.title}`,
        description: o.description ?? undefined,
        allDayDate: o.allDay ? dayD : undefined,
        startAt: o.allDay ? undefined : new Date(o.startAt),
        endAt: o.allDay ? undefined : o.endAt ? new Date(o.endAt) : undefined,
      })
    }
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//metro-line1//shift-life-calendar//FA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:تقویم شیفت مترو خط ۱',
    ...events.flatMap((e) => renderEvent(e, now)),
    'END:VCALENDAR',
  ]

  // خطوط ICS با CRLF جدا می‌شوند
  return lines.join('\r\n') + '\r\n'
}
