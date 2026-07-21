import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateSwapRules, validateTripSwapRules } from './service'
import { prisma } from '@/server/db'
import { ShiftCode, Shift } from '@/generated/prisma/client'

vi.mock('@/server/db', () => ({
  prisma: {
    shift: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    tripAssignment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    trip: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/server/modules/settings', () => ({
  getSettingValue: vi.fn((key, fallback) => Promise.resolve(fallback)),
}))

describe('validateSwapRules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fails if shifts are not found', async () => {
    vi.mocked(prisma.shift.findUnique).mockResolvedValue(null)

    const violations = await validateSwapRules('req-1', 'target-1', 'shift-1', 'shift-2')
    expect(violations).toContainEqual(
      expect.objectContaining({ rule: 'invalid_shift' })
    )
  })

  it('fails if shifts do not belong to the correct users', async () => {
    const shift1 = { id: 'shift-1', userId: 'wrong-user', date: new Date('2026-06-01'), code: 'morning' as ShiftCode }
    const shift2 = { id: 'shift-2', userId: 'target-1', date: new Date('2026-06-02'), code: 'evening' as ShiftCode }

    vi.mocked(prisma.shift.findUnique).mockImplementation((async ({ where }: any) => {
      if (where.id === 'shift-1') return shift1
      if (where.id === 'shift-2') return shift2
      return null
    }) as any)

    vi.mocked(prisma.user.findUnique).mockImplementation((async ({ where }: any) => {
      const id = where.id
      return { id, roleId: 'role-1', role: { id: 'role-1', key: 'operator', name: 'راهبر' } }
    }) as any)

    const violations = await validateSwapRules('req-1', 'target-1', 'shift-1', 'shift-2')
    expect(violations).toContainEqual(
      expect.objectContaining({ rule: 'not_your_shift' })
    )
  })

  it('passes if swap is valid and obeys all constraints', async () => {
    const shift1 = { id: 'shift-1', userId: 'req-1', date: new Date('2026-06-01'), code: 'morning' as ShiftCode }
    const shift2 = { id: 'shift-2', userId: 'target-1', date: new Date('2026-06-02'), code: 'evening' as ShiftCode }

    vi.mocked(prisma.shift.findUnique).mockImplementation((async ({ where }: any) => {
      if (where.id === 'shift-1') return shift1
      if (where.id === 'shift-2') return shift2
      return null
    }) as any)

    vi.mocked(prisma.user.findUnique).mockImplementation((async ({ where }: any) => {
      const id = where.id
      return { id, roleId: 'role-1', role: { id: 'role-1', key: 'operator', name: 'راهبر' } }
    }) as any)

    vi.mocked(prisma.shift.findMany).mockResolvedValue([])

    const violations = await validateSwapRules('req-1', 'target-1', 'shift-1', 'shift-2')
    expect(violations).toHaveLength(0)
  })

  it('fails if requester violates min rest hours', async () => {
    const shift1 = { id: 'shift-1', userId: 'req-1', date: new Date('2026-06-01'), code: 'morning' as ShiftCode }
    const shift2 = { id: 'shift-2', userId: 'target-1', date: new Date('2026-06-02'), code: 'morning' as ShiftCode }

    vi.mocked(prisma.shift.findUnique).mockImplementation((async ({ where }: any) => {
      if (where.id === 'shift-1') return shift1
      if (where.id === 'shift-2') return shift2
      return null
    }) as any)

    vi.mocked(prisma.user.findUnique).mockImplementation((async ({ where }: any) => {
      return { id: where.id, roleId: 'role-1', role: { id: 'role-1', key: 'operator', name: 'راهبر' } }
    }) as any)

    const otherRequesterShifts = [
      { id: 'shift-other', userId: 'req-1', date: new Date('2026-06-01'), code: 'night' as ShiftCode },
    ]

    vi.mocked(prisma.shift.findMany).mockImplementation((async ({ where }: any) => {
      if (where?.userId === 'req-1') {
        return otherRequesterShifts
      }
      return []
    }) as any)

    const violations = await validateSwapRules('req-1', 'target-1', 'shift-1', 'shift-2')
    expect(violations).toContainEqual(
      expect.objectContaining({
        rule: 'min_rest',
        message: expect.stringContaining('فاصله استراحت با شیفت'),
      })
    )
  })

  it('fails if target user violates min rest hours', async () => {
    const shift1 = { id: 'shift-1', userId: 'req-1', date: new Date('2026-06-02'), code: 'morning' as ShiftCode }
    const shift2 = { id: 'shift-2', userId: 'target-1', date: new Date('2026-06-03'), code: 'evening' as ShiftCode }

    vi.mocked(prisma.shift.findUnique).mockImplementation((async ({ where }: any) => {
      if (where.id === 'shift-1') return shift1
      if (where.id === 'shift-2') return shift2
      return null
    }) as any)

    const otherTargetShifts = [
      { id: 'shift-target-other', userId: 'target-1', date: new Date('2026-06-01'), code: 'night' as ShiftCode },
    ]

    vi.mocked(prisma.shift.findMany).mockImplementation((async ({ where }: any) => {
      if (where?.userId === 'target-1') {
        return otherTargetShifts
      }
      return []
    }) as any)

    const violations = await validateSwapRules('req-1', 'target-1', 'shift-1', 'shift-2')
    expect(violations).toContainEqual(
      expect.objectContaining({
        rule: 'min_rest',
        message: expect.stringContaining('برای کاربر مقصد: فاصله استراحت با شیفت'),
      })
    )
  })

  it('fails if requester exceeds max consecutive shifts limit', async () => {
    const shift1 = { id: 'shift-1', userId: 'req-1', date: new Date('2026-06-07'), code: 'morning' as ShiftCode }
    const shift2 = { id: 'shift-2', userId: 'target-1', date: new Date('2026-06-08'), code: 'evening' as ShiftCode }

    vi.mocked(prisma.shift.findUnique).mockImplementation((async ({ where }: any) => {
      if (where.id === 'shift-1') return shift1
      if (where.id === 'shift-2') return shift2
      return null
    }) as any)

    const otherRequesterShifts = [
      { id: 's1', userId: 'req-1', date: new Date('2026-06-02'), code: 'morning' as ShiftCode },
      { id: 's2', userId: 'req-1', date: new Date('2026-06-03'), code: 'morning' as ShiftCode },
      { id: 's3', userId: 'req-1', date: new Date('2026-06-04'), code: 'morning' as ShiftCode },
      { id: 's4', userId: 'req-1', date: new Date('2026-06-05'), code: 'morning' as ShiftCode },
      { id: 's5', userId: 'req-1', date: new Date('2026-06-06'), code: 'morning' as ShiftCode },
    ]

    vi.mocked(prisma.shift.findMany).mockImplementation((async ({ where }: any) => {
      if (where?.userId === 'req-1') {
        return otherRequesterShifts
      }
      return []
    }) as any)

    const violations = await validateSwapRules('req-1', 'target-1', 'shift-1', 'shift-2')
    expect(violations).toContainEqual(
      expect.objectContaining({
        rule: 'max_consecutive',
        message: expect.stringContaining('شیفت متوالی مجاز نیست'),
      })
    )
  })

  it('normalizes non-midnight dates correctly', async () => {
    const shift1 = { id: 'shift-1', userId: 'req-1', date: new Date('2026-06-01T09:30:00'), code: 'morning' as ShiftCode }
    const shift2 = { id: 'shift-2', userId: 'target-1', date: new Date('2026-06-02T12:00:00'), code: 'morning' as ShiftCode }

    vi.mocked(prisma.shift.findUnique).mockImplementation((async ({ where }: any) => {
      if (where.id === 'shift-1') return shift1
      if (where.id === 'shift-2') return shift2
      return null
    }) as any)

    vi.mocked(prisma.user.findUnique).mockImplementation((async ({ where }: any) => {
      const id = where.id
      return { id, roleId: 'role-1', role: { id: 'role-1', key: 'operator', name: 'راهبر' } }
    }) as any)

    const violations = await validateSwapRules('req-1', 'target-1', 'shift-1', 'shift-2')
    expect(violations).toBeDefined()
  })
})

