import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateRoster } from './service'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
    rosterVersion: {
      findUnique: vi.fn(),
    },
    setting: {
      findUnique: vi.fn(),
    },
    rosterValidationRule: {
      findMany: vi.fn(() => Promise.resolve([])),
    },
  },
}))

vi.mock('@/server/modules/settings', () => ({
  getSettingValue: vi.fn((key, fallback) => Promise.resolve(fallback)),
}))

describe('roster validation engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('detects invalid template structure (0 trips)', async () => {
    const issues = await validateRoster([], [])
    expect(issues).toHaveLength(1)
    expect(issues[0]).toEqual(
      expect.objectContaining({
        severity: 'CRITICAL',
        type: 'invalid_template',
        message: expect.stringContaining('هیچ سفری استخراج نگردید'),
      })
    )
  })

  it('validates personnel code format (national ID length check)', async () => {
    // Mock active users in DB. user-1 has valid 10-digit, user-2 has invalid personnelCode.
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'user-1', name: 'علی شفیعی', personnelCode: '1234567890', role: { key: 'operator' } },
      { id: 'user-2', name: 'محمود احمدی', personnelCode: '98765', role: { key: 'operator' } },
    ] as any)

    const trips = [
      { tempId: 'trip-1', rowNo: 1, direction: 'TAJRISH_TO_SHAHRREY', departureTime: '06:00', arrivalTime: '07:15' },
    ]
    const assignments = [
      { tripTempId: 'trip-1', role: 'H1', rawName: 'محمود احمدی', matchedUserId: 'user-2' },
    ]

    const issues = await validateRoster(trips, assignments)
    const personnelIssue = issues.find(i => i.type === 'invalid_personnel_no')
    expect(personnelIssue).toBeDefined()
    expect(personnelIssue?.severity).toBe('ERROR')
  })

  it('identifies active operators with no assigned shifts (idle drivers)', async () => {
    // Mock user-1 (active operator assigned) and user-2 (active operator idle)
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'user-1', name: 'علی شفیعی', personnelCode: '1234567890', role: { key: 'operator' } },
      { id: 'user-2', name: 'محمود احمدی', personnelCode: '1029384756', role: { key: 'operator' } },
    ] as any)

    const trips = [
      { tempId: 'trip-1', rowNo: 1, direction: 'TAJRISH_TO_SHAHRREY', departureTime: '06:00', arrivalTime: '07:15' },
    ]
    const assignments = [
      { tripTempId: 'trip-1', role: 'H1', rawName: 'علی شفیعی', matchedUserId: 'user-1' },
    ]

    const issues = await validateRoster(trips, assignments)
    const idleIssue = issues.find(i => i.type === 'idle_driver')
    expect(idleIssue).toBeDefined()
    expect(idleIssue?.severity).toBe('INFO')
    expect(idleIssue?.message).toContain('محمود احمدی')
  })
})
