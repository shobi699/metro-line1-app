import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { useNetworkStore } from '../stores/network'
import { API_URL } from '../shared/config'
import { AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react-native'

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

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
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
      </View>

      {isOffline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>نمایش آفلاین تیکت‌های کش‌شده</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e53935" />
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
                <Text style={styles.cardMeta}>{item.creator.name}</Text>
                <Text style={styles.cardMeta}>
                  {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                </Text>
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
              <AlertTriangle size={40} color="#555860" style={{ marginBottom: 8 }} />
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#13151a' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  filterBar: { flexDirection: 'row', padding: 16, gap: 8 },
  filterButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930' },
  filterActive: { backgroundColor: '#e53935', borderColor: '#e53935' },
  filterText: { color: '#a0a3b0', fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: '#ffffff' },
  listContainer: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#f2f2f7', textAlign: 'right' },
  wagonCode: { fontSize: 11, color: '#a0a3b0', fontFamily: 'monospace' },
  badges: { flexDirection: 'row-reverse', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardBody: { fontSize: 12, color: '#a0a3b0', textAlign: 'right', marginTop: 8, lineHeight: 18 },
  cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 10 },
  cardMeta: { fontSize: 11, color: '#555860' },
  actionButton: { marginTop: 10, backgroundColor: '#e5393520', borderWidth: 1, borderColor: '#e5393540', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  actionButtonText: { color: '#e53935', fontSize: 12, fontWeight: '600' },
  emptyText: { color: '#a0a3b0', fontSize: 14 },
  offlineIndicator: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  offlineText: {
    color: '#e53935',
    fontSize: 12,
    fontWeight: 'bold',
  },
})

export default TicketsScreen
