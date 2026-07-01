import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** سطح اولویت پیام — بخش ۵.۳ سند tosee.md */
export type MessagePriority = 'normal' | 'important' | 'urgent' | 'emergency' | 'critical'

/** رسید قانونی خواندن پیام — بخش ۵.۲ */
export interface ReadReceipt {
  userId: string
  userName: string
  seenAt: string
  device?: string
  ipAddress?: string
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  body: string | null
  attachmentUrl: string | null
  attachmentType: string | null
  pinned: boolean
  createdAt: string
  /** اولویت پیام — بخش ۵.۳ */
  priority?: MessagePriority
  /** تگ‌های پیام — بخش ۵.۴ */
  tags?: string[]
  /** رسیدهای قانونی خواندن — بخش ۵.۲ */
  readReceipts?: ReadReceipt[]
}

/** نوع کانال رسمی — بخش ۵.۱ */
export type ChannelKind =
  | 'direct'       // چت شخصی
  | 'shift'        // گروه شیفت
  | 'station'      // روم ایستگاه
  | 'announcement' // کانال اطلاعیه رسمی
  | 'emergency'    // کانال اضطراری
  | 'occ'          // کانال OCC
  | 'training'     // کانال آموزش
  | 'management'   // کانال مدیران
  | 'general'
  | 'operators'
  | 'custom'

export interface ChatRoom {
  id: string
  name: string
  type: 'direct' | 'group'
  kind: ChannelKind
  memberCount: number
  unreadCount: number
  lastMessage: {
    body: string | null
    attachmentType: string | null
    senderName: string
    createdAt: string
  } | null
  updatedAt: string
}

interface ChatState {
  rooms: ChatRoom[]
  activeRoomId: string | null
  messagesByRoom: Record<string, ChatMessage[]>
  roomSettings: Record<string, { readOnly: boolean; blockAttachments: boolean; maxLength: number }>
  roomReactions: Record<string, Record<string, Array<{ emoji: string; userId: string; userName: string }>>>
  roomIsAdmin: Record<string, boolean>
  loadingRooms: boolean
  loadingMessages: boolean
  connected: boolean
  /** حالت ارتباط اضطراری — بخش ۵.۵ */
  emergencyMode: boolean
  loadRooms: (token: string) => Promise<void>
  selectRoom: (token: string, roomId: string) => Promise<void>
  sendMessage: (
    token: string,
    roomId: string,
    body: string,
    attachment?: { url: string; type: string },
    priority?: MessagePriority,
  ) => Promise<boolean>
  openDirect: (token: string, userId: string) => Promise<string | null>
  markRead: (token: string, roomId: string) => Promise<void>
  toggleReaction: (token: string, roomId: string, messageId: string, emoji: string) => Promise<void>
  updateSettings: (token: string, roomId: string, settings: { readOnly: boolean; blockAttachments: boolean; maxLength: number }) => Promise<void>
  acknowledgeMessage: (token: string, messageId: string) => Promise<void>
  setEmergencyMode: (active: boolean) => void
  connect: (token: string) => void
  disconnect: () => void
  reset: () => void
}

