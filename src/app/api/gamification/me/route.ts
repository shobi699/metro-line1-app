import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { authenticate } from '@/server/auth'

export async function GET(req: NextRequest) {
  try {
    const { user } = await authenticate(req)
    if (!user) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') ?? new Date().toISOString().slice(0, 7)

    const scores = await prisma.gamificationScore.findMany({
      where: { userId: user.id, period }
    })

    const totalPoints = scores.reduce((sum, s) => sum + s.points, 0)

    return NextResponse.json({ data: { totalPoints, scores } })
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 })
  }
}

