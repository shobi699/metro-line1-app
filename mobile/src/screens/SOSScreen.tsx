import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Vibration,
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useConfigStore } from '../stores/config'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { AlertOctagon, ShieldAlert } from 'lucide-react-native'

export function SOSScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const config = useConfigStore((s) => s.config)
  const { theme } = useTheme()
  
  const rooms = useChatStore((s) => s.rooms)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const loadRooms = useChatStore((s) => s.loadRooms)

  const [loading, setLoading] = useState(false)
  const [activeAlarm, setActiveAlarm] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)

  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (accessToken && rooms.length === 0) {
      loadRooms(accessToken)
    }
  }, [accessToken])

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current)
      }
    }
  }, [])

  const handlePressIn = () => {
    if (activeAlarm || loading) return

    Vibration.vibrate(80)
    const startTime = Date.now()

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / 3000) * 100, 100)

      setHoldProgress(progress)

      // لرزش‌های کوتاه دوره‌ای در حین نگه داشتن دکمه برای حس فیزیکی دکمه صنعتی
      if (progress < 100 && Math.floor(elapsed / 300) % 2 === 0) {
        Vibration.vibrate([0, 30])
      }

      if (progress >= 100) {
        if (holdIntervalRef.current) {
          clearInterval(holdIntervalRef.current)
        }
        triggerSOS()
      }
    }, 100)
  }

  const handlePressOut = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
    }
    if (!activeAlarm) {
      setHoldProgress(0)
    }
  }

  const triggerSOS = async () => {
    setLoading(true)
    Vibration.vibrate([0, 300, 100, 300, 100, 500]) // الگوی لرزش اضطراری شدید

    // پیدا کردن یا ایجاد چیت اضطراری و ارسال مکان زنده
    const sosRoom = rooms.find((r) => r.type === 'group' && (r.name.includes('SOS') || r.kind === 'occ' || r.name.includes('OCC')))
    if (sosRoom && accessToken) {
      try {
        await sendMessage(
          sosRoom.id,
          `🚨 اعلام اضطراری SOS زنده!\nفرستنده: ${user?.name || 'پرسنل'}\nموقعیت: راهبر خط ۱ - قطار جاری`,
          accessToken
        )
      } catch (e) {
        console.error('Error sending SOS message:', e)
      }
    }

    setActiveAlarm(true)
    setHoldProgress(0)
    setLoading(false)
  }

  const handleCancelAlarm = () => {
    Vibration.vibrate(100)
    setActiveAlarm(false)
    setHoldProgress(0)
    Alert.alert('اطلاع', 'اعلام وضعیت اضطراری غیرفعال شد.')
  }

  const isSosEnabled = config?.mobile?.enableSos !== false

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    alarmContainer: {
      backgroundColor: '#3b0712',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    sosButton: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: theme.colors.error,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.level2,
      elevation: 8,
      borderWidth: 6,
      borderColor: '#3b0712',
      marginBottom: 24,
    },
    sosButtonActive: {
      backgroundColor: '#ef4444',
      borderColor: '#fee2e2',
      borderWidth: 8,
      transform: [{ scale: 1.15 }],
    },
    sosButtonDisabled: {
      backgroundColor: theme.colors.surfaceContainer,
      borderColor: theme.colors.border,
    },
    progressTrack: {
      position: 'absolute',
      top: '60%',
      width: '80%',
      height: 6,
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.colors.error,
    },
    countdownContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    countdownNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      fontFamily: theme.typography.numericHero.fontFamily,
    },
    countdownText: {
      fontSize: 12,
      color: '#ffffff',
      marginTop: 4,
      fontWeight: '800',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    statusText: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.primary,
      marginTop: 20,
      textAlign: 'center',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
  })

  if (!isSosEnabled) {
    return (
      <ScreenWrapper title="سیستم دکمه اضطراری (SOS)" navigation={navigation}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={[styles.sosButton, styles.sosButtonDisabled]}>
              <AlertOctagon size={64} color={theme.colors.secondary} />
            </View>

            <Text style={styles.infoText}>
              این سیستم در حال حاضر توسط مدیریت ارشد غیرفعال شده است. در صورت نیاز اضطراری، مستقیماً از طریق بیسیم یا تلفن‌های داخلی تماس بگیرید.
            </Text>

            <Text style={styles.statusText}>وضعیت: غیرفعال</Text>
          </View>
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper title="سیستم دکمه اضطراری (SOS)" navigation={navigation}>
      <View style={[styles.container, activeAlarm ? styles.alarmContainer : null]}>
        <View style={styles.content}>
          <Text style={styles.infoText}>
            در صورت بروز سانحه یا نقص فنی بحرانی در تونل یا ایستگاه، دکمه قرمز زیر را ۳ ثانیه فشرده نگه دارید.
          </Text>

          <TouchableOpacity
            style={[
              styles.sosButton,
              activeAlarm ? styles.sosButtonActive : null,
              holdProgress > 0 && holdProgress < 100 ? { transform: [{ scale: 1 + holdProgress / 300 }] } : null
            ]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={activeAlarm ? handleCancelAlarm : undefined}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : activeAlarm ? (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownNumber}>🚨</Text>
                <Text style={styles.countdownText}>لغو هشدار (ضربه بزنید)</Text>
              </View>
            ) : holdProgress > 0 ? (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownNumber}>{Math.round(holdProgress)}%</Text>
                <Text style={styles.countdownText}>نگه دارید...</Text>
              </View>
            ) : (
              <AlertOctagon size={64} color="#ffffff" />
            )}
          </TouchableOpacity>

          {holdProgress > 0 && holdProgress < 100 && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${holdProgress}%` }]} />
            </View>
          )}

          <Text style={styles.statusText}>
            {activeAlarm
              ? '🚨 سیگنال اضطراری به همراه موقعیت به مرکز فرمان ارسال شد!'
              : holdProgress > 0
              ? 'در حال فعال‌سازی دکمه اضطراری...'
              : 'وضعیت: آماده به کار (۳ ثانیه فشرده نگه دارید)'}
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default SOSScreen
