import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/db'
import { verifyAccessToken } from '@/server/auth/jwt'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر است' } }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر است' } }, { status: 401 })
    }

    const body = await request.json()
    const { rating } = body // should be 1 or -1
    const { id } = await params

    if (rating !== 1 && rating !== -1) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'مقدار امتیاز نامعتبر است' } }, { status: 400 })
    }

    // Update rating in AiInteraction
    // Wait, the id returned is 'llm-' + timestamp in some offline fallbacks or from prisma
    // Let's handle if it exists
    let updated = null
    try {
      updated = await prisma.aiInteraction.update({
        where: { id },
        data: { rating }
      })
    } catch (e) {
      console.warn(`Could not find AiInteraction with ID ${id} to rate, trying to find latest user interaction`)
      // Fallback: rate latest user interaction
      const latest = await prisma.aiInteraction.findFirst({
        where: { userId: decoded.id as string },
        orderBy: { createdAt: 'desc' }
      })
      if (latest) {
        updated = await prisma.aiInteraction.update({
          where: { id: latest.id },
          data: { rating }
        })
      }
    }

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error('[POST /api/ai/chat/[id]/rate] Error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'خطا در ثبت فیدبک' } },
      { status: 500 }
    )
  }
}
