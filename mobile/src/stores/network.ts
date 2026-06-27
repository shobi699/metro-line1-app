import { create } from 'zustand'
import { API_URL } from '../shared/config'
import { useOfflineCacheStore } from './offline-cache'
import { useAuthStore } from './auth'

interface NetworkState {
  isOffline: boolean
  wasOffline: boolean
  setOffline: (offline: boolean) => void
  checkConnection: () => Promise<boolean>
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOffline: false,
  wasOffline: false,
  setOffline: (offline) => set({ isOffline: offline }),
  async checkConnection() {
    const prevOffline = get().isOffline
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)
      const res = await fetch(`${API_URL}/config`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      })
      clearTimeout(timeoutId)
      const offline = !res.ok
      set({ isOffline: offline, wasOffline: prevOffline && !offline })

      if (prevOffline && !offline) {
        const { processQueue } = useOfflineCacheStore.getState()
        const { accessToken } = useAuthStore.getState()
        processQueue(accessToken)
      }

      return !offline
    } catch {
      set({ isOffline: true, wasOffline: false })
      return false
    }
  },
}))
