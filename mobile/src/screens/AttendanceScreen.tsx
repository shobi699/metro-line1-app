import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../stores/auth'
import { toFa } from '../shared/jalali'
import { API_URL } from '../shared/config'
import { LogIn, LogOut, MapPin, CheckCircle, Clock, Navigation } from 'lucide-react-native'
import { useConfigStore } from '../stores/config'


interface AttendanceRecord {
  id: string
  stationId: string | null
  checkInGeo: string | null
  checkInTime: string
  checkOutGeo: string | null
  checkOutTime: string | null
  method: string
}

interface MetroStation {
  id: string
  name: string
  lat: number
  lng: number
  radius: number
}

const METRO_STATIONS: MetroStation[] = [
  { id: 'station_tajrish', name: 'ایستگاه تجریش', lat: 35.8052, lng: 51.4316, radius: 150 },
  { id: 'station_ghods', name: 'ایستگاه شهدای هفتم تیر', lat: 35.7175, lng: 51.4244, radius: 150 },
  { id: 'station_darvazeh_dolat', name: 'ایستگاه دروازه دولت', lat: 35.7014, lng: 51.4215, radius: 150 },
  { id: 'station_emam_khomeini', name: 'ایستگاه امام خمینی', lat: 35.6908, lng: 51.4208, radius: 150 },
  { id: 'station_shahr_e_rey', name: 'ایستگاه شهر ری', lat: 35.5925, lng: 51.4358, radius: 150 },
  { id: 'station_kahrizak', name: 'ایستگاه کهریزک', lat: 35.5235, lng: 51.3592, radius: 200 },
  { id: 'depot_kahrizak', name: 'دپوی کهریزک', lat: 35.5180, lng: 51.3650, radius: 300 },
]

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

import { useTheme } from '../shared/ThemeProvider'

