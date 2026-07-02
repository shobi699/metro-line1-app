import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  SafeAreaView,
  Modal,
  Dimensions
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { useNetworkStore } from '../stores/network'
import { API_URL } from '../shared/config'
import { useTheme } from '../shared/ThemeProvider'
import { useUIBuilderStore } from '../stores/ui-builder'
import { DynamicRenderer } from '../shared/DynamicRenderer'
import { handleDynamicNavigation } from '../shared/navigation-helper'

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
  const { theme } = useTheme()
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
  const [showMoreModal, setShowMoreModal] = useState(false)
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false)

  // Fetch logic omitted for brevity in design, keeping identical logic:
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

      if (config?.mobile?.offlineCacheEnabled !== false) {
        await AsyncStorage.multiSet([
          ['@dashboard_stats', JSON.stringify(newStats)],
          ['@today_shift', JSON.stringify(todayShiftData ?? null)]
        ])
      }
    } catch {
      setGlobalOffline(true)
      try {
        const keys = ['@dashboard_stats', '@today_shift']
        const cached = await AsyncStorage.multiGet(keys)
        const cachedStats = cached.find(([k]) => k === '@dashboard_stats')?.[1]
        const cachedShift = cached.find(([k]) => k === '@today_shift')?.[1]

        if (cachedStats) setStats(JSON.parse(cachedStats))
        if (cachedShift) setTodayShift(JSON.parse(cachedShift))
      } catch (err) {}
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    async function loadCache() {
      try {
        const keys = ['@dashboard_stats', '@today_shift']
        const cached = await AsyncStorage.multiGet(keys)
        const cachedStats = cached.find(([k]) => k === '@dashboard_stats')?.[1]
        const cachedShift = cached.find(([k]) => k === '@today_shift')?.[1]
        if (cachedStats) setStats(JSON.parse(cachedStats))
        if (cachedShift) setTodayShift(JSON.parse(cachedShift))
      } catch (err) {} finally {
        setLoading(false)
      }
    }
    if (accessToken) {
      loadCache().then(() => loadData())
    }
  }, [accessToken])

  useEffect(() => {
    if (!navigation) return
    const unsubscribe = navigation.addListener('focus', () => {
      void useUIBuilderStore.getState().bootstrap().catch(() => {})
    })
    return unsubscribe
  }, [navigation])

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1, paddingBottom: 20 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.containerMargin,
      paddingVertical: 10,
      backgroundColor: theme.colors.background,
    },
    headerProfile: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: theme.colors.surfaceContainer },
    greeting: { fontFamily: theme.typography.screenTitle.fontFamily, fontSize: 16, fontWeight: '700', color: theme.colors.primary, textAlign: 'right' },
    dateText: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 11, color: theme.colors.secondary, textAlign: 'right' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
    syncText: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 10, color: '#166534' },
    notificationBtn: { padding: 6, borderRadius: 9999 },
    notificationDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, backgroundColor: theme.colors.primary, borderRadius: 4, borderWidth: 2, borderColor: theme.colors.background },
    
    section: { paddingHorizontal: theme.spacing.containerMargin, marginBottom: 10 },
    sectionTitle: { fontFamily: theme.typography.sectionTitle.fontFamily, fontSize: 13, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 6, textAlign: 'right' },
    
    heroCard: { backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.xl, padding: 12, ...theme.shadows.level1, borderColor: theme.colors.surfaceVariant, borderWidth: 1, overflow: 'hidden' },
    heroIndicator: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 5, backgroundColor: '#f59e0b' },
    heroHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    heroTitle: { fontFamily: theme.typography.sectionTitle.fontFamily, fontSize: 13, color: theme.colors.onSurface, fontWeight: '700' },
    shiftBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: '#fffbeb', borderColor: '#fef3c7', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999 },
    shiftBadgeText: { color: '#d97706', fontFamily: theme.typography.captionSm.fontFamily, fontSize: 11 },
    heroContent: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    heroTime: { fontFamily: theme.typography.numericHero.fontFamily, fontSize: 28, fontWeight: '800', color: theme.colors.onSurface, textAlign: 'left' },
    heroLocation: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 },
    heroLocationText: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 12, color: theme.colors.secondary },
    heroStatusBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surfaceContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.md },
    heroStatusText: { color: theme.colors.primary, fontFamily: theme.typography.captionSm.fontFamily, fontSize: 11 },
    heroButton: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg, paddingVertical: 10, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, ...theme.shadows.level2 },
    heroButtonText: { color: theme.colors.onPrimary, fontFamily: theme.typography.cardTitle.fontFamily, fontSize: 13, fontWeight: '600' },

    actionsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
    actionCard: { width: '48%', alignItems: 'center', backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.lg, padding: 10, ...theme.shadows.level1, borderWidth: 1, borderColor: theme.colors.surfaceVariant },
    actionIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    actionText: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 11, color: theme.colors.onSurface, textAlign: 'center', fontWeight: '600' },

    metricsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
    metricCard: { width: '48%', backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.lg, padding: 12, ...theme.shadows.level1, borderWidth: 1, borderColor: theme.colors.surfaceVariant, height: 72, justifyContent: 'space-between' },
    metricHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
    metricLabel: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 12, color: theme.colors.secondary },
    metricValue: { fontFamily: theme.typography.numericHero.fontFamily, fontSize: 18, color: theme.colors.onSurface, fontWeight: '800', textAlign: 'right' },

    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalBackgroundDismiss: {
      flex: 1,
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xl * 1.5,
      borderTopRightRadius: theme.borderRadius.xl * 1.5,
      maxHeight: Dimensions.get('window').height * 0.75,
      paddingHorizontal: 20,
      paddingBottom: 30,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
    modalHeader: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    modalHeaderIndicator: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: 16,
    },
    modalHeaderTitleRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    modalTitle: {
      fontFamily: theme.typography.screenTitle.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    modalCloseBtn: {
      padding: 6,
      borderRadius: 9999,
      backgroundColor: theme.colors.surfaceContainer,
    },
    modalScroll: {
      paddingTop: 8,
      paddingBottom: 20,
    },
    modalGrid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
    },
    modalServiceCard: {
      width: '48%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      marginBottom: 4,
      ...theme.shadows.level1,
    },
    modalIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    modalServiceText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    drawerOverlay: {
      flex: 1,
      flexDirection: 'row-reverse',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    drawerBackgroundDismiss: {
      flex: 1,
    },
    drawerContent: {
      width: Dimensions.get('window').width * 0.78,
      backgroundColor: theme.colors.background,
      height: '100%',
      paddingTop: 40,
      paddingBottom: 20,
      paddingHorizontal: 16,
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.surfaceVariant,
      justifyContent: 'space-between',
    },
    drawerProfileHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
      paddingBottom: 16,
      marginBottom: 16,
    },
    drawerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    drawerProfileInfo: {
      flex: 1,
      marginRight: 12,
      alignItems: 'flex-start',
    },
    drawerUserName: {
      fontFamily: theme.typography.screenTitle.fontFamily,
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onSurface,
      textAlign: 'right',
    },
    drawerUserRole: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '600',
      marginTop: 2,
      textAlign: 'right',
    },
    drawerUserPhone: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 10,
      color: theme.colors.secondary,
      marginTop: 1,
      textAlign: 'right',
    },
    drawerCloseBtn: {
      padding: 6,
      borderRadius: 9999,
      backgroundColor: theme.colors.surfaceContainer,
    },
    drawerScroll: {
      flexGrow: 1,
    },
    drawerList: {
      gap: 4,
    },
    drawerItem: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: theme.borderRadius.md,
      backgroundColor: 'transparent',
    },
    drawerItemRight: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 12,
    },
    drawerItemIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    drawerItemText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    drawerFooter: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceVariant,
      paddingTop: 12,
      alignItems: 'center',
    },
    drawerFooterText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 10,
      color: theme.colors.secondary,
    },
    drawerVersionText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 9,
      color: theme.colors.secondary,
      opacity: 0.7,
      marginTop: 2,
    },
  })

  const widgets = useUIBuilderStore((s) => s.widgets)
  const menuItems = useUIBuilderStore((s) => s.menuItems)

  const mapMenuIcon = (iconName: string) => {
    switch (iconName) {
      case 'home': return 'home'
      case 'calendar': return 'calendar-today'
      case 'chat': return 'chat'
      case 'tickets': return 'report-problem'
      case 'profile': return 'person'
      case 'announcements': return 'description'
      case 'radio': return 'radio'
      case 'checklist': return 'done-all'
      case 'settings': return 'settings'
      case 'info': return 'info'
      default: return 'menu-open'
    }
  }

  const componentsToRender = widgets
    .filter(w => w.isVisible)
    .map(w => {
      let type = 'StatRow'
      let props = {}
      if (w.widgetType === 'stat_card') {
        type = 'StatRow'
        props = {
          items: [
            { label: w.title || 'آمار', value: w.configJson?.source === 'shift' ? todayLabel : '۵' }
          ]
        }
      } else if (w.widgetType === 'chart') {
        type = 'ChartWidget'
        props = {
          title: w.title || 'نمودار عملکرد',
          data: [
            { label: 'شنبه', value: 80 },
            { label: 'یکشنبه', value: 65 },
            { label: 'دوشنبه', value: 95 },
            { label: 'سه‌شنبه', value: 40 },
            { label: 'چهارشنبه', value: 75 }
          ]
        }
      } else if (w.widgetType === 'list') {
        type = 'DataList'
        props = {
          title: w.title || 'لیست',
          items: [
            { title: 'بخشنامه سرعت مطمئنه در محدوده باز', desc: 'مهلت مطالعه: امروز' },
            { title: 'اعلام حریق ایستگاه شوش', desc: 'وضعیت: برطرف شده' },
          ]
        }
      }

      return {
        id: w.id,
        type,
        props,
        layout: {
          colSpan: w.size === 'sm' ? 4 : w.size === 'md' ? 6 : 12
        }
      }
    })

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  const shiftLabelMap: Record<string, string> = { morning: 'روزکار', evening: 'عصرکار', night: 'شب‌کار', off: 'آف' }
  const todayLabel = todayShift ? (shiftLabelMap[todayShift.code] ?? todayShift.code) : 'نامشخص'

  const dashboardActions = [
    { label: 'اعلام\nخرابی', icon: 'report-problem', color: theme.colors.error, bg: theme.colors.errorContainer, screen: 'تیکت‌ها' },
    { label: 'لوحه\nکاربر', icon: 'calendar-today', color: theme.colors.primary, bg: theme.colors.surfaceContainerHighest, screen: 'لوحه' },
    { label: 'دفتر\nتلفن', icon: 'contacts', color: theme.colors.secondary, bg: theme.colors.surfaceContainer, screen: 'دفتر تلفن' },
    { label: 'سایر\nخدمات', icon: 'apps', color: theme.colors.primary, bg: theme.colors.surfaceContainerLowest, action: 'more' },
  ]

  const allServices = [
    { label: 'اعلام خرابی (تیکت)', icon: 'report-problem', color: theme.colors.error, bg: theme.colors.errorContainer, screen: 'تیکت‌ها' },
    { label: 'لوحه هفتگی (شیفت)', icon: 'calendar-today', color: theme.colors.primary, bg: theme.colors.surfaceContainerHighest, screen: 'لوحه' },
    { label: 'دفترچه تلفن پرسنل', icon: 'contacts', color: theme.colors.secondary, bg: theme.colors.surfaceContainer, screen: 'دفتر تلفن' },
    { label: 'بخشنامه‌های ایمنی', icon: 'description', color: theme.colors.primary, bg: theme.colors.surfaceContainerLowest, screen: 'بخشنامه‌ها' },
    { label: 'دستیار هوشمند AI', icon: 'assistant', color: '#0d9488', bg: '#ccfbf1', screen: 'دستیار AI' },
    { label: 'بی‌سیم راهبری', icon: 'radio', color: '#2563eb', bg: '#dbeafe', screen: 'بی‌سیم راهبری' },
    { label: 'چک‌لیست قبل از حرکت', icon: 'done-all', color: '#16a34a', bg: '#dcfce7', screen: 'چک‌لیست‌ها' },
    { label: 'اعلام اضطراری (SOS)', icon: 'warning', color: '#dc2626', bg: '#fee2e2', screen: 'SOS' },
    { label: 'ثبت حضور و غیاب', icon: 'pin-drop', color: '#7c3aed', bg: '#ede9fe', screen: 'حضور و غیاب' },
    { label: 'کارنامه عملکرد', icon: 'emoji-events', color: '#ea580c', bg: '#ffedd5', screen: 'عملکرد' },
  ]

  const metrics = [
    { label: 'تیکت‌های باز', value: stats.openTickets.toString(), icon: 'confirmation-number' },
    { label: 'اعلان جدید', value: stats.unreadBulletins.toString(), icon: 'campaign' }
  ]

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { 
              setRefreshing(true)
              void loadData()
              void useUIBuilderStore.getState().bootstrap().catch(() => {})
            }} 
            tintColor={theme.colors.primary} 
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerProfile}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3-83sYQfLES0gmvDO5q2w28Raab5S1KepqfdSRMpxZnef78ytjqK2n-NdvYbNjQS_ca544VkccdbSdSpqgoRryJucwTRlS5GxTmUFbVKeezJ1QkeNGF0xe6zNAU4TXydoyFGGOhEl5FdxzcPCCHoPZT84FY-8OQlEniA0nZHCon-Db2rkNuNlkkufryldM1drCGtAjfTeaYeTT-yhX3Cp1zI12skUoqT9lhAWWGomB57lbAnzwP0gimpOjbQlw6053Iws6FeBdLtL' }} 
              style={styles.avatar} 
            />
            <View>
              <Text style={styles.greeting}>سلام، {user?.name?.split(' ')[0] ?? 'کاربر'} عزیز</Text>
              <Text style={styles.dateText}>{new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setShowHamburgerMenu(true)} style={{ padding: 4, marginRight: 6 }}>
              <MaterialIcons name="menu" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationBtn}>
              <MaterialIcons name="notifications" size={20} color={theme.colors.onSurfaceVariant} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <View style={styles.syncBadge}>
              <MaterialIcons name="cloud-done" size={12} color="#166534" />
              <Text style={styles.syncText}>همگام‌سازی شده</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.heroCard}>
            <View style={styles.heroIndicator} />
            <View style={styles.heroHeader}>
              <Text style={styles.heroTitle}>شیفت امروز</Text>
              <View style={styles.shiftBadge}>
                <MaterialIcons name="light-mode" size={14} color="#d97706" />
                <Text style={styles.shiftBadgeText}>{todayLabel}</Text>
              </View>
            </View>
            <View style={styles.heroContent}>
              <View>
                <Text style={styles.heroTime}>۰۷:۰۰ - ۱۹:۰۰</Text>
                <View style={styles.heroLocation}>
                  <MaterialIcons name="location-on" size={14} color={theme.colors.secondary} />
                  <Text style={styles.heroLocationText}>ایستگاه امام خمینی</Text>
                </View>
              </View>
              <View style={styles.heroStatusBadge}>
                <MaterialIcons name="pending" size={14} color={theme.colors.primary} />
                <Text style={styles.heroStatusText}>در انتظار حضور</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.heroButton} activeOpacity={0.8} onPress={() => navigation.navigate('شیفت‌ها')}>
              <Text style={styles.heroButtonText}>مشاهده جزئیات</Text>
              <MaterialIcons name="arrow-back" size={16} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>دسترسی سریع</Text>
          <View style={styles.actionsGrid}>
            {dashboardActions.map((action, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.actionCard} 
                onPress={() => {
                  if (action.action === 'more') {
                    setShowMoreModal(true)
                  } else {
                    navigation.navigate(action.screen)
                  }
                }} 
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.bg }]}>
                  <MaterialIcons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {componentsToRender.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ابزارک‌های پویا (داشبورد)</Text>
            <DynamicRenderer components={componentsToRender} onAction={(action) => {
              if (action?.type === 'navigate') {
                handleDynamicNavigation(navigation, action.target)
              }
            }} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>نمای کلی ماه</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, i) => (
              <View key={i} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <MaterialIcons name={metric.icon as any} size={16} color={theme.colors.secondary} />
                </View>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Premium All Services Bottom Sheet Modal */}
      <Modal
        visible={showMoreModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackgroundDismiss} 
            activeOpacity={1} 
            onPress={() => setShowMoreModal(false)} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIndicator} />
              <View style={styles.modalHeaderTitleRow}>
                <Text style={styles.modalTitle}>سایر خدمات و امکانات</Text>
                <TouchableOpacity onPress={() => setShowMoreModal(false)} style={styles.modalCloseBtn}>
                  <MaterialIcons name="close" size={20} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalGrid}>
                {allServices.map((service, i) => (
                  <TouchableOpacity 
                    key={i} 
                    style={styles.modalServiceCard} 
                    onPress={() => {
                      setShowMoreModal(false)
                      navigation.navigate(service.screen)
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modalIconContainer, { backgroundColor: service.bg }]}>
                      <MaterialIcons name={service.icon as any} size={24} color={service.color} />
                    </View>
                    <Text style={styles.modalServiceText}>{service.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Hamburger Drawer Modal */}
      <Modal
        visible={showHamburgerMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowHamburgerMenu(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity 
            style={styles.drawerBackgroundDismiss} 
            activeOpacity={1} 
            onPress={() => setShowHamburgerMenu(false)} 
          />
          <View style={styles.drawerContent}>
            <View>
              {/* Drawer Header Profile */}
              <View style={styles.drawerProfileHeader}>
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3-83sYQfLES0gmvDO5q2w28Raab5S1KepqfdSRMpxZnef78ytjqK2n-NdvYbNjQS_ca544VkccdbSdSpqgoRryJucwTRlS5GxTmUFbVKeezJ1QkeNGF0xe6zNAU4TXydoyFGGOhEl5FdxzcPCCHoPZT84FY-8OQlEniA0nZHCon-Db2rkNuNlkkufryldM1drCGtAjfTeaYeTT-yhX3Cp1zI12skUoqT9lhAWWGomB57lbAnzwP0gimpOjbQlw6053Iws6FeBdLtL' }} 
                  style={styles.drawerAvatar} 
                />
                <View style={styles.drawerProfileInfo}>
                  <Text style={styles.drawerUserName}>{user?.name || 'کاربر سیستم'}</Text>
                  <Text style={styles.drawerUserRole}>{user?.roleKey === 'admin' ? 'مدیر حرکت (ادمین)' : user?.roleKey === 'super_admin' ? 'مدیر کل سیستم' : 'راهبر قطار'}</Text>
                  <Text style={styles.drawerUserPhone}>{user?.phone || ''}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowHamburgerMenu(false)} style={styles.drawerCloseBtn}>
                  <MaterialIcons name="close" size={20} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </View>

              {/* Drawer Menu List */}
              <ScrollView contentContainerStyle={styles.drawerScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.drawerList}>
                  {menuItems.filter(item => item.isVisible).map((item, i) => (
                    <TouchableOpacity 
                      key={i} 
                      style={styles.drawerItem} 
                      onPress={() => {
                        setShowHamburgerMenu(false)
                        handleDynamicNavigation(navigation, item.route)
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.drawerItemRight}>
                        <View style={[styles.drawerItemIconContainer, { backgroundColor: theme.colors.surfaceContainerHighest }]}>
                          <MaterialIcons name={mapMenuIcon(item.icon) as any} size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.drawerItemText}>{item.label}</Text>
                      </View>
                      <MaterialIcons name="keyboard-arrow-left" size={20} color={theme.colors.secondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Drawer Footer */}
            <View style={styles.drawerFooter}>
              <Text style={styles.drawerFooterText}>سیر و حرکت خط ۱ مترو تهران</Text>
              <Text style={styles.drawerVersionText}>نسخه ۱.۱.۰</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default HomeScreen
