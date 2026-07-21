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
      .filter((e) => !['task', 'financial', 'work_log', 'overtime'].includes(e.type))
      .map((e) => `${e.title}${e.description ? ` (${e.description})` : ''}`)
      .join('، '),
    'کارها': d.events
      .filter((e) => e.type === 'task')
      .map((e) => `${e.isDone ? '✔' : '☐'} ${e.title}${e.description ? ` (${e.description})` : ''}`)
      .join('، '),
    'اضافه کار / کارکرد': d.events
      .filter((e) => e.type === 'overtime' || e.type === 'work_log')
      .map((e) => `${e.title}: ${(e.metadata as any)?.hours || 0} ساعت${e.description ? ` (${e.description})` : ''}`)
      .join('، '),
    'تراکنش‌های مالی': d.events
      .filter((e) => e.type === 'financial')
      .map((e) => `${e.title}: ${(e.metadata as any)?.isIncome !== false ? '+' : '-'} ${Number((e.metadata as any)?.amount || 0).toLocaleString()} تومان${e.description ? ` (${e.description})` : ''}`)
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
    { 'شاخص': 'ساعات کارکرد تقریبی شیفت', 'مقدار': insights.stats.workHours },
    { 'شاخص': 'مجموع ساعات اضافه کار ثبت شده', 'مقدار': insights.stats.overtimeTotalHours },
    { 'شاخص': 'تراز مالی ماه (تومان)', 'مقدار': insights.stats.workLogTotalAmount },
  ]

  const wb = XLSX.utils.book_new()

  const daysSheet = XLSX.utils.json_to_sheet(rows)
  daysSheet['!cols'] = [
    { wch: 12 }, // تاریخ جلالی
    { wch: 10 }, // روز هفته
    { wch: 12 }, // تاریخ میلادی
    { wch: 8 },  // شیفت
    { wch: 16 }, // ساعت
    { wch: 12 }, // وضعیت
    { wch: 24 }, // تعطیلی/مناسبت
    { wch: 30 }, // رویدادها
    { wch: 30 }, // کارها
    { wch: 35 }, // اضافه کار / کارکرد
    { wch: 35 }, // تراکنش‌های مالی
    { wch: 30 }, // رویداد سازمانی
  ]
  XLSX.utils.book_append_sheet(wb, daysSheet, monthTitle.slice(0, 31))

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows)
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'خلاصه ماه')

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

export async function exportDayStatusToExcel(where: any): Promise<ArrayBuffer> {
  const { prisma } = await import('@/server/db')
  const { toFa } = await import('@/lib/fa')
  
  const events = await prisma.personalEvent.findMany({
    where,
    include: {
      user: { select: { name: true, personnelCode: true } }
    },
    orderBy: { startAt: 'desc' },
  })

  const headers = [
    'ردیف',
    'نام و نام خانوادگی',
    'کد پرسنلی',
    'نوع رویداد',
    'تاریخ (شمسی)',
    'ساعت/مبلغ',
    'یادداشت/توضیحات',
  ]

  const typeMap: Record<string, string> = {
    on_call: 'کشیک',
    overtime: 'اضافه کار',
    leave_sick: 'مرخصی استعلاجی',
    leave_daily: 'مرخصی روزانه',
    leave_hourly: 'مرخصی ساعتی',
    note: 'یادداشت',
    other: 'سایر کارکرد',
    reminder: 'یادآور',
  }

  const rows = events.map((e, index) => {
    const cf = (e.metadata as Record<string, any> | null) || {}
    let amountOrHours = ''
    if (cf.hours !== undefined) {
      amountOrHours = toFa(String(cf.hours)) + ' ساعت'
    } else if (cf.amount !== undefined) {
      const prefix = cf.isIncome !== false ? '+' : '−'
      amountOrHours = prefix + toFa(Number(cf.amount).toLocaleString()) + ' تومان'
    }

    return [
      index + 1,
      e.user.name,
      e.user.personnelCode,
      typeMap[e.type] || e.type,
      toFa(jdate(e.startAt).format('YYYY/MM/DD')),
      amountOrHours,
      e.title + (e.description ? ` (توضیحات: ${e.description})` : ''),
    ]
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 40 },
  ]
  
  // RTL
  if (!ws['!views']) ws['!views'] = []
  ws['!views'].push({ rightToLeft: true })
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'گزارش روزانه')

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}
