import React, { useEffect } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { WifiOff, RefreshCw } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNetworkStore } from '../stores/network'
import { useOfflineCacheStore } from '../stores/offline-cache'

export function OfflineBanner() {
  const insets = useSafeAreaInsets()
  const isOffline = useNetworkStore((s) => s.isOffline)
  const wasOffline = useNetworkStore((s) => s.wasOffline)
  const checkConnection = useNetworkStore((s) => s.checkConnection)
  const initCache = useOfflineCacheStore((s) => s.init)
  const queueLength = useOfflineCacheStore((s) => s.getQueueLength())
  const isInitialized = useOfflineCacheStore((s) => s.isInitialized)

  useEffect(() => {
    if (!isInitialized) initCache()
    checkConnection()

    const interval = setInterval(() => {
      checkConnection()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  if (wasOffline) return null

  if (!isOffline) return null

  return (
    <View style={[styles.banner, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={styles.content}>
        <WifiOff size={16} color="#ffffff" style={styles.icon} />
        <Text style={styles.text}>
          {queueLength > 0
            ? `ارتباط قطع است — ${queueLength} درخواست در صف`
            : 'ارتباط قطع است — در حال نمایش داده‌های ذخیره‌شده'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#b71c1c',
    width: '100%',
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  icon: {
    marginLeft: 4,
  },
})
