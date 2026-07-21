import { create } from 'zustand'
import { API_URL } from '../shared/config'
import { useAuthStore } from './auth'

export interface Bulletin {
  id: string
  title: string
  body: string
  active: boolean
  createdAt: string
}

interface BulletinsState {
  pendingBulletins: Bulletin[]
  isLoading: boolean
  error: string | null
  fetchPendingBulletins: () => Promise<void>
  acknowledgeBulletin: (id: string) => Promise<void>
}

export const useBulletinsStore = create<BulletinsState>((set, get) => ({
  pendingBulletins: [],
  isLoading: false,
  error: null,

  fetchPendingBulletins: async () => {
    set({ isLoading: true, error: null })
    try {
      const { accessToken } = useAuthStore.getState()
      const res = await fetch(`${API_URL}/bulletins/pending`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const data = await res.json()
      if (data && Array.isArray(data.data)) {
        set({ pendingBulletins: data.data, isLoading: false })
      } else {
        set({ error: 'Data format error', isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.message || 'خطا در دریافت بخشنامه‌ها', isLoading: false })
    }
  },

  acknowledgeBulletin: async (id: string) => {
    try {
      const { accessToken } = useAuthStore.getState()
      await fetch(`${API_URL}/bulletins/${id}/acknowledge`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      // Remove it from the pending list upon success
      set((state) => ({
        pendingBulletins: state.pendingBulletins.filter((b) => b.id !== id),
      }))
    } catch (err: any) {
      console.error('Failed to acknowledge bulletin', err)
      throw err
    }
  },
}))
