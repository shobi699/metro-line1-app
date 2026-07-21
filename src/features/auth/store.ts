import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SessionUser {
  id: string
  personnelCode: string
  name: string
  roleKey: string
  customFields?: {
    avatar?: string
    availability?: string
    themeColor?: string
    carPlate?: string
    personnelNo?: string
    [key: string]: unknown
  }
}

interface AuthState {
  user: SessionUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (
    user: SessionUser,
    accessToken: string,
    refreshToken: string,
  ) => void
  logout: () => void
  updateAccessToken: (accessToken: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      updateAccessToken: (accessToken) => set({ accessToken }),
    }),
    {
      name: 'metro-line1-auth-storage',
    },
  ),
)
