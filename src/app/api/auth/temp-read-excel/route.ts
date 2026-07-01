import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), 'lohe', 'loheadi (2).xlsx')
    const fileBuffer = fs.readFileSync(filePath)
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

    const sampleRows = rows.slice(0, 15).map((r, idx) => ({
      index: idx,
      cells: r
    }))

    return NextResponse.json({ sampleRows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) })
  }
}
