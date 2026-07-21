/**
 * هوش شیفتی (فاز ۳ — SHIFT_CALENDAR_DESIGN.md §۴.۲):
 * آمار ماه، مقایسه با ماه قبل، پل تعطیلات (Bridge Finder) و شمارش معکوس.
 */
import dayjs from 'dayjs'
import { fromJalali, gregStr } from '@/lib/dayjs'
import { getCalendarRange, type CalendarDay } from './service'
import { getCalendarConfig } from './admin-service'

export interface MonthShiftStats {
  counts: Record<string, number> // morning/evening/night/off/office
  workHours: number
  offDays: number // آف + تعطیل رسمیِ بدون شیفت کاری
  workLogTotalAmount: number
  overtimeTotalHours: number
  movazafiHours: number
}

export interface HolidayBridge {
  /** میلادی YYYY-MM-DD */
  from: string
  to: string
  fromJalali: string
  toJalali: string
  /** طول بازه استراحت به روز */
  length: number
  /** عنوان روزهای تشکیل‌دهنده (آف / جمعه / نام تعطیلی) */
  parts: string[]
}

export interface CalendarInsights {
  jYear: number
  jMonth: number
  stats: MonthShiftStats
  prevStats: MonthShiftStats
  bridges: HolidayBridge[]
  countdown: {
    daysToNextOff: number | null
    nextShift: { date: string; jalali: string; code: string; startTime: string } | null
  }
}

function isRestDay(day: CalendarDay): boolean {
  // روز استراحت: شیفت آف، یا تعطیل رسمی/جمعه بدون شیفت کاری
  if (day.shift) return day.shift.code === 'off'
  return day.weekday === 6 || day.holidays.some((h) => h.isOffDay)
}

function restLabel(day: CalendarDay): string {
  if (day.shift?.code === 'off') return 'آف'
  const holiday = day.holidays.find((h) => h.isOffDay)
  if (holiday) return holiday.title
  return 'جمعه'
}

function computeStats(days: CalendarDay[], movazafiRules: any = { satTueHours: 8.75, wedHours: 7, thuHours: 7 }): MonthShiftStats {
  const counts: Record<string, number> = {}
  let workHours = 0
  let offDays = 0
  let movazafiHours = 0
  let workLogTotalAmount = 0
  let overtimeTotalHours = 0

  for (const day of days) {
    if (day.shift) {
      counts[day.shift.code] = (counts[day.shift.code] ?? 0) + 1
      workHours += day.shift.code === 'off' ? 0 : day.shift.hours
    }
    if (isRestDay(day)) offDays++

    // Calculate Movazafi Hours
    const isHoliday = day.holidays.some((h) => h.isOffDay)
    if (day.weekday >= 0 && day.weekday <= 3 && !isHoliday) {
      movazafiHours += movazafiRules.satTueHours ?? 8.75
    } else if (day.weekday === 4 && !isHoliday) {
      movazafiHours += movazafiRules.wedHours ?? 7
    } else if (day.weekday === 5) {
      // User specifically requested: "روزهایی که پنجشنبه تعطیلن هم ۷ ساعت"
      movazafiHours += movazafiRules.thuHours ?? 7
    }

    // Sum financials and overtime
    for (const ev of day.events || []) {
      if (ev.type === 'overtime' || ev.type === 'work_log') {
        const meta = ev.metadata as Record<string, any> | null
        if (meta?.hours && typeof meta.hours === 'number') {
          overtimeTotalHours += meta.hours
        }
      }
      if (ev.type === 'financial') {
        const meta = ev.metadata as Record<string, any> | null
        if (meta?.amount && typeof meta.amount === 'number') {
          const isIncome = meta.isIncome !== false
          if (isIncome) {
            workLogTotalAmount += meta.amount
          } else {
            workLogTotalAmount -= meta.amount
          }
        }
      }
    }
  }

  return {
    counts,
    workHours: Math.round(workHours * 100) / 100,
    offDays,
    workLogTotalAmount,
    overtimeTotalHours,
    movazafiHours: Math.round(movazafiHours * 100) / 100,
  }
}

