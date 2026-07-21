/**
 * سرویس Audit Log پیشرفته (بخش ۴.۵ سند tosee.md)
 * ثبت کامل عملیات حساس شامل: چه کسی، چه زمانی، از چه دستگاهی، با چه IP،
 * مقدار قبل/بعد تغییر، و دلیل تغییر.
 */
import { prisma } from '@/server/db'
import type { AuditLogAction } from '@/generated/prisma/client'

/** اطلاعات دستگاه و شبکه استخراج‌شده از درخواست HTTP */
export interface RequestContext {
  ipAddress?: string
  userAgent?: string
  device?: string // mobile | desktop | tablet
}

/** پارامترهای ثبت یک رکورد audit log */
export interface WriteAuditLogParams {
  actorId: string
  entity: string         // نام موجودیت مثل User, Shift, Setting
  entityId: string       // شناسه رکورد مرتبط
  action: AuditLogAction // نوع عملیات
  before?: unknown       // مقدار قبل از تغییر
  after?: unknown        // مقدار بعد از تغییر
  reason?: string        // دلیل تغییر
  metadata?: unknown     // اطلاعات اضافی دلخواه
  request?: Request      // درخواست HTTP جهت استخراج IP و userAgent
}

/**
 * استخراج اطلاعات دستگاه از هدرهای درخواست HTTP.
 */
export function extractRequestContext(request?: Request): RequestContext {
  if (!request) return {}

  const userAgent = request.headers.get('user-agent') || undefined
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwarded?.split(',')[0]?.trim() || realIp || undefined

  let device: string | undefined
  if (userAgent) {
    const ua = userAgent.toLowerCase()
    if (/tablet|ipad/i.test(ua)) {
      device = 'tablet'
    } else if (/mobile|android|iphone/i.test(ua)) {
      device = 'mobile'
    } else {
      device = 'desktop'
    }
  }

  return { ipAddress, userAgent, device }
}

/**
 * ثبت یک رکورد audit log حرفه‌ای در دیتابیس.
 * این تابع هرگز throw نمی‌کند — خطا فقط log می‌شود.
 */
export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  try {
    const ctx = extractRequestContext(params.request)

    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        entity: params.entity,
        entityId: params.entityId,
        action: params.action,
        before: params.before ? JSON.parse(JSON.stringify(params.before)) : undefined,
        after: params.after ? JSON.parse(JSON.stringify(params.after)) : undefined,
        reason: params.reason || undefined,
        ipAddress: ctx.ipAddress || undefined,
        userAgent: ctx.userAgent || undefined,
        device: ctx.device || undefined,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    })
  } catch (err) {
    // هرگز خطای audit log نباید عملیات اصلی را متوقف کند
    console.error('[AuditLog] خطا در ثبت لاگ:', err)
  }
}

/**
 * تابع کمکی محاسبه diff بین دو شیء (مقدار قبل و بعد).
 * فقط کلیدهایی که تغییر کرده‌اند را برمی‌گرداند.
 */
export function computeDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { changed: Record<string, { from: unknown; to: unknown }> } {
  const changed: Record<string, { from: unknown; to: unknown }> = {}
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

  for (const key of allKeys) {
    const oldVal = before[key]
    const newVal = after[key]
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changed[key] = { from: oldVal, to: newVal }
    }
  }

  return { changed }
}
