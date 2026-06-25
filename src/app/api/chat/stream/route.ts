import { verifyAccessToken } from '@/server/auth/jwt'
import { prisma } from '@/server/db'
import { subscribeMessages, type ChatMessageEvent } from '@/server/realtime/bus'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const HEARTBEAT_MS = 25_000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return new Response('توکن یافت نشد', { status: 401 })
  }

  let userId: string
  try {
    const payload = await verifyAccessToken(token)
    userId = payload.sub!
  } catch {
    return new Response('توکن نامعتبر یا منقضی شده', { status: 401 })
  }

  // روم‌هایی که کاربر عضو آن‌هاست؛ فقط پیام این روم‌ها استریم می‌شود.
  const memberships = await prisma.chatMember.findMany({
    where: { userId },
    select: { roomId: true },
  })
  const roomIds = memberships.map((m) => m.roomId)

  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          // کنترلر بسته شده؛ نادیده گرفته می‌شود.
        }
      }

      // رویداد آماده‌بودن اتصال
      send(`event: ready\ndata: ${JSON.stringify({ rooms: roomIds.length })}\n\n`)

      unsubscribe = subscribeMessages(roomIds, (event: ChatMessageEvent) => {
        send(`event: message\ndata: ${JSON.stringify(event)}\n\n`)
      })

      heartbeat = setInterval(() => send(`: ping\n\n`), HEARTBEAT_MS)

      request.signal.addEventListener('abort', () => {
        if (heartbeat) clearInterval(heartbeat)
        unsubscribe?.()
        try {
          controller.close()
        } catch {
          // قبلاً بسته شده
        }
      })
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat)
      unsubscribe?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
