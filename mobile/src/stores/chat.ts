import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../shared/config'
import { useAuthStore } from './auth'

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
  status?: 'sending' | 'sent' | 'failed'
}

export interface ChatRoom {
  id: string
  name: string
  type: 'direct' | 'group'
  kind: string
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
  loadingOlderMessages: boolean
  cursorsByRoom: Record<string, string | null>
  hasMoreByRoom: Record<string, boolean>
  connected: boolean
  loadRooms: (token: string) => Promise<void>
  selectRoom: (token: string, roomId: string) => Promise<void>
  loadOlderMessages: (token: string, roomId: string) => Promise<void>
  sendMessage: (
    token: string,
    roomId: string,
    body: string,
    attachment?: { url: string; type: string },
  ) => Promise<boolean>
  openDirect: (token: string, userId: string) => Promise<string | null>
  toggleReaction: (token: string, roomId: string, messageId: string, emoji: string) => Promise<void>
  updateSettings: (token: string, roomId: string, settings: { readOnly: boolean; blockAttachments: boolean; maxLength: number }) => Promise<void>
  connect: (token: string) => void
  disconnect: () => void
  reset: () => void
}

let activeInterval: ReturnType<typeof setInterval> | null = null

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  activeRoomId: null,
  messagesByRoom: {},
  roomSettings: {},
  roomReactions: {},
  roomIsAdmin: {},
  loadingRooms: false,
  loadingMessages: false,
  loadingOlderMessages: false,
  cursorsByRoom: {},
  hasMoreByRoom: {},
  connected: false,

  async loadRooms(token) {
    set({ loadingRooms: true })

    try {
      const cached = await AsyncStorage.getItem('@chat_rooms')
      if (cached) {
        set({ rooms: JSON.parse(cached) as ChatRoom[] })
      }
    } catch (e) {
      console.error('Error loading rooms cache:', e)
    }

    try {
      const res = await fetch(`${API_URL}/chat/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const fetchedRooms = data.data as ChatRoom[]
        set({ rooms: fetchedRooms })
        await AsyncStorage.setItem('@chat_rooms', JSON.stringify(fetchedRooms))
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
      const cached = await AsyncStorage.getItem(`@chat_messages_${roomId}`)
      if (cached) {
        const messages = JSON.parse(cached) as ChatMessage[]
        set((s) => ({
          messagesByRoom: {
            ...s.messagesByRoom,
            [roomId]: messages,
          },
        }))
      }
    } catch (e) {
      console.error('Error loading messages cache:', e)
    }

    try {
      const res = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const fetchedMessages = data.data.messages as ChatMessage[]
        const nextCursor = data.data.nextCursor as string | null
        
        set((s) => ({
          messagesByRoom: {
            ...s.messagesByRoom,
            [roomId]: fetchedMessages,
          },
          cursorsByRoom: {
            ...s.cursorsByRoom,
            [roomId]: nextCursor,
          },
          hasMoreByRoom: {
            ...s.hasMoreByRoom,
            [roomId]: nextCursor !== null,
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
        await AsyncStorage.setItem(`@chat_messages_${roomId}`, JSON.stringify(fetchedMessages))
      }
    } catch {
      // silent
    } finally {
      set({ loadingMessages: false })
    }

    set((s) => ({
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, unreadCount: 0 } : r,
      ),
    }))

    try {
      await fetch(`${API_URL}/chat/rooms/${roomId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // silent
    }
  },

  async loadOlderMessages(token, roomId) {
    const { cursorsByRoom, hasMoreByRoom, loadingOlderMessages } = get()
    const cursor = cursorsByRoom[roomId]
    const hasMore = hasMoreByRoom[roomId]

    if (loadingOlderMessages || !hasMore || !cursor) return

    set({ loadingOlderMessages: true })

    try {
      const res = await fetch(`${API_URL}/chat/rooms/${roomId}/messages?cursor=${cursor}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const fetchedMessages = data.data.messages as ChatMessage[]
        const nextCursor = data.data.nextCursor as string | null

        set((s) => {
          const existing = s.messagesByRoom[roomId] ?? []
          const existingIds = new Set(existing.map((m) => m.id))
          const filteredNew = fetchedMessages.filter((m) => !existingIds.has(m.id))
          const updated = [...filteredNew, ...existing]

          return {
            messagesByRoom: {
              ...s.messagesByRoom,
              [roomId]: updated,
            },
            cursorsByRoom: {
              ...s.cursorsByRoom,
              [roomId]: nextCursor,
            },
            hasMoreByRoom: {
              ...s.hasMoreByRoom,
              [roomId]: nextCursor !== null,
            },
          }
        })
      }
    } catch (e) {
      console.error('Failed to load older messages:', e)
    } finally {
      set({ loadingOlderMessages: false })
    }
  },

  async sendMessage(token, roomId, body, attachment) {
    const tempId = `temp-${Date.now()}`
    const currentUser = useAuthStore.getState().user

    // پیام خوش‌بینانه (Optimistic UI) برای نشان دادن آنی پیام در چت
    const optimisticMsg: ChatMessage = {
      id: tempId,
      roomId,
      senderId: currentUser?.id ?? 'current-user-id',
      senderName: currentUser?.name ?? 'من',
      body: body || null,
      attachmentUrl: attachment?.url || null,
      attachmentType: attachment?.type || null,
      pinned: false,
      createdAt: new Date().toISOString(),
      status: 'sending',
    }

    set((s) => {
      const existing = s.messagesByRoom[roomId] ?? []
      return {
        messagesByRoom: {
          ...s.messagesByRoom,
          [roomId]: [...existing, optimisticMsg],
        },
      }
    })

    try {
      const res = await fetch(`${API_URL}/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          body,
          attachmentUrl: attachment?.url,
          attachmentType: attachment?.type,
        }),
      })

      if (!res.ok) {
        // به‌روزرسانی پیام خوش‌بینانه به وضعیت شکست‌خورده
        set((s) => {
          const existing = s.messagesByRoom[roomId] ?? []
          const updated = existing.map((m) =>
            m.id === tempId ? { ...m, status: 'failed' as const } : m,
          )
          return {
            messagesByRoom: {
              ...s.messagesByRoom,
              [roomId]: updated,
            },
          }
        })
        return false
      }

      const data = await res.json()
      const newMsg = data.data as ChatMessage
      
      set((s) => {
        const existing = s.messagesByRoom[roomId] ?? []
        // جایگزینی پیام خوش‌بینانه با پیام رسمی ثبت شده در سرور
        const updated = existing.map((m) =>
          m.id === tempId ? { ...newMsg, status: 'sent' as const } : m,
        )
        AsyncStorage.setItem(`@chat_messages_${roomId}`, JSON.stringify(updated)).catch((err) => {
          console.error('Failed to write message cache:', err)
        })
        return {
          messagesByRoom: {
            ...s.messagesByRoom,
            [roomId]: updated,
          },
        }
      })
      return true
    } catch {
      // به‌روزرسانی پیام خوش‌بینانه به وضعیت شکست‌خورده
      set((s) => {
        const existing = s.messagesByRoom[roomId] ?? []
        const updated = existing.map((m) =>
          m.id === tempId ? { ...m, status: 'failed' as const } : m,
        )
        return {
          messagesByRoom: {
            ...s.messagesByRoom,
            [roomId]: updated,
          },
        }
      })
      return false
    }
  },

  async openDirect(token, userId) {
    try {
      const res = await fetch(`${API_URL}/chat/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

  async toggleReaction(token, roomId, messageId, emoji) {
    try {
      const res = await fetch(`${API_URL}/chat/rooms/${roomId}/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
      const res = await fetch(`${API_URL}/chat/rooms/${roomId}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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

  connect(token) {
    if (activeInterval) return
    
    set({ connected: true })
    
    const poll = async () => {
      const activeId = get().activeRoomId
      if (activeId) {
        try {
          const res = await fetch(`${API_URL}/chat/rooms/${activeId}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            const fetchedMessages = data.data.messages as ChatMessage[]
            
            set((s) => {
              const existing = s.messagesByRoom[activeId] ?? []
              const existingMap = new Map(existing.map((m) => [m.id, m]))
              
              // Add/update based on polled messages (maintains order)
              for (const msg of fetchedMessages) {
                existingMap.set(msg.id, msg)
              }
              
              // Preserve temporary messages that haven't completed or failed yet,
              // unless their content matches a message already fetched.
              const tempMessages = existing.filter((m) => {
                if (!m.id.startsWith('temp-')) return false
                const alreadyReceived = fetchedMessages.some(
                  (f) =>
                    f.senderId === m.senderId &&
                    f.body === m.body &&
                    Math.abs(new Date(f.createdAt).getTime() - new Date(m.createdAt).getTime()) < 15000
                )
                return !alreadyReceived
              })
              
              const merged = Array.from(existingMap.values())
              const updated = [
                ...merged.filter((m) => !m.id.startsWith('temp-')),
                ...tempMessages,
              ]
              
              AsyncStorage.setItem(`@chat_messages_${activeId}`, JSON.stringify(updated)).catch((err) => {
                console.error('Failed to write message cache:', err)
              })
              
              return {
                messagesByRoom: {
                  ...s.messagesByRoom,
                  [activeId]: updated,
                },
                roomSettings: {
                  ...s.roomSettings,
                  [activeId]: data.data.settings,
                },
                roomReactions: {
                  ...s.roomReactions,
                  [activeId]: data.data.reactions,
                },
                roomIsAdmin: {
                  ...s.roomIsAdmin,
                  [activeId]: data.data.isAdmin,
                },
              }
            })
          }
        } catch {
          // silent
        }
      }
      
      try {
        const res = await fetch(`${API_URL}/chat/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          const fetchedRooms = data.data as ChatRoom[]
          set({ rooms: fetchedRooms })
          await AsyncStorage.setItem('@chat_rooms', JSON.stringify(fetchedRooms))
        }
      } catch {
        // silent
      }
    }

    poll()
    
    let lastActiveRoomId = get().activeRoomId
    let intervalTime = lastActiveRoomId ? 1500 : 4000

    const resetInterval = () => {
      if (activeInterval) {
        clearInterval(activeInterval)
      }
      activeInterval = setInterval(async () => {
        await poll()
        const currentActiveRoomId = get().activeRoomId
        if (currentActiveRoomId !== lastActiveRoomId) {
          lastActiveRoomId = currentActiveRoomId
          intervalTime = currentActiveRoomId ? 1500 : 4000
          resetInterval()
        }
      }, intervalTime)
    }

    resetInterval()
  },

  disconnect() {
    if (activeInterval) {
      clearInterval(activeInterval)
      activeInterval = null
    }
    set({ connected: false })
  },

  reset() {
    get().disconnect()
    set({
      rooms: [],
      activeRoomId: null,
      messagesByRoom: {},
      roomSettings: {},
      roomReactions: {},
      roomIsAdmin: {},
      cursorsByRoom: {},
      hasMoreByRoom: {},
      loadingOlderMessages: false,
      connected: false,
    })
  },
}))
