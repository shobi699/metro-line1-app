import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateSwapRules } from './service'
import { prisma } from '@/server/db'
import { ShiftCode, Shift } from '@/generated/prisma/client'

vi.mock('@/server/db', () => ({
  prisma: {
    shift: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
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

    vi.mocked(prisma.shift.findUnique).mockImplementation(async ({ where }) => {
      if (where.id === 'shift-1') return shift1 as unknown as Shift
      if (where.id === 'shift-2') return shift2 as unknown as Shift
      return null
    })

    const violations = await validateSwapRules('req-1', 'target-1', 'shift-1', 'shift-2')
    expect(violations).toContainEqual(
      expect.objectContaining({ rule: 'not_your_shift' })
    )
  })

  it('passes if swap is valid and obeys all constraints', async () => {
    const shift1 = { id: 'shift-1', userId: 'req-1', date: new Date('2026-06-01'), code: 'morning' as ShiftCode }
    const shift2 = { id: 'shift-2', userId: 'target-1', date: new Date('2026-06-02'), code: 'evening' as ShiftCode }

    vi.mocked(prisma.shift.findUnique).mockImplementation(async ({ where }) => {
      if (where.id === 'shift-1') return shift1 as unknown as Shift
      if (where.id === 'shift-2') return shift2 as unknown as Shift
      return null
    })

    vi.mocked(prisma.shift.findMany).mockResolvedValue([])

    const violations = await validateSwapRules('req-1', 'target-1', 'shift-1', 'shift-2')
    expect(violations).toHaveLength(0)
  })

  it('fails if requester violates min rest hours', async () => {
    const shift1 = { id: 'shift-1', userId: 'req-1', date: new Date('2026-06-01'), code: 'morning' as ShiftCode }
    const shift2 = { id: 'shift-2', userId: 'target-1', date: new Date('2026-06-02'), code: 'morning' as ShiftCode }

    vi.mocked(prisma.shift.findUnique).mockImplementation(async ({ where }) => {
      if (where.id === 'shift-1') return shift1 as unknown as Shift
      if (where.id === 'shift-2') return shift2 as unknown as Shift
      return null
    })

    const otherRequesterShifts = [
      { id: 'shift-other', userId: 'req-1', date: new Date('2026-06-01'), code: 'night' as ShiftCode },
    ]

    vi.mocked(prisma.shift.findMany).mockImplementation(async ({ where }) => {
      if (where?.userId === 'req-1') {
        return otherRequesterShifts as unknown as Shift[]
      }
      return []
    })

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

    vi.mocked(prisma.shift.findUnique).mockImplementation(async ({ where }) => {
      if (where.id === 'shift-1') return shift1 as unknown as Shift
      if (where.id === 'shift-2') return shift2 as unknown as Shift
      return null
    })

    const otherTargetShifts = [
      { id: 'shift-target-other', userId: 'target-1', date: new Date('2026-06-01'), code: 'night' as ShiftCode },
    ]

    vi.mocked(prisma.shift.findMany).mockImplementation(async ({ where }) => {
      if (where?.userId === 'target-1') {
        return otherTargetShifts as unknown as Shift[]
      }
      return []
    })

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

    vi.mocked(prisma.shift.findUnique).mockImplementation(async ({ where }) => {
      if (where.id === 'shift-1') return shift1 as unknown as Shift
      if (where.id === 'shift-2') return shift2 as unknown as Shift
      return null
    })

    const otherRequesterShifts = [
      { id: 's1', userId: 'req-1', date: new Date('2026-06-02'), code: 'morning' as ShiftCode },
      { id: 's2', userId: 'req-1', date: new Date('2026-06-03'), code: 'morning' as ShiftCode },
      { id: 's3', userId: 'req-1', date: new Date('2026-06-04'), code: 'morning' as ShiftCode },
      { id: 's4', userId: 'req-1', date: new Date('2026-06-05'), code: 'morning' as ShiftCode },
      { id: 's5', userId: 'req-1', date: new Date('2026-06-06'), code: 'morning' as ShiftCode },
    ]

    vi.mocked(prisma.shift.findMany).mockImplementation(async ({ where }) => {
      if (where?.userId === 'req-1') {
        return otherRequesterShifts as unknown as Shift[]
      }
      return []
    })

    const violations = await validateSwapRules('req-1', 'target-1', 'shift-1', 'shift-2')
    expect(violations).toContainEqual(
      expect.objectContaining({
        rule: 'max_consecutive',
        message: expect.stringContaining('بیش از ۶ شیفت متوالی مجاز نیست'),
      })
    )
  })
})
