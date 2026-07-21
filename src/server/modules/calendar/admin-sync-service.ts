import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { createClient } from '@libsql/client'
import { importHolidays, type HolidayImportRow } from './admin-service'

const PERSIAN_HOLIDAY_DB_URL = 'https://raw.githubusercontent.com/samanzamani/PersianHoliday/main/persian_holiday.db'

export function sanitizeHolidayTitle(rawTitle: string): string | null {
  if (!rawTitle) return null
  let title = rawTitle.trim()

  // 1. Skip concatenated month dumps (length > 75 or multiple bracket pairs)
  if (title.length > 75 || (title.match(/\[/g) || []).length > 2) {
    return null
  }

  // 2. Remove prepended day + month numbers (e.g., "1 فروردینجشن نوروز", "1 فروردین جشن نوروز", "14 مهرروز جهانی معلم")
  title = title.replace(/^\d+\s*(?:فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)?\s*/iu, '')
  title = title.replace(/^[\u0660-\u0669\u06f0-\u06f9]+\s*(?:فروردین|اردیبهشت|خرداد|تیر|مرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)?\s*/iu, '')

  // 3. Remove Gregorian English bracket tags like "[ September 27 ]" or "[ October 10 ]"
  title = title.replace(/\s*\[\s*[A-Za-z]+\s+\d+\s*\]/gi, '')

  // 4. Convert Hijri brackets like "[ ۱ شوال ]" to standard Persian parenthesis "(۱ شوال)"
  title = title.replace(/\s*\[\s*([\u0600-\u06FF\s]+)\s*\]/gi, (_match, inner) => ` (${inner.trim()})`)

  // 5. Fix common concatenated words lacking spaces
  title = title
    .replace(/عیدنوروز/g, 'عید نوروز')
    .replace(/روزبزرگداشت/g, 'روز بزرگداشت')
    .replace(/روزجهانی/g, 'روز جهانی')
    .replace(/روزملی/g, 'روز ملی')
    .replace(/روزدندانپزشک/g, 'روز دندانپزشک')

  // 6. Trim and clean double spaces
  title = title.replace(/\s+/g, ' ').trim()

  if (!title || title.length < 2) return null
  return title
}

export async function syncPersianHolidays(actorId: string, fromYear: number = 1400) {
  const tmpDir = os.tmpdir()
  const dbPath = path.join(tmpDir, `persian_holiday_${Date.now()}.db`)

  try {
    // 1. Download the DB
    const response = await fetch(PERSIAN_HOLIDAY_DB_URL, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Failed to download database: ${response.statusText}`)
    }
    const buffer = await response.arrayBuffer()
    await fs.writeFile(dbPath, Buffer.from(buffer))

    // 2. Query the SQLite DB
    const client = createClient({ url: `file:${dbPath}` })
    
    // Select events from the requested year onwards
    const result = await client.execute({
      sql: 'SELECT * FROM events WHERE year >= ?',
      args: [fromYear],
    })

    const rows: HolidayImportRow[] = []
    const seen = new Set<string>()

    for (const row of result.rows) {
      const year = String(row.year).padStart(4, '0')
      const month = String(row.month).padStart(2, '0')
      const day = String(row.day).padStart(2, '0')
      const jalaliDate = `${year}-${month}-${day}`
      const isOffDay = row.is_holiday === 1
      const rawTitle = String(row.event)
      const title = sanitizeHolidayTitle(rawTitle)
      
      if (!title) continue
      const dedupKey = `${jalaliDate}_${title}`
      if (seen.has(dedupKey)) continue
      seen.add(dedupKey)

      const kind = isOffDay ? 'official' : 'occasion'

      rows.push({
        jalaliDate,
        title,
        isOffDay,
        kind,
        recurring: false,
        hijriBased: false,
      })
    }

    client.close()

    // 3. Import using existing logic
    if (rows.length === 0) {
      throw new Error('No events found for the specified year range.')
    }

    const importResult = await importHolidays(rows, actorId)
    return importResult
  } finally {
    // Cleanup temporary DB file
    await fs.unlink(dbPath).catch(() => {})
  }
}