// نگه‌داری اتصال WebSocket خارج از state تا از سریال‌سازی/رندر مجدد جدا بماند.
let ws: WebSocket | null = null
let eventSource: EventSource | null = null

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      rooms: [],
      activeRoomId: null,
      messagesByRoom: {},
      roomSettings: {},
      roomReactions: {},
      roomIsAdmin: {},
      loadingRooms: false,
      loadingMessages: false,
      connected: false,
      emergencyMode: false,

      async loadRooms(token) {
        set({ loadingRooms: true })
        try {
          const res = await fetch('/api/chat/rooms', { headers: authHeaders(token) })
          if (res.ok) {
            const data = await res.json()
            set({ rooms: data.data as ChatRoom[] })
          }
        } catch {
          // silent
        } finally {
          set({ loadingRooms: false })
        }
      },

      async selectRoom(token, roomId) {
        set({ activeRoomId: roomId, loadingMessages: true })
        try {
          const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
            headers: authHeaders(token),
          })
          if (res.ok) {
            const data = await res.json()
            set((s) => ({
              messagesByRoom: {
                ...s.messagesByRoom,
                [roomId]: data.data.messages as ChatMessage[],
              },
              roomSettings: {
                ...s.roomSettings,
                [roomId]: data.data.settings,
              },
              roomReactions: {
                ...s.roomReactions,
                [roomId]: data.data.reactions,
              },
              roomIsAdmin: {
                ...s.roomIsAdmin,
                [roomId]: data.data.isAdmin,
              },
            }))
          }
        } catch {
          // silent
        } finally {
          set({ loadingMessages: false })
        }
        // علامت‌گذاری خوانده‌شده و صفر کردن شمارنده محلی
        set((s) => ({
          rooms: s.rooms.map((r) =>
            r.id === roomId ? { ...r, unreadCount: 0 } : r,
          ),
        }))
        await get().markRead(token, roomId)
      },

      async sendMessage(token, roomId, body, attachment, priority) {
        try {
          const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            body: JSON.stringify({
              body,
              attachmentUrl: attachment?.url,
              attachmentType: attachment?.type,
              priority: priority ?? 'normal',
            }),
          })
          if (!res.ok) return false
          const data = await res.json()
          // افزودن با حذف تکراری (پیام از SSE هم می‌رسد)
          addMessage(set, data.data as ChatMessage)
          return true
        } catch {
          return false
        }
      },

      async openDirect(token, userId) {
        try {
          const res = await fetch('/api/chat/direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            body: JSON.stringify({ userId }),
          })
          if (!res.ok) return null
          const data = await res.json()
          await get().loadRooms(token)
          return data.data.id as string
        } catch {
          return null
        }
      },

      async markRead(token, roomId) {
        try {
          await fetch(`/api/chat/rooms/${roomId}/read`, {
            method: 'POST',
            headers: authHeaders(token),
          })
        } catch {
          // silent
        }
      },

      async toggleReaction(token, roomId, messageId, emoji) {
        try {
          const res = await fetch(`/api/chat/rooms/${roomId}/reaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            body: JSON.stringify({ messageId, emoji }),
          })
          if (res.ok) {
            const data = await res.json()
            set((s) => ({
              roomReactions: {
                ...s.roomReactions,
                [roomId]: {
                  ...(s.roomReactions[roomId] || {}),
                  [messageId]: data.data[messageId] || [],
                },
              },
            }))
          }
        } catch {
          // silent
        }
      },

      async updateSettings(token, roomId, settings) {
        try {
          const res = await fetch(`/api/chat/rooms/${roomId}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            body: JSON.stringify(settings),
          })
          if (res.ok) {
            set((s) => ({
              roomSettings: {
                ...s.roomSettings,
                [roomId]: settings,
              },
            }))
          }
        } catch {
          // silent
        }
      },

      async acknowledgeMessage(token, messageId) {
        try {
          await fetch(`/api/chat/messages/${messageId}/acknowledge`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({}),
          })
        } catch {
          // silent
        }
      },

      connect(token) {
        if (ws || eventSource) return

        const sseUrl = `/api/chat/stream?token=${encodeURIComponent(token)}`
        const es = new EventSource(sseUrl)

        es.onopen = () => set({ connected: true })

        es.addEventListener('message', (ev) => {
          try {
            const data = JSON.parse(ev.data) as ChatMessage
            handleIncoming(set, get, data)
          } catch (e) {
            // silent
          }
        })

        es.onerror = () => {
          set({ connected: false })
          // در صورتی که اتصال EventSource قطع شد یا سرور Cloudflare بود، به WebSocket سوئیچ کن
          if (es.readyState === EventSource.CLOSED) {
            es.close()
            eventSource = null
            tryWebSocket(token)
          }
        }

        eventSource = es

        function tryWebSocket(t: string) {
          if (ws) return
          const wsUrl = `/api/chat/stream?token=${encodeURIComponent(t)}`
          const socket = new WebSocket(wsUrl.replace(/^http/, 'ws'))

          socket.onopen = () => set({ connected: true })

          socket.onmessage = (ev) => {
            try {
              const payload = JSON.parse(ev.data) as {
                type: string
                roomId: string
                data: ChatMessage
              }
              if (payload.type === 'message') {
                handleIncoming(set, get, payload.data)
              }
            } catch {
              // silent
            }
          }

          socket.onerror = () => {
            set({ connected: false })
          }

          socket.onclose = () => {
            set({ connected: false })
            ws = null
            // تلاش مجدد بعد از ۳ ثانیه
            setTimeout(() => {
              if (!ws && !eventSource) get().connect(t)
            }, 3000)
          }

          ws = socket
        }
      },

      setEmergencyMode(active) {
        set({ emergencyMode: active })
      },

      disconnect() {
        ws?.close()
        ws = null
        eventSource?.close()
        eventSource = null
        set({ connected: false })
      },

      reset() {
        ws?.close()
        ws = null
        eventSource?.close()
        eventSource = null
        set({
          rooms: [],
          activeRoomId: null,
          messagesByRoom: {},
          connected: false,
          emergencyMode: false,
        })
      },
    }),
    {
      name: 'metro-line1-chat-storage',
    },
  ),
)

