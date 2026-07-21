import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/server/auth/jwt'
import { AIAssistantService } from '@/server/modules/ai/service'

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { personaKey, message, threadId, stream, history, imageUrl } = body
    if (!personaKey || !message) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'پارامترهای personaKey و message الزامی هستند' } }, { status: 400 })
    }

    // Default to streaming if requested, or if not specified
    const shouldStream = stream !== false

    if (shouldStream) {
      const responseStream = new TransformStream()
      const writer = responseStream.writable.getWriter()
      const encoder = new TextEncoder()

      // Run async generation in background
      ;(async () => {
        try {
          const gen = AIAssistantService.processMessageStream({
            userId: decoded.sub as string,
            personaKey,
            message,
            threadId,
            history,
            imageUrl
          })

          for await (const chunk of gen) {
            const data = `event: ${chunk.type}\ndata: ${JSON.stringify(chunk.data)}\n\n`
            await writer.write(encoder.encode(data))
          }
        } catch (err: any) {
          console.error('[SSE Stream Error]', err)
          const data = `event: error\ndata: ${JSON.stringify({ message: err.message || 'خطای غیرمنتظره سرور' })}\n\n`
          await writer.write(encoder.encode(data))
        } finally {
          await writer.close()
        }
      })()

      return new Response(responseStream.readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    } else {
      const response = await AIAssistantService.processMessage({
        userId: decoded.sub as string,
        personaKey,
        message,
        threadId,
        imageUrl
      })

      return NextResponse.json({ data: response })
    }
  } catch (error: any) {
    console.error('[POST /api/ai/chat] Error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'خطای سرور در پردازش درخواست AI' } },
      { status: 500 }
    )
  }
}
