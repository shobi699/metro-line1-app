import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMeetingTypes, getMeetingRooms, getAvailableSlots } from './service'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    meetingType: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    meetingRoom: {
      findMany: vi.fn(),
    },
    meetingRequest: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    availabilityRule: {
      findMany: vi.fn(),
    },
    availabilityException: {
      findMany: vi.fn(),
    },
  },
}))

describe('meetings service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets meeting types', async () => {
    const mockTypes = [{ id: 'mt-1', key: 'technical', title: 'Technical' }]
    vi.mocked(prisma.meetingType.findMany).mockResolvedValue(mockTypes as any)

    const result = await getMeetingTypes()
    expect(result).toHaveLength(1)
    expect(prisma.meetingType.findMany).toHaveBeenCalledOnce()
  })

  it('gets meeting rooms', async () => {
    const mockRooms = [{ id: 'mr-1', name: 'Depot Room' }]
    vi.mocked(prisma.meetingRoom.findMany).mockResolvedValue(mockRooms as any)

    const result = await getMeetingRooms()
    expect(result).toHaveLength(1)
    expect(prisma.meetingRoom.findMany).toHaveBeenCalledOnce()
  })

  it('calculates available slots based on rules and meetings', async () => {
    // Mock meeting type
    vi.mocked(prisma.meetingType.findUnique).mockResolvedValue({
      id: 'mt-1',
      key: 'tech',
      durationMin: 30,
      bufferMin: 0,
    } as any)

    // Mock availability rules: Sat 09:00 - 10:00 (which is JS weekday 6, map to 0 in RTL)
    vi.mocked(prisma.availabilityRule.findMany).mockResolvedValue([
      {
        id: 'rule-1',
        ownerType: 'user',
        ownerKey: 'manager-1',
        weekday: 0, // Saturday in RTL
        fromTime: '09:00',
        toTime: '10:00',
        isActive: true,
      },
    ] as any)

    // No exceptions
    vi.mocked(prisma.availabilityException.findMany).mockResolvedValue([])

    // Existing meeting: Sat 09:30 - 10:00
    const mockMeetDate = new Date('2026-07-11')
    mockMeetDate.setHours(9, 30, 0, 0)

    vi.mocked(prisma.meetingRequest.findMany).mockResolvedValue([
      {
        scheduledAt: mockMeetDate, // Saturday
        durationMinutes: 30,
      },
    ] as any)

    const slots = await getAvailableSlots('manager-1', new Date('2026-07-11'), 'tech')

    // Since availability is 09:00-10:00, with 30min slots:
    // Slot 1: 09:00 (available)
    // Slot 2: 09:30 (should be blocked due to the overlap with existing meeting)
    expect(slots).toHaveLength(2)
    expect(slots[0]).toEqual({ time: '09:00', available: true, reason: undefined })
    expect(slots[1].time).toBe('09:30')
    expect(slots[1].available).toBe(false)
  })
})
