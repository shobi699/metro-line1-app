import { NextResponse } from 'next/server'
import { verifyAccessToken } from '@/server/auth/jwt'
import { hasPermission, rankForRoleKey } from './permissions'

export interface AuthUser {
  id: string
  nationalId: string
  roleKey: string
  rank: number
  permissions: string[]
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
      nationalId: payload.nationalId,
      roleKey: payload.roleKey,
      rank: typeof payload.rank === 'number' ? payload.rank : rankForRoleKey(payload.roleKey),
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    }
  } catch {
    return { error: 'توکن نامعتبر یا منقضی شده', status: 401 }
  }
}

/** گارد مبتنی بر رتبه؛ کلیدهای نقش سیستمی به رتبه نگاشت می‌شوند. */
export function requireRole(
  user: AuthUser,
  minRole: string,
): AuthError | null {
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
 * به عنوان مثال، سرشیفت شیفت الف فقط مجاز به مدیریت پرسنل همان شیفت/گروه است.
 */
export function checkAbacAccess(
  user: AuthUser,
  targetUser: { id: string; group?: string; shift?: string },
  userGroup?: string
): boolean {
  // مدیر ارشد و ادمین به همه دسترسی دارند
  if (user.roleKey === 'super_admin' || user.roleKey === 'admin') {
    return true
  }

  // اگر نقش سرشیفت باشد:
  if (user.roleKey === 'shift_lead') {
    const operatorGroup = userGroup || 'A'
    const targetGroup = targetUser.group || 'A'
    
    // سرشیفت فقط پرسنل هم‌گروه خود را مدیریت می‌کند
    return operatorGroup === targetGroup
  }

  // کاربر عادی فقط خودش را مدیریت می‌کند
  return user.id === targetUser.id
}
