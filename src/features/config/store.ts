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

interface ConfigStore {
  config: AppConfig | null
  setConfig: (config: AppConfig) => void
}

export const useConfigStore = create<ConfigStore>((set) => ({
  config: null,
  setConfig: (config) => set({ config }),
}))
