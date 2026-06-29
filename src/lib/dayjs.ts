import dayjs from 'dayjs'
import jalalidayMod from 'jalaliday'
import 'dayjs/locale/fa'

// jalaliday ships as a default export under some bundlers and a namespace under others
const jalaliday =
  (jalalidayMod as unknown as { default?: dayjs.PluginFunc }).default ??
  (jalalidayMod as dayjs.PluginFunc)

dayjs.extend(jalaliday)

/**
 * یک dayjs در تقویم جلالی + لوکیل فارسی (نام ماه و روزهای هفته فارسی).
 * در این حالت توکن‌های استاندارد (YYYY/MM/DD/MMMM/daysInMonth/...) مقدار جلالی برمی‌گردانند.
 */
export function jdate(input?: dayjs.ConfigType): dayjs.Dayjs {
  return dayjs(input).calendar('jalali').locale('fa')
}

/**
 * ساخت یک تاریخ جلالی از اجزای مشخص با setter
 * (به‌جای سازنده‌ی { jalali: true } که دچار اختلاف یک‌روزه‌ی UTC می‌شود).
 */
export function fromJalali(jy: number, jm1to12: number, jd: number): dayjs.Dayjs {
  return jdate().year(jy).month(jm1to12 - 1).date(jd)
}

/**
 * شناسه‌ی دوره‌ی سال‑ماه جلالی، مثل "1405-04".
 */
export function jalaliPeriodId(input?: dayjs.ConfigType): string {
  return jdate(input).format('YYYY-MM')
}

/**
 * کلید میلادی (YYYY-MM-DD) از یک dayjs جلالی — برای تطبیق با تاریخ‌های ذخیره‌شده‌ی دیتابیس.
 * نمایش جلالی است ولی کلید داده‌ای میلادی می‌ماند.
 */
export function gregStr(d: dayjs.Dayjs): string {
  return dayjs(d.toDate()).calendar('gregory').format('YYYY-MM-DD')
}

export { dayjs }
