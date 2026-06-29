import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { useNetworkStore } from '../stores/network'
import { API_URL } from '../shared/config'
import {
  LayoutDashboard,
  Users,
  Calendar,
  ArrowLeftRight,
  AlertTriangle,
  Bell,
  MessageCircle,
  Newspaper,
  Shield,
  ChevronLeft,
  Bot,
  AlertOctagon,
  ClipboardCheck,
  ClipboardList,
  MessageSquare,
  Radio,
} from 'lucide-react-native'

interface DashboardStats {
  users: number
  pendingSwaps: number
  openTickets: number
  unreadBulletins: number
}

interface TodayShift {
  code: string
  note: string | null
}

export function HomeScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const config = useConfigStore((s) => s.config)
  const setGlobalOffline = useNetworkStore((s) => s.setOffline)

  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    pendingSwaps: 0,
    openTickets: 0,
    unreadBulletins: 0,
  })
  const [todayShift, setTodayShift] = useState<TodayShift | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadData() {
    if (!accessToken) return
    try {
      const headers = { Authorization: `Bearer ${accessToken}` }
      const [usersRes, swapsRes, ticketsRes, bulletinsRes, shiftsRes] =
        await Promise.all([
          fetch(`${API_URL}/users?pageSize=1`, { headers }),
          fetch(`${API_URL}/swap-requests/inbox`, { headers }),
          fetch(`${API_URL}/tickets`, { headers }),
          fetch(`${API_URL}/bulletins/pending`, { headers }),
          fetch(`${API_URL}/shifts/me`, { headers }),
        ])

      const [usersData, swapsData, ticketsData, bulletinsData, shiftsData] =
        await Promise.all([
          usersRes.ok ? usersRes.json() : { data: { total: 0 } },
          swapsRes.ok ? swapsRes.json() : { data: [] },
          ticketsRes.ok ? ticketsRes.json() : { data: { stats: { open: 0 } } },
          bulletinsRes.ok ? bulletinsRes.json() : { data: [] },
          shiftsRes.ok ? shiftsRes.json() : { data: [] },
        ])

      const today = new Date().toISOString().split('T')[0]
      const todayShiftData = Array.isArray(shiftsData.data)
        ? shiftsData.data.find((s: { date: string }) => s.date?.startsWith(today))
        : null

      const newStats = {
        users: usersData.data?.total ?? 0,
        pendingSwaps: Array.isArray(swapsData.data) ? swapsData.data.length : 0,
        openTickets: ticketsData.data?.stats?.open ?? 0,
        unreadBulletins: Array.isArray(bulletinsData.data) ? bulletinsData.data.length : 0,
      }

      setStats(newStats)
      setTodayShift(todayShiftData ?? null)
      setGlobalOffline(false)

      // Save to cache if enabled
      if (config?.mobile?.offlineCacheEnabled !== false) {
        await AsyncStorage.multiSet([
          ['@dashboard_stats', JSON.stringify(newStats)],
          ['@today_shift', JSON.stringify(todayShiftData ?? null)]
        ])
      }
    } catch {
      setGlobalOffline(true)
      // Load from cache on network failure
      try {
        const keys = ['@dashboard_stats', '@today_shift']
        const cached = await AsyncStorage.multiGet(keys)
        const cachedStats = cached.find(([k]) => k === '@dashboard_stats')?.[1]
        const cachedShift = cached.find(([k]) => k === '@today_shift')?.[1]

        if (cachedStats) setStats(JSON.parse(cachedStats))
        if (cachedShift) setTodayShift(JSON.parse(cachedShift))
      } catch (err) {
        console.error('Error loading cached data on fetch error:', err)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load cache immediately on mount
  useEffect(() => {
    async function loadCache() {
      try {
        const keys = ['@dashboard_stats', '@today_shift']
        const cached = await AsyncStorage.multiGet(keys)
        const cachedStats = cached.find(([k]) => k === '@dashboard_stats')?.[1]
        const cachedShift = cached.find(([k]) => k === '@today_shift')?.[1]

        if (cachedStats) {
          setStats(JSON.parse(cachedStats))
        }
        if (cachedShift) {
          setTodayShift(JSON.parse(cachedShift))
        }
      } catch (err) {
        console.error('Error loading initial cache:', err)
      } finally {
        setLoading(false)
      }
    }
    
    if (accessToken) {
      loadCache().then(() => {
        loadData()
      })
    }
  }, [accessToken])

  const shiftLabel: Record<string, string> = {
    morning: 'صبح',
    evening: 'عصر',
    night: 'شب',
    off: 'استراحت',
  }

  const shiftColor: Record<string, string> = {
    morning: '#34c759',
    evening: '#007aff',
    night: '#8e8e93',
    off: '#555860',
  }

  const statCards = [
    { title: 'دفتر تلفن', value: `${stats.users}`, icon: Users, color: '#007aff', screen: 'دفتر تلفن' },
    { title: 'شیفت امروز', value: todayShift ? shiftLabel[todayShift.code] ?? '—' : '—', icon: Calendar, color: '#34c759', screen: 'شیفت' },
    { title: 'تعویض شیفت', value: `${stats.pendingSwaps}`, icon: ArrowLeftRight, color: '#ff9500', screen: 'شیفت' },
    { title: 'تیکت‌های باز', value: `${stats.openTickets}`, icon: AlertTriangle, color: '#e53935', screen: 'تیکت‌ها' },
  ]

  const quickActions = [
    { label: 'لوحه و اعزام روزانه', icon: Calendar, screen: 'لوحه' },
    { label: 'چک‌لیست فنی قطار', icon: ClipboardList, screen: 'چک‌لیست‌ها' },
    { label: 'گفت‌وگو', icon: MessageSquare, screen: 'چت' },
    { label: 'کنفرانس صوتی', icon: Radio, screen: 'کنفرانس صوتی' },
    { label: 'بی‌سیم راهبری', icon: Radio, screen: 'بی‌سیم راهبری' },
    { label: 'بخشنامه‌ها', icon: Shield, screen: 'بخشنامه‌ها' },
    { label: 'حضور و غیاب', icon: ClipboardCheck, screen: 'حضور و غیاب' },
    { label: 'تیکت خرابی', icon: AlertTriangle, screen: 'تیکت‌ها' },
    { label: 'دستیار AI', icon: Bot, screen: 'دستیار AI' },
    { label: 'اضطراری SOS', icon: AlertOctagon, screen: 'SOS' },
    { label: 'ثبت بازخورد', icon: MessageCircle, screen: 'بازخورد' },
    { label: 'اعلانات سیستم', icon: Bell, screen: 'اعلانات' },
  ]

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e53935" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData() }} tintColor="#e53935" />
      }
    >
      {/* Welcome */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeName}>{user?.name}</Text>
        <Text style={styles.welcomeDate}>
          {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((card, i) => (
          <TouchableOpacity
            key={i}
            style={styles.statCard}
            onPress={() => navigation.navigate(card.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.statIcon, { backgroundColor: `${card.color}20` }]}>
              <card.icon size={20} color={card.color} />
            </View>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statLabel}>{card.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Today's Shift */}
      {todayShift && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>شیفت امروز</Text>
          <View style={styles.shiftCard}>
            <View style={[styles.shiftDot, { backgroundColor: shiftColor[todayShift.code] ?? '#555860' }]} />
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftLabel}>{shiftLabel[todayShift.code] ?? todayShift.code}</Text>
              {todayShift.note && <Text style={styles.shiftNote}>{todayShift.note}</Text>}
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>دسترسی سریع</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.7}
            >
              <action.icon size={20} color="#a0a3b0" />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#13151a', padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#13151a' },
  welcomeSection: { marginBottom: 24 },
  welcomeName: { fontSize: 22, fontWeight: 'bold', color: '#f2f2f7', textAlign: 'right' },
  welcomeDate: { fontSize: 13, color: '#a0a3b0', textAlign: 'right', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47%', backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930', borderRadius: 12, padding: 16 },
  statIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#f2f2f7', textAlign: 'right' },
  statLabel: { fontSize: 12, color: '#a0a3b0', textAlign: 'right', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#f2f2f7', textAlign: 'right', marginBottom: 12 },
  shiftCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930', borderRadius: 12, padding: 16, gap: 12 },
  shiftDot: { width: 12, height: 12, borderRadius: 6 },
  shiftInfo: { flex: 1 },
  shiftLabel: { fontSize: 15, fontWeight: '600', color: '#f2f2f7', textAlign: 'right' },
  shiftNote: { fontSize: 12, color: '#a0a3b0', textAlign: 'right', marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930', borderRadius: 8, padding: 14 },
  actionLabel: { fontSize: 13, color: '#a0a3b0', fontWeight: '500' },
})
export default HomeScreen
