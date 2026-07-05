import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  Image,
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

interface Train {
  id: string
  trainNumber: string
  fleetSeries: string
  wagons: { id: string; wagonCode: string; position: number }[]
}

interface FaultReport {
  id: string
  faultNo: number
  trainId: string
  wagonId: string | null
  faultCodeId: string
  status: string
  priority: string
  description: string
  locationNote: string | null
  occurredAt: string
  serviceImpact: string
  photoUrls: string | null
  createdAt: string
  train: { trainNumber: string; fleetSeries: string }
  wagon: { wagonCode: string; position: number } | null
  faultCode: { code: string; title: string; operatorGuide: string | null }
  reporter: { name: string }
  slaDueAt: string | null
  slaBreached: boolean
  logs: {
    id: string
    createdAt: string
    action: string
    note: string | null
    actor: { name: string }
  }[]
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'ثبت شده',
  under_review: 'در حال بررسی',
  needs_info: 'نیاز به اطلاعات',
  rejected: 'رد شده',
  approved: 'تایید شده',
  in_repair: 'در حال تعمیر',
  repaired: 'تعمیر شده',
  verified_closed: 'بسته شده',
  deferred: 'ماندگار (Deferred)',
  reopened: 'بازگشایی شده',
}

const STATUS_COLORS: Record<string, string> = {
  submitted: '#007aff',
  under_review: '#af52de',
  needs_info: '#ff9500',
  rejected: '#ff3b30',
  approved: '#ffcc00',
  in_repair: '#5856d6',
  repaired: '#4cd964',
  verified_closed: '#34c759',
  deferred: '#8e8e93',
  reopened: '#ff2d55',
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
  critical: '#ff3b30',
}

const LOG_ACTION_LABELS: Record<string, string> = {
  created: 'ثبت اولیه',
  status_changed: 'تغییر وضعیت',
  edited: 'ویرایش',
  assigned: 'تخصیص',
  comment: 'درج نظر',
  priority_changed: 'تغییر اولویت',
  attachment_added: 'افزودن پیوست',
  sla_breached: 'نقض زمان SLA 🚨',
  reopened: 'بازگشایی مجدد',
  deferred: 'انتقال به ماندگار',
}

