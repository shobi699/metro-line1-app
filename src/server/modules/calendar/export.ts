/**
 * خروجی اکسل ماهانه تقویم (فاز ۳ — SHIFT_CALENDAR_DESIGN.md §۴.۴):
 * برنامه شیفت + تعطیلات + رویدادها و کارهای شخصی در یک شیت.
 */
import * as XLSX from 'xlsx'
import { fromJalali, gregStr, jdate } from '@/lib/dayjs'
import { getCalendarRange } from './service'
import { getCalendarInsights } from './insights'

const SHIFT_FA: Record<string, string> = {
  morning: 'صبح',
  evening: 'عصر',
  night: 'شب',
  off: 'آف',
  office: 'اداری',
}

const WEEKDAY_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

export async function exportMonthToExcel(params: {
  userId: string
  roleKey: string
  jYear: number
  jMonth: number
}): Promise<ArrayBuffer> {
  const { userId, roleKey, jYear, jMonth } = params
  const first = fromJalali(jYear, jMonth, 1)
  const last = first.date(first.daysInMonth())

  const [range, insights] = await Promise.all([
    getCalendarRange({
      userId,
      roleKey,
      from: gregStr(first),
      to: gregStr(last),
    }),
    getCalendarInsights({ userId, roleKey, jYear, jMonth }),
  ])

  const monthTitle = jdate(first.toDate()).format('MMMM YYYY')

  const rows = range.days.map((d) => ({
    'تاریخ جلالی': d.jalali,
    'روز هفته': WEEKDAY_FA[d.weekday],
    'تاریخ میلادی': d.date,
    'شیفت': d.shift ? SHIFT_FA[d.shift.code] ?? d.shift.code : '',
    'ساعت': d.shift?.startTime ? `${d.shift.startTime} تا ${d.shift.endTime}` : '',
    'وضعیت': d.shift?.forecast ? 'پیش‌بینی سیکل' : d.shift ? 'قطعی' : '',
    'تعطیلی/مناسبت': d.holidays.map((h) => h.title).join('، '),
    'رویدادها': d.events
      .filter((e) => e.type !== 'task')
      .map((e) => e.title)
      .join('، '),
    'کارها': d.events
      .filter((e) => e.type === 'task')
      .map((e) => `${e.isDone ? '✔' : '☐'} ${e.title}`)
      .join('، '),
    'رویداد سازمانی': d.orgEvents
      .map((e) => `${e.mandatory ? '(الزامی) ' : ''}${e.title}`)
      .join('، '),
  }))

  const summaryRows = [
    { 'شاخص': 'صبح', 'مقدار': insights.stats.counts.morning ?? 0 },
    { 'شاخص': 'عصر', 'مقدار': insights.stats.counts.evening ?? 0 },
    { 'شاخص': 'شب', 'مقدار': insights.stats.counts.night ?? 0 },
    { 'شاخص': 'اداری', 'مقدار': insights.stats.counts.office ?? 0 },
    { 'شاخص': 'آف', 'مقدار': insights.stats.counts.off ?? 0 },
    { 'شاخص': 'روزهای استراحت (با تعطیلات)', 'مقدار': insights.stats.offDays },
    { 'شاخص': 'ساعات کارکرد تقریبی', 'مقدار': insights.stats.workHours },
  ]

  const wb = XLSX.utils.book_new()

  const daysSheet = XLSX.utils.json_to_sheet(rows)
  daysSheet['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 8 },
    { wch: 16 },
    { wch: 12 },
    { wch: 24 },
    { wch: 30 },
    { wch: 30 },
    { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(wb, daysSheet, monthTitle.slice(0, 31))

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows)
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'خلاصه ماه')

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}
