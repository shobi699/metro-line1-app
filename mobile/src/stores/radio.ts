import { create } from 'zustand'
import { cachedFetch } from '../shared/cached-fetch'
import { useAuthStore } from './auth'

export interface RadioChannel {
  id: string
  key: string
  label: string
  code: string | null
  color: string | null
}

export interface RadioPhrase {
  id: string
  label: string
  text: string
}

export interface RadioLog {
  id: string
  channelId: string
  senderId: string | null
  senderName: string
  message: string
  kind: string
  createdAt: string
}

interface RadioState {
  channels: RadioChannel[]
  activeChannel: RadioChannel | null
  phrases: RadioPhrase[]
  logs: RadioLog[]
  isLoading: boolean
  error: string | null
  
  fetchChannels: () => Promise<void>
  fetchPhrases: () => Promise<void>
  fetchLogs: (channelId: string) => Promise<void>
  setActiveChannel: (channel: RadioChannel) => void
  transmitMessage: (channelId: string, message: string, kind?: string) => Promise<void>
}

export const useRadioStore = create<RadioState>((set, get) => ({
  channels: [],
  activeChannel: null,
  phrases: [],
  logs: [],
  isLoading: false,
  error: null,

  setActiveChannel: (channel) => {
    set({ activeChannel: channel })
    get().fetchLogs(channel.id)
  },

  fetchChannels: async () => {
    try {
      set({ isLoading: true, error: null })
      const res = await cachedFetch<any>('/comms/radio/channels')
      if (res) {
        set({ channels: res, isLoading: false })
        if (res.length > 0 && !get().activeChannel) {
          get().setActiveChannel(res[0])
        }
      } else {
        set({ isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchPhrases: async () => {
    try {
      const res = await cachedFetch<any>('/comms/radio/phrases')
      if (res) set({ phrases: res })
    } catch (err: any) {
      // ignore
    }
  },

  fetchLogs: async (channelId: string) => {
    try {
      const res = await cachedFetch<any>(`/comms/radio/logs?channelId=${channelId}`)
      if (res) set({ logs: res })
    } catch (err: any) {
      // ignore
    }
  },

  transmitMessage: async (channelId: string, message: string, kind = 'VOICE_NOTE') => {
    try {
      const user = useAuthStore.getState().user
      // Optimistic update
      const tempLog: RadioLog = {
        id: `temp-${Date.now()}`,
        channelId,
        senderId: user?.id || null,
        senderName: user?.name || 'ناشناس',
        message,
        kind,
        createdAt: new Date().toISOString()
      }
      set(state => ({ logs: [tempLog, ...state.logs] }))

      await cachedFetch('/comms/radio/transmit', {
        method: 'POST',
        body: JSON.stringify({
          channelId,
          message,
          kind
        })
      })
      // fetch again to confirm
      await get().fetchLogs(channelId)
    } catch (err: any) {
      set({ error: err.message })
    }
  }
}))
