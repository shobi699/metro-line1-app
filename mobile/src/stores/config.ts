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

interface ConfigState {
  config: MobileConfig | null
  isLoading: boolean
  fetchConfig: () => Promise<void>
  loadPersistedConfig: () => Promise<void>
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
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

  async loadPersistedConfig() {
    try {
      const stored = await AsyncStorage.getItem('@app_config')
      if (stored) {
        set({ config: JSON.parse(stored) as MobileConfig })
      }
    } catch (err) {
      console.error('Error loading persisted config:', err)
    }
  },
}))
