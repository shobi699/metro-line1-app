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
import { AlertOctagon, ShieldAlert } from 'lucide-react-native'

export function SOSScreen() {
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

    Vibration.vibrate(80) // بازخورد لمسی اولیه
    const startTime = Date.now()

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / 3000) * 100, 100) // نگه داشتن به مدت ۳ ثانیه

      setHoldProgress(progress)

      // لرزش‌های کوتاه دوره‌ای در حین نگه داشتن دکمه برای حس فیزیکی دکمه صنعتی
      if (progress < 100 && Math.floor(elapsed / 300) % 2 === 0) {
        Vibration.vibrate(20)
      }

      if (progress >= 100) {
        if (holdIntervalRef.current) {
          clearInterval(holdIntervalRef.current)
          holdIntervalRef.current = null
        }
        Vibration.vibrate([0, 500]) // لرزش ممتد و قوی هنگام فعال‌سازی موفقیت‌آمیز
        void triggerSOS()
      }
    }, 50)
  }

  const handlePressOut = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
    if (holdProgress < 100) {
      setHoldProgress(0)
    }
  }

  async function triggerSOS() {
    setLoading(true)
    setActiveAlarm(true)
    
    // پیدا کردن چت‌روم مرکز فرمان (OCC)
    const occRoom = rooms.find((r) => r.kind === 'occ' || r.name.includes('OCC') || r.name.includes('مرکز فرمان'))
    
    if (!occRoom) {
      Alert.alert('خطا', 'اتاق گفتگوی مرکز فرمان (OCC) جهت ارسال آلارم یافت نشد.')
      setActiveAlarm(false)
      setHoldProgress(0)
      setLoading(false)
      return
    }

    // موقعیت پیش‌فرض شبیه‌سازی شده (ایستگاه دروازه دولت)
    let lat = 35.7014
    let lng = 51.4215
    let locationSource = 'ایستگاه دروازه دولت (موقعیت فرضی)'

    // تلاش برای دریافت موقعیت واقعی از GPS
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 }),
        )
        lat = pos.coords.latitude
        lng = pos.coords.longitude
        locationSource = 'موقعیت واقعی دستگاه'
      } catch (e) {
        // نادیده گرفتن خطا و استفاده از لوکیشن شبیه‌سازی شده پیش‌فرض
      }
    }

    const messageBody = `🚨 هشدار اضطراری (SOS)\nموقعیت: ${locationSource} (${lat.toFixed(5)}, ${lng.toFixed(5)})\nفرستنده: ${user?.name} (کد ملی: ${user?.nationalId})`

    if (accessToken) {
      const success = await sendMessage(accessToken, occRoom.id, messageBody)
      if (success) {
        Alert.alert('ارسال شد', 'آلارم اضطراری به همراه موقعیت جغرافیایی شما با موفقیت به مرکز فرمان مخابره گردید.')
      } else {
        Alert.alert(
          'خطا در ارسال',
          `ارسال اینترنتی آلارم ناموفق بود. لطفاً پیامک اضطراری به شماره دیسپچ پشتیبان OCC ارسال کنید:\n${config?.mobile?.sosRecipientPhone ?? '09120000000'}`
        )
      }
    }

    setLoading(false)
  }

  function handleCancelAlarm() {
    Vibration.vibrate(100)
    setActiveAlarm(false)
    setHoldProgress(0)
  }

  const isSosEnabled = config?.mobile?.enableSos ?? true

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 24,
    },
    alarmContainer: {
      backgroundColor: '#fde8e8', // قرمز بسیار روشن برای حالت آلارم فعال در تم لایت
    },
    header: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 40,
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      fontFamily: theme.typography.screenTitle.fontFamily,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 32,
    },
    infoText: {
      color: theme.colors.secondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 20,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    sosButton: {
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: theme.colors.error, // قرمز اضطراری
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 8,
      borderColor: theme.colors.error + '30',
      elevation: 8,
      shadowColor: theme.colors.error,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
    },
    sosButtonActive: {
      backgroundColor: '#ff1744',
      borderColor: 'rgba(255, 23, 68, 0.4)',
    },
    sosButtonDisabled: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    countdownContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    countdownNumber: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
      fontFamily: theme.typography.numericHero.fontFamily,
    },
    countdownText: {
      fontSize: 11,
      color: '#ffffff',
      marginTop: 6,
      textAlign: 'center',
      paddingHorizontal: 12,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontWeight: '700',
    },
    progressTrack: {
      width: 200,
      height: 8,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: -8,
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.colors.error,
    },
    statusText: {
      fontSize: 13,
      color: theme.colors.secondary,
      fontWeight: '600',
      textAlign: 'center',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
  })

  if (!isSosEnabled) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ShieldAlert size={28} color={theme.colors.secondary} />
          <Text style={styles.headerTitle}>سیستم دکمه اضطراری (SOS)</Text>
        </View>

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
    )
  }

  return (
    <View style={[styles.container, activeAlarm ? styles.alarmContainer : null]}>
      <View style={styles.header}>
        <ShieldAlert size={28} color={theme.colors.error} />
        <Text style={styles.headerTitle}>سیستم دکمه اضطراری (SOS)</Text>
      </View>

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
  )
}

export default SOSScreen
