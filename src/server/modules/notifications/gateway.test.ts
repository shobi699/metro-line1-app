import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderTemplate, isInQuietHours, notifyEvent } from './gateway'
import { prisma } from '@/server/db'
import { chatBus } from '@/server/realtime/bus'

vi.mock('@/server/db', () => ({
  prisma: {
    notificationTemplate: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    notificationRule: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    notificationPreference: {
      findUnique: vi.fn(),
    },
    shift: {
      findFirst: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    notificationOutbox: {
      create: vi.fn(),
      update: vi.fn(),
    },
    setting: {
      findUnique: vi.fn(),
    },
    notificationDevice: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/server/realtime/bus', () => ({
  chatBus: {
    emit: vi.fn(),
  },
}))

describe('notification gateway core', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('renderTemplate', () => {
    it('replaces template variables correctly', () => {
      const template = 'کاربر {name} شیفت شما در تاریخ {date} تغییر یافت.'
      const result = renderTemplate(template, { name: 'شایان', date: '۱۴۰۵/۰۴/۱۷' })
      expect(result).toBe('کاربر شایان شیفت شما در تاریخ ۱۴۰۵/۰۴/۱۷ تغییر یافت.')
    })
  })

  describe('isInQuietHours', () => {
    it('returns false if no quiet hours configured', () => {
      expect(isInQuietHours(null, false)).toBe(false)
    })

    it('returns false if user has night shift today', () => {
      expect(isInQuietHours({ from: '22:00', to: '06:00' }, true)).toBe(false)
    })

    it('correctly checks normal hours (e.g. 23:00 to 07:00)', () => {
      // We will mock the Date object to control the current time
      const quiet = { from: '23:00', to: '07:00' }

      // Mock current time as 01:30 AM (quiet hour)
      const mockDate = new Date()
      mockDate.setHours(1, 30, 0, 0)
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)
      expect(isInQuietHours(quiet, false)).toBe(true)

      // Mock current time as 12:00 PM (not quiet hour)
      const mockDateDay = new Date()
      mockDateDay.setHours(12, 0, 0, 0)
      vi.setSystemTime(mockDateDay)
      expect(isInQuietHours(quiet, false)).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('notifyEvent event dispatch', () => {
    it('dispatches simple inapp notification successfully', async () => {
      vi.mocked(prisma.notificationTemplate.findUnique).mockResolvedValue({
        id: 't-1',
        eventKey: 'test.event',
        title: 'اعلان {title}',
        body: 'متن',
        smsText: 'کوتاه',
        link: '/shifts',
        isActive: true,
        updatedBy: 'admin',
        updatedAt: new Date(),
      })

      vi.mocked(prisma.notificationRule.findUnique).mockResolvedValue({
        id: 'r-1',
        eventKey: 'test.event',
        severity: 'normal',
        channels: ['inapp'],
        audience: ['driver'],
        smsIfUnseenMinutes: null,
        respectQuietHours: true,
        isActive: true,
      })

      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: 'user-1', name: 'علی', status: 'active' },
      ] as any)

      vi.mocked(prisma.notificationPreference.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.shift.findFirst).mockResolvedValue(null)

      vi.mocked(prisma.notification.create).mockResolvedValue({
        id: 'n-1',
        userId: 'user-1',
        type: 'info',
        title: 'اعلان تست',
        body: 'متن',
        link: '/shifts',
        createdAt: new Date(),
      } as any)

      await notifyEvent('test.event', null, { title: 'تست' })

      expect(prisma.notification.create).toHaveBeenCalledOnce()
      expect(prisma.notificationOutbox.create).toHaveBeenCalledOnce()
      expect(chatBus.emit).toHaveBeenCalledWith('notification', expect.any(Object))
    })
  })
})
