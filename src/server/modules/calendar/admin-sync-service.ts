import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { createClient } from '@libsql/client'
import { importHolidays, type HolidayImportRow } from './admin-service'

const PERSIAN_HOLIDAY_DB_URL = 'https://raw.githubusercontent.com/samanzamani/PersianHoliday/main/persian_holiday.db'

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

    for (const row of result.rows) {
      const year = String(row.year).padStart(4, '0')
      const month = String(row.month).padStart(2, '0')
      const day = String(row.day).padStart(2, '0')
      const jalaliDate = `${year}-${month}-${day}`
      const isOffDay = row.is_holiday === 1
      const title = String(row.event)
      
      // Basic mapping: If it's a holiday, mark as official. Else, occasion.
      const kind = isOffDay ? 'official' : 'occasion'

      rows.push({
        jalaliDate,
        title,
        isOffDay,
        kind,
        recurring: false, // PersianHoliday data is year-specific, so we shouldn't mark it as recurring globally
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
