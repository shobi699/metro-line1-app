import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateSlaDueTime, detectRecurrence } from './service'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    faultReport: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/server/modules/settings/service', () => ({
  getSettingValue: vi.fn((key, fallback) => Promise.resolve(fallback)),
}))

describe('Fault Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateSlaDueTime', () => {
    it('calculates review SLA correctly', async () => {
      const now = new Date('2026-07-05T12:00:00.000Z')
      // default critical review SLA is 1 hour
      const result = await calculateSlaDueTime('review', 'critical', now)
      expect(result.getTime()).toBe(now.getTime() + 1 * 60 * 60 * 1000)
    })

    it('calculates repair SLA correctly', async () => {
      const now = new Date('2026-07-05T12:00:00.000Z')
      // default medium repair SLA is 72 hours
      const result = await calculateSlaDueTime('repair', 'medium', now)
      expect(result.getTime()).toBe(now.getTime() + 72 * 60 * 60 * 1000)
    })
  })

  describe('detectRecurrence', () => {
    it('returns null and 0 count if no past reports exist', async () => {
      vi.mocked(prisma.faultReport.findMany).mockResolvedValue([])

      const now = new Date('2026-07-05T12:00:00.000Z')
      const result = await detectRecurrence('train-1', 'code-1', now)

      expect(result.recurrenceOfId).toBeNull()
      expect(result.count).toBe(0)
    })

    it('identifies recurrence and counts history', async () => {
      const pastReports = [
        { id: 'rep-prev', occurredAt: new Date('2026-07-01T10:00:00.000Z') }
      ]
      vi.mocked(prisma.faultReport.findMany).mockResolvedValue(pastReports as any)

      const now = new Date('2026-07-05T12:00:00.000Z')
      const result = await detectRecurrence('train-1', 'code-1', now)

      expect(result.recurrenceOfId).toBe('rep-prev')
      expect(result.count).toBe(1)
    })
  })
})
