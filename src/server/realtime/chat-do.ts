/**
 * Durable Object for chat room WebSocket connections.
 * Each chat room gets its own DO instance that manages
 * WebSocket connections and broadcasts messages.
 */

import type {
  DurableObjectNamespace,
  DurableObjectState,
} from '../cloudflare-types'

declare const WebSocketPair: {
  new (): { 0: WebSocket; 1: WebSocket }
}

interface Env {
  CHAT_DO: DurableObjectNamespace
}

interface WebSocketSession {
  ws: WebSocket
  userId: string
  roomIds: Set<string>
}

interface ChatMessage {
  type: 'message' | 'reaction' | 'settings_updated'
  roomId: string
  data: unknown
}

export class ChatRoom {
  private sessions: WebSocketSession[] = []
  private state: DurableObjectState

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state
    void _env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/websocket') {
      return this.handleWebSocketUpgrade(request)
    }

    if (url.pathname === '/broadcast' && request.method === 'POST') {
      const message = (await request.json()) as ChatMessage
      this.broadcast(message)
      return new Response('ok')
    }

    return new Response('Not found', { status: 404 })
  }

  private handleWebSocketUpgrade(request: Request): Response {
    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]

    this.state.acceptWebSocket(server)

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || 'anonymous'
    const roomIdsParam = url.searchParams.get('roomIds') || ''
    const roomIds = new Set(roomIdsParam.split(',').filter(Boolean))

    const session: WebSocketSession = {
      ws: server,
      userId,
      roomIds,
    }
    this.sessions.push(session)

    server.addEventListener('close', () => {
      this.sessions = this.sessions.filter((s) => s.ws !== server)
    })

    server.addEventListener('error', () => {
      this.sessions = this.sessions.filter((s) => s.ws !== server)
    })

    return new Response(null, { status: 101, webSocket: client } as ResponseInit)
  }

  async webSocketMessage(_ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // Clients can send pings or other messages — currently ignored
    void _ws
    void message
  }

  async webSocketClose(
    ws: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean,
  ): Promise<void> {
    this.sessions = this.sessions.filter((s) => s.ws !== ws)
    void _code
    void _reason
    void _wasClean
  }

  private broadcast(message: ChatMessage): void {
    const payload = JSON.stringify(message)
    for (const session of this.sessions) {
      if (session.roomIds.has(message.roomId)) {
        try {
          session.ws.send(payload)
        } catch {
          // Dead session — will be cleaned up on close
        }
      }
    }
  }
}
