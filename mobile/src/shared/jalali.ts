import * as jalaali from 'jalaali-js'

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFa(n: number | string): string {
  return String(n).replace(/\d/g, (d) => persianDigits[Number(d)])
}

export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const { jy, jm, jd } = jalaali.toJalaali(gy, gm, gd)
  return [jy, jm, jd]
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd)
  return new Date(gy, gm - 1, gd)
}

export function getJalaliMonthLength(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm)
}

export function getJalaliDateString(date: Date): string {
  const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate())
  return `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`
}

export function getJalaliDateLabel(date: Date): string {
  const [jy, jm, jd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد',
    'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر',
    'دی', 'بهمن', 'اسفند'
  ]
  const weekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
  const dayName = weekdays[date.getDay()]
  return `${dayName} ${toFa(jd)} ${months[jm - 1]} ${toFa(jy)}`
}

// Static solar holidays (fixed every year in Jalali calendar)
const STATIC_SOLAR_HOLIDAYS: Record<string, string> = {
  '1-1': 'عید نوروز',
  '1-2': 'عید نوروز',
  '1-3': 'عید نوروز',
  '1-4': 'عید نوروز',
  '1-12': 'روز جمهوری اسلامی',
  '1-13': 'روز طبیعت',
  '3-14': 'رحلت امام خمینی',
  '3-15': 'قیام ۱۵ خرداد',
  '11-22': 'پیروزی انقلاب اسلامی',
  '12-29': 'روز ملی شدن صنعت نفت',
}

// Some sample lunar holidays for the years 1403-1405 (demo data)
const LUNAR_HOLIDAYS_DEMO: Record<string, string> = {
  // 1403
  '1403-1-12': 'شهادت امام علی (ع)',
  '1403-1-22': 'عید سعید فطر',
  '1403-1-23': 'عید سعید فطر',
  '1403-2-15': 'شهادت امام جعفر صادق (ع)',
  '1403-3-28': 'عید سعید قربان',
  '1403-4-5': 'عید سعید غدیر خم',
  '1403-4-25': 'تاسوعای حسینی',
  '1403-4-26': 'عاشورای حسینی',
  '1403-6-4': 'اربعین حسینی',
  '1403-6-12': 'رحلت پیامبر اکرم (ص) و شهادت امام حسن (ع)',
  '1403-6-14': 'شهادت امام رضا (ع)',
  '1403-6-22': 'شهادت امام حسن عسکری (ع)',
  '1403-6-31': 'میلاد پیامبر اکرم (ص) و امام جعفر صادق (ع)',
  '1403-9-15': 'شهادت حضرت فاطمه زهرا (س)',
  '1403-10-25': 'ولادت امام علی (ع) - روز پدر',
  '1403-11-9': 'مبعث پیامبر اکرم (ص)',
  '1403-11-26': 'ولادت حضرت مهدی (عج)',
  
  // 1404
  '1404-1-1': 'شهادت امام علی (ع)',
  '1404-1-11': 'عید سعید فطر',
  '1404-1-12': 'عید سعید فطر',
  '1404-2-4': 'شهادت امام جعفر صادق (ع)',
  '1404-3-17': 'عید سعید قربان',
  '1404-3-25': 'عید سعید غدیر خم',
  '1404-4-15': 'تاسوعای حسینی',
  '1404-4-16': 'عاشورای حسینی',
  '1404-5-24': 'اربعین حسینی',
  '1404-6-1': 'رحلت پیامبر اکرم (ص)',
  '1404-6-3': 'شهادت امام رضا (ع)',
  '1404-6-11': 'شهادت امام حسن عسکری (ع)',
  '1404-6-20': 'میلاد پیامبر اکرم (ص)',
  '1404-9-4': 'شهادت حضرت فاطمه زهرا (س)',
  '1404-10-15': 'ولادت امام علی (ع) - روز پدر',
  '1404-10-29': 'مبعث پیامبر اکرم (ص)',
  '1404-11-15': 'ولادت حضرت مهدی (عج)',
  '1404-12-20': 'شهادت امام علی (ع)',
  
  // 1405
  '1405-1-1': 'عید سعید فطر',
  '1405-1-2': 'عید سعید فطر',
  '1405-1-24': 'شهادت امام جعفر صادق (ع)',
  '1405-3-7': 'عید سعید قربان',
  '1405-3-15': 'عید سعید غدیر خم',
  '1405-4-5': 'تاسوعای حسینی',
  '1405-4-6': 'عاشورای حسینی',
  '1405-5-14': 'اربعین حسینی',
  '1405-5-22': 'رحلت پیامبر اکرم (ص)',
  '1405-5-24': 'شهادت امام رضا (ع)',
  '1405-6-1': 'شهادت امام حسن عسکری (ع)',
  '1405-6-10': 'میلاد پیامبر اکرم (ص)',
  '1405-8-23': 'شهادت حضرت فاطمه زهرا (س)',
  '1405-10-5': 'ولادت امام علی (ع) - روز پدر',
  '1405-10-19': 'مبعث پیامبر اکرم (ص)',
  '1405-11-5': 'ولادت حضرت مهدی (عج)',
  '1405-12-10': 'شهادت امام علی (ع)',
  '1405-12-20': 'عید سعید فطر',
  '1405-12-21': 'عید سعید فطر',
}

export function getJalaliHoliday(jy: number, jm: number, jd: number): string | null {
  const staticKey = `${jm}-${jd}`
  if (STATIC_SOLAR_HOLIDAYS[staticKey]) {
    return STATIC_SOLAR_HOLIDAYS[staticKey]
  }
  
  const lunarKey = `${jy}-${jm}-${jd}`
  if (LUNAR_HOLIDAYS_DEMO[lunarKey]) {
    return LUNAR_HOLIDAYS_DEMO[lunarKey]
  }
  
  return null
}

