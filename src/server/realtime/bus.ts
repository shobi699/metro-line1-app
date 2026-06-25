import { EventEmitter } from 'node:events'

/** payload رویداد پیام جدید که از طریق SSE به کلاینت‌ها می‌رسد. */
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

const CHANNEL = 'chat:message'

// EventEmitter تک‌نمونه روی globalThis تا در برابر hot-reload در حالت توسعه مقاوم بماند.
const globalForBus = globalThis as unknown as { __chatBus?: EventEmitter }

function getEmitter(): EventEmitter {
  if (!globalForBus.__chatBus) {
    const emitter = new EventEmitter()
    emitter.setMaxListeners(0) // هر اتصال SSE یک listener است
    globalForBus.__chatBus = emitter
  }
  return globalForBus.__chatBus
}

export function publishMessage(event: ChatMessageEvent): void {
  getEmitter().emit(CHANNEL, event)
}

/**
 * اشتراک در پیام‌های روم‌های مشخص. handler فقط برای رویدادهای روم‌های عضو
 * فراخوانی می‌شود. تابع لغو اشتراک بازگردانده می‌شود.
 */
export function subscribeMessages(
  roomIds: string[],
  handler: (event: ChatMessageEvent) => void,
): () => void {
  const rooms = new Set(roomIds)
  const listener = (event: ChatMessageEvent) => {
    if (rooms.has(event.roomId)) handler(event)
  }
  const emitter = getEmitter()
  emitter.on(CHANNEL, listener)
  return () => emitter.off(CHANNEL, listener)
}
