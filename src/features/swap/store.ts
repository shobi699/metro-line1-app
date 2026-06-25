import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SwapRequest {
  id: string
  status: string
  note: string | null
  createdAt: string
  requester: { id: string; name: string }
  target: { id: string; name: string }
  sourceShift: { id: string; date: string; code: string }
  targetShift: { id: string; date: string; code: string }
}

interface SwapState {
  inbox: SwapRequest[]
  loading: boolean
  setInbox: (inbox: SwapRequest[]) => void
  setLoading: (loading: boolean) => void
  removeRequest: (id: string) => void
}

export const useSwapStore = create<SwapState>()(
  persist(
    (set) => ({
      inbox: [],
      loading: true,
      setInbox: (inbox) => set({ inbox }),
      setLoading: (loading) => set({ loading }),
      removeRequest: (id) =>
        set((state) => ({
          inbox: state.inbox.filter((r) => r.id !== id),
        })),
    }),
    {
      name: 'metro-line1-swap-storage',
    },
  ),
)
