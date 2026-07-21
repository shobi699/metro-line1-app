import { prisma } from '@/server/db'

export const awardPoints = async (userId: string, points: number, reason: string) => {
  // We use current month as period e.g. "2026-07"
  const now = new Date()
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  try {
    // Attempt to insert. We rely on the unique constraint [userId, period, reason]
    // If it fails because of unique constraint, it means points were already awarded for this reason in this period.
    return await prisma.gamificationScore.create({
      data: {
        userId,
        points,
        reason,
        period,
      }
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      // Already awarded
      return null
    }
    throw err
  }
}

export const getLeaderboard = async (period?: string) => {
  // Aggregate points by userId
  const where = period ? { period } : {}

  const scores = await prisma.gamificationScore.groupBy({
    by: ['userId'],
    where,
    _sum: {
      points: true
    },
    orderBy: {
      _sum: {
        points: 'desc'
      }
    },
    take: 100 // Top 100
  })

  // We need to fetch user details for these scores
  const userIds = scores.map(s => s.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true }
  })

  const usersMap = users.reduce((acc, u) => {
    acc[u.id] = u
    return acc
  }, {} as Record<string, any>)

  return scores.map((s, index) => ({
    rank: index + 1,
    userId: s.userId,
    user: usersMap[s.userId],
    points: s._sum.points || 0
  }))
}
