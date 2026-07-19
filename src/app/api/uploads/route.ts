import { NextResponse } from 'next/server'
import {
  getSessionUser,
  requireRole,
  authErrorResponse,
} from '@/server/rbac/guard'
import { getStorage } from '@/server/storage'
import { writeSystemLog } from '@/server/modules/logs/service'
import { extractRequestContext } from '@/server/modules/audit/service'


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
  'application/x-rar',
  'application/vnd.rar',
  'application/x-tar',
  'application/x-7z-compressed',
  'application/rar',
]

export async function POST(request: Request) {
  let currentUser: { id: string } | null = null
  let uploadedFile: File | null = null

  try {
    const user = await getSessionUser(request)
    if ('error' in user) return authErrorResponse(user)
    currentUser = user

    const roleErr = await requireRole(user, 'operator')
    if (roleErr) return authErrorResponse(roleErr)

    const form = await request.formData()
    const file = form.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'فایلی ارسال نشده است' }, { status: 400 })
    }
    uploadedFile = file



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
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('[Upload API Error]:', err)

    try {
      const ctx = extractRequestContext(request)
      await writeSystemLog({
        level: 'error',
        source: 'server',
        category: 'uploads',
        message: `خطای سرور در آپلود فایل: ${err.message}`,
        stack: err.stack,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        actorId: currentUser?.id,
        metadata: {
          fileName: uploadedFile?.name || 'unknown',
          fileSize: uploadedFile?.size || 0,
          mimeType: uploadedFile?.type || 'unknown',
        },
      })
    } catch (logError) {
      console.error('[Upload API Log Failure]:', logError)
    }

    return NextResponse.json(
      { error: `خطای سرور در آپلود فایل: ${err.message}` },
      { status: 500 },
    )
  }
}

