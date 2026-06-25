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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight size={20} color="#f2f2f7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>چک‌لیست‌های فنی قطار (خط ۱)</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Admin Simulation Toggle Bar */}
      <View style={styles.adminSimulationBar}>
        <View style={styles.adminSimLabelContainer}>
          <Shield size={14} color={isAdminSimulated ? "#e53935" : "#8e8e93"} style={{ marginLeft: 6 }} />
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
                  <ClipboardCheck size={16} color="#e53935" style={{ marginLeft: 6 }} />
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
                    <Info size={11} color="#ef4444" style={{ marginLeft: 4 }} />
                    <Text style={styles.validationHelpText}>برای ارسال، تایید موارد الزامی اجباری است.</Text>
                  </View>
                )}
              </View>
            ) : templates.length === 0 ? (
              <View style={styles.emptyCard}>
                <ClipboardCheck size={36} color="#8e8e93" />
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
                                <CheckCircle2 size={12} color="#34c759" />
                              ) : (
                                <XCircle size={12} color="#ef4444" />
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
                <Lock size={16} color="#e53935" style={{ marginLeft: 6 }} />
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
                <Text style={styles.sectionTitle}>تسک‌های تعریف شده در این قالب ({toFa(newTplItems.length)} مورد):</Text>
                
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
                    trackColor={{ false: '#262930', true: 'rgba(229, 57, 53, 0.4)' }}
                    thumbColor={newItemRequired ? '#e53935' : '#8e8e93'}
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#13151a',
    padding: 16,
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
    backgroundColor: '#1c1e24',
    borderWidth: 1,
    borderColor: '#262930',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  adminSimLabelContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  adminSimLabel: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: 'bold',
  },
  adminSimButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3f4b',
    backgroundColor: '#13151a',
  },
  adminSimButtonActive: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderColor: 'rgba(229, 57, 53, 0.4)',
  },
  adminSimButtonText: {
    fontSize: 10,
    color: '#8e8e93',
    fontWeight: '600',
  },
  adminSimButtonTextActive: {
    color: '#e53935',
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: '#1c1e24',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262930',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#e53935',
  },
  tabButtonText: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabButtonTextActive: {
    color: '#f2f2f7',
  },
  card: {
    backgroundColor: '#1c1e24',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(38, 41, 48, 0.4)',
    paddingBottom: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f2f2f7',
    flex: 1,
    textAlign: 'right',
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cancelButtonText: {
    fontSize: 11,
    color: '#8e8e93',
  },
  templateDesc: {
    fontSize: 11,
    color: '#8e8e93',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 16,
  },
  metadataBox: {
    backgroundColor: '#13151a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262930',
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  metaCol: {
    gap: 6,
  },
  metaLabel: {
    fontSize: 11,
    color: '#8e8e93',
    textAlign: 'right',
    fontWeight: '600',
  },
  metaInput: {
    backgroundColor: '#1c1e24',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 6,
    height: 36,
    paddingHorizontal: 10,
    color: '#f2f2f7',
    fontSize: 11,
    textAlign: 'right',
  },
  stationSelectionRow: {
    flexDirection: 'row-reverse',
  },
  stationPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1c1e24',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 15,
    marginLeft: 6,
  },
  stationPillActive: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderColor: '#e53935',
  },
  stationPillText: {
    color: '#8e8e93',
    fontSize: 10.5,
  },
  stationPillTextActive: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  itemsList: {
    gap: 8,
    marginBottom: 16,
  },
  itemRow: {
    backgroundColor: '#13151a',
    borderWidth: 1,
    borderColor: '#262930',
    borderRadius: 8,
    padding: 10,
  },
  itemRowChecked: {
    borderColor: 'rgba(52, 199, 89, 0.2)',
    backgroundColor: 'rgba(52, 199, 89, 0.02)',
  },
  itemRowRequired: {
    borderColor: 'rgba(239, 68, 68, 0.12)',
  },
  checkWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderWidth: 1.5,
    borderColor: '#8e8e93',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkboxChecked: {
    borderColor: '#34c759',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  checkMark: {
    color: '#34c759',
    fontSize: 10,
    fontWeight: 'bold',
  },
  labelWrapper: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLabelText: {
    fontSize: 11.5,
    color: '#f2f2f7',
    textAlign: 'right',
    flex: 1,
  },
  itemLabelTextDone: {
    textDecorationLine: 'line-through',
    color: '#8e8e93',
  },
  requiredBadge: {
    fontSize: 8.5,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: 'bold',
    marginRight: 6,
  },
  requiredBadgeTrue: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
  },
  requiredBadgeFalse: {
    backgroundColor: '#262930',
    color: '#8e8e93',
  },
  itemNoteContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 30, 36, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(38, 41, 48, 0.5)',
    borderRadius: 6,
    height: 28,
    paddingHorizontal: 6,
    marginTop: 8,
  },
  itemNoteInput: {
    flex: 1,
    color: '#f2f2f7',
    fontSize: 10,
    textAlign: 'right',
    height: '100%',
  },
  submitBtn: {
    backgroundColor: '#e53935',
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#f2f2f7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  validationHelp: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  validationHelpText: {
    fontSize: 10,
    color: '#ef4444',
  },
  emptyCard: {
    backgroundColor: '#1c1e24',
    borderWidth: 1,
    borderColor: '#262930',
    borderRadius: 12,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#8e8e93',
    fontSize: 12,
  },
  listContainer: {
    gap: 12,
  },
  listSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f2f2f7',
    textAlign: 'right',
    marginBottom: 4,
  },
  templateItemCard: {
    backgroundColor: '#1c1e24',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateCardMeta: {
    flex: 1,
    gap: 4,
  },
  templateCardName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#f2f2f7',
    textAlign: 'right',
  },
  templateCardDesc: {
    fontSize: 10.5,
    color: '#8e8e93',
    textAlign: 'right',
  },
  templateCardBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badgeLabel: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#13151a',
    color: '#8e8e93',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#262930',
  },
  badgeLabelReq: {
    color: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  historyCard: {
    backgroundColor: '#1c1e24',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  historyCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(38, 41, 48, 0.3)',
    paddingBottom: 8,
  },
  historyTplName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f2f2f7',
    textAlign: 'right',
  },
  historyMetaText: {
    fontSize: 9.5,
    color: '#8e8e93',
    textAlign: 'right',
    marginTop: 2,
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(52, 199, 89, 0.2)',
  },
  historyStatusText: {
    fontSize: 9,
    color: '#34c759',
    fontWeight: 'bold',
  },
  defectAlertBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 0, 0.08)',
    borderColor: 'rgba(255, 179, 0, 0.2)',
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
  },
  defectAlertText: {
    fontSize: 10,
    color: '#ffb300',
    fontWeight: 'bold',
  },
  historyItemsGrid: {
    gap: 6,
  },
  historyItemRow: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  histChecked: {
    backgroundColor: 'rgba(52, 199, 89, 0.02)',
    borderColor: 'rgba(52, 199, 89, 0.08)',
  },
  histUnchecked: {
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
    borderColor: 'rgba(239, 68, 68, 0.08)',
  },
  historyItemTitleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemLabel: {
    fontSize: 10.5,
    color: '#f2f2f7',
    flex: 1,
    textAlign: 'right',
  },
  historyItemNote: {
    fontSize: 9.5,
    color: '#ffb300',
    textAlign: 'right',
    backgroundColor: 'rgba(255, 179, 0, 0.05)',
    padding: 4,
    borderRadius: 4,
    marginTop: 2,
  },
  taskInput: {
    backgroundColor: '#13151a',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    color: '#f2f2f7',
    fontSize: 11.5,
    textAlign: 'right',
    marginBottom: 10,
  },
  textarea: {
    backgroundColor: '#13151a',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: '#f2f2f7',
    fontSize: 11,
    textAlign: 'right',
    minHeight: 52,
    marginBottom: 14,
  },
  adminItemsSection: {
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#e53935',
    textAlign: 'right',
  },
  emptyTasksText: {
    fontSize: 10.5,
    color: '#8e8e93',
    textAlign: 'center',
    paddingVertical: 10,
  },
  adminItemsList: {
    backgroundColor: '#13151a',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    gap: 6,
  },
  adminItemRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#262930',
  },
  adminItemRowTextContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  adminItemIndex: {
    fontSize: 10.5,
    color: '#8e8e93',
    marginLeft: 4,
  },
  adminItemLabel: {
    fontSize: 11,
    color: '#f2f2f7',
    textAlign: 'right',
    flex: 1,
  },
  adminItemDelete: {
    padding: 4,
  },
  addItemForm: {
    backgroundColor: '#13151a',
    borderWidth: 1,
    borderColor: '#262930',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  addItemFormTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#f2f2f7',
    textAlign: 'right',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 10.5,
    color: '#8e8e93',
  },
  addItemBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1e24',
    borderWidth: 1,
    borderColor: '#262930',
    height: 32,
    borderRadius: 6,
  },
  addItemBtnText: {
    color: '#f2f2f7',
    fontSize: 11,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262930',
    marginBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f2f2f7',
    textAlign: 'center',
    flex: 1,
  }
})
