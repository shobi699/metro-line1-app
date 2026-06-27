'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from './store'

interface PrivateConfig {
  occPhone?: string
  maxLoginAttempts?: number
  sessionTimeout?: number
  chatMaxMessageLength?: number
  enableFileSharing?: boolean
  allowNoWagon?: boolean
  requireImage?: boolean
  shifts?: {
    minRestHours?: number
    maxConsecutiveDays?: number
    allowSwapRequests?: boolean
  }
  mobile?: {
    enableSos?: boolean
    geofencingEnabled?: boolean
    geofencingRadius?: number
    offlineCacheEnabled?: boolean
    sosRecipientPhone?: string
    activeTheme?: string
    forceUpdate?: boolean
    locationTrackingInterval?: number
  }
  comms?: {
    voiceChatEnabled?: boolean
    maxRecordingTime?: number
    conferenceEnabled?: boolean
    maxConferenceParticipants?: number
    radioEnabled?: boolean
    radioDefaultChannel?: string
    radioTransmissionInterval?: number
    radioVibrationEnabled?: boolean
    audioBitrate?: string
  }
}

let cachedConfig: PrivateConfig | null = null
let fetchPromise: Promise<PrivateConfig> | null = null

async function fetchPrivateConfig(token: string): Promise<PrivateConfig> {
  if (cachedConfig) return cachedConfig
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/api/config/settings', {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) return {} as PrivateConfig
      return res.json()
    })
    .then((json) => {
      const config = json?.data ?? {}
      cachedConfig = config
      fetchPromise = null
      return config
    })
    .catch(() => {
      fetchPromise = null
      return {} as PrivateConfig
    })

  return fetchPromise
}

export function usePrivateConfig(): PrivateConfig | null {
  const [config, setConfig] = useState<PrivateConfig | null>(cachedConfig)
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (!accessToken) return

    fetchPrivateConfig(accessToken).then((c) => {
      setConfig(c)
    })
  }, [accessToken])

  return config
}