export function TicketsScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isGlobalOffline = useNetworkStore((s) => s.isOffline)

  const [reports, setReports] = useState<FaultReport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [isOffline, setIsOffline] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<FaultReport | null>(null)

  // Wizard state
  const [trains, setTrains] = useState<Train[]>([])
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null)
  const [selectedWagonId, setSelectedWagonId] = useState('')
  const [description, setDescription] = useState('')
  const [locationNote, setLocationNote] = useState('')
  const [serviceImpact, setServiceImpact] = useState('none')
  const [selectedFaultCode, setSelectedFaultCode] = useState<{ id: string; code: string; title: string } | null>(null)
  const [priority, setPriority] = useState('medium')
  const [newAttachment, setNewAttachment] = useState<{ url: string; type: string } | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // AI match state
  const [matching, setMatching] = useState(false)
  const [matchedSuggestions, setMatchedSuggestions] = useState<any[]>([])

  // Repair transition dialog
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [rootCause, setRootCause] = useState('')
  const [actionsTaken, setActionsTaken] = useState('')
  const [partsUsed, setPartsUsed] = useState('')
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const { theme } = useTheme()

  useEffect(() => {
    void loadTrains()
    void loadReports()
  }, [statusFilter, isGlobalOffline])

  async function loadCachedReports(filter: string) {
    const key = `@faults_list_${filter || 'all'}`
    try {
      const stored = await AsyncStorage.getItem(key)
      if (stored) {
        setReports(JSON.parse(stored))
      } else {
        setReports([])
      }
    } catch (err) {
      console.error('Error loading faults cache:', err)
    }
  }

  async function loadTrains() {
    if (isGlobalOffline) return
    try {
      const res = await fetch(`${API_URL}/fleet/trains`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setTrains(json.data || [])
      }
    } catch (err) {
      console.error('Error loading trains:', err)
    }
  }

  async function loadReports() {
    if (isGlobalOffline) {
      setIsOffline(true)
      await loadCachedReports(statusFilter)
      setLoading(false)
      return
    }

    try {
      const headers = { Authorization: `Bearer ${accessToken}` }
      const res = await fetch(`${API_URL}/faults?status=${statusFilter}`, { headers })
      const data = await res.json()
      if (res.ok) {
        setReports(data.data.reports || [])
        setIsOffline(false)
        await AsyncStorage.setItem(`@faults_list_${statusFilter || 'all'}`, JSON.stringify(data.data.reports || []))
      } else {
        setIsOffline(true)
        await loadCachedReports(statusFilter)
      }
    } catch {
      setIsOffline(true)
      await loadCachedReports(statusFilter)
    } finally {
      setLoading(false)
    }
  }

  async function handleAiMatch() {
    if (!description.trim()) {
      Alert.alert('خطا', 'لطفا ابتدا شرح کوتاهی از خرابی بنویسید تا سیستم آن را تحلیل کند.')
      return
    }
    setMatching(true)
    try {
      const res = await fetch(`${API_URL}/fault-catalog/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text: description }),
      })
      if (res.ok) {
        const json = await res.json()
        setMatchedSuggestions(json.data?.suggestions || [])
      }
    } catch (err) {
      console.error(err)
      Alert.alert('خطا', 'امکان ارتباط با موتور تطبیق کاتالوگ وجود ندارد.')
    } finally {
      setMatching(false)
    }
  }

  async function handleCreateFault() {
    if (!selectedTrain) return Alert.alert('خطا', 'انتخاب قطار الزامی است.')
    if (!selectedFaultCode) return Alert.alert('خطا', 'انتخاب کد فالت کاتالوگ الزامی است.')
    if (!description.trim()) return Alert.alert('خطا', 'درج شرح نقص فنی الزامی است.')

    setIsCreating(true)
    try {
      const payload = {
        trainId: selectedTrain.id,
        wagonId: selectedWagonId || undefined,
        faultCodeId: selectedFaultCode.id,
        description: description.trim(),
        locationNote: locationNote.trim() || undefined,
        priority,
        occurredAt: new Date().toISOString(),
        serviceImpact,
        photoUrls: newAttachment ? [newAttachment.url] : [],
      }

      const res = await fetch(`${API_URL}/faults`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setShowCreateModal(false)
        // Reset states
        setSelectedTrain(null)
        setSelectedWagonId('')
        setDescription('')
        setLocationNote('')
        setServiceImpact('none')
        setSelectedFaultCode(null)
        setPriority('medium')
        setNewAttachment(null)
        setMatchedSuggestions([])
        void loadReports()
      } else {
        const err = await res.json()
        Alert.alert('خطا', err.error || 'خطا در ثبت فالت جدید')
      }
    } catch (err) {
      Alert.alert('خطا', 'ارتباط با سرور برقرار نشد.')
    } finally {
      setIsCreating(false)
    }
  }

  async function executeTransition(reportId: string, action: string, extra: any = {}) {
    if (isGlobalOffline) {
      Alert.alert('خطا', 'در حالت آفلاین امکان تغییر وضعیت فالت وجود ندارد.')
      return
    }

    try {
      const res = await fetch(`${API_URL}/faults/${reportId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action, ...extra }),
      })
      if (res.ok) {
        Alert.alert('موفقیت', 'وضعیت فالت با موفقیت تغییر یافت.')
        setShowRepairModal(false)
        setShowDetailModal(false)
        void loadReports()
      } else {
        const json = await res.json()
        Alert.alert('خطا', json.error || 'عملیات ناموفق بود')
      }
    } catch {
      Alert.alert('خطا', 'ارتباط با سرور قطع است.')
    }
  }

  async function submitComment(reportId: string) {
    if (!commentText.trim()) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`${API_URL}/faults/${reportId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ note: commentText.trim() }),
      })
      if (res.ok) {
        setCommentText('')
        // Refresh details
        const rRes = await fetch(`${API_URL}/faults/${reportId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (rRes.ok) {
          const json = await rRes.json()
          setSelectedReport(json.data)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingComment(false)
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
    cardBody: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: theme.typography.bodyMd.fontSize, color: theme.colors.onSurfaceVariant, textAlign: 'right', marginBottom: 12, lineHeight: 20 },
    cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.surfaceVariant },
    cardMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
    cardMeta: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 12, color: theme.colors.secondary, fontWeight: '600' },
    actionButton: { marginTop: 12, backgroundColor: theme.colors.primaryContainer, borderRadius: theme.borderRadius.md, paddingVertical: 10, alignItems: 'center' },
    actionButtonText: { color: theme.colors.primary, fontFamily: theme.typography.cardTitle.fontFamily, fontSize: theme.typography.cardTitle.fontSize, fontWeight: '800' },

    emptyText: { color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: theme.typography.bodyMd.fontSize, fontWeight: '700', textAlign: 'center', marginTop: 12 },
    offlineIndicator: { backgroundColor: theme.colors.errorContainer, borderRadius: theme.borderRadius.md, paddingVertical: 8, paddingHorizontal: 12, marginHorizontal: theme.spacing.containerMargin, marginBottom: 8, alignItems: 'center' },
    offlineText: { color: theme.colors.error, fontFamily: theme.typography.captionSm.fontFamily, fontWeight: '800' },
    fab: { position: 'absolute', bottom: 24, left: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#e53935', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
    modalContent: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: 20, maxHeight: '85%' },
    modalTitle: { fontFamily: theme.typography.sectionTitle.fontFamily, fontSize: 16, fontWeight: 'bold', color: theme.colors.onSurface, marginBottom: 16, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.borderRadius.sm, padding: 12, marginBottom: 12, fontFamily: 'Vazirmatn-Regular', color: theme.colors.onSurface, backgroundColor: theme.colors.surfaceVariant, textAlign: 'right', fontSize: 12 },
    
    label: { fontFamily: 'Vazirmatn-Bold', fontSize: 11, color: theme.colors.onSurfaceVariant, marginBottom: 6, textAlign: 'right' },
    pickerRow: { flexDirection: 'row-reverse', gap: 6, marginBottom: 12 },
    pickerButton: { flex: 1, padding: 10, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceVariant, alignItems: 'center' },
    pickerButtonActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
    pickerText: { fontFamily: 'Vazirmatn-Medium', fontSize: 11, color: theme.colors.secondary },
    pickerTextActive: { color: theme.colors.primary },

    aiButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: '#5856d6', padding: 10, borderRadius: theme.borderRadius.sm, marginBottom: 12, gap: 8 },
    aiButtonText: { color: '#fff', fontFamily: 'Vazirmatn-Bold', fontSize: 12 },

    suggestionCard: { borderLeftWidth: 3, borderLeftColor: '#5856d6', backgroundColor: 'rgba(88, 86, 214, 0.05)', padding: 10, borderRadius: 6, marginBottom: 8 },
    suggestionTitle: { fontFamily: 'Vazirmatn-Bold', fontSize: 11, color: theme.colors.onSurface, textAlign: 'right' },
    suggestionMeta: { fontFamily: 'Vazirmatn-Regular', fontSize: 10, color: theme.colors.secondary, textAlign: 'right', marginTop: 2 },

    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: theme.borderRadius.sm, alignItems: 'center' },
    modalBtnCancel: { backgroundColor: theme.colors.surfaceVariant },
    modalBtnSubmit: { backgroundColor: '#e53935' },
    modalBtnCancelText: { color: theme.colors.onSurface, fontFamily: 'Vazirmatn-Bold' },
    modalBtnSubmitText: { color: '#fff', fontFamily: 'Vazirmatn-Bold' },
    attachmentBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.borderRadius.sm, borderStyle: 'dashed', marginBottom: 12, gap: 8 },
    attachmentPreview: { width: '100%', height: 150, borderRadius: theme.borderRadius.sm, marginBottom: 12, backgroundColor: theme.colors.surfaceVariant },

    // Timeline styles
    timelineItem: { borderRightWidth: 1.5, borderRightColor: theme.colors.border, paddingRight: 16, marginRight: 8, paddingBottom: 14 },
    timelineDot: { position: 'absolute', right: -6, top: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
    timelineAction: { fontFamily: 'Vazirmatn-Bold', fontSize: 11, color: theme.colors.onSurface, textAlign: 'right' },
    timelineMeta: { fontFamily: 'Vazirmatn-Regular', fontSize: 9, color: theme.colors.secondary, textAlign: 'right' },
    timelineNote: { fontFamily: 'Vazirmatn-Regular', fontSize: 11, color: theme.colors.onSurfaceVariant, textAlign: 'right', marginTop: 4, backgroundColor: theme.colors.surfaceVariant, padding: 8, borderRadius: 4 },
  })

  return (
    <ScreenWrapper title="مدیریت فالت قطارها" navigation={navigation}>
      <View style={styles.container}>
        {/* Filter Bar */}
        <View style={styles.filterBarWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
            {[
              { key: '', label: 'همه' },
              { key: 'submitted', label: 'ثبت شده' },
              { key: 'under_review', label: 'در حال بررسی' },
              { key: 'approved', label: 'تایید شده' },
              { key: 'in_repair', label: 'در حال تعمیر' },
              { key: 'repaired', label: 'تعمیر شده' },
              { key: 'verified_closed', label: 'بسته شده' },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterButton, statusFilter === f.key && styles.filterActive]}
                onPress={() => setStatusFilter(f.key)}
              >
                <Text style={[styles.filterText, statusFilter === f.key && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {isOffline && (
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>نمایش آفلاین فالت‌های کش‌شده</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={async () => {
                  setSelectedReport(item)
                  setShowDetailModal(true)
                  // Load detailed log if online
                  if (!isGlobalOffline) {
                    try {
                      const res = await fetch(`${API_URL}/faults/${item.id}`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                      })
                      if (res.ok) {
                        const json = await res.json()
                        setSelectedReport(json.data)
                      }
                    } catch {}
                  }
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>
                      قطار {item.train.trainNumber}
                      {item.wagon && ` | واگن ${item.wagon.position}`}
                    </Text>
                    <Text style={styles.wagonCode}>{item.faultCode.code} - {item.faultCode.title}</Text>
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

                <Text style={styles.cardBody} numberOfLines={2}>{item.description}</Text>

                <View style={styles.cardFooter}>
                  <View style={styles.cardMetaRow}>
                    <MaterialIcons name="person-outline" size={14} color={theme.colors.secondary} />
                    <Text style={styles.cardMeta}>{item.reporter.name}</Text>
                  </View>
                  <View style={styles.cardMetaRow}>
                    <MaterialIcons name="confirmation-number" size={14} color={theme.colors.secondary} />
                    <Text style={styles.cardMeta}>F-{item.faultNo}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <MaterialIcons name="error-outline" size={48} color={theme.colors.secondary} />
                <Text style={styles.emptyText}>
                  {isOffline ? 'ارتباط قطع است و داده کش‌شده‌ای یافت نشد.' : 'هیچ گزارشی یافت نشد'}
                </Text>
              </View>
            }
          />
        )}

        {/* FAB to report new fault */}
        <TouchableOpacity style={styles.fab} onPress={() => setShowCreateModal(true)}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Wizard creation modal */}
        <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>گزارش نقص فنی ناوگان (فالت قطار)</Text>

                {/* Train selector */}
                <Text style={styles.label}>انتخاب قطار *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                  {trains.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.pickerButton, selectedTrain?.id === t.id && styles.pickerButtonActive]}
                      onPress={() => {
                        setSelectedTrain(t)
                        setSelectedWagonId('')
                      }}
                    >
                      <Text style={[styles.pickerText, selectedTrain?.id === t.id && styles.pickerTextActive]}>
                        قطار {t.trainNumber}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Wagon selector */}
                {selectedTrain && (
                  <>
                    <Text style={styles.label}>انتخاب واگن (اختیاری)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                      <TouchableOpacity
                        style={[styles.pickerButton, selectedWagonId === '' && styles.pickerButtonActive]}
                        onPress={() => setSelectedWagonId('')}
                      >
                        <Text style={[styles.pickerText, selectedWagonId === '' && styles.pickerTextActive]}>کل قطار</Text>
                      </TouchableOpacity>
                      {selectedTrain.wagons.map((w) => (
                        <TouchableOpacity
                          key={w.id}
                          style={[styles.pickerButton, selectedWagonId === w.id && styles.pickerButtonActive]}
                          onPress={() => setSelectedWagonId(w.id)}
                        >
                          <Text style={[styles.pickerText, selectedWagonId === w.id && styles.pickerTextActive]}>
                            واگن {w.position} ({w.wagonCode})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                {/* Description and location */}
                <Text style={styles.label}>شرح و اثر خرابی *</Text>
                <TextInput
                  style={[styles.input, { minHeight: 60 }]}
                  placeholder="شرح جزئیات، صدا یا علائم عیب..."
                  placeholderTextColor={theme.colors.secondary}
                  multiline
                  value={description}
                  onChangeText={setDescription}
                />

                <TextInput
                  style={styles.input}
                  placeholder="موقعیت وقوع فالت (مثال: ایستگاه طالقانی)"
                  placeholderTextColor={theme.colors.secondary}
                  value={locationNote}
                  onChangeText={setLocationNote}
                />

                {/* AI Matching catalog */}
                <TouchableOpacity
                  style={styles.aiButton}
                  onPress={handleAiMatch}
                  disabled={matching || !description.trim()}
                >
                  {matching ? <ActivityIndicator size="small" color="#fff" /> : (
                    <>
                      <MaterialIcons name="psychology" size={18} color="#fff" />
                      <Text style={styles.aiButtonText}>تشخیص و انطباق هوشمند کد خطا</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Matched Suggestions */}
                {matchedSuggestions.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.label}>کدهای پیشنهادی کاتالوگ:</Text>
                    {matchedSuggestions.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.suggestionCard, selectedFaultCode?.id === s.id && { backgroundColor: 'rgba(88, 86, 214, 0.15)', borderColor: '#5856d6' }]}
                        onPress={() => {
                          setSelectedFaultCode(s)
                          setPriority(s.defaultPriority || 'medium')
                        }}
                      >
                        <Text style={styles.suggestionTitle}>{s.code} - {s.title}</Text>
                        <Text style={styles.suggestionMeta}>اولویت پیش‌فرض: {PRIORITY_LABELS[s.defaultPriority] || s.defaultPriority} | انطباق: {Math.round(s.similarity * 100)}%</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {selectedFaultCode && (
                  <View style={{ padding: 10, backgroundColor: theme.colors.surfaceVariant, borderRadius: 6, marginBottom: 12 }}>
                    <Text style={[styles.label, { color: theme.colors.primary }]}>کد انتخاب شده: {selectedFaultCode.code}</Text>
                    <Text style={{ fontSize: 11, color: theme.colors.onSurfaceVariant, textAlign: 'right' }}>{selectedFaultCode.title}</Text>
                  </View>
                )}

                {/* Priority Selection */}
                <Text style={styles.label}>اولویت گزارش فالت</Text>
                <View style={styles.pickerRow}>
                  {['low', 'medium', 'high', 'critical'].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.pickerButton, priority === p && styles.pickerButtonActive]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[styles.pickerText, priority === p && styles.pickerTextActive]}>
                        {PRIORITY_LABELS[p]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Service Impact Selection */}
                <Text style={styles.label}>اثر بر سیر قطار</Text>
                <View style={styles.pickerRow}>
                  {[
                    { key: 'none', label: 'بدون اثر' },
                    { key: 'delay', label: 'تاخیر در سیر' },
                    { key: 'withdrawal', label: 'کوبله/خروج از سیر' },
                  ].map((imp) => (
                    <TouchableOpacity
                      key={imp.key}
                      style={[styles.pickerButton, serviceImpact === imp.key && styles.pickerButtonActive]}
                      onPress={() => setServiceImpact(imp.key)}
                    >
                      <Text style={[styles.pickerText, serviceImpact === imp.key && styles.pickerTextActive]}>
                        {imp.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Camera attachment */}
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
                      const res = await pickAndUploadImage(true)
                      setIsUploading(false)
                      if (res) setNewAttachment(res)
                    }}
                    disabled={isUploading}
                  >
                    {isUploading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : (
                      <>
                        <MaterialIcons name="add-a-photo" size={20} color={theme.colors.secondary} />
                        <Text style={{ fontFamily: 'Vazirmatn-Medium', color: theme.colors.secondary }}>افزودن تصویر خرابی</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowCreateModal(false)}>
                    <Text style={styles.modalBtnCancelText}>انصراف</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSubmit]} onPress={handleCreateFault} disabled={isCreating}>
                    {isCreating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.modalBtnSubmitText}>ثبت فالت</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Detail Modal */}
        <Modal visible={showDetailModal} transparent animationType="fade" onRequestClose={() => setShowDetailModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedReport && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontFamily: 'Vazirmatn-Bold', fontSize: 15, color: theme.colors.onSurface }}>
                      جزئیات فالت F-{selectedReport.faultNo}
                    </Text>
                    <View style={styles.badges}>
                      <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[selectedReport.status]}20` }]}>
                        <Text style={{ color: STATUS_COLORS[selectedReport.status], fontSize: 10, fontWeight: '700' }}>
                          {STATUS_LABELS[selectedReport.status]}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Guide text */}
                  {selectedReport.faultCode.operatorGuide && (
                    <View style={{ backgroundColor: 'rgba(255, 149, 0, 0.08)', borderRightWidth: 3, borderRightColor: '#ff9500', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                      <Text style={{ fontFamily: 'Vazirmatn-Bold', fontSize: 10, color: '#ff9500', textAlign: 'right' }}>اقدام فوری راهبر:</Text>
                      <Text style={{ fontFamily: 'Vazirmatn-Regular', fontSize: 11, color: '#ff9500', textAlign: 'right', marginTop: 2 }}>
                        {selectedReport.faultCode.operatorGuide}
                      </Text>
                    </View>
                  )}

                  {/* Photo attachment if available */}
                  {selectedReport.photoUrls && selectedReport.photoUrls.length > 0 && (
                    <Image
                      source={{ uri: typeof selectedReport.photoUrls === 'string' ? JSON.parse(selectedReport.photoUrls)[0] : selectedReport.photoUrls[0] }}
                      style={{ width: '100%', height: 180, borderRadius: 8, marginBottom: 12 }}
                      resizeMode="cover"
                    />
                  )}

                  {/* Specifications */}
                  <View style={{ backgroundColor: theme.colors.surfaceVariant, padding: 12, borderRadius: 8, gap: 8, marginBottom: 12 }}>
                    <Text style={{ fontFamily: 'Vazirmatn-Regular', fontSize: 11, color: theme.colors.onSurfaceVariant, textAlign: 'right' }}>
                      <Text style={{ fontFamily: 'Vazirmatn-Bold' }}>قطار: </Text>{selectedReport.train.trainNumber} ({selectedReport.train.fleetSeries})
                    </Text>
                    {selectedReport.wagon && (
                      <Text style={{ fontFamily: 'Vazirmatn-Regular', fontSize: 11, color: theme.colors.onSurfaceVariant, textAlign: 'right' }}>
                        <Text style={{ fontFamily: 'Vazirmatn-Bold' }}>موقعیت واگن: </Text>واگن {selectedReport.wagon.position} ({selectedReport.wagon.wagonCode})
                      </Text>
                    )}
                    <Text style={{ fontFamily: 'Vazirmatn-Regular', fontSize: 11, color: theme.colors.onSurfaceVariant, textAlign: 'right' }}>
                      <Text style={{ fontFamily: 'Vazirmatn-Bold' }}>کد خطا: </Text>{selectedReport.faultCode.code} - {selectedReport.faultCode.title}
                    </Text>
                    <Text style={{ fontFamily: 'Vazirmatn-Regular', fontSize: 11, color: theme.colors.onSurfaceVariant, textAlign: 'right' }}>
                      <Text style={{ fontFamily: 'Vazirmatn-Bold' }}>شرح خرابی: </Text>{selectedReport.description}
                    </Text>
                    {selectedReport.locationNote && (
                      <Text style={{ fontFamily: 'Vazirmatn-Regular', fontSize: 11, color: theme.colors.onSurfaceVariant, textAlign: 'right' }}>
                        <Text style={{ fontFamily: 'Vazirmatn-Bold' }}>موقعیت وقوع: </Text>{selectedReport.locationNote}
                      </Text>
                    )}
                  </View>

                  {/* Actions buttons based on status */}
                  {!isOffline && (
                    <View style={{ gap: 8, marginBottom: 16 }}>
                      {selectedReport.status === 'submitted' && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: '#5856d6' }]}
                          onPress={() => executeTransition(selectedReport.id, 'review_approve', { priority: selectedReport.priority })}
                        >
                          <Text style={{ color: '#fff', fontFamily: 'Vazirmatn-Bold' }}>تایید و ارجاع به تعمیرات</Text>
                        </TouchableOpacity>
                      )}

                      {selectedReport.status === 'approved' && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: '#007aff' }]}
                          onPress={() => executeTransition(selectedReport.id, 'start_repair')}
                        >
                          <Text style={{ color: '#fff', fontFamily: 'Vazirmatn-Bold' }}>شروع تعمیرات فالت</Text>
                        </TouchableOpacity>
                      )}

                      {selectedReport.status === 'in_repair' && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: '#4cd964' }]}
                          onPress={() => {
                            setRootCause('')
                            setActionsTaken('')
                            setPartsUsed('')
                            setShowRepairModal(true)
                          }}
                        >
                          <Text style={{ color: '#fff', fontFamily: 'Vazirmatn-Bold' }}>ثبت اقدامات تعمیراتی</Text>
                        </TouchableOpacity>
                      )}

                      {selectedReport.status === 'repaired' && (
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: '#34c759' }]}
                          onPress={() => executeTransition(selectedReport.id, 'verify_close')}
                        >
                          <Text style={{ color: '#fff', fontFamily: 'Vazirmatn-Bold' }}>تایید نهایی و بستن فالت</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Timeline Stepper */}
                  {selectedReport.logs && selectedReport.logs.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={[styles.label, { marginBottom: 10 }]}>تایم‌لاین چرخه عمر فالت</Text>
                      {selectedReport.logs.map((log) => (
                        <View key={log.id} style={styles.timelineItem}>
                          <View style={styles.timelineDot} />
                          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.timelineAction}>
                              {LOG_ACTION_LABELS[log.action] || log.action}
                            </Text>
                            <Text style={styles.timelineMeta}>
                              توسط: {log.actor.name}
                            </Text>
                          </View>
                          {log.note && <Text style={styles.timelineNote}>{log.note}</Text>}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Comments Input inside modal */}
                  <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 }}>
                    <Text style={styles.label}>درج دیدگاه یا گزارش پیشرفت تعمیر:</Text>
                    <TextInput
                      style={[styles.input, { minHeight: 50, marginTop: 4 }]}
                      placeholder="پیام خود را بنویسید..."
                      placeholderTextColor={theme.colors.secondary}
                      value={commentText}
                      onChangeText={setCommentText}
                    />
                    <TouchableOpacity
                      style={[styles.actionButton, { marginTop: 4 }]}
                      onPress={() => submitComment(selectedReport.id)}
                      disabled={submittingComment || !commentText.trim()}
                    >
                      {submittingComment ? <ActivityIndicator size="small" color={theme.colors.primary} /> : (
                        <Text style={styles.actionButtonText}>ثبت نظر</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel, { marginTop: 16 }]}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>بستن پنجره</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Repair Action modal */}
        <Modal visible={showRepairModal} transparent animationType="slide" onRequestClose={() => setShowRepairModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>ثبت اقدامات تعمیراتی</Text>

                <Text style={styles.label}>علت ریشه‌ای خرابی (Root Cause) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="علت وقوع نقص فنی قطار..."
                  placeholderTextColor={theme.colors.secondary}
                  value={rootCause}
                  onChangeText={setRootCause}
                />

                <Text style={styles.label}>اقدامات فنی انجام‌شده (Actions Taken) *</Text>
                <TextInput
                  style={[styles.input, { minHeight: 60 }]}
                  placeholder="مراحل رفع عیب، اتصالات، تست‌ها..."
                  placeholderTextColor={theme.colors.secondary}
                  multiline
                  value={actionsTaken}
                  onChangeText={setActionsTaken}
                />

                <Text style={styles.label}>قطعات مصرفی (فرمت متنی)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="مثال: واشر ترمز، سنسور دما..."
                  placeholderTextColor={theme.colors.secondary}
                  value={partsUsed}
                  onChangeText={setPartsUsed}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowRepairModal(false)}>
                    <Text style={styles.modalBtnCancelText}>انصراف</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSubmit, { backgroundColor: '#4cd964' }]}
                    onPress={() => {
                      if (!rootCause.trim() || !actionsTaken.trim()) {
                        Alert.alert('خطا', 'ثبت علت ریشه‌ای و اقدامات انجام‌شده الزامی است.')
                        return
                      }
                      const partsList = partsUsed.trim() ? partsUsed.split(',').map((p) => p.trim()) : []
                      executeTransition(selectedReport!.id, 'repair_complete', {
                        rootCause: rootCause.trim(),
                        actionsTaken: actionsTaken.trim(),
                        partsUsed: partsList,
                      })
                    }}
                  >
                    <Text style={{ color: '#fff', fontFamily: 'Vazirmatn-Bold' }}>ثبت و اتمام تعمیر</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
    </ScreenWrapper>
  )
}

export default TicketsScreen
