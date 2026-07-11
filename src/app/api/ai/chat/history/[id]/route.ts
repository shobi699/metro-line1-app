import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/server/auth/jwt'
import { prisma } from '@/server/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر است' } }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'توکن نامعتبر است' } }, { status: 401 })
    }

    const userId = decoded.sub as string
    const { id } = await params

    const conversation = await prisma.aiConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'گفتگو یافت نشد' } }, { status: 404 })
    }

    if (conversation.userId !== userId) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'شما مجاز به دسترسی به این گفتگو نیستید' } }, { status: 403 })
    }

    // Map DB messages to UI message format
    const formattedMessages = conversation.messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.text,
      source: m.source || undefined,
      confidence: m.confidence || undefined,
      handbookSection: m.handbookSection || undefined,
      rating: (m.feedback === 1 ? 'up' : m.feedback === -1 ? 'down' : undefined)
    }))

    return NextResponse.json({ data: formattedMessages })

  } catch (error: any) {
    console.error(`[GET /api/ai/chat/history/[id]] Error:`, error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'خطای سرور' } },
      { status: 500 }
    )
  }
}
