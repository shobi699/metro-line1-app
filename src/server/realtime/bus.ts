import type { DurableObjectNamespace } from '../cloudflare-types'
import { EventEmitter } from 'events'

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
    priority?: string
    tags?: string[]
    readReceipts?: any
  }
}

// کانتینر باس برای سرور محلی نودجی‌اس جهت همگام‌سازی چت لایو
if (!(globalThis as any).chatBus) {
  (globalThis as any).chatBus = new EventEmitter()
}
export const chatBus = (globalThis as any).chatBus as EventEmitter

export async function publishMessage(event: ChatMessageEvent): Promise<void> {
  const ns = (globalThis as unknown as { CHAT_DO?: DurableObjectNamespace }).CHAT_DO
  if (ns) {
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
  } else {
    // انتشار پیام روی کانتینر باس محلی نودجی‌اس
    chatBus.emit('message', event)
  }
}

