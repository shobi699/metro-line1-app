import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getMeetingTypes,
  getMeetingRooms,
  getAvailableSlots,
  createMeetingRequest,
  cancelMeeting,
  rescheduleMeetingRequest,
  saveMeetingOutcome,
  isUserBannedFromBooking,
  checkForMeetingShiftConflicts,
  isHostAvailable
} from './service'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    meetingType: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    meetingRoom: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    meetingRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    availabilityRule: {
      findMany: vi.fn(),
    },
    availabilityException: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
    shift: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/server/modules/settings/service', () => ({
  getSettingValue: vi.fn((key, fallback) => Promise.resolve(fallback)),
}))

vi.mock('@/server/modules/notifications/gateway', () => ({
  notifyEvent: vi.fn(() => Promise.resolve()),
}))

describe('meetings service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-10T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getMeetingTypes & getMeetingRooms', () => {
    it('gets active meeting types', async () => {
      const mockTypes = [{ id: 'mt-1', key: 'technical', title: 'Technical' }]
      vi.mocked(prisma.meetingType.findMany).mockResolvedValue(mockTypes as any)

      const result = await getMeetingTypes()
      expect(result).toHaveLength(1)
      expect(prisma.meetingType.findMany).toHaveBeenCalledOnce()
    })

    it('gets active meeting rooms', async () => {
      const mockRooms = [{ id: 'mr-1', name: 'Depot Room' }]
      vi.mocked(prisma.meetingRoom.findMany).mockResolvedValue(mockRooms as any)

      const result = await getMeetingRooms()
      expect(result).toHaveLength(1)
      expect(prisma.meetingRoom.findMany).toHaveBeenCalledOnce()
    })
  })

  describe('isUserBannedFromBooking', () => {
    it('returns banned false if no late cancellations exist', async () => {
      vi.mocked(prisma.meetingRequest.findMany).mockResolvedValue([])
      const res = await isUserBannedFromBooking('user-1')
      expect(res.banned).toBe(false)
    })

    it('returns banned true if late cancellations exceed limit', async () => {
      const now = new Date()
      const scheduledAt = new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now

      vi.mocked(prisma.meetingRequest.findMany).mockResolvedValue([
        {
          id: 'meet-1',
          requesterId: 'user-1',
          cancelReason: 'late',
          scheduledAt: scheduledAt,
          updatedAt: now,
        },
        {
          id: 'meet-2',
          requesterId: 'user-1',
          cancelReason: 'late',
          scheduledAt: scheduledAt,
          updatedAt: now,
        },
        {
          id: 'meet-3',
          requesterId: 'user-1',
          cancelReason: 'late',
          scheduledAt: scheduledAt,
          updatedAt: now,
        },
      ] as any)

      const res = await isUserBannedFromBooking('user-1')
      expect(res.banned).toBe(true)
      expect(res.reason).toContain('محرومیت')
    })
  })

  describe('isHostAvailable', () => {
    it('returns available true if host matches rule and has no conflicts', async () => {
      vi.mocked(prisma.meetingType.findUnique).mockResolvedValue({
        id: 'mt-1',
        key: 'tech',
        durationMin: 30,
        bufferMin: 0,
      } as any)

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

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'manager-1',
        role: { key: 'manager' },
      } as any)

      vi.mocked(prisma.availabilityException.findMany).mockResolvedValue([])
      vi.mocked(prisma.shift.findMany).mockResolvedValue([])
      vi.mocked(prisma.meetingRequest.findMany).mockResolvedValue([])

      const scheduledAt = new Date('2026-07-11') // Saturday
      scheduledAt.setHours(9, 15, 0, 0)

      const res = await isHostAvailable('manager-1', scheduledAt, 30, 'tech')
      expect(res.available).toBe(true)
    })

    it('returns available false if outside availability rules', async () => {
      vi.mocked(prisma.meetingType.findUnique).mockResolvedValue({
        id: 'mt-1',
        key: 'tech',
        durationMin: 30,
        bufferMin: 0,
      } as any)

      vi.mocked(prisma.availabilityRule.findMany).mockResolvedValue([])
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'manager-1',
        role: { key: 'manager' },
      } as any)

      const scheduledAt = new Date('2026-07-11')
      scheduledAt.setHours(11, 0, 0, 0)

      const res = await isHostAvailable('manager-1', scheduledAt, 30, 'tech')
      expect(res.available).toBe(false)
      expect(res.reason).toBe('خارج از ساعت حضور')
    })
  })

  describe('getAvailableSlots', () => {
    it('calculates available slots based on rules and meetings', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'manager-1',
        role: { key: 'manager' },
      } as any)

      vi.mocked(prisma.meetingType.findUnique).mockResolvedValue({
        id: 'mt-1',
        key: 'tech',
        durationMin: 30,
        bufferMin: 0,
      } as any)

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

      vi.mocked(prisma.availabilityException.findMany).mockResolvedValue([])
      vi.mocked(prisma.shift.findMany).mockResolvedValue([])

      const mockMeetDate = new Date('2026-07-11')
      mockMeetDate.setHours(9, 30, 0, 0)

      vi.mocked(prisma.meetingRequest.findMany).mockResolvedValue([
        {
          scheduledAt: mockMeetDate,
          durationMinutes: 30,
        },
      ] as any)

      const slots = await getAvailableSlots('manager-1', new Date('2026-07-11'), 'tech')

      expect(slots).toHaveLength(2)
      expect(slots[0]).toEqual({ time: '09:00', available: true, reason: undefined, availableHosts: ['manager-1'] })
      expect(slots[1].time).toBe('09:30')
      expect(slots[1].available).toBe(false)
      expect(slots[1].reason).toBe('تداخل با جلسه دیگر')
    })
  })

  describe('createMeetingRequest & cancel & reschedule', () => {
    it('creates a meeting request successfully', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'manager-1',
        role: { key: 'manager' },
      } as any)

      vi.mocked(prisma.meetingType.findUnique).mockResolvedValue({
        id: 'mt-1',
        key: 'tech',
        durationMin: 30,
        bufferMin: 0,
        approval: 'auto',
      } as any)

      vi.mocked(prisma.availabilityRule.findMany).mockResolvedValue([
        {
          id: 'rule-1',
          ownerType: 'user',
          ownerKey: 'manager-1',
          weekday: 0,
          fromTime: '09:00',
          toTime: '10:00',
          isActive: true,
        },
      ] as any)

      vi.mocked(prisma.availabilityException.findMany).mockResolvedValue([])
      vi.mocked(prisma.shift.findMany).mockResolvedValue([])
      vi.mocked(prisma.meetingRequest.findMany).mockResolvedValue([])
      vi.mocked(prisma.meetingRequest.count).mockResolvedValue(0)

      const mockCreatedMeeting = {
        id: 'meet-123',
        title: 'جلسه تست',
        requesterId: 'user-1',
        targetManagerId: 'manager-1',
        scheduledAt: new Date('2026-07-11T09:00:00Z'),
        durationMinutes: 30,
        status: 'approved',
        requester: { name: 'احمدی', id: 'user-1' },
        targetManager: { name: 'کریمی', id: 'manager-1' },
      }
      vi.mocked(prisma.meetingRequest.create).mockResolvedValue(mockCreatedMeeting as any)

      const dateObj = new Date('2026-07-11')
      dateObj.setHours(9, 0, 0, 0)

      const result = await createMeetingRequest({
        requesterId: 'user-1',
        targetManagerId: 'manager-1',
        title: 'جلسه تست',
        scheduledAt: dateObj,
        typeId: 'mt-1',
      })

      expect(result.id).toBe('meet-123')
      expect(result.status).toBe('approved')
      expect(prisma.meetingRequest.create).toHaveBeenCalledOnce()
      expect(prisma.auditLog.create).toHaveBeenCalledOnce()
    })

    it('fails to create meeting request due to room conflict', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'manager-1',
        role: { key: 'manager' },
      } as any)

      vi.mocked(prisma.meetingType.findUnique).mockResolvedValue({
        id: 'mt-1',
        key: 'tech',
        durationMin: 30,
      } as any)

      vi.mocked(prisma.availabilityRule.findMany).mockResolvedValue([
        {
          id: 'rule-1',
          ownerType: 'user',
          ownerKey: 'manager-1',
          weekday: 0,
          fromTime: '09:00',
          toTime: '10:00',
          isActive: true,
        },
      ] as any)

      vi.mocked(prisma.availabilityException.findMany).mockResolvedValue([])
      vi.mocked(prisma.shift.findMany).mockResolvedValue([])
      vi.mocked(prisma.meetingRequest.findMany).mockResolvedValue([])
      vi.mocked(prisma.meetingRequest.count).mockResolvedValue(0)

      // Mock room conflict
      vi.mocked(prisma.meetingRequest.findFirst).mockResolvedValue({ id: 'conflicting-1' } as any)

      const dateObj = new Date('2026-07-11')
      dateObj.setHours(9, 0, 0, 0)

      await expect(
        createMeetingRequest({
          requesterId: 'user-1',
          targetManagerId: 'manager-1',
          title: 'جلسه تست',
          scheduledAt: dateObj,
          typeId: 'mt-1',
          roomId: 'room-1',
        })
      ).rejects.toThrow('اتاق جلسه در این زمان قبلاً رزرو شده است')
    })

    it('cancels meeting request successfully', async () => {
      const mockMeeting = {
        id: 'meet-1',
        title: 'جلسه لغو',
        status: 'pending',
        targetManagerId: 'manager-1',
        requesterId: 'user-1',
      }
      vi.mocked(prisma.meetingRequest.findUnique).mockResolvedValue(mockMeeting as any)
      vi.mocked(prisma.meetingRequest.update).mockResolvedValue(mockMeeting as any)

      await cancelMeeting('meet-1', 'user-1', 'تغییر برنامه کاری')

      expect(prisma.meetingRequest.update).toHaveBeenCalledOnce()
      expect(prisma.auditLog.create).toHaveBeenCalledOnce()
    })

    it('saves meeting outcome successfully', async () => {
      await saveMeetingOutcome('meet-1', 'تصمیمات فنی اتخاذ گردید.')
      expect(prisma.meetingRequest.update).toHaveBeenCalledOnce()
    })
  })
})
