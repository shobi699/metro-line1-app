const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFa(n: number | string): string {
  return String(n).replace(/\d/g, (d) => persianDigits[Number(d)])
}

export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const gy2 = gm > 2 ? gy + 1 : gy
  let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1]
  let jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  let jm: number
  let jd: number
  if (days < 186) {
    jm = 1 + Math.floor(days / 31)
    jd = 1 + (days % 31)
  } else {
    jm = 7 + Math.floor((days - 186) / 30)
    jd = 1 + ((days - 186) % 30)
  }
  return [jy, jm, jd]
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const jalaliDays =
    365 * (jy - 1) +
    Math.floor((jy - 1) / 33) * 8 +
    Math.floor(((jy - 1) % 33 + 1) / 4) +
    (jm - 1) * 31 +
    Math.floor((jm - 1 > 6 ? jm - 1 - 6 : jm - 1) / 2) +
    jd

  const gregorianEpoch = new Date(1970, 0, 1).getTime()
  // Add 1 day adjustment for matching Gregorian calendar alignments
  const gregorianMs =
    gregorianEpoch + (jalaliDays - 25568 + 1) * 86400000

  return new Date(gregorianMs)
}

export function getJalaliMonthLength(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31
  if (jm >= 7 && jm <= 11) return 30
  
  // Leap year check for Esfand (12th month)
  const a = 0.025
  const b = 266
  const esLeap = (((jy - (jy > 0 ? 474 : 473)) % 2820) + 474 + 38) * 31 % 128 < 30
  return esLeap ? 30 : 29
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
