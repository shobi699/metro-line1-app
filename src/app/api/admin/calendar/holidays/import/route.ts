import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission, authErrorResponse } from '@/server/rbac/guard'
import { importHolidays, type HolidayImportRow } from '@/server/modules/calendar/admin-service'
import * as XLSX from 'xlsx'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)
  const permErr = requirePermission(user, 'calendar-admin:holidays')
  if (permErr) return authErrorResponse(permErr)

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: { code: 'NO_FILE', message: 'فایل اکسل یافت نشد' } }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) {
    return NextResponse.json({ error: { code: 'EMPTY_SHEET', message: 'فایل خالی است' } }, { status: 400 })
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

  const COLUMN_MAP: Record<string, string> = {
    'تاریخ': 'jalaliDate',
    'تاریخ جلالی': 'jalaliDate',
    'jalaliDate': 'jalaliDate',
    'date': 'jalaliDate',
    'عنوان': 'title',
    'title': 'title',
    'نوع': 'kind',
    'kind': 'kind',
    'تعطیل': 'isOffDay',
    'isOffDay': 'isOffDay',
    'تکرار': 'recurring',
    'recurring': 'recurring',
    'قمری': 'hijriBased',
    'hijriBased': 'hijriBased',
  }

  const rows: HolidayImportRow[] = rawRows.map((raw) => {
    const mapped: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(raw)) {
      const normalized = COLUMN_MAP[key.trim()] ?? key.trim()
      mapped[normalized] = val
    }
    return {
      jalaliDate: String(mapped.jalaliDate ?? ''),
      title: String(mapped.title ?? ''),
      kind: mapped.kind ? String(mapped.kind) : undefined,
      isOffDay: mapped.isOffDay !== undefined ? Boolean(mapped.isOffDay) : undefined,
      recurring: mapped.recurring !== undefined ? Boolean(mapped.recurring) : undefined,
      hijriBased: mapped.hijriBased !== undefined ? Boolean(mapped.hijriBased) : undefined,
    }
  })

  const result = await importHolidays(rows, user.id)
  return NextResponse.json({ data: result })
}