/**
 * پل تعطیلات: بازه‌های استراحت پیوسته‌ی ≥ minLength روز در افق آینده.
 * «۲ آف پشت هم + تعطیل رسمی + جمعه = ۴ روز استراحت».
 */
export function findBridges(days: CalendarDay[], minLength = 2, max = 5): HolidayBridge[] {
  const bridges: HolidayBridge[] = []
  let run: CalendarDay[] = []

  const flush = () => {
    if (run.length >= minLength) {
      bridges.push({
        from: run[0].date,
        to: run[run.length - 1].date,
        fromJalali: run[0].jalali,
        toJalali: run[run.length - 1].jalali,
        length: run.length,
        parts: run.map(restLabel),
      })
    }
    run = []
  }

  for (const day of days) {
    if (isRestDay(day)) run.push(day)
    else flush()
  }
  flush()

  // طولانی‌ترین‌ها اول، سپس نزدیک‌ترین
  return bridges
    .sort((a, b) => b.length - a.length || a.from.localeCompare(b.from))
    .slice(0, max)
}

async function monthDays(
  userId: string,
  roleKey: string,
  jYear: number,
  jMonth: number,
): Promise<CalendarDay[]> {
  const first = fromJalali(jYear, jMonth, 1)
  const last = first.date(first.daysInMonth())
  const range = await getCalendarRange({
    userId,
    roleKey,
    from: gregStr(first),
    to: gregStr(last),
    layers: ['shift', 'holidays', 'personal'],
  })
  return range.days
}

export async function getCalendarInsights(params: {
  userId: string
  roleKey: string
  jYear: number
  jMonth: number
}): Promise<CalendarInsights> {
  const { userId, roleKey, jYear, jMonth } = params
  const prevYear = jMonth === 1 ? jYear - 1 : jYear
  const prevMonth = jMonth === 1 ? 12 : jMonth - 1

  const [current, previous] = await Promise.all([
    monthDays(userId, roleKey, jYear, jMonth),
    monthDays(userId, roleKey, prevYear, prevMonth),
  ])

  // پل تعطیلات و شمارش معکوس روی افق ۹۰ روز از امروز (مستقل از ماه نمایشی)
  const today = dayjs().startOf('day')
  const [horizon, calendarConfig] = await Promise.all([
    getCalendarRange({
      userId,
      roleKey,
      from: today.format('YYYY-MM-DD'),
      to: today.add(89, 'day').format('YYYY-MM-DD'),
      layers: ['shift', 'holidays'],
    }),
    getCalendarConfig().catch(() => null),
  ])

  const bridgeFinderEnabled = calendarConfig?.smartRules?.bridgeFinder ?? true
  const movazafiRules = (calendarConfig as any)?.movazafiRules ?? { satTueHours: 8.75, wedHours: 7, thuHours: 7 }

  const upcoming = horizon.days.filter((d) => d.date > today.format('YYYY-MM-DD'))
  const nextOffIdx = upcoming.findIndex(isRestDay)
  const nextWork = horizon.days.find(
    (d) => d.date >= today.format('YYYY-MM-DD') && d.shift && d.shift.code !== 'off',
  )

  return {
    jYear,
    jMonth,
    stats: computeStats(current, movazafiRules),
    prevStats: computeStats(previous, movazafiRules),
    bridges: bridgeFinderEnabled ? findBridges(horizon.days) : [],
    countdown: {
      daysToNextOff: nextOffIdx === -1 ? null : nextOffIdx + 1,
      nextShift: nextWork?.shift
        ? {
            date: nextWork.date,
            jalali: nextWork.jalali,
            code: nextWork.shift.code,
            startTime: nextWork.shift.startTime,
          }
        : null,
    },
  }
}
