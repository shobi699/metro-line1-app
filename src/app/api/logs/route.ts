import { NextResponse } from 'next/server'
import { getSessionUser } from '@/server/rbac/guard'
import { writeSystemLog } from '@/server/modules/logs/service'
import { extractRequestContext } from '@/server/modules/audit/service'
import { z } from 'zod'

const logSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  source: z.enum(['client', 'mobile']),
  category: z.string().min(1),
  message: z.string().min(1),
  stack: z.string().optional(),
  metadata: z.any().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = logSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'فرمت داده‌های ارسالی صحیح نیست' }, { status: 400 })
    }

    const { level, source, category, message, stack, metadata } = result.data

    // بررسی کاربر لاگین شده (اختیاری)
    let actorId: string | undefined
    try {
      const user = await getSessionUser(request)
      if (user && !('error' in user)) {
        actorId = user.id
      }
    } catch {
      // نادیده گرفتن خطای احراز هویت در صورت عدم لاگین بودن
    }

    // استخراج اطلاعات IP و UserAgent
    const ctx = extractRequestContext(request)

    await writeSystemLog({
      level,
      source,
      category,
      message,
      stack,
      metadata,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      actorId,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'خطا در ثبت لاگ سمت کلاینت: ' + err.message },
      { status: 500 }
    )
  }
}
