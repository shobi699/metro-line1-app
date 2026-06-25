import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useConfigStore } from '../stores/config'
import { AlertOctagon, ShieldAlert } from 'lucide-react-native'

export function SOSScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const config = useConfigStore((s) => s.config)
  
  const rooms = useChatStore((s) => s.rooms)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const loadRooms = useChatStore((s) => s.loadRooms)

  const [loading, setLoading] = useState(false)
  const [activeAlarm, setActiveAlarm] = useState(false)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (accessToken && rooms.length === 0) {
      loadRooms(accessToken)
    }
  }, [accessToken])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (activeAlarm && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (activeAlarm && countdown === 0) {
      triggerSOS()
    }
    return () => clearInterval(timer)
  }, [activeAlarm, countdown])

  async function triggerSOS() {
    setLoading(true)
    
    // پیدا کردن چت‌روم مرکز فرمان (OCC)
    const occRoom = rooms.find((r) => r.kind === 'occ' || r.name.includes('OCC') || r.name.includes('مرکز فرمان'))
    
    if (!occRoom) {
      Alert.alert('خطا', 'اتاق گفتگوی مرکز فرمان (OCC) جهت ارسال آلارم یافت نشد.')
      setActiveAlarm(false)
      setCountdown(5)
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
        // نادیده گرفتن خطا و استفاده از فرضی
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

    setActiveAlarm(false)
    setCountdown(5)
    setLoading(false)
  }

  function handleButtonPress() {
    if (activeAlarm) {
      // لغو آلارم
      setActiveAlarm(false)
      setCountdown(5)
    } else {
      // شروع شمارش معکوس برای ارسال خودکار جهت جلوگیری از خطای ناخواسته
      setActiveAlarm(true)
    }
  }

  const isSosEnabled = config?.mobile?.enableSos ?? true

  if (!isSosEnabled) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ShieldAlert size={28} color="#8e8e93" />
          <Text style={styles.headerTitle}>سیستم دکمه اضطراری (SOS)</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.sosButton, styles.sosButtonDisabled]}>
            <AlertOctagon size={64} color="#8e8e93" />
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
        <ShieldAlert size={28} color="#e53935" />
        <Text style={styles.headerTitle}>سیستم دکمه اضطراری (SOS)</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.infoText}>
          در صورت بروز سانحه یا نقص فنی بحرانی در تونل یا ایستگاه، دکمه قرمز زیر را بفشارید.
        </Text>

        <TouchableOpacity
          style={[styles.sosButton, activeAlarm ? styles.sosButtonActive : null]}
          onPress={handleButtonPress}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#ffffff" />
          ) : activeAlarm ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
              <Text style={styles.countdownText}>ثانیه تا ارسال (کلیک جهت لغو)</Text>
            </View>
          ) : (
            <AlertOctagon size={64} color="#ffffff" />
          )}
        </TouchableOpacity>

        <Text style={styles.statusText}>
          {activeAlarm 
            ? '🚨 در حال ارسال سیگنال اضطراری به مرکز فرمان...'
            : 'وضعیت: آماده به کار'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13151a',
    padding: 24,
  },
  alarmContainer: {
    backgroundColor: '#3a0c11', // قرمز تیره چشمک‌زن/هشدار
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#f2f2f7',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  infoText: {
    color: '#a0a3b0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#e53935', // قرمز اضطراری
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: 'rgba(229, 57, 53, 0.2)',
    elevation: 8,
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sosButtonActive: {
    backgroundColor: '#ff1744',
    borderColor: 'rgba(255, 23, 68, 0.4)',
  },
  sosButtonDisabled: {
    backgroundColor: '#262930',
    borderColor: '#3a3d46',
    shadowOpacity: 0,
    elevation: 0,
  },
  countdownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  countdownText: {
    fontSize: 11,
    color: '#ffffff',
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#a0a3b0',
    fontWeight: '500',
  },
})
export default SOSScreen