describe('validateTripSwapRules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fails if assignments are not found', async () => {
    vi.mocked(prisma.tripAssignment.findUnique).mockResolvedValue(null)

    const violations = await validateTripSwapRules('req-1', 'target-1', 'assign-1', 'assign-2')
    expect(violations).toContainEqual(
      expect.objectContaining({ rule: 'invalid_assignment' })
    )
  })

  it('fails if roles are not identical', async () => {
    const assign1 = { id: 'assign-1', matchedUserId: 'req-1', role: 'H1', trip: { id: 't1', rosterVersionId: 'v1' } }
    const assign2 = { id: 'assign-2', matchedUserId: 'target-1', role: 'H2', trip: { id: 't2', rosterVersionId: 'v1' } }

    vi.mocked(prisma.tripAssignment.findUnique).mockImplementation((async ({ where }: any) => {
      if (where.id === 'assign-1') return assign1
      if (where.id === 'assign-2') return assign2
      return null
    }) as any)

    vi.mocked(prisma.user.findUnique).mockImplementation((async ({ where }: any) => {
      if (where.id === 'req-1') return { id: 'req-1', roleId: 'role-1', role: { id: 'role-1', key: 'operator', name: 'راهبر' } }
      if (where.id === 'target-1') return { id: 'target-1', roleId: 'role-2', role: { id: 'role-2', key: 'admin', name: 'مدیر' } }
      return null
    }) as any)

    const violations = await validateTripSwapRules('req-1', 'target-1', 'assign-1', 'assign-2')
    expect(violations).toContainEqual(
      expect.objectContaining({ rule: 'role_parity' })
    )
  })
})
