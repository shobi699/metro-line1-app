import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SafetyBulletin {
  id: string
  title: string
  body: string
  active: boolean
  createdAt: string
}

interface SafetyState {
  pendingBulletins: SafetyBulletin[]
  loading: boolean
  setPendingBulletins: (bulletins: SafetyBulletin[]) => void
  setLoading: (loading: boolean) => void
  removeBulletin: (id: string) => void
}

export const useSafetyStore = create<SafetyState>()(
  persist(
    (set) => ({
      pendingBulletins: [],
      loading: true,
      setPendingBulletins: (pendingBulletins) => set({ pendingBulletins }),
      setLoading: (loading) => set({ loading }),
      removeBulletin: (id) =>
        set((state) => ({
          pendingBulletins: state.pendingBulletins.filter((b) => b.id !== id),
        })),
    }),
    {
      name: 'metro-line1-safety-storage',
    },
  ),
)
