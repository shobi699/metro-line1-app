import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assertPolicy, invalidatePolicyCache } from './policy'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    chatRolePolicy: {
      findUnique: vi.fn(),
    },
    rosterRolePolicy: {
      findUnique: vi.fn(),
    },
    radioRolePolicy: {
      findUnique: vi.fn(),
    },
    directoryFieldPolicy: {
      findUnique: vi.fn(),
    },
    courseAudience: {
      count: vi.fn(),
    },
    postAudience: {
      count: vi.fn(),
    },
  },
}))

describe('RBAC policy engine with cache support', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invalidatePolicyCache()
  })

  it('bypasses checks and returns true for super_admin', async () => {
    const result = await assertPolicy('super_admin', 'roster', 'publish')
    expect(result).toBe(true)
    expect(prisma.rosterRolePolicy.findUnique).not.toHaveBeenCalled()
  })

  it('correctly uses database policy checks and falls back if missing', async () => {
    // Mocking missing roster policy -> falls back to false for publish action
    vi.mocked(prisma.rosterRolePolicy.findUnique).mockResolvedValue(null)
    const result = await assertPolicy('operator', 'roster', 'publish')
    expect(result).toBe(false)

    // Mocking existing roster policy -> allowed = true
    vi.mocked(prisma.rosterRolePolicy.findUnique).mockResolvedValue({
      id: 'p-1',
      roleKey: 'operator',
      action: 'publish',
      allowed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    // Invalidate first to clear the cache of the previous check
    invalidatePolicyCache()
    const resultAllowed = await assertPolicy('operator', 'roster', 'publish')
    expect(resultAllowed).toBe(true)
  })

  it('implements in-memory caching to avoid database queries on repeated calls', async () => {
    vi.mocked(prisma.chatRolePolicy.findUnique).mockResolvedValue({
      id: 'c-1',
      roleKey: 'driver',
      roomKind: 'group',
      canSend: true,
      canAttach: false,
      canPin: false,
      canUrgent: false,
      canCreate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // First call: hits DB
    const res1 = await assertPolicy('driver', 'chat', 'group', 'canSend')
    expect(res1).toBe(true)
    expect(prisma.chatRolePolicy.findUnique).toHaveBeenCalledTimes(1)

    // Second call: should serve from cache, NOT database
    const res2 = await assertPolicy('driver', 'chat', 'group', 'canSend')
    expect(res2).toBe(true)
    expect(prisma.chatRolePolicy.findUnique).toHaveBeenCalledTimes(1)

    // Invalidate cache: should clear cache
    invalidatePolicyCache()

    // Third call: hits DB again
    const res3 = await assertPolicy('driver', 'chat', 'group', 'canSend')
    expect(res3).toBe(true)
    expect(prisma.chatRolePolicy.findUnique).toHaveBeenCalledTimes(2)
  })

  it('verifies safe policy fallbacks for default behaviors', async () => {
    vi.mocked(prisma.directoryFieldPolicy.findUnique).mockResolvedValue(null)
    
    // Phone/email are visible by default
    const visiblePhone = await assertPolicy('driver', 'directory', 'phone')
    expect(visiblePhone).toBe(true)

    // NationalId is hidden by default
    const visibleNationalId = await assertPolicy('driver', 'directory', 'personnelCode')
    expect(visibleNationalId).toBe(false)
  })
})
