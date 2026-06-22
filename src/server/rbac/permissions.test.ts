import { describe, it, expect } from 'vitest'
import {
  hasMinRole,
  hasPermission,
  getRolePermissions,
  PERMISSION_MATRIX,
} from './permissions'

describe('RBAC permissions', () => {
  describe('hasMinRole', () => {
    it('operator meets operator requirement', () => {
      expect(hasMinRole('operator', 'operator')).toBe(true)
    })

    it('operator does NOT meet admin requirement', () => {
      expect(hasMinRole('operator', 'admin')).toBe(false)
    })

    it('operator does NOT meet super_admin requirement', () => {
      expect(hasMinRole('operator', 'super_admin')).toBe(false)
    })

    it('admin meets operator requirement', () => {
      expect(hasMinRole('admin', 'operator')).toBe(true)
    })

    it('admin meets admin requirement', () => {
      expect(hasMinRole('admin', 'admin')).toBe(true)
    })

    it('admin does NOT meet super_admin requirement', () => {
      expect(hasMinRole('admin', 'super_admin')).toBe(false)
    })

    it('super_admin meets all requirements', () => {
      expect(hasMinRole('super_admin', 'operator')).toBe(true)
      expect(hasMinRole('super_admin', 'admin')).toBe(true)
      expect(hasMinRole('super_admin', 'super_admin')).toBe(true)
    })
  })

  describe('hasPermission', () => {
    it('operator can read tickets', () => {
      expect(hasPermission('operator', 'tickets:read')).toBe(true)
    })

    it('operator cannot delete users', () => {
      expect(hasPermission('operator', 'users:delete')).toBe(false)
    })

    it('admin can update shifts', () => {
      expect(hasPermission('admin', 'shifts:update')).toBe(true)
    })

    it('admin cannot delete users', () => {
      expect(hasPermission('admin', 'users:delete')).toBe(false)
    })

    it('super_admin has all permissions', () => {
      for (const perm of PERMISSION_MATRIX.super_admin) {
        expect(hasPermission('super_admin', perm)).toBe(true)
      }
    })
  })

  describe('getRolePermissions', () => {
    it('returns correct permissions for each role', () => {
      expect(getRolePermissions('operator')).toEqual(
        PERMISSION_MATRIX.operator,
      )
      expect(getRolePermissions('admin')).toEqual(PERMISSION_MATRIX.admin)
      expect(getRolePermissions('super_admin')).toEqual(
        PERMISSION_MATRIX.super_admin,
      )
    })

    it('super_admin has more permissions than admin', () => {
      expect(
        getRolePermissions('super_admin').length,
      ).toBeGreaterThan(getRolePermissions('admin').length)
    })

    it('admin has more permissions than operator', () => {
      expect(
        getRolePermissions('admin').length,
      ).toBeGreaterThan(getRolePermissions('operator').length)
    })
  })
})
