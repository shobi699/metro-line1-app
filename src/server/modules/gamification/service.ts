import { prisma } from '@/server/db'

export interface GamificationScoreData {
  id: string
  userId: string
  points: number
  reason: string
  period: string
  user?: { name: string }
}

export async function addPoints(data: {
  userId: string
  points: number
  reason: string
  period: string
}): Promise<GamificationScoreData> {
  return prisma.gamificationScore.upsert({
    where: {
      userId_period_reason: {
        userId: data.userId,
        period: data.period,
        reason: data.reason,
      },
    },
    update: { points: { increment: data.points } },
    create: {
      userId: data.userId,
      points: data.points,
      reason: data.reason,
      period: data.period,
    },
  })
}

export async function getUserScore(
  userId: string,
  period?: string,
): Promise<{ totalPoints: number; breakdown: GamificationScoreData[] }> {
  const where: Record<string, unknown> = { userId }
  if (period) where.period = period

  const scores = await prisma.gamificationScore.findMany({
    where,
    orderBy: { points: 'desc' },
  })

  return {
    totalPoints: scores.reduce((sum, s) => sum + s.points, 0),
    breakdown: scores,
  }
}

export async function getLeaderboard(
  period: string,
  limit?: number,
): Promise<Array<{ userId: string; name: string; totalPoints: number }>> {
  const scores = await prisma.gamificationScore.groupBy({
    by: ['userId'],
    where: { period },
    _sum: { points: true },
    orderBy: { _sum: { points: 'desc' } },
    take: limit ?? 10,
  })

  const userIds = scores.map((s) => s.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u.name]))

  return scores.map((s) => ({
    userId: s.userId,
    name: userMap.get(s.userId) ?? '—',
    totalPoints: s._sum.points ?? 0,
  }))
}
