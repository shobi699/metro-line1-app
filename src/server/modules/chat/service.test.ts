import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendMessage, pinMessage } from './service'
import { prisma } from '@/server/db'
import { publishMessage } from '@/server/realtime/bus'

vi.mock('@/server/db', () => ({
  prisma: {
    chatMember: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    chatRoom: {
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
      update: vi.fn(),
    },
    setting: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}))

vi.mock('@/server/realtime/bus', () => ({
  publishMessage: vi.fn(),
}))

describe('chat service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects messaging when the user is not a room member', async () => {
    vi.mocked(prisma.chatMember.findUnique).mockResolvedValue(null)

    await expect(
      sendMessage('room-1', 'user-1', { body: 'سلام' }),
    ).rejects.toThrow('شما عضو این روم نیستید')
    expect(publishMessage).not.toHaveBeenCalled()
  })

  it('persists a message and publishes it to the realtime bus', async () => {
    vi.mocked(prisma.chatMember.findUnique).mockResolvedValue({
      id: 'm1',
      roomId: 'room-1',
      userId: 'user-1',
      isAdmin: false,
      lastReadAt: null,
      joinedAt: new Date(),
    })

    const created = {
      id: 'msg-1',
      roomId: 'room-1',
      senderId: 'user-1',
      body: 'سلام',
      attachmentUrl: null,
      attachmentType: null,
      pinned: false,
      priority: 'normal',
      tags: null,
      readReceipts: null,
      createdAt: new Date('2026-06-23T10:00:00Z'),
      sender: { name: 'علی راهبر' },
    }
    vi.mocked(prisma.message.create).mockResolvedValue(created as never)

    const view = await sendMessage('room-1', 'user-1', { body: 'سلام', priority: 'normal' })

    expect(view.senderName).toBe('علی راهبر')
    expect(view.body).toBe('سلام')
    expect(publishMessage).toHaveBeenCalledOnce()
    expect(vi.mocked(publishMessage).mock.calls[0][0].roomId).toBe('room-1')
  })

  it('blocks non-admin members from pinning messages', async () => {
    vi.mocked(prisma.chatMember.findUnique).mockResolvedValue({
      id: 'm1',
      roomId: 'room-1',
      userId: 'user-1',
      isAdmin: false,
      lastReadAt: null,
      joinedAt: new Date(),
    })

    await expect(
      pinMessage('room-1', 'msg-1', 'user-1', true),
    ).rejects.toThrow('فقط مدیر روم می‌تواند پیام پین کند')
    expect(prisma.message.update).not.toHaveBeenCalled()
  })

  // ── تست‌های جدید رسید قانونی و ممیزی — بخش ۵.۲ سند tosee.md
  it('records a legal read-receipt for a message', async () => {
    const { acknowledgeMessage } = await import('./service')

    vi.mocked(prisma.message.findUnique).mockResolvedValue({
      id: 'msg-1',
      roomId: 'room-1',
      readReceipts: null,
    } as any)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-2',
      name: 'محمدرضا مدیر',
    } as any)

    const receipts = await acknowledgeMessage('msg-1', 'user-2', {
      device: 'mobile',
      ipAddress: '192.168.1.100',
      signature: 'TEST-SIGN-123'
    })

    expect(receipts).toHaveLength(1)
    expect(receipts[0]).toEqual(
      expect.objectContaining({
        userId: 'user-2',
        userName: 'محمدرضا مدیر',
        device: 'mobile',
        ipAddress: '192.168.1.100',
        signature: 'TEST-SIGN-123',
      })
    )
    expect(prisma.message.update).toHaveBeenCalledOnce()
  })
})
