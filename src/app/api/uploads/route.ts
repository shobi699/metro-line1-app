import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { getStorage } from '@/server/storage'

const MAX_SIZE = 100 * 1024 * 1024 // ۱۰۰ مگابایت
const ALLOWED_PREFIXES = ['image/', 'video/', 'audio/']
const ALLOWED_EXACT = [
  'application/pdf',
  'application/vnd.android.package-archive',
  'application/octet-stream',
  'application/x-ios-app',
  'application/xml',
  'text/xml',
  'application/x-plist',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
]

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return authErrorResponse(user)

    const roleErr = await requireRole(user, 'operator')
    if (roleErr) return authErrorResponse(roleErr)

    const form = await request.formData()
    const file = form.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'حجم فایل بیش از ۱۰۰ مگابایت است' },
        { status: 400 },
      )
    }

    const mime = file.type || 'application/octet-stream'
    const allowed =
      ALLOWED_PREFIXES.some((p) => mime.startsWith(p)) ||
      ALLOWED_EXACT.includes(mime)
    if (!allowed) {
      return NextResponse.json(
        { error: 'نوع فایل مجاز نیست' },
        { status: 400 },
      )
    }

    const buffer = await file.arrayBuffer()
    const stored = await getStorage().saveFile(buffer, file.name, mime)

    return NextResponse.json({ data: stored }, { status: 201 })
  } catch (error: any) {
    console.error('[Upload API Error]:', error)
    return NextResponse.json(
      { error: `خطای سرور در آپلود فایل: ${error?.message || error}` },
      { status: 500 },
    )
  }
}
