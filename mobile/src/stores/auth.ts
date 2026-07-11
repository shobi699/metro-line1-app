import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface UserProfile {
  id: string
  name: string
  personnelCode: string
  phone?: string | null
  email?: string | null
  status: 'pending' | 'active' | 'suspended'
  roleKey: 'super_admin' | 'admin' | 'operator'
  customFields?: Record<string, any> | null
}

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  loadPersistedAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,

  async setAuth(user, accessToken, refreshToken) {
    try {
      await AsyncStorage.multiSet([
        ['@auth_user', JSON.stringify(user)],
        ['@auth_accessToken', accessToken],
        ['@auth_refreshToken', refreshToken],
      ])
      set({ user, accessToken, refreshToken, isLoading: false })
    } catch {
      set({ user, accessToken, refreshToken, isLoading: false })
    }
  },

  async logout() {
    try {
      await AsyncStorage.multiRemove([
        '@auth_user',
        '@auth_accessToken',
        '@auth_refreshToken',
      ])
    } catch {
      // silent
    }
    set({ user: null, accessToken: null, refreshToken: null, isLoading: false })
  },

  async loadPersistedAuth() {
    set({ isLoading: true })
    try {
      const keys = ['@auth_user', '@auth_accessToken', '@auth_refreshToken']
      const values = await AsyncStorage.multiGet(keys)
      
      const userVal = values.find(([k]) => k === '@auth_user')?.[1]
      const accessVal = values.find(([k]) => k === '@auth_accessToken')?.[1]
      const refreshVal = values.find(([k]) => k === '@auth_refreshToken')?.[1]

      if (userVal && accessVal && refreshVal) {
        set({
          user: JSON.parse(userVal) as UserProfile,
          accessToken: accessVal,
          refreshToken: refreshVal,
          isLoading: false,
        })
      } else {
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false })
      }
    } catch {
      set({ user: null, accessToken: null, refreshToken: null, isLoading: false })
    }
  },
}))
