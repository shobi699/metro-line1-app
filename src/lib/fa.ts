const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFa(n: number | string): string {
  return String(n).replace(/\d/g, (d) => persianDigits[Number(d)])
}

export function toEn(n: number | string): string {
  return String(n)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
}

function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
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

export function jalali(date?: Date | string): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${toFa(jy)}/${toFa(String(jm).padStart(2, '0'))}/${toFa(String(jd).padStart(2, '0'))}`
}

export function faTime(date?: Date | string): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return toFa(`${h}:${m}`)
}

function jalaliToGregorianArray(jy: number, jm: number, jd: number): [number, number, number] {
  const sal_a = jy % 33
  const gy =
    jy <= 975
      ? 621 + 977 - jy + (sal_a <= 7 ? 0 : sal_a === 8 ? 366 : 365)
      : 1600 + 975 - (sal_a <= 7 ? 0 : sal_a === 8 ? 366 : 365) + jy
  const gy_day = gd_g(gy) - gd_j(jy)
  let j_day = jd
  const j_month = jm
  if (j_month > 6) j_day += 186
  else j_day += 186 - (6 - j_month) * 31
  let g_day = j_day + gy_day
  let g_year = gy
  if (g_day > 365) {
    g_day -= 365
    g_year++
  }
  const g_months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (isLeapGregorian(g_year)) g_months[1] = 29
  let gm = 0
  while (g_day > g_months[gm]) {
    g_day -= g_months[gm]
    gm++
  }
  return [g_year, gm + 1, g_day]
}

function isLeapGregorian(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function gd_g(jy: number): number {
  const gy = jy <= 975 ? 621 + 977 - jy : 1600 + 975 - jy
  return gy
}

function gd_j(jy: number): number {
  const gy = jy <= 975 ? 621 + 977 - jy : 1600 + 975 - jy
  const days = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400)
  return days - 1
}

export function jalaliToDate(jy: number, jm: number, jd: number): Date {
  const [gy, gm, gd] = jalaliToGregorianArray(jy, jm, jd)
  return new Date(gy, gm - 1, gd)
}

export function normalizeFarsiString(str: string): string {
  if (!str) return ''
  return toEn(str)
    .replace(/[\u064B-\u065F\u0640]/g, '') // Remove Arabic diacritics & Kashida
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/ۀ/g, 'ه')
    .replace(/\u200c/g, ' ') // Replace ZWNJ with space
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces/joins
    .replace(/[,\-\_\.\u060C]/g, ' ') // Replace commas, dashes, periods with space
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .trim()
    .toLowerCase()
}

export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length
  const n = s2.length
  const d: number[][] = []

  for (let i = 0; i <= m; i++) d[i] = [i]
  for (let j = 0; j <= n; j++) d[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      )
    }
  }
  return d[m][n]
}

export function fuzzyMatchScore(a: string, b: string): number {
  const normA = normalizeFarsiString(a)
  const normB = normalizeFarsiString(b)

  if (!normA || !normB) return 0
  if (normA === normB) return 100

  // 1. Direct Levenshtein similarity
  const maxLen = Math.max(normA.length, normB.length)
  const dist = levenshteinDistance(normA, normB)
  const directScore = ((maxLen - dist) / maxLen) * 100

  // 2. Token Sort Ratio (helps with word order changes)
  const tokensA = normA.split(' ').filter(Boolean).sort().join(' ')
  const tokensB = normB.split(' ').filter(Boolean).sort().join(' ')
  const tokensMaxLen = Math.max(tokensA.length, tokensB.length)
  const tokensDist = levenshteinDistance(tokensA, tokensB)
  const tokenSortScore = tokensMaxLen > 0 ? ((tokensMaxLen - tokensDist) / tokensMaxLen) * 100 : 0

  return Math.max(directScore, tokenSortScore)
}
