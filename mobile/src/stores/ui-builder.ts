import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../shared/config'

export interface UITheme {
  primaryColor: string
  accentColor: string
  radius: number
  fontSize: 'sm' | 'md' | 'lg'
  darkModeDefault: boolean
  logoUrl?: string
  apiBaseUrl?: string
}

export interface MenuItem {
  id: string
  label: string
  icon: string
  route: string
  orderIndex: number
  isVisible: boolean
  requiredPermission?: string | null
}

export interface DashboardWidget {
  id: string
  widgetType: 'stat_card' | 'chart' | 'list' | 'banner'
  title: string | null
  size: 'sm' | 'md' | 'lg'
  orderIndex: number
  isVisible: boolean
  configJson: any
}

interface UIBuilderState {
  theme: UITheme
  menuItems: MenuItem[]
  widgets: DashboardWidget[]
  isLoading: boolean
  bootstrap: () => Promise<void>
  updateThemeLocal: (newTheme: Partial<UITheme>) => void
  updateMenuLocal: (menuItems: MenuItem[]) => void
  updateWidgetsLocal: (widgets: DashboardWidget[]) => void
  saveThemeToServer: () => Promise<void>
  saveMenuToServer: () => Promise<void>
  saveWidgetsToServer: () => Promise<void>
}

const DEFAULT_THEME: UITheme = {
  primaryColor: '#ae0011',
  accentColor: '#575e70',
  radius: 12,
  fontSize: 'md',
  darkModeDefault: false,
  logoUrl: '',
}

export const useUIBuilderStore = create<UIBuilderState>((set, get) => ({
  theme: DEFAULT_THEME,
  menuItems: [],
  widgets: [],
  isLoading: false,

  async bootstrap() {
    set({ isLoading: true })
    try {
      // Offline-first: load cached bootstrap data first
      const cached = await AsyncStorage.getItem('@ui_bootstrap')
      if (cached) {
        const parsed = JSON.parse(cached)
        set({
          theme: parsed.theme || DEFAULT_THEME,
          menuItems: parsed.menuItems || [],
          widgets: parsed.widgets || [],
        })
      }

      // Fetch fresh bootstrap data (theme + menuItems) from public server
      const res = await fetch(`${API_URL}/ui/bootstrap`)
      if (res.ok) {
        const json = await res.json()
        const { theme, menuItems } = json.data

        // Check if server-side domain settings are updated
        if (theme && theme.apiBaseUrl) {
          const config = require('../shared/config')
          if (theme.apiBaseUrl !== config.BASE_URL) {
            await config.setApiUrl(theme.apiBaseUrl)
          }
        }

        // Fetch widgets (needs auth token if restricted, so we use token if available)
        const token = await AsyncStorage.getItem('@auth_accessToken')
        const headers: Record<string, string> = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const widgetRes = await fetch(`${API_URL}/admin/ui/dashboard`, { headers })
        let widgets = []
        if (widgetRes.ok) {
          const wJson = await widgetRes.json()
          widgets = wJson.data || []
        }

        const dataToSave = { theme, menuItems, widgets }
        await AsyncStorage.setItem('@ui_bootstrap', JSON.stringify(dataToSave))

        set({
          theme: theme || DEFAULT_THEME,
          menuItems: menuItems || [],
          widgets: widgets || [],
        })
      }
    } catch (err) {
      console.error('Error bootstrapping UI settings:', err)
    } finally {
      set({ isLoading: false })
    }
  },

  updateThemeLocal(newTheme) {
    set((state) => ({ theme: { ...state.theme, ...newTheme } }))
  },

  updateMenuLocal(menuItems) {
    set({ menuItems })
  },

  updateWidgetsLocal(widgets) {
    set({ widgets })
  },

  async saveThemeToServer() {
    try {
      const { theme } = get()
      const token = await AsyncStorage.getItem('@auth_accessToken')
      const res = await fetch(`${API_URL}/admin/ui/theme`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(theme),
      })
      if (!res.ok) throw new Error('Failed to save theme to server')
      // re-trigger bootstrap to cache it locally
      await get().bootstrap()
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  async saveMenuToServer() {
    try {
      const { menuItems } = get()
      const token = await AsyncStorage.getItem('@auth_accessToken')
      const res = await fetch(`${API_URL}/admin/ui/menu`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ menuItems }),
      })
      if (!res.ok) throw new Error('Failed to save menu to server')
      await get().bootstrap()
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  async saveWidgetsToServer() {
    try {
      const { widgets } = get()
      const token = await AsyncStorage.getItem('@auth_accessToken')
      const res = await fetch(`${API_URL}/admin/ui/dashboard`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ widgets }),
      })
      if (!res.ok) throw new Error('Failed to save widgets to server')
      await get().bootstrap()
    } catch (err) {
      console.error(err)
      throw err
    }
  },
}))
