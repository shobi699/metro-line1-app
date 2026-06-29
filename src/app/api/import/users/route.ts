import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import {
  importUsersFromExcel,
  generateErrorReport,
} from '@/server/modules/directory/import'

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
  const result = await importUsersFromExcel(buffer, user.id)

  if (result.errors.length > 0) {
    const errorBuffer = generateErrorReport(result.errors)
    const bytes = new Uint8Array(errorBuffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const errorBase64 = btoa(binary)

    return NextResponse.json({
      data: {
        ...result,
        errorReportUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${errorBase64}`,
      },
    })
  }

  return NextResponse.json({ data: result })
}
