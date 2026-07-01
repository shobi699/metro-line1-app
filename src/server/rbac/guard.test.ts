import { describe, it, expect } from 'vitest'
import { requireRole, requirePermission, checkAbacAccess, type AuthUser } from './guard'

function makeUser(rank: number, permissions: string[]): AuthUser {
  return {
    id: 'test-id',
    nationalId: '0000000000',
    roleKey: 'custom',
    rank,
    permissions,
  }
}

describe('requireRole guard (rank-based)', () => {
  it('operator-rank passes operator check', () => {
    expect(requireRole(makeUser(0, []), 'operator')).toBeNull()
  })

  it('operator-rank fails admin check', () => {
    const err = requireRole(makeUser(0, []), 'admin')
    expect(err).not.toBeNull()
    expect(err!.status).toBe(403)
  })

  it('admin-rank passes operator check', () => {
    expect(requireRole(makeUser(1, []), 'operator')).toBeNull()
  })

  it('admin-rank fails super_admin check', () => {
    expect(requireRole(makeUser(1, []), 'super_admin')).not.toBeNull()
  })

  it('super_admin-rank passes all checks', () => {
    expect(requireRole(makeUser(2, []), 'operator')).toBeNull()
    expect(requireRole(makeUser(2, []), 'admin')).toBeNull()
    expect(requireRole(makeUser(2, []), 'super_admin')).toBeNull()
  })
})

describe('requirePermission guard (permission-based)', () => {
  it('passes when the user holds the permission', () => {
    expect(
      requirePermission(makeUser(0, ['tickets:read']), 'tickets:read'),
    ).toBeNull()
  })

  it('fails when the permission is missing', () => {
    const err = requirePermission(makeUser(0, ['tickets:read']), 'users:delete')
    expect(err).not.toBeNull()
    expect(err!.status).toBe(403)
  })

  it('wildcard permission passes any check', () => {
    expect(requirePermission(makeUser(2, ['*']), 'users:delete')).toBeNull()
    expect(requirePermission(makeUser(2, ['*']), 'roles:manage')).toBeNull()
  })
})

describe('checkAbacAccess (Attribute-based & Scoped)', () => {
  const adminUser: AuthUser = { id: 'admin-1', nationalId: '1', roleKey: 'admin', rank: 1, permissions: ['*'] }
  const shiftLeadUser: AuthUser = { id: 'lead-1', nationalId: '2', roleKey: 'shift_lead', rank: 0, permissions: [] }
  const driverUser: AuthUser = { id: 'driver-1', nationalId: '3', roleKey: 'driver', rank: 0, permissions: [] }

  it('admin can access any user', () => {
    expect(checkAbacAccess(adminUser, { id: 'driver-2', group: 'B' })).toBe(true)
  })

  it('shift lead A can access driver A', () => {
    expect(checkAbacAccess(shiftLeadUser, { id: 'driver-2', group: 'A' }, 'A')).toBe(true)
  })

  it('shift lead A cannot access driver B', () => {
    expect(checkAbacAccess(shiftLeadUser, { id: 'driver-2', group: 'B' }, 'A')).toBe(false)
  })

  it('regular user can only access themselves', () => {
    expect(checkAbacAccess(driverUser, { id: 'driver-1' })).toBe(true)
    expect(checkAbacAccess(driverUser, { id: 'driver-2' })).toBe(false)
  })
})
