import { NextResponse } from 'next/server'
import { verifyAccessToken } from '@/server/auth/jwt'
import { hasPermission, rankForRoleKey } from './permissions'
import { hasScopeAccess } from './org-unit'

export interface AuthUser {
  id: string
  personnelCode: string
  roleKey: string
  rank: number
  permissions: string[]
  homeUnitId?: string
  scopes?: { type: string; key: string }[]
}

export type AuthError = { error: string; status: number }

export async function getSessionUser(
  request: Request,
): Promise<AuthUser | AuthError> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'توکن احراز هویت یافت نشد', status: 401 }
  }

  const token = authHeader.slice(7)
  try {
    const payload = await verifyAccessToken(token)
    return {
      id: payload.sub!,
      personnelCode: payload.personnelCode as string || '',
      roleKey: payload.roleKey as string || 'user',
      rank: typeof payload.rank === 'number' ? payload.rank : rankForRoleKey(payload.roleKey as string),
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
      homeUnitId: payload.homeUnitId as string | undefined,
      scopes: Array.isArray(payload.scopes) ? payload.scopes : [],
    }
  } catch {
    return { error: 'توکن نامعتبر یا منقضی شده', status: 401 }
  }
}

/** گارد مبتنی بر رتبه؛ کلیدهای نقش سیستمی به رتبه نگاشت می‌شوند. */
export async function requireRole(
  user: AuthUser,
  minRole: string,
): Promise<AuthError | null> {
  if (user.rank < rankForRoleKey(minRole)) {
    return {
      error: 'شما دسترسی کافی برای این عملیات را ندارید',
      status: 403,
    }
  }
  return null
}

export function requirePermission(
  user: AuthUser,
  permission: string,
): AuthError | null {
  if (!hasPermission(user.permissions, permission)) {
    return {
      error: 'شما دسترسی کافی برای این عملیات را ندارید',
      status: 403,
    }
  }
  return null
}

export function authErrorResponse(err: AuthError) {
  return NextResponse.json({ error: err.error }, { status: err.status })
}

/**
 * بررسی دسترسی ویژگی‌محور (ABAC) و محدود شده (Scoped).
 * جایگزین تابع‌های استاتیک قبلی برای پشتیبانی از معماری IAM.
 */
export function checkAbacAccess(
  user: AuthUser,
  targetUser: { id: string; group?: string; shift?: string },
  userGroup?: string
): boolean {
  if (user.roleKey === 'super_admin' || user.roleKey === 'admin') {
    return true
  }

  if (user.roleKey === 'shift_lead') {
    const operatorGroup = userGroup || 'A'
    const targetGroup = targetUser.group || 'A'
    return operatorGroup === targetGroup
  }

  return user.id === targetUser.id
}

/**
 * بررسی دسترسی اصلی سیستم IAM
 * مشخص می‌کند آیا کاربر دسترسی خاصی را در یک محدوده (Scope) دارد یا خیر
 */
export async function can(
  user: AuthUser,
  permissionKey: string,
  scope?: { type: string; key: string }
): Promise<boolean> {
  // مدیر ارشد به همه چیز دسترسی دارد
  if (hasPermission(user.permissions, '*')) return true
  
  // بررسی وجود خود مجوز
  const hasPerm = hasPermission(user.permissions, permissionKey)
  if (!hasPerm) return false

  // اگر محدوده خاصی مد نظر نیست، فقط داشتن مجوز کافی است
  if (!scope) return true

  // اگر کاربر دسترسی global/all دارد
  const hasGlobalScope = user.scopes?.some(s => s.type === 'global' || s.type === 'all')
  if (hasGlobalScope) return true

  if (scope.type === 'org_unit') {
    return hasScopeAccess(user.scopes || [], scope.key)
  }

  // بررسی تطابق محدوده درخواست شده با محدوده‌های کاربر
  return user.scopes?.some(s => s.type === scope.type && s.key === scope.key) ?? false
}

/**
 * یک Wrapper برای مسیرهای API (Route Handlers) جهت ثبت خودکار خطاهای کنترل‌نشده ۵۰۰ در سیستم لاگ.
 */
export function withErrorLogging<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse<R> | Response>
) {
  return async (...args: T): Promise<NextResponse | Response> => {
    try {
      return await handler(...args)
    } catch (error) {
      const request = args[0] instanceof Request ? args[0] : null
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[API Route Error]:', err)

      try {
        let actorId: string | undefined
        let userAgent: string | undefined
        let ipAddress: string | undefined
        let category = 'api'

        if (request) {
          // استخراج اطلاعات درخواست
          const { extractRequestContext } = await import('@/server/modules/audit/service')
          const ctx = extractRequestContext(request)
          userAgent = ctx.userAgent
          ipAddress = ctx.ipAddress

          // استخراج دسته‌بندی از روی URL
          const url = new URL(request.url)
          const paths = url.pathname.split('/').filter(Boolean)
          if (paths[0] === 'api' && paths[1]) {
            category = paths[1]
          }

          // استخراج کاربر لاگین شده بدون بالا انداختن خطا
          const user = await getSessionUser(request).catch(() => null)
          if (user && !('error' in user)) {
            actorId = user.id
          }
        }

        const { writeSystemLog } = await import('@/server/modules/logs/service')
        await writeSystemLog({
          level: 'error',
          source: 'server',
          category,
          message: `خطای کنترل‌نشده در مسیر: ${err.message}`,
          stack: err.stack,
          ipAddress,
          userAgent,
          actorId,
        })
      } catch (logErr) {
        console.error('[withErrorLogging Log Failure]:', logErr)
      }

      return NextResponse.json(
        { error: `خطای داخلی سرور: ${err.message}` },
        { status: 500 }
      )
    }
  }
}

