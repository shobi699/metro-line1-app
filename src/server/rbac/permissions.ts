import type { RoleKey } from '@/generated/prisma/client'

export type Permission =
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'shifts:create'
  | 'shifts:read'
  | 'shifts:update'
  | 'shifts:delete'
  | 'tickets:create'
  | 'tickets:read'
  | 'tickets:update'
  | 'tickets:delete'
  | 'bulletins:create'
  | 'bulletins:read'
  | 'bulletins:update'
  | 'bulletins:delete'
  | 'imports:create'
  | 'imports:read'
  | 'settings:read'
  | 'settings:update'

const ROLE_HIERARCHY: Record<RoleKey, number> = {
  operator: 0,
  admin: 1,
  super_admin: 2,
}

export function hasMinRole(userRole: RoleKey, requiredRole: RoleKey): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export const PERMISSION_MATRIX: Record<RoleKey, Permission[]> = {
  super_admin: [
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'shifts:create',
    'shifts:read',
    'shifts:update',
    'shifts:delete',
    'tickets:create',
    'tickets:read',
    'tickets:update',
    'tickets:delete',
    'bulletins:create',
    'bulletins:read',
    'bulletins:update',
    'bulletins:delete',
    'imports:create',
    'imports:read',
    'settings:read',
    'settings:update',
  ],
  admin: [
    'users:read',
    'users:update',
    'shifts:create',
    'shifts:read',
    'shifts:update',
    'tickets:create',
    'tickets:read',
    'tickets:update',
    'bulletins:create',
    'bulletins:read',
    'bulletins:update',
    'imports:create',
    'imports:read',
    'settings:read',
  ],
  operator: [
    'users:read',
    'shifts:read',
    'tickets:create',
    'tickets:read',
    'tickets:update',
    'bulletins:read',
    'imports:read',
    'settings:read',
  ],
}

export function hasPermission(
  roleKey: RoleKey,
  permission: Permission,
): boolean {
  return PERMISSION_MATRIX[roleKey]?.includes(permission) ?? false
}

export function getRolePermissions(roleKey: RoleKey): Permission[] {
  return PERMISSION_MATRIX[roleKey] ?? []
}
