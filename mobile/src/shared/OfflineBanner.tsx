import React, { useEffect } from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { WifiOff } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNetworkStore } from '../stores/network'

export function OfflineBanner() {
  const insets = useSafeAreaInsets()
  const isOffline = useNetworkStore((s) => s.isOffline)
  const checkConnection = useNetworkStore((s) => s.checkConnection)

  useEffect(() => {
    checkConnection()

    // Check connection every 10 seconds
    const interval = setInterval(() => {
      checkConnection()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  if (!isOffline) return null

  return (
    <View style={[styles.banner, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={styles.content}>
        <Text style={styles.text}>ارتباط قطع است - در حال نمایش داده‌های ذخیره‌شده</Text>
        <WifiOff size={16} color="#ffffff" style={styles.icon} />
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
