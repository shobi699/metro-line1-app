import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { useNetworkStore } from '../stores/network'
import { API_URL } from '../shared/config'
import { useTheme } from '../shared/ThemeProvider'

interface Ticket {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  wagonCode: string | null
  createdAt: string
  creator: { id: string; name: string }
  _count: { logs: number }
}

const STATUS_LABELS: Record<string, string> = {
  open: 'باز',
  in_progress: 'در حال تعمیر',
  resolved: 'حل شده',
  closed: 'بسته شده',
}

const STATUS_COLORS: Record<string, string> = {
  open: '#ff9500',
  in_progress: '#007aff',
  resolved: '#34c759',
  closed: '#8e8e93',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  critical: 'بحرانی',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#8e8e93',
  medium: '#007aff',
  high: '#ff9500',
  critical: '#e53935',
}

const NEXT_STATUS: Record<string, string> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
}

const NEXT_LABEL: Record<string, string> = {
  open: 'شروع تعمیر',
  in_progress: 'حل شده',
  resolved: 'بستن',
}

export function TicketsScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const config = useConfigStore((s) => s.config)
  const isGlobalOffline = useNetworkStore((s) => s.isOffline)
  const setGlobalOffline = useNetworkStore((s) => s.setOffline)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [isOffline, setIsOffline] = useState(false)

  const { theme } = useTheme()

  async function loadCachedTickets(filter: string) {
    const key = `@tickets_list_${filter || 'all'}`
    try {
      const stored = await AsyncStorage.getItem(key)
      if (stored) {
        setTickets(JSON.parse(stored))
      } else {
        setTickets([])
      }
    } catch (err) {
      console.error('Error loading tickets cache:', err)
    }
  }

  async function loadTickets() {
    if (!accessToken) return
    const filter = statusFilter
    const cacheKey = `@tickets_list_${filter || 'all'}`
    const isCacheEnabled = config?.mobile?.offlineCacheEnabled !== false

    await loadCachedTickets(filter)
    setLoading(true)

    try {
      const params = filter ? `?status=${filter}` : ''
      const res = await fetch(`${API_URL}/tickets${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        const fetchedTickets = data.data.tickets || []
        setTickets(fetchedTickets)
        setIsOffline(false)
        setGlobalOffline(false)

        if (isCacheEnabled) {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(fetchedTickets))
        }
      } else {
        throw new Error('Fetch failed')
      }
    } catch {
      setIsOffline(true)
      setGlobalOffline(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [accessToken, statusFilter])

  async function handleStatusChange(ticketId: string, newStatus: string) {
    Alert.alert('تغییر وضعیت', 'آیا مطمئن هستید؟', [
      { text: 'لغو', style: 'cancel' },
      {
        text: 'تأیید',
        onPress: async () => {
          if (!accessToken) return
          try {
            const res = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ status: newStatus }),
            })
            if (res.ok) {
              loadTickets()
            }
          } catch {
            Alert.alert('خطا', 'امکان تغییر وضعیت در حالت آفلاین وجود ندارد.')
          }
        },
      },
    ])
  }

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1 },
    header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.containerMargin, paddingVertical: 16, backgroundColor: theme.colors.background },
    headerTitle: { fontFamily: theme.typography.screenTitle.fontFamily, fontSize: theme.typography.screenTitle.fontSize, fontWeight: '700', color: theme.colors.primary },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: theme.colors.surfaceContainerLow },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    
    filterBarWrapper: { paddingVertical: 8, paddingHorizontal: theme.spacing.containerMargin, backgroundColor: theme.colors.background },
    filterBar: { flexDirection: 'row-reverse', gap: 8 },
    filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: theme.colors.surfaceContainerLow },
    filterActive: { backgroundColor: theme.colors.primary },
    filterText: { color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily, fontWeight: '600' },
    filterTextActive: { color: theme.colors.onPrimary },
    
    listContainer: { paddingHorizontal: theme.spacing.containerMargin, paddingTop: 8, paddingBottom: 80, gap: 12 },
    card: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.xl, padding: 16, ...theme.shadows.level1 },
    cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardTitleRow: { flex: 1, paddingLeft: 12 },
    cardTitle: { fontFamily: theme.typography.cardTitle.fontFamily, fontSize: theme.typography.cardTitle.fontSize, fontWeight: '700', color: theme.colors.onSurface, textAlign: 'right', marginBottom: 4 },
    wagonCode: { fontSize: 11, color: theme.colors.secondary, fontFamily: 'monospace', backgroundColor: theme.colors.surfaceContainer, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-end' },
    badges: { flexDirection: 'column', gap: 4, alignItems: 'flex-start' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 10, fontWeight: '700' },
    cardBody: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: theme.typography.bodyMd.fontSize, color: theme.colors.onSurfaceVariant, textAlign: 'right', marginBottom: 16, lineHeight: 22 },
    cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.surfaceVariant },
    cardMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
    cardMeta: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 12, color: theme.colors.secondary, fontWeight: '600' },
    actionButton: { marginTop: 12, backgroundColor: theme.colors.primaryContainer, borderRadius: theme.borderRadius.md, paddingVertical: 10, alignItems: 'center' },
    actionButtonText: { color: theme.colors.primary, fontFamily: theme.typography.cardTitle.fontFamily, fontSize: theme.typography.cardTitle.fontSize, fontWeight: '800' },
    
    emptyText: { color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: theme.typography.bodyMd.fontSize, fontWeight: '700', textAlign: 'center', marginTop: 12 },
    offlineIndicator: { backgroundColor: theme.colors.errorContainer, borderRadius: theme.borderRadius.md, paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: theme.spacing.containerMargin, marginBottom: 8, alignItems: 'center' },
    offlineText: { color: theme.colors.error, fontFamily: theme.typography.captionSm.fontFamily, fontWeight: '800' },
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn}>
            <MaterialIcons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تیکت‌های خرابی</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter Bar */}
        <View style={styles.filterBarWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
            {['', 'open', 'in_progress', 'resolved'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterButton, statusFilter === status && styles.filterActive]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
                  {status ? STATUS_LABELS[status] : 'همه'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isOffline && (
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>نمایش آفلاین تیکت‌های کش‌شده</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.wagonCode && (
                      <Text style={styles.wagonCode}>{item.wagonCode}</Text>
                    )}
                  </View>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: `${PRIORITY_COLORS[item.priority]}20` }]}>
                      <Text style={[styles.badgeText, { color: PRIORITY_COLORS[item.priority] }]}>
                        {PRIORITY_LABELS[item.priority]}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[item.status]}20` }]}>
                      <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>
                        {STATUS_LABELS[item.status]}
                      </Text>
                    </View>
                  </View>
                </View>
                {item.description && (
                  <Text style={styles.cardBody} numberOfLines={2}>{item.description}</Text>
                )}
                <View style={styles.cardFooter}>
                  <View style={styles.cardMetaRow}>
                    <MaterialIcons name="person-outline" size={16} color={theme.colors.secondary} />
                    <Text style={styles.cardMeta}>{item.creator.name}</Text>
                  </View>
                  <View style={styles.cardMetaRow}>
                    <MaterialIcons name="access-time" size={16} color={theme.colors.secondary} />
                    <Text style={styles.cardMeta}>
                      {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                    </Text>
                  </View>
                </View>
                {!isOffline && NEXT_STATUS[item.status] && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusChange(item.id, NEXT_STATUS[item.status])}
                  >
                    <Text style={styles.actionButtonText}>{NEXT_LABEL[item.status]}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <MaterialIcons name="error-outline" size={48} color={theme.colors.secondary} />
                <Text style={styles.emptyText}>
                  {isOffline
                    ? 'ارتباط قطع است و تیکت کش‌شده‌ای برای این فیلتر یافت نشد.'
                    : 'تیکتی وجود ندارد'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  )
}

export default TicketsScreen