type SetState = (
  partial:
    | Partial<ChatState>
    | ((state: ChatState) => Partial<ChatState>),
) => void

function addMessage(set: SetState, message: ChatMessage) {
  set((s) => {
    const existing = s.messagesByRoom[message.roomId] ?? []
    if (existing.some((m) => m.id === message.id)) return {}
    return {
      messagesByRoom: {
        ...s.messagesByRoom,
        [message.roomId]: [...existing, message],
      },
    }
  })
}

function handleIncoming(
  set: SetState,
  get: () => ChatState,
  message: ChatMessage,
) {
  const state = get()

  if (message.attachmentType === 'event/reaction') {
    try {
      const payload = JSON.parse(message.body || '{}') as {
        messageId: string
        emoji: string
        activeReactions: Array<{ emoji: string; userId: string; userName: string }>
      }
      set((s) => ({
        roomReactions: {
          ...s.roomReactions,
          [message.roomId]: {
            ...(s.roomReactions[message.roomId] || {}),
            [payload.messageId]: payload.activeReactions,
          },
        },
      }))
    } catch {
      // silent
    }
    return
  }

  if (message.attachmentType === 'event/settings_updated') {
    try {
      const settings = JSON.parse(message.body || '{}') as {
        readOnly: boolean
        blockAttachments: boolean
        maxLength: number
      }
      set((s) => ({
        roomSettings: {
          ...s.roomSettings,
          [message.roomId]: settings,
        },
      }))
    } catch {
      // silent
    }
    return
  }

  if (message.attachmentType === 'event/receipt_updated') {
    try {
      const payload = JSON.parse(message.body || '{}') as {
        messageId: string
        receipts: any[]
      }
      set((s) => {
        const existing = s.messagesByRoom[message.roomId] ?? []
        const updated = existing.map((m) =>
          m.id === payload.messageId ? { ...m, readReceipts: payload.receipts } : m
        )
        return {
          messagesByRoom: {
            ...s.messagesByRoom,
            [message.roomId]: updated,
          },
        }
      })
    } catch {
      // silent
    }
    return
  }

  const isActive = state.activeRoomId === message.roomId

  // درج پیام در صورت بازبودن روم
  if (isActive) addMessage(set, message)

  // به‌روزرسانی خلاصه روم: آخرین پیام، شمارنده نخوانده و مرتب‌سازی
  set((s) => {
    const rooms = s.rooms.map((r) => {
      if (r.id !== message.roomId) return r
      const isMine = isActive
      return {
        ...r,
        unreadCount: isMine ? 0 : r.unreadCount + 1,
        lastMessage: {
          body: message.body,
          attachmentType: message.attachmentType,
          senderName: message.senderName,
          createdAt: message.createdAt,
        },
      }
    })
    rooms.sort((a, b) => {
      const at = a.lastMessage?.createdAt ?? a.updatedAt
      const bt = b.lastMessage?.createdAt ?? b.updatedAt
      return bt.localeCompare(at)
    })
    return { rooms }
  })
}

