import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRadioChannels, getRadioLogs, logTransmission, getRadioPhrases } from './service'
import { prisma } from '@/server/db'

vi.mock('@/server/db', () => ({
  prisma: {
    radioChannel: {
      findMany: vi.fn(),
    },
    radioLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    radioPhrase: {
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

describe('radio service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retrieves active radio channels', async () => {
    const mockChannels = [
      { id: 'ch-1', key: 'ch1', label: 'Channel 1', code: '440', color: 'red', isActive: true },
    ]
    vi.mocked(prisma.radioChannel.findMany).mockResolvedValue(mockChannels as any)

    const result = await getRadioChannels()
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('ch1')
    expect(prisma.radioChannel.findMany).toHaveBeenCalledOnce()
  })

  it('logs a radio transmission', async () => {
    const mockLog = {
      id: 'log-1',
      channelId: 'ch-1',
      senderId: 'user-1',
      senderName: 'Driver 1',
      message: 'Test Message',
      kind: 'VOICE_NOTE',
      createdAt: new Date(),
    }
    vi.mocked(prisma.radioLog.create).mockResolvedValue(mockLog as any)

    const result = await logTransmission({
      channelId: 'ch-1',
      senderId: 'user-1',
      senderName: 'Driver 1',
      message: 'Test Message',
    })

    expect(result.id).toBe('log-1')
    expect(prisma.radioLog.create).toHaveBeenCalledOnce()
    expect(prisma.auditLog.create).not.toHaveBeenCalled()
  })

  it('creates audit log for emergency radio transmission', async () => {
    const mockLog = {
      id: 'log-emergency',
      channelId: 'ch-1',
      senderId: 'user-1',
      senderName: 'Driver 1',
      message: 'Emergency!',
      kind: 'EMERGENCY',
      createdAt: new Date(),
    }
    vi.mocked(prisma.radioLog.create).mockResolvedValue(mockLog as any)

    await logTransmission({
      channelId: 'ch-1',
      senderId: 'user-1',
      senderName: 'Driver 1',
      message: 'Emergency!',
      kind: 'EMERGENCY',
    })

    expect(prisma.radioLog.create).toHaveBeenCalledOnce()
    expect(prisma.auditLog.create).toHaveBeenCalledOnce()
  })
})
