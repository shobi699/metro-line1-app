import { describe, it, expect } from 'vitest'
import { requireRole, requirePermission, type AuthUser } from './guard'

function makeUser(roleKey: 'operator' | 'admin' | 'super_admin'): AuthUser {
  return {
    id: 'test-id',
    nationalId: '0000000000',
    roleKey,
  }
}

describe('requireRole guard', () => {
  it('operator passes operator check', () => {
    expect(requireRole(makeUser('operator'), 'operator')).toBeNull()
  })

  it('operator fails admin check', () => {
    const err = requireRole(makeUser('operator'), 'admin')
    expect(err).not.toBeNull()
    expect(err!.status).toBe(403)
  })

  it('admin passes operator check', () => {
    expect(requireRole(makeUser('admin'), 'operator')).toBeNull()
  })

  it('admin fails super_admin check', () => {
    const err = requireRole(makeUser('admin'), 'super_admin')
    expect(err).not.toBeNull()
    expect(err!.status).toBe(403)
  })

  it('super_admin passes all checks', () => {
    expect(requireRole(makeUser('super_admin'), 'operator')).toBeNull()
    expect(requireRole(makeUser('super_admin'), 'admin')).toBeNull()
    expect(requireRole(makeUser('super_admin'), 'super_admin')).toBeNull()
  })
})

describe('requirePermission guard', () => {
  it('operator has tickets:read', () => {
    expect(requirePermission(makeUser('operator'), 'tickets:read')).toBeNull()
  })

  it('operator lacks users:delete', () => {
    const err = requirePermission(makeUser('operator'), 'users:delete')
    expect(err).not.toBeNull()
    expect(err!.status).toBe(403)
  })

  it('admin has shifts:create', () => {
    expect(requirePermission(makeUser('admin'), 'shifts:create')).toBeNull()
  })

  it('admin lacks users:delete', () => {
    const err = requirePermission(makeUser('admin'), 'users:delete')
    expect(err).not.toBeNull()
  })

  it('super_admin has all permissions', () => {
    const perms = [
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
    ] as const

    for (const perm of perms) {
      expect(requirePermission(makeUser('super_admin'), perm)).toBeNull()
    }
  })
})
