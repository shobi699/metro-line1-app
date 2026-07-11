import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/server/auth/jwt'
import { prisma } from '@/server/db'

export async function GET(req: NextRequest) {
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

    const conversations = await prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1
        }
      }
    })

    const formatted = conversations.map(c => {
      let title = c.messages[0]?.text || 'گفتگوی جدید'
      if (title.length > 40) title = title.substring(0, 40) + '...'
      return {
        id: c.id,
        title,
        date: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(c.createdAt)
      }
    })

    return NextResponse.json({ data: formatted })

  } catch (error: any) {
    console.error('[GET /api/ai/chat/history] Error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'خطای سرور' } },
      { status: 500 }
    )
  }
}
