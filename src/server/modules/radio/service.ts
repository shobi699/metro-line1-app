import { prisma } from '@/server/db'

export interface RadioChannelData {
  id: string
  key: string
  label: string
  code: string | null
  color: string | null
  isActive: boolean
  sortOrder?: number
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
export async function getRadioChannels(includeInactive = false): Promise<RadioChannelData[]> {
  return prisma.radioChannel.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
}

/**
 * Admin: Create/Update Radio Channel
 */
export async function saveRadioChannel(data: any) {
  if (data.id) {
    return prisma.radioChannel.update({
      where: { id: data.id },
      data: {
        key: data.key,
        label: data.label,
        code: data.code,
        color: data.color,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      }
    })
  } else {
    return prisma.radioChannel.create({
      data: {
        key: data.key,
        label: data.label,
        code: data.code,
        color: data.color,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      }
    })
  }
}

export async function deleteRadioChannel(id: string) {
  return prisma.radioChannel.delete({ where: { id } })
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

/**
 * Admin: Get all phrases
 */
export async function getAllRadioPhrases() {
  return prisma.radioPhrase.findMany({
    orderBy: { sortOrder: 'asc' }
  })
}

/**
 * Admin: Save phrase
 */
export async function saveRadioPhrase(data: any) {
  if (data.id) {
    return prisma.radioPhrase.update({
      where: { id: data.id },
      data: {
        roleKey: data.roleKey || null,
        label: data.label,
        text: data.text,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      }
    })
  } else {
    return prisma.radioPhrase.create({
      data: {
        roleKey: data.roleKey || null,
        label: data.label,
        text: data.text,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      }
    })
  }
}

export async function deleteRadioPhrase(id: string) {
  return prisma.radioPhrase.delete({ where: { id } })
}

/**
 * Admin: Analytics and Reports
 */
export async function getRadioAnalytics(options?: { fromDate?: Date, toDate?: Date }) {
  const where: any = {}
  if (options?.fromDate || options?.toDate) {
    where.createdAt = {}
    if (options.fromDate) where.createdAt.gte = options.fromDate
    if (options.toDate) where.createdAt.lte = options.toDate
  }

  const [totalCount, emergencyCount, voiceCount, logs] = await Promise.all([
    prisma.radioLog.count({ where }),
    prisma.radioLog.count({ where: { ...where, kind: 'EMERGENCY' } }),
    prisma.radioLog.count({ where: { ...where, kind: 'VOICE_NOTE' } }),
    prisma.radioLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: { channel: { select: { label: true } } }
    })
  ])

  return {
    totalCount,
    emergencyCount,
    voiceCount,
    textCount: totalCount - voiceCount - emergencyCount, // Roughly
    logs,
  }
}
