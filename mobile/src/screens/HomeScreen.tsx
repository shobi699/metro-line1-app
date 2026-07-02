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
  Dimensions,
  Linking
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { useNetworkStore } from '../stores/network'
import { API_URL, BASE_URL } from '../shared/config'
import { useTheme } from '../shared/ThemeProvider'
import { useUIBuilderStore } from '../stores/ui-builder'
import { DynamicRenderer } from '../shared/DynamicRenderer'
import { handleDynamicNavigation } from '../shared/navigation-helper'
import { ScreenWrapper } from '../shared/ScreenWrapper'

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
    bannerSection: { paddingHorizontal: 16, marginTop: 8, marginBottom: 8 },
    bannerImage: { width: '100%', height: 75, borderRadius: 12, backgroundColor: theme.colors.surface },
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1, paddingBottom: 10 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
    
    // Greeting
    greetingCard: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.containerMargin,
      marginTop: 8,
      marginBottom: 10,
    },
    greetingTextContainer: { alignItems: 'flex-start' },
    greetingName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.onSurface, fontFamily: theme.typography.screenTitle.fontFamily },
    greetingDate: { fontSize: 11, color: theme.colors.secondary, marginTop: 2, fontFamily: theme.typography.captionSm.fontFamily },
    greetingAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: theme.colors.primary },

    section: { paddingHorizontal: theme.spacing.containerMargin, marginBottom: 10 },
    sectionTitle: { fontFamily: theme.typography.sectionTitle.fontFamily, fontSize: 13, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 8, textAlign: 'right' },
    
    // Hero Card (Compact)
    heroCard: { backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.xl, padding: 12, ...theme.shadows.level1, borderColor: theme.colors.surfaceVariant, borderWidth: 1, overflow: 'hidden' },
    heroIndicator: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#f59e0b' },
    heroHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    heroTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
    heroTitle: { fontFamily: theme.typography.sectionTitle.fontFamily, fontSize: 13, color: theme.colors.onSurface, fontWeight: '700' },
    shiftBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: '#fffbeb', borderColor: '#fef3c7', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.sm },
    shiftBadgeText: { color: '#d97706', fontFamily: theme.typography.captionSm.fontFamily, fontSize: 10 },
    heroContent: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end' },
    heroTime: { fontFamily: theme.typography.numericHero.fontFamily, fontSize: 22, fontWeight: '800', color: theme.colors.onSurface, textAlign: 'left' },
    heroLocation: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 },
    heroLocationText: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 11, color: theme.colors.secondary },
    heroStatusBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.borderRadius.md },
    heroStatusText: { color: theme.colors.primary, fontFamily: theme.typography.captionSm.fontFamily, fontSize: 10 },

    // Actions Grid (4 columns)
    actionsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start' },
    actionCard: { width: '25%', alignItems: 'center', marginBottom: 10 },
    actionIconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4, ...theme.shadows.level1 },
    actionText: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 10, color: theme.colors.onSurface, textAlign: 'center', fontWeight: '600' },

    metricsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
    metricCard: { width: '48%', backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.lg, padding: 10, ...theme.shadows.level1, borderWidth: 1, borderColor: theme.colors.surfaceVariant, height: 56, justifyContent: 'space-between' },
    metricHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
    metricLabel: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 11, color: theme.colors.secondary },
    metricValue: { fontFamily: theme.typography.numericHero.fontFamily, fontSize: 16, color: theme.colors.onSurface, fontWeight: '800', textAlign: 'right' },

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
    }
  })

  const widgets = useUIBuilderStore((s) => s.widgets)
  const menuItems = useUIBuilderStore((s) => s.menuItems)
  const shiftLabelMap: Record<string, string> = { morning: 'روزکار', evening: 'عصرکار', night: 'شب‌کار', off: 'آف' }
  const todayLabel = todayShift ? (shiftLabelMap[todayShift.code] ?? todayShift.code) : 'نامشخص'

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

  // Expanded Dashboard Actions to 8 items for a 4-column compact layout
  const dashboardActions = [
    { label: 'لوحه شیفت', icon: 'calendar-today', color: '#0284c7', bg: '#e0f2fe', screen: 'لوحه' },
    { label: 'اعلام خرابی', icon: 'report-problem', color: '#dc2626', bg: '#fee2e2', screen: 'تیکت‌ها' },
    { label: 'حضور و غیاب', icon: 'pin-drop', color: '#16a34a', bg: '#dcfce7', screen: 'حضور و غیاب' },
    { label: 'دستیار AI', icon: 'assistant', color: '#7c3aed', bg: '#ede9fe', screen: 'دستیار AI' },
    { label: 'بخشنامه‌ها', icon: 'description', color: '#ea580c', bg: '#ffedd5', screen: 'بخشنامه‌ها' },
    { label: 'دفتر تلفن', icon: 'contacts', color: '#0d9488', bg: '#ccfbf1', screen: 'دفتر تلفن' },
    { label: 'بی‌سیم', icon: 'radio', color: '#2563eb', bg: '#dbeafe', screen: 'بی‌سیم راهبری' },
    { label: 'سایر خدمات', icon: 'apps', color: theme.colors.onSurface, bg: theme.colors.surfaceContainerHighest, action: 'more' },
  ]

  const allServices = [
    { label: 'اعلام خرابی (تیکت)', icon: 'report-problem', color: '#dc2626', bg: '#fee2e2', screen: 'تیکت‌ها' },
    { label: 'لوحه هفتگی (شیفت)', icon: 'calendar-today', color: '#0284c7', bg: '#e0f2fe', screen: 'لوحه' },
    { label: 'دفترچه تلفن پرسنل', icon: 'contacts', color: '#0d9488', bg: '#ccfbf1', screen: 'دفتر تلفن' },
    { label: 'بخشنامه‌های ایمنی', icon: 'description', color: '#ea580c', bg: '#ffedd5', screen: 'بخشنامه‌ها' },
    { label: 'دستیار هوشمند AI', icon: 'assistant', color: '#7c3aed', bg: '#ede9fe', screen: 'دستیار AI' },
    { label: 'بی‌سیم راهبری', icon: 'radio', color: '#2563eb', bg: '#dbeafe', screen: 'بی‌سیم راهبری' },
    { label: 'چک‌لیست قبل از حرکت', icon: 'done-all', color: '#16a34a', bg: '#dcfce7', screen: 'چک‌لیست‌ها' },
    { label: 'اعلام اضطراری (SOS)', icon: 'warning', color: '#b91c1c', bg: '#fef2f2', screen: 'SOS' },
    { label: 'ثبت حضور و غیاب', icon: 'pin-drop', color: '#059669', bg: '#d1fae5', screen: 'حضور و غیاب' },
    { label: 'سامانه آموزش پرسنل', icon: 'school', color: '#6d28d9', bg: '#f3e8ff', screen: 'آموزش' },
    { label: 'کارنامه عملکرد', icon: 'emoji-events', color: '#c2410c', bg: '#ffedd5', screen: 'عملکرد' },
    { label: 'راهنمای کاربری', icon: 'import-contacts', color: '#0f766e', bg: '#f0fdfa', screen: 'راهنمای کاربری' },
  ]

  const metrics = [
    { label: 'تیکت‌های باز', value: stats.openTickets.toString(), icon: 'confirmation-number' },
    { label: 'اعلان جدید', value: stats.unreadBulletins.toString(), icon: 'campaign' }
  ]

  return (
    <ScreenWrapper title="داشبورد پرسنلی" navigation={navigation}>
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
        {/* Compact Premium Greeting */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingName}>
              سلام، {user?.name?.split(' ')[0] ?? 'کاربر'} عزیز
            </Text>
            <Text style={styles.greetingDate}>
              {new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3-83sYQfLES0gmvDO5q2w28Raab5S1KepqfdSRMpxZnef78ytjqK2n-NdvYbNjQS_ca544VkccdbSdSpqgoRryJucwTRlS5GxTmUFbVKeezJ1QkeNGF0xe6zNAU4TXydoyFGGOhEl5FdxzcPCCHoPZT84FY-8OQlEniA0nZHCon-Db2rkNuNlkkufryldM1drCGtAjfTeaYeTT-yhX3Cp1zI12skUoqT9lhAWWGomB57lbAnzwP0gimpOjbQlw6053Iws6FeBdLtL' }} 
            style={styles.greetingAvatar} 
          />
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.heroCard} activeOpacity={0.7} onPress={() => navigation.navigate('شیفت‌ها')}>
            <View style={styles.heroIndicator} />
            <View style={styles.heroHeader}>
              <View style={styles.heroTitleRow}>
                <Text style={styles.heroTitle}>شیفت امروز</Text>
                <MaterialIcons name="chevron-left" size={16} color={theme.colors.secondary} />
              </View>
              <View style={styles.shiftBadge}>
                <MaterialIcons name="light-mode" size={12} color="#d97706" />
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
                <MaterialIcons name="pending" size={12} color={theme.colors.primary} />
                <Text style={styles.heroStatusText}>در انتظار حضور</Text>
              </View>
            </View>
          </TouchableOpacity>
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
                  <MaterialIcons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {componentsToRender.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ابزارک‌های پویا</Text>
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

        {config?.mobile?.dashboardBanner?.enabled && config?.mobile?.dashboardBanner?.url && (
          <View style={styles.bannerSection}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                if (config.mobile.dashboardBanner?.link) {
                  Linking.openURL(config.mobile.dashboardBanner.link).catch(() => {})
                }
              }}
            >
              <Image 
                source={{ 
                  uri: config.mobile.dashboardBanner.url.startsWith('/') 
                    ? `${BASE_URL}${config.mobile.dashboardBanner.url}` 
                    : config.mobile.dashboardBanner.url 
                }} 
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        )}
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

    </ScreenWrapper>
  )
}

export default HomeScreen
