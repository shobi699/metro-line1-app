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
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { API_URL } from '../shared/config'
import { Bell, Info, AlertTriangle, AlertCircle } from 'lucide-react-native'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link?: string | null
  isRead: boolean
  createdAt: string
}

export function NotificationsScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const { theme } = useTheme()

  const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
    info: { icon: Info, color: theme.colors.info },
    warning: { icon: AlertTriangle, color: theme.colors.warning },
    urgent: { icon: AlertCircle, color: theme.colors.error },
    system: { icon: Bell, color: theme.colors.secondary },
  }

  useEffect(() => {
    void loadNotifications()
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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    filterBar: { flexDirection: 'row-reverse', padding: 16, gap: 8 },
    filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.surfaceContainerLow, borderWidth: 1, borderColor: theme.colors.border },
    filterActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    filterText: { color: theme.colors.secondary, fontSize: 13, fontWeight: '600', fontFamily: theme.typography.captionSm.fontFamily },
    filterTextActive: { color: theme.colors.onPrimary },
    listContainer: { padding: 16, paddingBottom: 24 },
    card: { flexDirection: 'row-reverse', backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.xl, padding: 14, marginBottom: 10, gap: 12, ...theme.shadows.level1 },
    cardUnread: { borderColor: theme.colors.primaryContainer + '40', backgroundColor: theme.colors.primaryContainer + '0D' },
    iconContainer: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    cardContent: { flex: 1 },
    cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
    cardTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.onSurface, textAlign: 'right', fontFamily: theme.typography.cardTitle.fontFamily },
    unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
    cardBody: { fontSize: 12, color: theme.colors.secondary, textAlign: 'right', marginTop: 4, lineHeight: 18, fontFamily: theme.typography.bodyMd.fontFamily },
    cardTime: { fontSize: 11, color: theme.colors.secondary, textAlign: 'right', marginTop: 6, fontFamily: theme.typography.captionSm.fontFamily },
    emptyText: { color: theme.colors.secondary, fontSize: 14, marginTop: 8, fontFamily: theme.typography.bodyMd.fontFamily },
  })

  return (
    <ScreenWrapper title="اعلان‌های سیستم" navigation={navigation}>
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
            <ActivityIndicator size="large" color={theme.colors.primary} />
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
                  onPress={() => {
                    if (!item.isRead) markAsRead(item.id)
                    // Basic Deep Linking Simulation
                    if (item.link && item.link.startsWith('/schedule/')) {
                      // Navigate to RosterScreen
                      navigation.navigate('RosterScreen')
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${config.color}1A` }]}>
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
                <Bell size={40} color={theme.colors.secondary} />
                <Text style={styles.emptyText}>اعلانی وجود ندارد</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenWrapper>
  )
}

export default NotificationsScreen
