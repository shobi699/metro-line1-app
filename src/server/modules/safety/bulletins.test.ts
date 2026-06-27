import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBulletin, getPendingBulletins, acknowledgeBulletin, getBulletinReceipts } from './bulletins'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    safetyBulletin: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    readReceipt: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
  },
}))

describe('createBulletin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a bulletin and logs audit', async () => {
    const mockBulletin = { id: 'b1', title: 'ایمنی', body: 'متن', active: true, createdAt: new Date() }
    vi.mocked(prisma.safetyBulletin.create).mockResolvedValue(mockBulletin as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const result = await createBulletin({ title: 'ایمنی', body: 'متن', active: true }, 'actor-1')

    expect(result.id).toBe('b1')
    expect(prisma.safetyBulletin.create).toHaveBeenCalledWith({
      data: { title: 'ایمنی', body: 'متن', active: true },
    })
    expect(prisma.auditLog.create).toHaveBeenCalled()
  })
})

describe('getPendingBulletins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns active bulletins not yet acknowledged', async () => {
    const bulletins = [
      { id: 'b1', title: 'بخشنامه ۱', active: true },
      { id: 'b2', title: 'بخشنامه ۲', active: true },
    ]
    const receipts = [{ safetyBulletinId: 'b1' }]

    vi.mocked(prisma.safetyBulletin.findMany).mockResolvedValue(bulletins as any)
    vi.mocked(prisma.readReceipt.findMany).mockResolvedValue(receipts as any)

    const result = await getPendingBulletins('user-1')

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('b2')
  })

  it('returns all bulletins when none acknowledged', async () => {
    const bulletins = [{ id: 'b1', title: 'بخشنامه ۱', active: true }]
    vi.mocked(prisma.safetyBulletin.findMany).mockResolvedValue(bulletins as any)
    vi.mocked(prisma.readReceipt.findMany).mockResolvedValue([])

    const result = await getPendingBulletins('user-1')

    expect(result).toHaveLength(1)
  })
})

describe('acknowledgeBulletin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates receipt for new acknowledgment', async () => {
    const bulletin = { id: 'b1', title: 'ایمنی' }
    const receipt = { id: 'r1', userId: 'user-1', safetyBulletinId: 'b1', readAt: new Date() }

    vi.mocked(prisma.safetyBulletin.findUnique).mockResolvedValue(bulletin as any)
    vi.mocked(prisma.readReceipt.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.readReceipt.create).mockResolvedValue(receipt as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const result = await acknowledgeBulletin('b1', 'user-1', 'Mozilla/5.0')

    expect(result.id).toBe('r1')
    expect(prisma.readReceipt.create).toHaveBeenCalled()
  })

  it('returns existing receipt if already acknowledged', async () => {
    const bulletin = { id: 'b1', title: 'ایمنی' }
    const existingReceipt = { id: 'r1', userId: 'user-1', safetyBulletinId: 'b1' }

    vi.mocked(prisma.safetyBulletin.findUnique).mockResolvedValue(bulletin as any)
    vi.mocked(prisma.readReceipt.findUnique).mockResolvedValue(existingReceipt as any)

    const result = await acknowledgeBulletin('b1', 'user-1', null)

    expect(result.id).toBe('r1')
    expect(prisma.readReceipt.create).not.toHaveBeenCalled()
  })

  it('throws if bulletin not found', async () => {
    vi.mocked(prisma.safetyBulletin.findUnique).mockResolvedValue(null)

    await expect(acknowledgeBulletin('nonexistent', 'user-1', null)).rejects.toThrow('بخشنامه یافت نشد')
  })
})

describe('getBulletinReceipts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns receipt stats with percentage', async () => {
    const bulletin = { id: 'b1', title: 'ایمنی' }
    const receipts = [
      { id: 'r1', user: { id: 'u1', name: 'علی', nationalId: '111' } },
      { id: 'r2', user: { id: 'u2', name: 'محمد', nationalId: '222' } },
    ]

    vi.mocked(prisma.safetyBulletin.findUnique).mockResolvedValue(bulletin as any)
    vi.mocked(prisma.readReceipt.findMany).mockResolvedValue(receipts as any)
    vi.mocked(prisma.user.count).mockResolvedValue(10)

    const result = await getBulletinReceipts('b1')

    expect(result.totalUsers).toBe(10)
    expect(result.acknowledgedCount).toBe(2)
    expect(result.percentage).toBe(20)
  })

  it('throws if bulletin not found', async () => {
    vi.mocked(prisma.safetyBulletin.findUnique).mockResolvedValue(null)

    await expect(getBulletinReceipts('nonexistent')).rejects.toThrow('بخشنامه یافت نشد')
  })
})
