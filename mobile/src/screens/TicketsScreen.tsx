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
  ScrollView,
  Modal,
  TextInput,
  Image
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { useNetworkStore } from '../stores/network'
import { API_URL } from '../shared/config'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { pickAndUploadImage } from '../shared/uploader'

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

export function TicketsScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const config = useConfigStore((s) => s.config)
  const isGlobalOffline = useNetworkStore((s) => s.isOffline)
  const setGlobalOffline = useNetworkStore((s) => s.setOffline)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [isOffline, setIsOffline] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newWagon, setNewWagon] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newAttachment, setNewAttachment] = useState<{ url: string; type: string } | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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
    if (isGlobalOffline) {
      setIsOffline(true)
      await loadCachedTickets(statusFilter)
      setLoading(false)
      return
    }

    try {
      const headers = { Authorization: `Bearer ${accessToken}` }
      const res = await fetch(`${API_URL}/tickets?status=${statusFilter}`, { headers })
      const data = await res.json()
      if (res.ok) {
        setTickets(data.data.tickets || [])
        setIsOffline(false)
        await AsyncStorage.setItem(`@tickets_list_${statusFilter || 'all'}`, JSON.stringify(data.data.tickets || []))
      } else {
        setIsOffline(true)
        await loadCachedTickets(statusFilter)
      }
    } catch {
      setIsOffline(true)
      await loadCachedTickets(statusFilter)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTickets()
  }, [statusFilter, isGlobalOffline])

  async function handleStatusChange(ticketId: string, newStatus: string) {
    if (isGlobalOffline) {
      Alert.alert('خطا', 'در حالت آفلاین امکان تغییر وضعیت تیکت وجود ندارد.')
      return
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      }
      const res = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        void loadTickets()
      } else {
        const err = await res.json()
        Alert.alert('خطا', err.error || 'خطایی رخ داد')
      }
    } catch {
      Alert.alert('خطا', 'ارتباط با سرور برقرار نشد.')
    }
  }

  async function handleCreateTicket() {
    if (!newTitle.trim()) return Alert.alert('خطا', 'عنوان تیکت الزامی است.')
    setIsCreating(true)
    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          wagonCode: newWagon,
          priority: newPriority,
          photoUrl: newAttachment ? newAttachment.url : undefined
        }),
      })
      if (res.ok) {
        setShowCreateModal(false)
        setNewTitle('')
        setNewDesc('')
        setNewWagon('')
        setNewPriority('medium')
        setNewAttachment(null)
        void loadTickets()
      } else {
        const err = await res.json()
        Alert.alert('خطا', err.error || 'خطا در ثبت تیکت')
      }
    } catch {
      Alert.alert('خطا', 'ارتباط با سرور برقرار نشد.')
    } finally {
      setIsCreating(false)
    }
  }

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    
    filterBarWrapper: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant, backgroundColor: theme.colors.background },
    filterBar: { paddingHorizontal: theme.spacing.containerMargin, flexDirection: 'row-reverse', gap: 8 },
    filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.surfaceContainer, borderWidth: 1, borderColor: theme.colors.border },
    filterActive: { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary },
    filterText: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 12, color: theme.colors.secondary, fontWeight: '700' },
    filterTextActive: { color: theme.colors.primary },
    
    listContainer: { padding: theme.spacing.containerMargin, gap: 12, paddingBottom: 80 },
    card: { backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.lg, padding: 14, ...theme.shadows.level1, borderWidth: 1, borderColor: theme.colors.surfaceVariant },
    cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    cardTitleRow: { alignItems: 'flex-end', flex: 1, marginLeft: 8 },
    cardTitle: { fontFamily: theme.typography.cardTitle.fontFamily, fontSize: theme.typography.cardTitle.fontSize, fontWeight: '700', color: theme.colors.onSurface, textAlign: 'right' },
    wagonCode: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 11, color: theme.colors.secondary, marginTop: 2 },
    badges: { flexDirection: 'row', gap: 6 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    badgeText: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 10, fontWeight: '800' },
    cardBody: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: theme.typography.bodyMd.fontSize, color: theme.colors.onSurfaceVariant, textAlign: 'right', marginBottom: 16, lineHeight: 22 },
    cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.surfaceVariant },
    cardMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
    cardMeta: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 12, color: theme.colors.secondary, fontWeight: '600' },
    actionButton: { marginTop: 12, backgroundColor: theme.colors.primaryContainer, borderRadius: theme.borderRadius.md, paddingVertical: 10, alignItems: 'center' },
    actionButtonText: { color: theme.colors.primary, fontFamily: theme.typography.cardTitle.fontFamily, fontSize: theme.typography.cardTitle.fontSize, fontWeight: '800' },
    
    emptyText: { color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: theme.typography.bodyMd.fontSize, fontWeight: '700', textAlign: 'center', marginTop: 12 },
    offlineIndicator: { backgroundColor: theme.colors.errorContainer, borderRadius: theme.borderRadius.md, paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: theme.spacing.containerMargin, marginBottom: 8, alignItems: 'center' },
    offlineText: { color: theme.colors.error, fontFamily: theme.typography.captionSm.fontFamily, fontWeight: '800' },
    fab: { position: 'absolute', bottom: 24, left: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
    modalContent: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 20 },
    modalTitle: { fontFamily: theme.typography.sectionTitle.fontFamily, fontSize: 18, fontWeight: 'bold', color: theme.colors.onSurface, marginBottom: 16, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.borderRadius.sm, padding: 12, marginBottom: 12, fontFamily: 'Vazirmatn-Regular', color: theme.colors.onSurface, backgroundColor: theme.colors.surfaceVariant, textAlign: 'right' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: theme.borderRadius.sm, alignItems: 'center' },
    modalBtnCancel: { backgroundColor: theme.colors.surfaceVariant },
    modalBtnSubmit: { backgroundColor: theme.colors.primary },
    modalBtnCancelText: { color: theme.colors.onSurface, fontFamily: 'Vazirmatn-Bold' },
    modalBtnSubmitText: { color: theme.colors.onPrimary, fontFamily: 'Vazirmatn-Bold' },
    attachmentBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.borderRadius.sm, borderStyle: 'dashed', marginBottom: 12, gap: 8 },
    attachmentPreview: { width: '100%', height: 150, borderRadius: theme.borderRadius.sm, marginBottom: 12, backgroundColor: theme.colors.surfaceVariant }
  })

  return (
    <ScreenWrapper title="تیکت‌های خرابی" navigation={navigation}>
      <View style={styles.container}>
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

        <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
          <MaterialIcons name="add" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>

        <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>ثبت تیکت خرابی</Text>
              
              <TextInput
                style={styles.input}
                placeholder="عنوان تیکت *"
                placeholderTextColor={theme.colors.secondary}
                value={newTitle}
                onChangeText={setNewTitle}
              />
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                placeholder="توضیحات"
                placeholderTextColor={theme.colors.secondary}
                multiline
                value={newDesc}
                onChangeText={setNewDesc}
              />
              <TextInput
                style={styles.input}
                placeholder="کد واگن / تجهیز"
                placeholderTextColor={theme.colors.secondary}
                value={newWagon}
                onChangeText={setNewWagon}
              />
              
              {newAttachment ? (
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: newAttachment.url }} style={styles.attachmentPreview} resizeMode="cover" />
                  <TouchableOpacity style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 12 }} onPress={() => setNewAttachment(null)}>
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.attachmentBtn} 
                  onPress={async () => {
                    setIsUploading(true)
                    const res = await pickAndUploadImage(true) // camera option can be false too
                    setIsUploading(false)
                    if (res) setNewAttachment(res)
                  }}
                  disabled={isUploading}
                >
                  {isUploading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : (
                    <>
                      <MaterialIcons name="add-a-photo" size={20} color={theme.colors.secondary} />
                      <Text style={{ fontFamily: 'Vazirmatn-Medium', color: theme.colors.secondary }}>افزودن تصویر</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.modalBtnCancelText}>انصراف</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSubmit]} onPress={handleCreateTicket} disabled={isCreating}>
                  {isCreating ? <ActivityIndicator size="small" color={theme.colors.onPrimary} /> : <Text style={styles.modalBtnSubmitText}>ثبت</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  )
}

export default TicketsScreen
