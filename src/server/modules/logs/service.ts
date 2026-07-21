import { prisma } from '@/server/db'
import { getSettingValue } from '@/server/modules/settings/service'

export interface WriteSystemLogParams {
  level: 'debug' | 'info' | 'warn' | 'error'
  source: 'server' | 'client' | 'mobile'
  category: string
  message: string
  stack?: string
  metadata?: unknown
  ipAddress?: string
  userAgent?: string
  actorId?: string
}

const LEVEL_SEVERITY: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * ثبت یک لاگ سیستمی در دیتابیس با بررسی فعال بودن تنظیمات و حداقل سطح لاگ
 */
export async function writeSystemLog(params: WriteSystemLogParams): Promise<void> {
  try {
    // خواندن تنظیمات مربوطه
    const loggingEnabled = await getSettingValue<boolean>('logging.enabled', true)
    if (!loggingEnabled) return

    const minLevel = await getSettingValue<string>('logging.minLevel', 'error')
    const currentSeverity = LEVEL_SEVERITY[params.level] ?? 1
    const requiredSeverity = LEVEL_SEVERITY[minLevel] ?? 3

    if (currentSeverity < requiredSeverity) {
      return
    }

    // ایجاد لاگ
    await prisma.systemLog.create({
      data: {
        level: params.level,
        source: params.source,
        category: params.category,
        message: params.message,
        stack: params.stack || null,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        actorId: params.actorId || null,
      },
    })
  } catch (err) {
    // خطای سرویس لاگ نباید اجرای کل برنامه را مختل کند
    console.error('[SystemLog] Failed to write system log to database:', err)
  }
}

export async function logError(
  category: string,
  message: string,
  stack?: string,
  metadata?: unknown,
  context?: { ipAddress?: string; userAgent?: string; actorId?: string }
): Promise<void> {
  await writeSystemLog({
    level: 'error',
    source: 'server',
    category,
    message,
    stack,
    metadata,
    ...context,
  })
}

export async function logWarn(
  category: string,
  message: string,
  metadata?: unknown,
  context?: { ipAddress?: string; userAgent?: string; actorId?: string }
): Promise<void> {
  await writeSystemLog({
    level: 'warn',
    source: 'server',
    category,
    message,
    metadata,
    ...context,
  })
}

export async function logInfo(
  category: string,
  message: string,
  metadata?: unknown,
  context?: { ipAddress?: string; userAgent?: string; actorId?: string }
): Promise<void> {
  await writeSystemLog({
    level: 'info',
    source: 'server',
    category,
    message,
    metadata,
    ...context,
  })
}

export async function logDebug(
  category: string,
  message: string,
  metadata?: unknown,
  context?: { ipAddress?: string; userAgent?: string; actorId?: string }
): Promise<void> {
  await writeSystemLog({
    level: 'debug',
    source: 'server',
    category,
    message,
    metadata,
    ...context,
  })
}
