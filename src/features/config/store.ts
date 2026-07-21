import { create } from 'zustand'

export interface AppConfig {
  appName: string
  appLogoUrl: string
  authBackgroundUrl: string
  authWelcomeText: string
  sidebarStyle: string
  dashboardLayout: string
  brandColor: string
  maintenanceMode: boolean
  systemNotice: string
  allowRegistration: boolean
  passwordPolicyMinLength: number
  [key: string]: any
}

export interface ModuleFlagItem {
  id: string
  enabled: boolean
  matchingPrefixes: string[]
}

interface ConfigStore {
  config: AppConfig | null
  moduleFlags: ModuleFlagItem[]
  setConfig: (config: AppConfig) => void
  setModuleFlags: (flags: ModuleFlagItem[]) => void
  isRouteEnabled: (pathname: string) => boolean
  fetchModuleFlags: () => Promise<void>
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  moduleFlags: [],
  setConfig: (config) => set({ config }),
  setModuleFlags: (flags) => set({ moduleFlags: flags }),

  isRouteEnabled: (pathname: string) => {
    const flags = get().moduleFlags
    if (!flags || flags.length === 0) return true
    
    // Always allow core system routes
    if (['/dashboard', '/login', '/pending-approval', '/profile', '/admin/modules'].includes(pathname)) {
      return true
    }

    // Check if any disabled module covers this pathname
    for (const flag of flags) {
      if (!flag.enabled) {
        for (const prefix of flag.matchingPrefixes) {
          if (pathname === prefix || pathname.startsWith(`${prefix}/`) || (prefix.includes('?') && pathname.startsWith(prefix.split('?')[0]))) {
            return false
          }
        }
      }
    }
    return true
  },

  fetchModuleFlags: async () => {
    try {
      const res = await fetch('/api/modules/public')
      if (res.ok) {
        const data = await res.json()
        if (data.data?.flags) {
          set({ moduleFlags: data.data.flags })
        }
      }
    } catch (e) {
      console.error('Failed to fetch module flags:', e)
    }
  },
}))
