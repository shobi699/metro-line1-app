import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../shared/config'

export interface MobileConfig {
  appName: string
  brandColor: string
  chatMaxMessageLength: number
  allowNoWagon: boolean
  appVersion?: string
  developerText?: string
  socialLinks?: Array<{ platform: string; url: string; icon: string }>
  shifts?: {
    showHolidays: boolean
  }
  mobile: {
    enableSos: boolean
    geofencingEnabled: boolean
    geofencingRadius: number
    offlineCacheEnabled: boolean
    sosRecipientPhone: string
    activeTheme: 'dark' | 'light' | 'system'
    locationTrackingInterval: number
    dashboardBanner?: {
      enabled: boolean
      url: string
      link: string
    }
  }
  leaveTypes?: Array<{ label: string; value: string; maxDaysPerMonth: number; requiresApproval: boolean }>
  comms?: {
    voiceChatEnabled: boolean
    maxRecordingTime: number
    conferenceEnabled: boolean
    maxConferenceParticipants: number
    radioEnabled: boolean
    radioDefaultChannel: string
    radioTransmissionInterval: number
    radioVibrationEnabled: boolean
    audioBitrate: '16kbps' | '32kbps' | '64kbps'
  }
}

export interface ModuleFlag {
  id: string
  enabled: boolean
  matchingPrefixes: string[]
}

interface ConfigState {
  config: MobileConfig | null
  moduleFlags: ModuleFlag[]
  isLoading: boolean
  fetchConfig: () => Promise<void>
  fetchModuleFlags: () => Promise<void>
  loadPersistedConfig: () => Promise<void>
  isModuleEnabled: (id: string) => boolean
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  moduleFlags: [],
  isLoading: false,

  async fetchConfig() {
    set({ isLoading: true })
    try {
      const res = await fetch(`${API_URL}/config`)
      if (res.ok) {
        const data = await res.json()
        const configData = data.data as MobileConfig
        await AsyncStorage.setItem('@app_config', JSON.stringify(configData))
        set({ config: configData, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch (err) {
      console.error('Error fetching config on mobile:', err)
      set({ isLoading: false })
    }
  },

  async fetchModuleFlags() {
    try {
      const res = await fetch(`${API_URL}/modules/public`)
      if (res.ok) {
        const data = await res.json()
        if (data.data?.flags) {
          const flags = data.data.flags as ModuleFlag[]
          await AsyncStorage.setItem('@module_flags', JSON.stringify(flags))
          set({ moduleFlags: flags })
        }
      }
    } catch (err) {
      console.error('Error fetching module flags on mobile:', err)
    }
  },

  async loadPersistedConfig() {
    try {
      const stored = await AsyncStorage.getItem('@app_config')
      if (stored) {
        set({ config: JSON.parse(stored) as MobileConfig })
      }
      const storedFlags = await AsyncStorage.getItem('@module_flags')
      if (storedFlags) {
        set({ moduleFlags: JSON.parse(storedFlags) as ModuleFlag[] })
      }
    } catch (err) {
      console.error('Error loading persisted config:', err)
    }
  },

  isModuleEnabled(id: string) {
    const flags = get().moduleFlags
    if (!flags || flags.length === 0) return true
    const flag = flags.find((f) => f.id === id)
    return flag ? flag.enabled : true
  },
}))
