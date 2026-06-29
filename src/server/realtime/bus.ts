/** Broadcasts chat messages via Durable Objects instead of in-process EventEmitter. */

import type { DurableObjectNamespace } from '../cloudflare-types'

export interface ChatMessageEvent {
  roomId: string
  message: {
    id: string
    roomId: string
    senderId: string
    senderName: string
    body: string | null
    attachmentUrl: string | null
    attachmentType: string | null
    pinned: boolean
    createdAt: string
  }
}

/**
 * Publish a message to the Durable Object for the given room.
 * On Cloudflare, the DO binding is on globalThis. In local dev without a DO,
 * this is a no-op (messages are still persisted to DB).
 */
export async function publishMessage(event: ChatMessageEvent): Promise<void> {
  const ns = (globalThis as unknown as { CHAT_DO?: DurableObjectNamespace }).CHAT_DO
  if (!ns) return

  const id = ns.idFromName(event.roomId)
  const stub = ns.get(id)

  await stub.fetch('https://chat-do/broadcast', {
    method: 'POST',
    body: JSON.stringify({
      type: 'message',
      roomId: event.roomId,
      data: event.message,
    }),
  })
}

