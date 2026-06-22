import * as XLSX from 'xlsx'
import { prisma } from '@/server/db'
import type { ShiftCode } from '@/generated/prisma/client'

export interface RosterRow {
  nationalId: string
  name: string
  date: string
  code: string
}

export interface ParsedRoster {
  rows: RosterRow[]
  unmapped: Array<{ row: number; reason: string }>
}

const CODE_MAP: Record<string, ShiftCode> = {
  صبح: 'morning',
  morning: 'morning',
  عصر: 'evening',
  evening: 'evening',
  شب: 'night',
  night: 'night',
  استراحت: 'off',
  off: 'off',
  rest: 'off',
  'OFF': 'off',
}

function normalizeCode(raw: string): ShiftCode | null {
  const trimmed = raw.trim().toLowerCase()
  for (const [key, value] of Object.entries(CODE_MAP)) {
    if (key.toLowerCase() === trimmed) return value
  }
  return null
}

export function parseRosterExcel(buffer: ArrayBuffer): ParsedRoster {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const rows: RosterRow[] = []
  const unmapped: ParsedRoster['unmapped'] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    })

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2

      const nationalId = String(row['کد ملی'] ?? row['nationalId'] ?? '').trim()
      const name = String(row['نام'] ?? row['name'] ?? '').trim()
      const dateStr = String(row['تاریخ'] ?? row['date'] ?? '').trim()
      const codeStr = String(row['کد شیフト'] ?? row['shiftCode'] ?? row['کد'] ?? '').trim()

      if (!nationalId || !dateStr || !codeStr) {
        unmapped.push({
          row: rowNumber,
          reason: 'فیلدهای ضروری (کد ملی، تاریخ، کد شیفت) خالی هستند',
        })
        continue
      }

      const code = normalizeCode(codeStr)
      if (!code) {
        unmapped.push({
          row: rowNumber,
          reason: `کد شیفت نامعتبر: ${codeStr}`,
        })
        continue
      }

      rows.push({ nationalId, name, date: dateStr, code })
    }
  }

  return { rows, unmapped }
}

export interface RosterImportResult {
  successCount: number
  errorCount: number
  totalRows: number
  errors: Array<{ row: number; nationalId: string; reason: string }>
}

export async function applyRosterToShifts(
  parsed: ParsedRoster,
  uploaderId: string,
): Promise<RosterImportResult> {
  const errors: RosterImportResult['errors'] = []
  let successCount = 0

  // Build lookup maps
  const users = await prisma.user.findMany({
    select: { id: true, nationalId: true },
  })
  const userByNationalId = new Map(users.map((u) => [u.nationalId, u.id]))

  // Save roster file record
  await prisma.rosterFile.create({
    data: {
      fileName: 'roster-import',
      period: new Date().toISOString(),
      parsedData: JSON.stringify(parsed),
      uploaderId,
    },
  })

  for (let i = 0; i < parsed.rows.length; i++) {
    const rosterRow = parsed.rows[i]
    const rowNumber = i + 2

    const userId = userByNationalId.get(rosterRow.nationalId)
    if (!userId) {
      errors.push({
        row: rowNumber,
        nationalId: rosterRow.nationalId,
        reason: 'کاربری با این کد ملی یافت نشد',
      })
      continue
    }

    // Parse jalali date to Gregorian
    const dateParts = rosterRow.date.split('/')
    if (dateParts.length !== 3) {
      errors.push({
        row: rowNumber,
        nationalId: rosterRow.nationalId,
        reason: `فرمت تاریخ نامعتبر: ${rosterRow.date}`,
      })
      continue
    }

    const [jy, jm, jd] = dateParts.map(Number)
    // Simple jalali to gregorian conversion
    const gregorianDate = jalaliToGregorian(jy, jm, jd)

    try {
      await prisma.shift.upsert({
        where: { userId_date: { userId, date: gregorianDate } },
        update: { code: rosterRow.code as ShiftCode },
        create: {
          userId,
          date: gregorianDate,
          code: rosterRow.code as ShiftCode,
        },
      })
      successCount++
    } catch {
      errors.push({
        row: rowNumber,
        nationalId: rosterRow.nationalId,
        reason: 'خطا در ذخیره شیفت',
      })
    }
  }

  return {
    successCount,
    errorCount: errors.length,
    totalRows: parsed.rows.length,
    errors,
  }
}

function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const jalaliDays =
    365 * (jy - 1) +
    Math.floor((jy - 1) / 33) * 8 +
    Math.floor(((jy - 1) % 33 + 1) / 4) +
    (jm - 1) * 31 +
    Math.floor((jm - 1 > 6 ? jm - 1 - 6 : jm - 1) / 2) +
    jd

  const gregorianEpoch = new Date(1970, 0, 1).getTime()
  const gregorianMs =
    gregorianEpoch + (jalaliDays - 25568 + 1) * 86400000

  return new Date(gregorianMs)
}
