import { prisma } from '@/server/db'
import type { CreateBulletinInput } from '@/lib/zod/safety'

export async function createBulletin(data: CreateBulletinInput, actorId: string) {
  const bulletin = await prisma.safetyBulletin.create({
    data: {
      title: data.title,
      body: data.body,
      active: data.active,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId,
      entity: 'SafetyBulletin',
      entityId: bulletin.id,
      action: 'create',
      after: { title: data.title, body: data.body, active: data.active },
    },
  })

  return bulletin
}

export async function getPendingBulletins(userId: string) {
  // Get active bulletins not yet acknowledged by user
  const allActive = await prisma.safetyBulletin.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  })

  const acknowledged = await prisma.readReceipt.findMany({
    where: { userId },
    select: { safetyBulletinId: true },
  })

  const ackSet = new Set(acknowledged.map((r) => r.safetyBulletinId))

  return allActive.filter((b) => !ackSet.has(b.id))
}

export async function acknowledgeBulletin(
  bulletinId: string,
  userId: string,
  userAgent: string | null,
) {
  // Check bulletin exists
  const bulletin = await prisma.safetyBulletin.findUnique({
    where: { id: bulletinId },
  })
  if (!bulletin) throw new Error('بخشنامه یافت نشد')

  // Check not already acknowledged
  const existing = await prisma.readReceipt.findUnique({
    where: {
      userId_safetyBulletinId: {
        userId,
        safetyBulletinId: bulletinId,
      },
    },
  })
  if (existing) return existing

  // Create immutable receipt
  const receipt = await prisma.readReceipt.create({
    data: {
      userId,
      safetyBulletinId: bulletinId,
      readAt: new Date(),
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: userId,
      entity: 'ReadReceipt',
      entityId: receipt.id,
      action: 'create',
      after: {
        safetyBulletinId: bulletinId,
        readAt: receipt.readAt,
        userAgent,
      },
    },
  })

  return receipt
}

export async function getBulletinReceipts(bulletinId: string) {
  const bulletin = await prisma.safetyBulletin.findUnique({
    where: { id: bulletinId },
  })
  if (!bulletin) throw new Error('بخشنامه یافت نشد')

  const [receipts, totalUsers] = await Promise.all([
    prisma.readReceipt.findMany({
      where: { safetyBulletinId: bulletinId },
      include: {
        user: { select: { id: true, name: true, nationalId: true } },
      },
      orderBy: { readAt: 'asc' },
    }),
    prisma.user.count({ where: { status: 'active' } }),
  ])

  return {
    bulletin,
    receipts,
    totalUsers,
    acknowledgedCount: receipts.length,
    percentage:
      totalUsers > 0
        ? Math.round((receipts.length / totalUsers) * 100)
        : 0,
  }
}

export async function getAllBulletins() {
  return prisma.safetyBulletin.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { readReceipts: true } },
    },
  })
}
