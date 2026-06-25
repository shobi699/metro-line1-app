import { create } from 'zustand'
import { API_URL } from '../shared/config'

interface NetworkState {
  isOffline: boolean
  setOffline: (offline: boolean) => void
  checkConnection: () => Promise<boolean>
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOffline: false,
  setOffline: (offline) => set({ isOffline: offline }),
  async checkConnection() {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)
      const res = await fetch(`${API_URL}/config`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      })
      clearTimeout(timeoutId)
      const offline = !res.ok
      set({ isOffline: offline })
      return !offline
    } catch {
      set({ isOffline: true })
      return false
    }
  },
}))
