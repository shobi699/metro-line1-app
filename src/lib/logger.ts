/**
2:  * یوتیلیتی لاگر کلاینت برای ارسال لاگ‌ها و خطاها به API سرور.
3:  */
export async function logToServer(params: {
  level: 'debug' | 'info' | 'warn' | 'error'
  source?: 'client' | 'mobile'
  category: string
  message: string
  stack?: string
  metadata?: unknown
}): Promise<void> {
  try {
    const payload = {
      level: params.level,
      source: params.source || 'client',
      category: params.category,
      message: params.message,
      stack: params.stack,
      metadata: params.metadata,
    }

    // ارسال لاگ به سرور به صورت پس‌زمینه
    await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    // از کار افتادن لاگر کلاینت نباید کل برنامه را کرش کند
    console.error('[ClientLogger] Failed to send log to server:', err)
  }
}

export async function clientLogError(category: string, message: string, error?: Error | unknown, metadata?: unknown): Promise<void> {
  let stack: string | undefined
  if (error instanceof Error) {
    stack = error.stack
  } else if (typeof error === 'string') {
    stack = error
  }

  await logToServer({
    level: 'error',
    category,
    message,
    stack,
    metadata,
  })
}

export async function clientLogWarn(category: string, message: string, metadata?: unknown): Promise<void> {
  await logToServer({
    level: 'warn',
    category,
    message,
    metadata,
  })
}

export async function clientLogInfo(category: string, message: string, metadata?: unknown): Promise<void> {
  await logToServer({
    level: 'info',
    category,
    message,
    metadata,
  })
}

export async function clientLogDebug(category: string, message: string, metadata?: unknown): Promise<void> {
  await logToServer({
    level: 'debug',
    category,
    message,
    metadata,
  })
}
