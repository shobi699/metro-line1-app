import { NextResponse } from 'next/server'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import { writeSystemLog } from '@/server/modules/logs/service'
import { extractRequestContext } from '@/server/modules/audit/service'

const TEST_ERRORS = [
  {
    level: 'error' as const,
    category: 'uploads',
    message: 'خطا در بارگذاری تصویر تیکت خرابی در Cloudflare R2: دسترسی غیرمجاز (Access Denied)',
    stack: `Error: Access Denied to R2 Bucket "metro-uploads"
    at createR2Driver (src/server/storage/r2.ts:21:28)
    at Object.saveFile (src/server/storage/r2.ts:21:28)
    at POST (src/app/api/uploads/route.ts:57:33)
    at runWithCleanups (node_modules/next/dist/compiled/next-server.js:8:1432)`,
    metadata: { bucket: 'metro-uploads', key: 'uploads/2026-07/ticket-fault-image.png' },
  },
  {
    level: 'error' as const,
    category: 'database',
    message: 'خطای پایگاه داده در فراخوانی prisma.user.create: نقض قید یکتایی کد پرسنلی (nationalId)',
    stack: `PrismaClientKnownRequestError: Unique constraint failed on the fields: (\`nationalId\`)
    at RequestHandler.request (node_modules/@prisma/client/runtime/library.js:125:7586)
    at async PrismaClient._request (node_modules/@prisma/client/runtime/library.js:127:10214)
    at async createSetting (src/server/modules/settings/service.ts:963:5)`,
    metadata: { personnelCode: '987654321', duplicateField: 'nationalId' },
  },
  {
    level: 'warn' as const,
    category: 'auth',
    message: 'تلاش مشکوک برای ورود با کد پرسنلی نامعتبر',
    metadata: { attemptedCode: '111111111', reason: 'User not found in active profile directory' },
  },
  {
    level: 'info' as const,
    category: 'system',
    message: 'شبیه‌سازی موفقیت‌آمیز راه‌اندازی ماژول لاگ‌گیری سیستم خط ۱ مترو',
    metadata: { status: 'initialized', version: '1.0.0' },
  }
]

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request)
    if ('error' in user) return authErrorResponse(user)

    const roleErr = await requireRole(user, 'admin')
    if (roleErr) return authErrorResponse(roleErr)

    // انتخاب تصادفی یک خطای تست
    const randomIndex = Math.floor(Math.random() * TEST_ERRORS.length)
    const testError = TEST_ERRORS[randomIndex]

    const ctx = extractRequestContext(request)

    await writeSystemLog({
      level: testError.level,
      source: 'server',
      category: testError.category,
      message: testError.message,
      stack: testError.stack,
      metadata: testError.metadata,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      actorId: user.id,
    })

    return NextResponse.json({ success: true, message: 'خطای تستی با موفقیت ثبت شد' }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'خطا در ثبت لاگ تستی: ' + err.message },
      { status: 500 }
    )
  }
}