export function AttendanceScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const config = useConfigStore((s) => s.config)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const { theme } = useTheme()

  // Geofencing states
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [activeStation, setActiveStation] = useState<MetroStation | null>(null)
  const [activeDistance, setActiveDistance] = useState<number | null>(null)
  const [autoCheckIn, setAutoCheckIn] = useState(false)
  const [mockLocationKey, setMockLocationKey] = useState<'real' | 'darvazeh' | 'outside'>('real')
  
  const autoCheckInRef = useRef(autoCheckIn)
  const todayRecordRef = useRef(todayRecord)

  // Sync refs for background auto check-in
  useEffect(() => {
    autoCheckInRef.current = autoCheckIn
  }, [autoCheckIn])

  useEffect(() => {
    todayRecordRef.current = todayRecord
  }, [todayRecord])

  // Load auto check-in preference on mount
  useEffect(() => {
    async function loadAutoPrefs() {
      try {
        const val = await AsyncStorage.getItem('@auto_checkin_enabled')
        if (val) setAutoCheckIn(JSON.parse(val))
      } catch (e) {
        console.error('Error loading auto checkin settings:', e)
      }
    }
    loadAutoPrefs()
  }, [])

  async function loadData() {
    if (!accessToken) return
    setLoading(true)
    try {
      const [todayRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/attendance/check-in`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/attendance/me?limit=14`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ])
      if (todayRes.ok) {
        const data = await todayRes.json()
        setTodayRecord(data.data)
      }
      if (historyRes.ok) {
        const data = await historyRes.json()
        setHistory(data.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [accessToken])

  // Handle GPS location updates and mock selections
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    const updateInterval = (config?.mobile?.locationTrackingInterval ?? 30) * 1000

    const updateLocation = async () => {
      let lat = 0
      let lng = 0

      if (mockLocationKey === 'darvazeh') {
        // Mock coordinates for Darvazeh Dolat (Within geofence)
        lat = 35.7014
        lng = 51.4215
      } else if (mockLocationKey === 'outside') {
        // Mock coordinates for outside metro line (e.g., Milad Tower)
        lat = 35.7448
        lng = 51.3753
      } else {
        // Real GPS Coordinates (fallbacks to gate if navigator fails)
        lat = 35.7012
        lng = 51.4211
        if (navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 }),
            )
            lat = pos.coords.latitude
            lng = pos.coords.longitude
          } catch { /* ignore fallback */ }
        }
      }

      setCurrentCoords({ lat, lng })

      // Calculate nearest geofence
      let nearestStation: MetroStation | null = null
      let minDistance = Infinity

      for (const station of METRO_STATIONS) {
        const dist = getDistanceInMeters(lat, lng, station.lat, station.lng)
        if (dist < minDistance) {
          minDistance = dist
          nearestStation = station
        }
      }

      const configuredRadius = config?.mobile?.geofencingRadius ?? 100
      const isGeofencingEnabled = config?.mobile?.geofencingEnabled !== false

      if (nearestStation && (!isGeofencingEnabled || minDistance <= (configuredRadius ?? nearestStation.radius))) {
        setActiveStation(nearestStation)
        setActiveDistance(minDistance)
        
        // Auto check-in trigger
        if (autoCheckInRef.current && !todayRecordRef.current && !checking) {
          triggerAutoCheckIn(nearestStation.id, `${lat},${lng}`)
        }
      } else {
        setActiveStation(null)
        setActiveDistance(null)
      }
    }

    updateLocation()
    interval = setInterval(updateLocation, updateInterval)
    return () => clearInterval(interval)
  }, [mockLocationKey, config?.mobile?.locationTrackingInterval])

  async function triggerAutoCheckIn(stationId: string, locationStr: string) {
    if (!accessToken) return
    setChecking(true)
    try {
      const res = await fetch(`${API_URL}/attendance/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkIn', stationId, geoLocation: locationStr }),
      })
      if (res.ok) {
        Alert.alert('ورود خودکار', 'حضور شما در محدوده مجاز ایستگاه به طور خودکار ثبت شد.')
        loadData()
      }
    } catch (e) {
      console.error('Auto check-in error:', e)
    } finally {
      setChecking(false)
    }
  }

  async function handleCheckIn() {
    if (!accessToken) return
    const isGeofencingEnabled = config?.mobile?.geofencingEnabled !== false
    if (isGeofencingEnabled && (!activeStation || !currentCoords)) {
      Alert.alert('خطا در موقعیت‌یابی', 'شما خارج از محدوده مجاز ایستگاه‌های مترو هستید.')
      return
    }

    const station = activeStation || METRO_STATIONS[0]
    const locationStr = currentCoords ? `${currentCoords.lat},${currentCoords.lng}` : '35.7014,51.4215'

    setChecking(true)
    try {
      const res = await fetch(`${API_URL}/attendance/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'checkIn', 
          stationId: station.id, 
          geoLocation: locationStr 
        }),
      })

      const data = await res.json()
      if (res.ok) {
        Alert.alert('موفقیت', `ورود شما در ${station.name} ثبت شد.`)
        loadData()
      } else {
        Alert.alert('خطای سرور', data.error || 'خطا در ثبت حضور')
      }
    } finally {
      setChecking(false)
    }
  }

  async function handleCheckOut() {
    if (!accessToken) return
    setChecking(true)
    try {
      let locationStr: string | undefined
      if (currentCoords) {
        locationStr = `${currentCoords.lat},${currentCoords.lng}`
      }
      
      const res = await fetch(`${API_URL}/attendance/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkOut', geoLocation: locationStr }),
      })

      if (res.ok) {
        Alert.alert('موفقیت', 'خروج شما با موفقیت ثبت شد.')
        loadData()
      } else {
        const data = await res.json()
        Alert.alert('خطا', data.error || 'خطا در ثبت خروج')
      }
    } finally {
      setChecking(false)
    }
  }

  const handleAutoCheckInChange = async (val: boolean) => {
    setAutoCheckIn(val)
    try {
      await AsyncStorage.setItem('@auto_checkin_enabled', JSON.stringify(val))
    } catch (e) {
      console.error(e)
    }
  }

  const isCheckedIn = todayRecord && !todayRecord.checkOutTime
  const isButtonDisabled = !isCheckedIn && !activeStation

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.containerMargin },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    geofenceCard: { 
      backgroundColor: theme.colors.surfaceContainerLowest, 
      borderWidth: 1, 
      borderColor: theme.colors.border, 
      borderLeftWidth: 4, 
      borderRadius: theme.borderRadius.xl, 
      padding: 16, 
      marginBottom: 16,
      ...theme.shadows.level1,
    },
    geofenceCardActive: { borderLeftColor: theme.colors.success },
    geofenceCardInactive: { borderLeftColor: theme.colors.error },
    geofenceHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 6 },
    geofenceTitle: { color: theme.colors.onSurface, fontSize: 13, fontWeight: '800', fontFamily: theme.typography.cardTitle.fontFamily },
    geofenceCoords: { color: theme.colors.secondary, fontSize: 10, textAlign: 'right', fontFamily: 'monospace' },
    geofenceStatus: { fontSize: 11, fontWeight: '700', marginTop: 4, textAlign: 'right', fontFamily: theme.typography.captionSm.fontFamily },
    geofenceStatusActive: { color: theme.colors.success },
    geofenceStatusInactive: { color: theme.colors.error },
    debugContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 8 },
    debugTitle: { color: theme.colors.secondary, fontSize: 10, textAlign: 'right', marginBottom: 6, fontFamily: theme.typography.captionSm.fontFamily },
    debugButtons: { flexDirection: 'row-reverse', gap: 6 },
    debugBtn: { flex: 1, height: 28, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: theme.borderRadius.md, justifyContent: 'center', alignItems: 'center' },
    debugBtnActive: { backgroundColor: theme.colors.primaryContainer },
    debugBtnText: { color: theme.colors.primary, fontSize: 10, fontWeight: '800', fontFamily: theme.typography.captionSm.fontFamily },
    autoCheckInRow: { 
      flexDirection: 'row-reverse', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      backgroundColor: theme.colors.surfaceContainerLowest, 
      borderWidth: 1, 
      borderColor: theme.colors.border, 
      borderRadius: theme.borderRadius.xl, 
      padding: 16, 
      marginBottom: 16,
      ...theme.shadows.level1,
    },
    autoCheckInText: { alignItems: 'flex-start', flex: 1, paddingStart: 12 },
    autoCheckInTitle: { color: theme.colors.onSurface, fontSize: 13, fontWeight: '800', textAlign: 'right', fontFamily: theme.typography.cardTitle.fontFamily },
    autoCheckInDesc: { color: theme.colors.secondary, fontSize: 9, marginTop: 2, textAlign: 'right', fontFamily: theme.typography.captionSm.fontFamily },
    statusCard: { 
      alignItems: 'center', 
      backgroundColor: theme.colors.surfaceContainerLowest, 
      borderWidth: 1, 
      borderColor: theme.colors.border, 
      borderRadius: theme.borderRadius.xxl, 
      padding: 24, 
      marginBottom: 20,
      ...theme.shadows.level2,
    },
    statusIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: theme.colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statusIconActive: { backgroundColor: theme.colors.success + '1A' },
    statusText: { fontSize: 18, fontWeight: '800', color: theme.colors.onSurface, fontFamily: theme.typography.screenTitle.fontFamily },
    timeText: { fontSize: 13, color: theme.colors.secondary, marginTop: 4, fontWeight: '600', fontFamily: theme.typography.bodyMd.fontFamily },
    warningText: { fontSize: 11, color: theme.colors.error, textAlign: 'center', marginTop: 12, paddingHorizontal: 10, fontWeight: '700', fontFamily: theme.typography.captionSm.fontFamily },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 48, borderRadius: theme.borderRadius.lg, marginTop: 16, ...theme.shadows.level1 },
    actionButtonDisabled: { backgroundColor: theme.colors.surfaceContainerLow, opacity: 0.5 },
    checkInButton: { backgroundColor: theme.colors.success },
    checkOutButton: { backgroundColor: theme.colors.error },
    actionText: { color: '#ffffff', fontSize: 15, fontWeight: '800', fontFamily: theme.typography.cardTitle.fontFamily },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.onSurface, textAlign: 'right', marginBottom: 12, fontFamily: theme.typography.sectionTitle.fontFamily },
    listContainer: { paddingBottom: 20 },
    historyCard: { 
      flexDirection: 'row-reverse', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      backgroundColor: theme.colors.surfaceContainerLowest, 
      borderWidth: 1, 
      borderColor: theme.colors.border, 
      borderRadius: theme.borderRadius.lg, 
      padding: 12, 
      marginBottom: 8,
      ...theme.shadows.level1,
    },
    historyLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
    historyDate: { fontSize: 13, color: theme.colors.onSurface, fontWeight: '700', textAlign: 'right', fontFamily: theme.typography.bodyMd.fontFamily },
    historyTime: { fontSize: 11, color: theme.colors.secondary, textAlign: 'right', marginTop: 2, fontWeight: '600', fontFamily: 'monospace' },
    historyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.borderRadius.sm },
    badgeComplete: { backgroundColor: theme.colors.success + '1A' },
    badgeActive: { backgroundColor: theme.colors.warning + '1A' },
    historyBadgeText: { fontSize: 10, fontWeight: '700', fontFamily: theme.typography.captionSm.fontFamily },
    badgeTextComplete: { color: theme.colors.success },
    badgeTextActive: { color: theme.colors.warning },
    emptyText: { color: theme.colors.secondary, fontSize: 13, fontWeight: '600', fontFamily: theme.typography.bodyMd.fontFamily },
  })

  return (
    <View style={styles.container}>
      {/* Geofencing Indicator */}
      <View style={[styles.geofenceCard, activeStation ? styles.geofenceCardActive : styles.geofenceCardInactive]}>
        <View style={styles.geofenceHeader}>
          <Navigation size={18} color={activeStation ? theme.colors.success : theme.colors.error} />
          <Text style={styles.geofenceTitle}>وضعیت موقعیت‌یابی هوشمند (Geofencing)</Text>
        </View>
        <Text style={styles.geofenceCoords}>
          مختصات فعلی: {currentCoords ? toFa(`${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}`) : 'در حال دریافت...'}
        </Text>
        <Text style={[styles.geofenceStatus, activeStation ? styles.geofenceStatusActive : styles.geofenceStatusInactive]}>
          {activeStation 
            ? `حضور در محدوده: ${activeStation.name} (فاصله: ${toFa(Math.round(activeDistance || 0))} متر)`
            : 'خارج از محدوده مجاز ایستگاه‌ها'}
        </Text>

        {/* Debug Location Mocking Selector */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>دیباگ جی‌پی‌اس (تست دستی):</Text>
          <View style={styles.debugButtons}>
            <TouchableOpacity 
              style={[styles.debugBtn, mockLocationKey === 'real' ? styles.debugBtnActive : null]}
              onPress={() => setMockLocationKey('real')}
            >
              <Text style={styles.debugBtnText}>GPS واقعی</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.debugBtn, mockLocationKey === 'darvazeh' ? styles.debugBtnActive : null]}
              onPress={() => setMockLocationKey('darvazeh')}
            >
              <Text style={styles.debugBtnText}>دروازه دولت</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.debugBtn, mockLocationKey === 'outside' ? styles.debugBtnActive : null]}
              onPress={() => setMockLocationKey('outside')}
            >
              <Text style={styles.debugBtnText}>خارج خط</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Auto Check-in Toggle */}
      <View style={styles.autoCheckInRow}>
        <Switch
          value={autoCheckIn}
          onValueChange={handleAutoCheckInChange}
          trackColor={{ false: theme.colors.border, true: theme.colors.primaryContainer }}
          thumbColor={autoCheckIn ? theme.colors.primary : theme.colors.secondary}
        />
        <View style={styles.autoCheckInText}>
          <Text style={styles.autoCheckInTitle}>ثبت حضور خودکار (Geofencing Auto Check-In)</Text>
          <Text style={styles.autoCheckInDesc}>با ورود به محدوده ایستگاه، حضور شما بدون نیاز به باز کردن اپ ثبت می‌شود.</Text>
        </View>
      </View>

      {/* Check In/Out Card */}
      <View style={styles.statusCard}>
        <View style={[styles.statusIcon, isCheckedIn ? styles.statusIconActive : null]}>
          {isCheckedIn ? <CheckCircle size={40} color={theme.colors.success} /> : <Clock size={40} color={theme.colors.secondary} />}
        </View>
        <Text style={styles.statusText}>{isCheckedIn ? 'در حال خدمت' : 'خارج از خدمت'}</Text>
        {todayRecord && (
          <Text style={styles.timeText}>
            ورود: {toFa(new Date(todayRecord.checkInTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}
            {todayRecord.checkOutTime && <> — خروج: {toFa(new Date(todayRecord.checkOutTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}</>}
          </Text>
        )}

        {!isCheckedIn && !activeStation && (
          <Text style={styles.warningText}>
            ⚠️ جهت ثبت ورود باید در محدوده یکی از ایستگاه‌های خط ۱ قرار داشته باشید.
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.actionButton, 
            isCheckedIn ? styles.checkOutButton : styles.checkInButton,
            isButtonDisabled ? styles.actionButtonDisabled : null
          ]}
          onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
          disabled={checking || isButtonDisabled}
          activeOpacity={0.7}
        >
          {checking ? (
            <ActivityIndicator color="#ffffff" />
          ) : isCheckedIn ? (
            <><LogOut size={18} color="#ffffff" /><Text style={styles.actionText}>ثبت خروج</Text></>
          ) : (
            <><LogIn size={18} color="#ffffff" /><Text style={styles.actionText}>ثبت ورود هوشمند</Text></>
          )}
        </TouchableOpacity>
      </View>

      {/* History */}
      <Text style={styles.sectionTitle}>تاریخچه حضور</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const station = METRO_STATIONS.find(s => s.id === item.stationId)
          return (
            <View style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <MapPin size={14} color={theme.colors.secondary} />
                <View>
                  <Text style={styles.historyDate}>
                    {toFa(new Date(item.checkInTime).toLocaleDateString('fa-IR'))} - {station ? station.name : 'ایستگاه ثبت‌نشده'}
                  </Text>
                  <Text style={styles.historyTime}>
                    {toFa(new Date(item.checkInTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}
                    {item.checkOutTime && <> — {toFa(new Date(item.checkOutTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }))}</>}
                  </Text>
                </View>
              </View>
              <View style={[styles.historyBadge, item.checkOutTime ? styles.badgeComplete : styles.badgeActive]}>
                <Text style={[styles.historyBadgeText, item.checkOutTime ? styles.badgeTextComplete : styles.badgeTextActive]}>
                  {item.checkOutTime ? 'تکمیل' : 'فعال'}
                </Text>
              </View>
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>سوابق حضوری ثبت نشده است</Text>
          </View>
        }
      />
    </View>
  )
}

export default AttendanceScreen

