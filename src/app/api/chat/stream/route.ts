import { verifyAccessToken } from '@/server/auth/jwt'
import { prisma } from '@/server/db'

export const dynamic = 'force-dynamic'

/**
 * WebSocket upgrade endpoint for chat.
 * Clients connect here; the server upgrades to WebSocket and registers
 * them with the ChatRoom Durable Object.
 */
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

  // Get rooms the user is a member of
  const memberships = await prisma.chatMember.findMany({
    where: { userId },
    select: { roomId: true },
  })
  const roomIds = memberships.map((m) => m.roomId)

  // On Cloudflare with Durable Objects, upgrade to WebSocket
  const ns = (globalThis as unknown as { CHAT_DO?: { idFromName(name: string): unknown; get(id: unknown): { fetch(request: Request): Promise<Response> } } }).CHAT_DO
  if (ns) {
    const roomId = roomIds[0] || 'lobby'
    const id = ns.idFromName(roomId)
    const stub = ns.get(id)

    const doUrl = new URL(request.url)
    doUrl.pathname = '/websocket'
    doUrl.searchParams.set('userId', userId)
    doUrl.searchParams.set('roomIds', roomIds.join(','))

    return stub.fetch(new Request(doUrl.toString(), request))
  }

  // Fallback: Server-Sent Events for local dev without Durable Objects
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          // closed
        }
      }

      send(`event: ready\ndata: ${JSON.stringify({ rooms: roomIds.length })}\n\n`)

      const heartbeat = setInterval(() => send(': ping\n\n'), 25_000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
    cancel() {
      // cleanup
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
