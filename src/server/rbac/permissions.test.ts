import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  coercePermissions,
  rankForRoleKey,
  SYSTEM_ROLE_RANKS,
  ALL_PERMISSIONS,
} from './permissions'

describe('RBAC permissions', () => {
  describe('rankForRoleKey', () => {
    it('orders system roles operator < admin < super_admin', () => {
      expect(rankForRoleKey('operator')).toBeLessThan(rankForRoleKey('admin'))
      expect(rankForRoleKey('admin')).toBeLessThan(rankForRoleKey('super_admin'))
    })

    it('defaults unknown (custom) roles to rank 0', () => {
      expect(rankForRoleKey('safety_officer')).toBe(0)
    })

    it('matches SYSTEM_ROLE_RANKS', () => {
      expect(rankForRoleKey('admin')).toBe(SYSTEM_ROLE_RANKS.admin)
    })
  })

  describe('hasPermission', () => {
    it('grants when the permission is present', () => {
      expect(hasPermission(['tickets:read', 'shifts:read'], 'tickets:read')).toBe(true)
    })

    it('denies when the permission is absent', () => {
      expect(hasPermission(['tickets:read'], 'users:delete')).toBe(false)
    })

    it('wildcard grants everything', () => {
      expect(hasPermission(['*'], 'users:delete')).toBe(true)
      expect(hasPermission(['*'], 'roles:manage')).toBe(true)
    })

    it('empty permissions deny all', () => {
      expect(hasPermission([], 'tickets:read')).toBe(false)
    })
  })

  describe('coercePermissions', () => {
    it('passes through a flat array', () => {
      expect(coercePermissions(['users:read', '*'])).toEqual(['users:read', '*'])
    })

    it('parses a JSON string', () => {
      expect(coercePermissions('["users:read"]')).toEqual(['users:read'])
    })

    it('flattens an object matrix to resource:action', () => {
      expect(
        coercePermissions({ users: ['read', 'create'], shifts: ['read'] }),
      ).toEqual(['users:read', 'users:create', 'shifts:read'])
    })

    it('returns empty for invalid input', () => {
      expect(coercePermissions(null)).toEqual([])
      expect(coercePermissions('not-json')).toEqual([])
    })
  })

  describe('catalog', () => {
    it('exposes a non-empty flat permission list', () => {
      expect(ALL_PERMISSIONS).toContain('roles:manage')
      expect(ALL_PERMISSIONS).toContain('meetings:manage')
      expect(ALL_PERMISSIONS.length).toBeGreaterThan(10)
    })
  })
})
