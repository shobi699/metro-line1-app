import { create } from 'zustand'
import type { RoleKey } from '@/generated/prisma/client'

export interface SessionUser {
  id: string
  nationalId: string
  name: string
  roleKey: RoleKey
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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken, refreshToken) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true }),
  logout: () =>
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
  updateAccessToken: (accessToken) => set({ accessToken }),
}))
