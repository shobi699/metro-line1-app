import { prisma } from '@/server/db'

export interface RadioChannelData {
  id: string
  key: string
  label: string
  code: string | null
  color: string | null
  isActive: boolean
}

export interface RadioLogData {
  id: string
  channelId: string
  senderId: string | null
  senderName: string
  message: string
  kind: string
  createdAt: Date
}

export interface RadioPhraseData {
  id: string
  roleKey: string | null
  label: string
  text: string
  sortOrder: number
}

/**
 * Get all active radio channels
 */
export async function getRadioChannels(): Promise<RadioChannelData[]> {
  return prisma.radioChannel.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * Get recent transmission logs for a channel
 */
export async function getRadioLogs(
  channelId: string,
  limit = 50
): Promise<RadioLogData[]> {
  return prisma.radioLog.findMany({
    where: { channelId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Create a new radio transmission log (broadcast)
 */
export async function logTransmission(data: {
  channelId: string
  senderId?: string
  senderName: string
  message: string
  kind?: 'VOICE_NOTE' | 'TEXT' | 'SYSTEM' | 'EMERGENCY'
}): Promise<RadioLogData> {
  const log = await prisma.radioLog.create({
    data: {
      channelId: data.channelId,
      senderId: data.senderId || null,
      senderName: data.senderName,
      message: data.message,
      kind: data.kind || 'VOICE_NOTE',
    },
  })

  // Write an audit log for emergency transmissions
  if (data.kind === 'EMERGENCY') {
    let actorId = data.senderId
    if (!actorId) {
      const systemUser = await prisma.user.findFirst({ select: { id: true } })
      actorId = systemUser?.id || 'system'
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        entity: 'RadioChannel',
        entityId: data.channelId,
        action: 'create',
        metadata: {
          event: 'radio:emergency_broadcast',
          message: data.message,
        },
      },
    })
  }

  return log
}

/**
 * Get standard radio phrases for a specific role or general phrases
 */
export async function getRadioPhrases(roleKey?: string): Promise<RadioPhraseData[]> {
  return prisma.radioPhrase.findMany({
    where: {
      isActive: true,
      OR: [
        { roleKey: null },
        roleKey ? { roleKey } : {},
      ],
    },
    orderBy: { sortOrder: 'asc' },
  })
}
