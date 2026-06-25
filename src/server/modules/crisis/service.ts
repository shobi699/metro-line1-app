import { prisma } from '@/server/db'

export interface CrisisEventData {
  id: string
  title: string
  description: string | null
  level: string
  stationId: string | null
  activatedAt: Date
  resolvedAt: Date | null
  activator?: { name: string }
}

export async function activateCrisis(data: {
  title: string
  description?: string
  level: string
  stationId?: string
  activatedBy: string
}): Promise<CrisisEventData> {
  return prisma.crisisEvent.create({
    data: {
      title: data.title,
      description: data.description,
      level: data.level as 'normal' | 'elevated' | 'high' | 'critical',
      stationId: data.stationId,
      activatedBy: data.activatedBy,
    },
    include: { activator: { select: { name: true } } },
  })
}

export async function resolveCrisis(crisisId: string): Promise<void> {
  await prisma.crisisEvent.update({
    where: { id: crisisId },
    data: { resolvedAt: new Date() },
  })
}

export async function getActiveCrisis(): Promise<CrisisEventData | null> {
  return prisma.crisisEvent.findFirst({
    where: { resolvedAt: null },
    include: { activator: { select: { name: true } } },
    orderBy: { activatedAt: 'desc' },
  })
}

export async function getCrisisHistory(limit?: number): Promise<CrisisEventData[]> {
  return prisma.crisisEvent.findMany({
    include: { activator: { select: { name: true } } },
    orderBy: { activatedAt: 'desc' },
    take: limit ?? 20,
  })
}
