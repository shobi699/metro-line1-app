import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { Bell, Info, AlertTriangle, AlertCircle } from 'lucide-react-native'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  isRead: boolean
  createdAt: string
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  info: { icon: Info, color: '#007aff' },
  warning: { icon: AlertTriangle, color: '#ff9500' },
  urgent: { icon: AlertCircle, color: '#e53935' },
  system: { icon: Bell, color: '#8e8e93' },
}

export function NotificationsScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
  }, [accessToken, filter])

  async function loadNotifications() {
    if (!accessToken) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === 'unread') params.set('unreadOnly', 'true')
      const res = await fetch(`${API_URL}/notifications?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.data?.notifications ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    if (!accessToken) return
    await fetch(`${API_URL}/notifications`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markRead', notificationId: id }),
    })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>همه</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && styles.filterActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>خوانده‌نشده</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e53935" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.info
            const Icon = config.icon
            return (
              <TouchableOpacity
                style={[styles.card, !item.isRead && styles.cardUnread]}
                onPress={() => !item.isRead && markAsRead(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
                  <Icon size={18} color={config.color} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                  {item.body && <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>}
                  <Text style={styles.cardTime}>{new Date(item.createdAt).toLocaleDateString('fa-IR')}</Text>
                </View>
              </TouchableOpacity>
            )
          }}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Bell size={40} color="#555860" />
              <Text style={styles.emptyText}>اعلانی وجود ندارد</Text>
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
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930' },
  filterActive: { backgroundColor: '#e53935', borderColor: '#e53935' },
  filterText: { color: '#a0a3b0', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#ffffff' },
  listContainer: { padding: 16, paddingBottom: 24 },
  card: { flexDirection: 'row', backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930', borderRadius: 12, padding: 14, marginBottom: 10, gap: 12 },
  cardUnread: { borderColor: '#e5393540', backgroundColor: '#e5393508' },
  iconContainer: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#f2f2f7', textAlign: 'right' },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e53935' },
  cardBody: { fontSize: 12, color: '#a0a3b0', textAlign: 'right', marginTop: 4, lineHeight: 18 },
  cardTime: { fontSize: 11, color: '#555860', textAlign: 'right', marginTop: 6 },
  emptyText: { color: '#a0a3b0', fontSize: 14, marginTop: 8 },
})
export default NotificationsScreen
