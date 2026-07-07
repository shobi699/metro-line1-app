import { NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { getSessionUser, requireRole, authErrorResponse } from '@/server/rbac/guard'
import dayjs from 'dayjs'

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request)
  if ('error' in sessionUser) return authErrorResponse(sessionUser)

  const roleErr = requireRole(sessionUser, 'admin')
  if (roleErr) return authErrorResponse(roleErr)

  try {
    const startOfMonth = dayjs().startOf('month').toDate()
    const startOfToday = dayjs().startOf('day').toDate()

    // 1. Fetch monthly interactions
    const monthInteractions = await prisma.aiInteraction.findMany({
      where: { createdAt: { gte: startOfMonth } }
    })

    // 2. Fetch today's interactions
    const todayInteractions = monthInteractions.filter(
      (i) => i.createdAt >= startOfToday
    )

    // Cost calculations
    const todayTokens = todayInteractions.reduce((sum, i) => sum + i.tokensIn + i.tokensOut, 0)
    const todayCost = todayInteractions.reduce((sum, i) => sum + i.costEst, 0)
    const monthTokens = monthInteractions.reduce((sum, i) => sum + i.tokensIn + i.tokensOut, 0)
    const monthCost = monthInteractions.reduce((sum, i) => sum + i.costEst, 0)

    // Layer distributions
    const layers = ['L0', 'L1', 'L2', 'L3', 'L4']
    const layerCounts = layers.reduce((acc, l) => {
      acc[l] = monthInteractions.filter((i) => i.layer === l).length
      return acc
    }, {} as Record<string, number>)

    // Latency metrics
    const latencies = monthInteractions.map((i) => i.latencyMs).sort((a, b) => a - b)
    const count = latencies.length

    const p50 = count > 0 ? latencies[Math.floor(count * 0.5)] : 0
    const p95 = count > 0 ? latencies[Math.floor(count * 0.95)] : 0

    // Cache savings (est savings = L0, L1, L2 calls * avg cost of Gemini call, e.g. $0.0015 per call)
    const cacheHitCount = (layerCounts['L0'] || 0) + (layerCounts['L1'] || 0) + (layerCounts['L2'] || 0)
    const estimatedSavings = cacheHitCount * 0.0015

    // Feedback rating count
    // Wait, rating is logged as rating in AiInteraction. Let's see what is inside: 1 for thumbs up, -1 for thumbs down
    // Let's count them
    // Wait, let's see if rating is nullable.
    const monthFeedback = await prisma.aiInteraction.findMany({
      where: {
        createdAt: { gte: startOfMonth },
        rating: { not: null }
      },
      select: { rating: true }
    })
    const thumbsUp = monthFeedback.filter(f => f.rating === 1).length
    const thumbsDown = monthFeedback.filter(f => f.rating === -1).length

    return NextResponse.json({
      data: {
        today: {
          interactionsCount: todayInteractions.length,
          tokens: todayTokens,
          cost: todayCost,
        },
        monthly: {
          interactionsCount: monthInteractions.length,
          tokens: monthTokens,
          cost: monthCost,
        },
        layerDistribution: layerCounts,
        performance: {
          p50,
          p95,
        },
        savings: {
          cacheHits: cacheHitCount,
          amountEst: estimatedSavings,
        },
        feedback: {
          thumbsUp,
          thumbsDown,
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطا در تولید گزارش هوش مصنوعی' }, { status: 500 })
  }
}
