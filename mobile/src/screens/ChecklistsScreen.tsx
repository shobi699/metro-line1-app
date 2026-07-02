import React, { useState, useEffect, useMemo } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Platform
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ClipboardCheck,
  History,
  Lock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Info,
  Wrench,
  Train,
  MapPin,
  CheckCircle2,
  XCircle
} from 'lucide-react-native'

import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'
import { useNetworkStore } from '../stores/network'
import { API_URL } from '../shared/config'
import { toFa } from '../shared/jalali'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'

interface ChecklistItem {
  label: string
  required: boolean
}

interface Template {
  id: string
  name: string
  description: string | null
  items: ChecklistItem[]
}

interface ChecklistRecord {
  id: string
  templateId: string
  items: Array<{ label: string; checked: boolean; note?: string }>
  signedAt: string
  trainId: string | null
  stationId: string | null
  template?: { name: string }
}

const LINE1_STATIONS = [
  'تجریش',
  'قلهک',
  'هفت تیر',
  'دروازه دولت',
  'امام خمینی',
  'شهر ری',
  'کهریزک',
  'دپوی کهریزک'
]

export function ChecklistsScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const config = useConfigStore((s) => s.config)
  const setGlobalOffline = useNetworkStore((s) => s.setOffline)

  const [templates, setTemplates] = useState<Template[]>([])
  const [history, setHistory] = useState<ChecklistRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  
  // Checklist filling states
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({})
  const [trainId, setTrainId] = useState('')
  const [stationId, setStationId] = useState('کهریزک')
  const [submitting, setSubmitting] = useState(false)

  // Navigation states
  const [activeTab, setActiveTab] = useState<'fill' | 'history' | 'admin'>('fill')
  const [isAdminSimulated, setIsAdminSimulated] = useState(true)
  const { theme } = useTheme()
  const styles = useMemo(() => getStyles(theme), [theme])

  // Template creation states (Admin)
  const [newTplName, setNewTplName] = useState('')
  const [newTplDescription, setNewTplDescription] = useState('')
  const [newTplItems, setNewTplItems] = useState<ChecklistItem[]>([
    { label: 'تست ترمز اضطراری و ترمزهای پارکینگ قطار', required: true },
    { label: 'بررسی فشار مخازن باد اصلی (حداقل ۷.۵ بار)', required: true },
    { label: 'کنترل سیستم رادیویی و خط ارتباط بی سیم با OCC', required: true },
    { label: 'تست باز و بسته شدن درب‌های قطار از هر دو سمت', required: true }
  ])
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newItemRequired, setNewItemRequired] = useState(true)
  const [creatingTemplate, setCreatingTemplate] = useState(false)

  // Load templates and history
  async function loadData() {
    if (!accessToken) return
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${accessToken}` }
      const [templatesRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/checklists`, { headers }),
        fetch(`${API_URL}/checklists?view=history`, { headers }),
      ])

      const [tplData, histData] = await Promise.all([
        templatesRes.ok ? templatesRes.json() : { data: [] },
        historyRes.ok ? historyRes.json() : { data: [] },
      ])

      setTemplates(tplData.data ?? [])
      setHistory(histData.data ?? [])
      setGlobalOffline(false)

      // Save to local cache
      if (config?.mobile?.offlineCacheEnabled !== false) {
        await AsyncStorage.multiSet([
          ['@checklists_templates', JSON.stringify(tplData.data ?? [])],
          ['@checklists_history', JSON.stringify(histData.data ?? [])]
        ])
      }
    } catch {
      setGlobalOffline(true)
      // Load offline cache on connection loss
      try {
        const cached = await AsyncStorage.multiGet(['@checklists_templates', '@checklists_history'])
        const cachedTemplates = cached.find(([k]) => k === '@checklists_templates')?.[1]
        const cachedHistory = cached.find(([k]) => k === '@checklists_history')?.[1]

        if (cachedTemplates) setTemplates(JSON.parse(cachedTemplates))
        if (cachedHistory) setHistory(JSON.parse(cachedHistory))
      } catch (err) {
        console.error('Error loading cached checklists:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [accessToken])

  // Submit filled checklist
  async function handleSubmitChecklist() {
    if (!accessToken || !activeTemplate) return
    setSubmitting(true)
    try {
      const items = activeTemplate.items.map((item, i) => ({
        label: item.label,
        checked: checkedItems[i] ?? false,
        note: itemNotes[i] || '',
      }))

      const res = await fetch(`${API_URL}/checklists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: activeTemplate.id,
          trainId: trainId.trim() ? trainId : null,
          stationId: stationId,
          items,
        }),
      })

      if (res.ok) {
        setActiveTemplate(null)
        setCheckedItems({})
        setItemNotes({})
        setTrainId('')
        setActiveTab('history')
        loadData()
        Alert.alert('موفقیت', 'چک‌لیست قبل از حرکت قطار با موفقیت ثبت شد.')
      } else {
        Alert.alert('خطا', 'ثبت چک‌لیست ناموفق بود.')
      }
    } catch {
      Alert.alert('خطای ارتباط با شبکه', 'در وضعیت آفلاین امکان ثبت به سرور وجود ندارد.')
    } finally {
      setSubmitting(false)
    }
  }

  // Create template (Admin)
  async function handleCreateTemplate() {
    if (!accessToken || !newTplName.trim()) return
    if (newTplItems.length === 0) return
    setCreatingTemplate(true)
    try {
      const res = await fetch(`${API_URL}/checklists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_template',
          name: newTplName,
          description: newTplDescription,
          items: newTplItems,
        }),
      })

      if (res.ok) {
        setNewTplName('')
        setNewTplDescription('')
        setNewTplItems([
          { label: 'تست ترمز اضطراری و ترمزهای پارکینگ قطار', required: true },
          { label: 'بررسی فشار مخازن باد اصلی (حداقل ۷.۵ بار)', required: true },
          { label: 'کنترل سیستم رادیویی و خط ارتباط بی سیم با OCC', required: true }
        ])
        setActiveTab('fill')
        loadData()
        Alert.alert('موفقیت', 'قالب جدید چک‌لیست با موفقیت ثبت گردید.')
      } else {
        Alert.alert('خطا', 'ثبت قالب ناموفق بود.')
      }
    } catch {
      Alert.alert('خطای شبکه', 'در وضعیت آفلاین امکان ثبت قالب وجود ندارد.')
    } finally {
      setCreatingTemplate(false)
    }
  }

  function handleAddNewItem() {
    if (!newItemLabel.trim()) return
    setNewTplItems([
      ...newTplItems,
      { label: newItemLabel, required: newItemRequired }
    ])
    setNewItemLabel('')
    setNewItemRequired(true)
  }

  function handleRemoveItem(idx: number) {
    setNewTplItems(newTplItems.filter((_, i) => i !== idx))
  }

  // Formatting dates to Jalali label
  function getJalaliLabel(isoString: string) {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoString
    }
  }

  // Validate if all required items are checked
  const isFormValid = useMemo(() => {
    if (!activeTemplate) return false
    return !activeTemplate.items
      .filter((item) => item.required)
      .some((_, i) => {
        // find index of this required item in the original list
        const origIdx = activeTemplate.items.findIndex(
          (origItem) => origItem.label === activeTemplate.items.filter(item => item.required)[i].label
        )
        return !checkedItems[origIdx]
      })
  }, [activeTemplate, checkedItems])

  return (
    <ScreenWrapper title="چک‌لیست‌های فنی قطار (خط ۱)" navigation={navigation}>
      <View style={styles.container}>

      {/* Admin Simulation Toggle Bar */}
      <View style={styles.adminSimulationBar}>
        <View style={styles.adminSimLabelContainer}>
          <Shield size={14} color={isAdminSimulated ? theme.colors.error : theme.colors.secondary} style={{ marginLeft: 6 }} />
          <Text style={styles.adminSimLabel}>شبیه‌ساز نقش مدیریت (ادمین):</Text>
        </View>
        <TouchableOpacity
          style={[styles.adminSimButton, isAdminSimulated && styles.adminSimButtonActive]}
          onPress={() => {
            const target = !isAdminSimulated
            setIsAdminSimulated(target)
            if (!target && activeTab === 'admin') {
              setActiveTab('fill')
            }
          }}
        >
          <Text style={[styles.adminSimButtonText, isAdminSimulated && styles.adminSimButtonTextActive]}>
            {isAdminSimulated ? 'مدیریت (فعال)' : 'کاربر عادی'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'fill' && styles.tabButtonActive]}
          onPress={() => setActiveTab('fill')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'fill' && styles.tabButtonTextActive]}>تکمیل چک‌لیست</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>تاریخچه</Text>
        </TouchableOpacity>

        {isAdminSimulated && (
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'admin' && styles.tabButtonActive]}
            onPress={() => setActiveTab('admin')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'admin' && styles.tabButtonTextActive]}>قالب‌ساز ادمین</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e53935" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* TAB 1: FILL */}
          {activeTab === 'fill' && (
            activeTemplate ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <ClipboardCheck size={16} color={theme.colors.error} style={{ marginLeft: 6 }} />
                  <Text style={styles.cardTitle}>{activeTemplate.name}</Text>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setActiveTemplate(null)
                      setCheckedItems({})
                      setItemNotes({})
                      setTrainId('')
                    }}
                  >
                    <Text style={styles.cancelButtonText}>انصراف</Text>
                  </TouchableOpacity>
                </View>

                {activeTemplate.description ? (
                  <Text style={styles.templateDesc}>{activeTemplate.description}</Text>
                ) : null}

                {/* Metadata Row */}
                <View style={styles.metadataBox}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>شماره رام قطار / واگن:</Text>
                    <TextInput
                      style={styles.metaInput}
                      placeholder="مثال: ۱۰۴"
                      placeholderTextColor="#555860"
                      value={trainId}
                      onChangeText={setTrainId}
                    />
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>ایستگاه شروع سیر:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stationSelectionRow}>
                      {LINE1_STATIONS.map((st) => (
                        <TouchableOpacity
                          key={st}
                          style={[styles.stationPill, stationId === st && styles.stationPillActive]}
                          onPress={() => setStationId(st)}
                        >
                          <Text style={[styles.stationPillText, stationId === st && styles.stationPillTextActive]}>{st}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Items */}
                <View style={styles.itemsList}>
                  {activeTemplate.items.map((item, i) => {
                    const isChecked = checkedItems[i] ?? false
                    return (
                      <View
                        key={i}
                        style={[
                          styles.itemRow,
                          isChecked && styles.itemRowChecked,
                          !isChecked && item.required && styles.itemRowRequired
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.checkWrapper}
                          onPress={() => setCheckedItems({ ...checkedItems, [i]: !isChecked })}
                        >
                          <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                            {isChecked && <Text style={styles.checkMark}>✓</Text>}
                          </View>
                          <View style={styles.labelWrapper}>
                            <Text style={[styles.itemLabelText, isChecked && styles.itemLabelTextDone]}>
                              {item.label}
                            </Text>
                            <Text style={[styles.requiredBadge, item.required ? styles.requiredBadgeTrue : styles.requiredBadgeFalse]}>
                              {item.required ? 'الزامی' : 'اختیاری'}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* Defect note input */}
                        <View style={styles.itemNoteContainer}>
                          <Wrench size={12} color="#8e8e93" style={{ marginLeft: 4 }} />
                          <TextInput
                            style={styles.itemNoteInput}
                            placeholder="ثبت گزارش نقص فنی یا توضیح فنی..."
                            placeholderTextColor="#555860"
                            value={itemNotes[i] || ''}
                            onChangeText={(text) => setItemNotes({ ...itemNotes, [i]: text })}
                          />
                        </View>
                      </View>
                    )
                  })}
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
                  disabled={submitting || !isFormValid}
                  onPress={handleSubmitChecklist}
                >
                  <Text style={styles.submitBtnText}>ثبت و ارسال چک‌لیست قبل از حرکت</Text>
                </TouchableOpacity>

                {!isFormValid && (
                  <View style={styles.validationHelp}>
                    <Info size={11} color={theme.colors.error} style={{ marginLeft: 4 }} />
                    <Text style={styles.validationHelpText}>برای ارسال، تایید موارد الزامی اجباری است.</Text>
                  </View>
                )}
              </View>
            ) : templates.length === 0 ? (
              <View style={styles.emptyCard}>
                <ClipboardCheck size={36} color={theme.colors.secondary} />
                <Text style={styles.emptyText}>هیچ قالب چک‌لیست فعالی یافت نشد.</Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                <Text style={styles.listSectionTitle}>قالب‌های بازرسی فنی قطار:</Text>
                {templates.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.templateItemCard}
                    onPress={() => setActiveTemplate(t)}
                  >
                    <View style={styles.templateCardMeta}>
                      <Text style={styles.templateCardName}>{t.name}</Text>
                      {t.description ? <Text style={styles.templateCardDesc}>{t.description}</Text> : null}
                    </View>
                    <View style={styles.templateCardBadges}>
                      <Text style={styles.badgeLabel}>{toFa(t.items.length)} آیتم</Text>
                      <Text style={[styles.badgeLabel, styles.badgeLabelReq]}>{toFa(t.items.filter(i => i.required).length)} الزامی</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )
          )}

          {/* TAB 2: HISTORY */}
          {activeTab === 'history' && (
            history.length === 0 ? (
              <View style={styles.emptyCard}>
                <History size={36} color="#8e8e93" />
                <Text style={styles.emptyText}>هیچ گزارش قبلی یافت نشد.</Text>
              </View>
            ) : (
              <View style={styles.listContainer}>
                {history.map((record) => {
                  const defectCount = record.items.filter(i => i.note && i.note.trim()).length
                  return (
                    <View key={record.id} style={styles.historyCard}>
                      <View style={styles.historyCardHeader}>
                        <View>
                          <Text style={styles.historyTplName}>{record.template?.name ?? 'چک‌لیست قطار'}</Text>
                          <Text style={styles.historyMetaText}>
                            {getJalaliLabel(record.signedAt)}
                            {record.trainId ? ` | رام قطار: ${toFa(record.trainId)}` : ''}
                            {record.stationId ? ` | ایستگاه: ${record.stationId}` : ''}
                          </Text>
                        </View>
                        <View style={styles.historyStatusBadge}>
                          <Text style={styles.historyStatusText}>ثبت شد</Text>
                        </View>
                      </View>

                      {defectCount > 0 ? (
                        <View style={styles.defectAlertBanner}>
                          <Wrench size={11} color="#ffb300" style={{ marginLeft: 4 }} />
                          <Text style={styles.defectAlertText}>تعداد {toFa(defectCount)} نقص فنی ثبت شده است.</Text>
                        </View>
                      ) : null}

                      {/* Items status */}
                      <View style={styles.historyItemsGrid}>
                        {record.items.map((item, i) => (
                          <View
                            key={i}
                            style={[
                              styles.historyItemRow,
                              item.checked ? styles.histChecked : styles.histUnchecked
                            ]}
                          >
                            <View style={styles.historyItemTitleRow}>
                              <Text style={styles.historyItemLabel}>{item.label}</Text>
                              {item.checked ? (
                                <CheckCircle2 size={12} color={theme.colors.success} />
                              ) : (
                                <XCircle size={12} color={theme.colors.error} />
                              )}
                            </View>
                            {item.note && item.note.trim() ? (
                              <Text style={styles.historyItemNote}>گزارش خرابی: {item.note}</Text>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    </View>
                  )
                })}
              </View>
            )
          )}

          {/* TAB 3: ADMIN TEMPLATE BUILDER */}
          {activeTab === 'admin' && isAdminSimulated && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Lock size={16} color={theme.colors.error} style={{ marginLeft: 6 }} />
                <Text style={styles.cardTitle}>تعریف قالب جدید چک‌لیست قبل از حرکت</Text>
              </View>

              <Text style={styles.metaLabel}>نام قالب چک‌لیست:</Text>
              <TextInput
                style={styles.taskInput}
                placeholder="مثال: چک‌لیست ایمنی عمومی و ترمزها"
                placeholderTextColor="#555860"
                value={newTplName}
                onChangeText={setNewTplName}
              />

              <Text style={styles.metaLabel}>توضیحات و دستورالعمل راهبری (اختیاری):</Text>
              <TextInput
                style={styles.textarea}
                placeholder="توضیح کوتاه در مورد زمان پر کردن چک‌لیست..."
                placeholderTextColor="#555860"
                multiline
                numberOfLines={2}
                value={newTplDescription}
                onChangeText={setNewTplDescription}
              />

              {/* Added items list */}
              <View style={styles.adminItemsSection}>
                <Text style={styles.listSectionTitle}>تسک‌های تعریف شده در این قالب ({toFa(newTplItems.length)} مورد):</Text>
                
                {newTplItems.length === 0 ? (
                  <Text style={styles.emptyTasksText}>هیچ تسکی اضافه نشده است.</Text>
                ) : (
                  <View style={styles.adminItemsList}>
                    {newTplItems.map((item, idx) => (
                      <View key={idx} style={styles.adminItemRow}>
                        <View style={styles.adminItemRowTextContainer}>
                          <Text style={styles.adminItemIndex}>{toFa(idx + 1)}.</Text>
                          <Text style={styles.adminItemLabel}>{item.label}</Text>
                          <Text style={[styles.requiredBadge, item.required ? styles.requiredBadgeTrue : styles.requiredBadgeFalse]}>
                            {item.required ? 'الزامی' : 'اختیاری'}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveItem(idx)} style={styles.adminItemDelete}>
                          <Trash2 size={13} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Add item form */}
              <View style={styles.addItemForm}>
                <Text style={styles.addItemFormTitle}>افزودن تسک جدید به لیست:</Text>
                <TextInput
                  style={styles.taskInput}
                  placeholder="عنوان بازرسی (مثال: تست بوق بادی اضطراری)"
                  placeholderTextColor="#555860"
                  value={newItemLabel}
                  onChangeText={setNewItemLabel}
                />
                
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>این مورد الزامی و اجباری است:</Text>
                  <Switch
                    trackColor={{ false: theme.colors.border, true: theme.colors.primaryContainer }}
                    thumbColor={newItemRequired ? theme.colors.primary : theme.colors.secondary}
                    onValueChange={setNewItemRequired}
                    value={newItemRequired}
                  />
                </View>

                <TouchableOpacity style={styles.addItemBtn} onPress={handleAddNewItem}>
                  <Plus size={14} color="#f2f2f7" style={{ marginLeft: 4 }} />
                  <Text style={styles.addItemBtnText}>افزودن تسک به قالب</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, (!newTplName.trim() || newTplItems.length === 0) && styles.submitBtnDisabled]}
                disabled={creatingTemplate || !newTplName.trim() || newTplItems.length === 0}
                onPress={handleCreateTemplate}
              >
                <Text style={styles.submitBtnText}>ثبت و ثبت نهایی قالب چک‌لیست</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      )}
      </View>
    </ScreenWrapper>
  )
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.containerMargin,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  adminSimulationBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
    ...theme.shadows.level1,
  },
  adminSimLabelContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  adminSimLabel: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: 'bold',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  adminSimButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  adminSimButtonActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  adminSimButtonText: {
    fontSize: 10,
    color: theme.colors.secondary,
    fontWeight: '600',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  adminSimButtonTextActive: {
    color: theme.colors.onPrimary,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.borderRadius.xl,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  tabButtonTextActive: {
    color: theme.colors.onPrimary,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    ...theme.shadows.level1,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.onSurface,
    flex: 1,
    textAlign: 'right',
    fontFamily: theme.typography.cardTitle.fontFamily,
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cancelButtonText: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  templateDesc: {
    fontSize: 11,
    color: theme.colors.secondary,
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 16,
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  metadataBox: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  metaCol: {
    gap: 6,
  },
  metaLabel: {
    fontSize: 11,
    color: theme.colors.secondary,
    textAlign: 'right',
    fontWeight: '700',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  metaInput: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    height: 40,
    paddingHorizontal: 10,
    color: theme.colors.onSurface,
    fontSize: 14,
    textAlign: 'right',
    fontFamily: theme.typography.bodyMd.fontFamily,
  },
  stationSelectionRow: {
    flexDirection: 'row-reverse',
  },
  stationPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 15,
    marginLeft: 6,
  },
  stationPillActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  stationPillText: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  stationPillTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: '800',
    fontFamily: theme.typography.captionSm.fontFamily,
  },
  itemsList: { gap: 8, marginBottom: 16 },
  itemRow: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.lg, padding: 12 },
  itemRowChecked: { borderColor: theme.colors.success + '40', backgroundColor: theme.colors.success + '08' },
  itemRowRequired: { borderColor: theme.colors.error + '20' },
  checkWrapper: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  checkbox: { width: 18, height: 18, borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginLeft: 8, backgroundColor: theme.colors.surfaceContainerLowest },
  checkboxChecked: { borderColor: theme.colors.success, backgroundColor: theme.colors.success + '1A' },
  checkMark: { color: theme.colors.success, fontSize: 12, fontWeight: '900' },
  labelWrapper: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  itemLabelText: { fontSize: 13, color: theme.colors.onSurface, textAlign: 'right', flex: 1, fontWeight: '600', fontFamily: theme.typography.bodyMd.fontFamily },
  itemLabelTextDone: { textDecorationLine: 'line-through', color: theme.colors.secondary },
  requiredBadge: { fontSize: 9, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: '800', marginRight: 8, fontFamily: theme.typography.captionSm.fontFamily },
  requiredBadgeTrue: { backgroundColor: theme.colors.error + '1A', color: theme.colors.error },
  requiredBadgeFalse: { backgroundColor: theme.colors.surfaceContainerLow, color: theme.colors.secondary },
  itemNoteContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, height: 36, paddingHorizontal: 8, marginTop: 10 },
  itemNoteInput: { flex: 1, color: theme.colors.onSurface, fontSize: 11, textAlign: 'right', height: '100%', fontFamily: theme.typography.bodyMd.fontFamily },
  submitBtn: { backgroundColor: theme.colors.primary, height: 48, borderRadius: theme.borderRadius.lg, justifyContent: 'center', alignItems: 'center', marginTop: 8, ...theme.shadows.level1 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800', fontFamily: theme.typography.cardTitle.fontFamily },
  validationHelp: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  validationHelpText: { fontSize: 11, color: theme.colors.error, fontWeight: '600', fontFamily: theme.typography.captionSm.fontFamily },
  emptyCard: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.xl, padding: 32, justifyContent: 'center', alignItems: 'center', gap: 10, ...theme.shadows.level1 },
  emptyText: { color: theme.colors.secondary, fontSize: 13, fontWeight: '600', fontFamily: theme.typography.bodyMd.fontFamily },
  listContainer: { gap: 12 },
  listSectionTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.onSurface, textAlign: 'right', marginBottom: 6, fontFamily: theme.typography.sectionTitle.fontFamily },
  templateItemCard: { backgroundColor: theme.colors.surfaceContainerLowest, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.borderRadius.xl, padding: 16, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', ...theme.shadows.level1 },
  templateCardMeta: { flex: 1, gap: 6 },
  templateCardName: { fontSize: 15, fontWeight: '800', color: theme.colors.onSurface, textAlign: 'right', fontFamily: theme.typography.cardTitle.fontFamily },
  templateCardDesc: { fontSize: 11, color: theme.colors.secondary, textAlign: 'right', fontFamily: theme.typography.captionSm.fontFamily },
  templateCardBadges: { flexDirection: 'row', gap: 6 },
  badgeLabel: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: theme.colors.surfaceContainerLow, color: theme.colors.secondary, borderRadius: 4, borderWidth: 1, borderColor: theme.colors.border, fontWeight: '600', fontFamily: theme.typography.captionSm.fontFamily },
  badgeLabelReq: { color: theme.colors.error, backgroundColor: theme.colors.error + '0A', borderColor: theme.colors.error + '1A' },
  historyCard: { backgroundColor: theme.colors.surfaceContainerLowest, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.borderRadius.xl, padding: 14, gap: 12, ...theme.shadows.level1 },
  historyCardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 10 },
  historyTplName: { fontSize: 13, fontWeight: '800', color: theme.colors.onSurface, textAlign: 'right', fontFamily: theme.typography.cardTitle.fontFamily },
  historyMetaText: { fontSize: 10, color: theme.colors.secondary, textAlign: 'right', marginTop: 4, fontWeight: '600', fontFamily: theme.typography.captionSm.fontFamily },
  historyStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.colors.success + '1A', borderRadius: 4, borderWidth: 1, borderColor: theme.colors.success + '30' },
  historyStatusText: { fontSize: 10, color: theme.colors.success, fontWeight: '800', fontFamily: theme.typography.captionSm.fontFamily },
  defectAlertBanner: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: theme.colors.warning + '1A', borderColor: theme.colors.warning + '30', borderWidth: 1, borderRadius: 6, padding: 8 },
  defectAlertText: { fontSize: 11, color: theme.colors.warning, fontWeight: '800', fontFamily: theme.typography.captionSm.fontFamily },
  historyItemsGrid: { gap: 8 },
  historyItemRow: { padding: 10, borderRadius: 6, borderWidth: 1, gap: 6 },
  histChecked: { backgroundColor: theme.colors.success + '08', borderColor: theme.colors.success + '1A' },
  histUnchecked: { backgroundColor: theme.colors.error + '08', borderColor: theme.colors.error + '1A' },
  historyItemTitleRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  historyItemLabel: { fontSize: 11, color: theme.colors.onSurface, flex: 1, textAlign: 'right', fontWeight: '600', fontFamily: theme.typography.bodyMd.fontFamily },
  historyItemNote: { fontSize: 10, color: theme.colors.warning, textAlign: 'right', backgroundColor: theme.colors.warning + '0A', padding: 6, borderRadius: 4, marginTop: 4, fontWeight: '600', fontFamily: theme.typography.captionSm.fontFamily },
  taskInput: { backgroundColor: theme.colors.surfaceContainerLowest, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, height: 42, color: theme.colors.onSurface, fontSize: 13, textAlign: 'right', marginBottom: 12, fontFamily: theme.typography.bodyMd.fontFamily },
  textarea: { backgroundColor: theme.colors.surfaceContainerLowest, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.borderRadius.md, padding: 12, color: theme.colors.onSurface, fontSize: 13, textAlign: 'right', minHeight: 60, marginBottom: 16, fontFamily: theme.typography.bodyMd.fontFamily },
  adminItemsSection: { gap: 10, marginBottom: 16 },
  emptyTasksText: { fontSize: 11, color: theme.colors.secondary, textAlign: 'center', paddingVertical: 12, fontWeight: '600', fontFamily: theme.typography.captionSm.fontFamily },
  adminItemsList: { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.borderRadius.lg, padding: 8, gap: 8 },
  adminItemRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  adminItemRowTextContainer: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1 },
  adminItemIndex: { fontSize: 11, color: theme.colors.secondary, marginLeft: 6, fontWeight: '700' },
  adminItemLabel: { fontSize: 13, color: theme.colors.onSurface, textAlign: 'right', flex: 1, fontWeight: '600', fontFamily: theme.typography.bodyMd.fontFamily },
  adminItemDelete: { padding: 6, backgroundColor: theme.colors.error + '1A', borderRadius: 4 },
  addItemForm: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.xl, padding: 12, marginBottom: 16 },
  addItemFormTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.onSurface, textAlign: 'right', marginBottom: 10, fontFamily: theme.typography.cardTitle.fontFamily },
  switchRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switchLabel: { fontSize: 11, color: theme.colors.secondary, fontWeight: '700', fontFamily: theme.typography.captionSm.fontFamily },
  addItemBtn: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, borderWidth: 1, borderColor: theme.colors.border, height: 38, borderRadius: theme.borderRadius.md, ...theme.shadows.level1 },
  addItemBtnText: { color: theme.colors.onPrimary, fontSize: 11, fontWeight: '800', fontFamily: theme.typography.captionSm.fontFamily },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border, marginBottom: 16 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.primary, textAlign: 'center', flex: 1, fontFamily: theme.typography.screenTitle.fontFamily }
})
