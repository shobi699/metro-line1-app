import { NextResponse } from 'next/server'
import { verifyAccessToken, type AccessTokenPayload } from '@/server/auth/jwt'
import { hasMinRole, hasPermission, type Permission } from './permissions'
import type { RoleKey } from '@/generated/prisma/client'

export interface AuthUser {
  id: string
  nationalId: string
  roleKey: RoleKey
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
      roleKey: payload.roleKey as RoleKey,
    }
  } catch {
    return { error: 'توکن نامعتبر یا منقضی شده', status: 401 }
  }
}

export function requireRole(
  user: AuthUser,
  minRole: RoleKey,
): AuthError | null {
  if (!hasMinRole(user.roleKey, minRole)) {
    return {
      error: 'شما دسترسی کافی برای این عملیات را ندارید',
      status: 403,
    }
  }
  return null
}

export function requirePermission(
  user: AuthUser,
  permission: Permission,
): AuthError | null {
  if (!hasPermission(user.roleKey, permission)) {
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
