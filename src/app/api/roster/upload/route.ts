import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { parseRosterExcel, applyRosterToShifts } from '@/server/modules/roster/service'

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if ('error' in user) return authErrorResponse(user)

  const roleErr = requireRole(user, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'فایل ارسال نشد' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext !== 'xlsx' && ext !== 'xls') {
    return NextResponse.json(
      { error: 'فرمت فایل نامعتبر است. فقط فایل Excel پذیرفته می‌شود.' },
      { status: 400 },
    )
  }

  const buffer = await file.arrayBuffer()
  const parsed = parseRosterExcel(buffer)

  if (parsed.rows.length === 0 && parsed.unmapped.length > 0) {
    return NextResponse.json({
      data: {
        successCount: 0,
        errorCount: parsed.unmapped.length,
        totalRows: 0,
        errors: parsed.unmapped.map((u) => ({
          row: u.row,
          nationalId: '',
          reason: u.reason,
        })),
        needsReview: false,
      },
    })
  }

  const result = await applyRosterToShifts(parsed, user.id)

  // Merge unmapped into errors
  const allErrors = [
    ...result.errors,
    ...parsed.unmapped.map((u) => ({
      row: u.row,
      nationalId: '',
      reason: u.reason,
    })),
  ]

  return NextResponse.json({
    data: {
      ...result,
      errorCount: allErrors.length,
      errors: allErrors,
      needsReview: parsed.unmapped.length > 0,
    },
  })
}
