import React, { useState, useEffect, useMemo } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  Modal,
  TextInput
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useUIBuilderStore } from '../stores/ui-builder'
import { useTheme } from '../shared/ThemeProvider'
import { API_URL } from '../shared/config'
import { DynamicRenderer } from '../shared/DynamicRenderer'

const DEFAULT_WIDGETS = [
  { id: '1', widgetType: 'stat_card', title: 'آمار شیفت امروز', size: 'md', orderIndex: 0, isVisible: true, configJson: { source: 'shift' } },
  { id: '2', widgetType: 'chart', title: 'عملکرد کیلومتر رانندگی', size: 'md', orderIndex: 1, isVisible: true, configJson: { type: 'bar' } },
  { id: '3', widgetType: 'list', title: 'آخرین بخشنامه‌های ایمنی', size: 'lg', orderIndex: 2, isVisible: true, configJson: { limit: 3, source: 'bulletins' } },
  { id: '4', widgetType: 'banner', title: 'اطلاعیه مهم ایمنی خط ۱', size: 'lg', orderIndex: 3, isVisible: true, configJson: { content: 'رعایت دستورالعمل فاصله ایمن از سکو الزامی است.' } },
]

const DEFAULT_MENU_ITEMS = [
  { id: '1', label: 'داشبورد', icon: 'home', route: 'HomeScreen', orderIndex: 0, isVisible: true },
  { id: '2', label: 'تقویم', icon: 'calendar', route: 'LifeCalendarScreen', orderIndex: 1, isVisible: true },
  { id: '3', label: 'اعلان‌ها', icon: 'announcements', route: 'NotificationsScreen', orderIndex: 2, isVisible: true },
  { id: '4', label: 'گفتگو', icon: 'chat', route: 'ChatScreen', orderIndex: 3, isVisible: true },
  { id: '5', label: 'پروفایل', icon: 'profile', route: 'ProfileScreen', orderIndex: 4, isVisible: true },
]

const DEFAULT_SYSTEM_SETTINGS = [
  { key: 'mobile.enableSos', label: 'تلفن اضطراری SOS راهبران', value: true },
  { key: 'mobile.offlineCacheEnabled', label: 'ذخیره‌سازی لوحه به صورت آفلاین', value: true },
  { key: 'tickets.allowNoWagon', label: 'ثبت تیکت بدون شماره واگن', value: false },
  { key: 'meetings.autoApprove', label: 'تایید خودکار رزرو جلسات پرسنل', value: true }
]

export function UIBuilderScreen({ navigation }: any) {
  const { theme } = useTheme()

  const storeTheme = useUIBuilderStore((s) => s.theme)
  const storeMenuItems = useUIBuilderStore((s) => s.menuItems)
  const storeWidgets = useUIBuilderStore((s) => s.widgets)

  const updateThemeLocal = useUIBuilderStore((s) => s.updateThemeLocal)
  const updateMenuLocal = useUIBuilderStore((s) => s.updateMenuLocal)
  const updateWidgetsLocal = useUIBuilderStore((s) => s.updateWidgetsLocal)

  const saveThemeToServer = useUIBuilderStore((s) => s.saveThemeToServer)
  const saveMenuToServer = useUIBuilderStore((s) => s.saveMenuToServer)
  const saveWidgetsToServer = useUIBuilderStore((s) => s.saveWidgetsToServer)

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'theme' | 'menu' | 'dashboard' | 'system'>('theme')
  const [previewVisible, setPreviewVisible] = useState(false)

  // Local state fallbacks to prevent empty arrays from 401 unauth
  const [localMenuItems, setLocalMenuItems] = useState<any[]>([])
  const [localWidgets, setLocalWidgets] = useState<any[]>([])
  const [systemSettings, setSystemSettings] = useState<any[]>([])
  const [loadingSettings, setLoadingSettings] = useState(false)

  // Widget config editor state
  const [editingWidget, setEditingWidget] = useState<any | null>(null)
  const [editingWidgetIndex, setEditingWidgetIndex] = useState<number | null>(null)

  useEffect(() => {
    if (storeMenuItems && storeMenuItems.length > 0) {
      setLocalMenuItems(storeMenuItems)
    } else {
      setLocalMenuItems(DEFAULT_MENU_ITEMS)
    }
  }, [storeMenuItems])

  useEffect(() => {
    if (storeWidgets && storeWidgets.length > 0) {
      setLocalWidgets(storeWidgets)
    } else {
      setLocalWidgets(DEFAULT_WIDGETS)
    }
  }, [storeWidgets])

  useEffect(() => {
    void loadSystemSettings()
  }, [])

  const loadSystemSettings = async () => {
    setLoadingSettings(true)
    try {
      const token = await AsyncStorage.getItem('@auth_accessToken')
      const res = await fetch(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        const fetched = json.data || []
        const keysToExpose = ['mobile.enableSos', 'mobile.offlineCacheEnabled', 'tickets.allowNoWagon', 'meetings.autoApprove']
        
        const exposed = fetched
          .filter((s: any) => keysToExpose.includes(s.key))
          .map((s: any) => ({
            key: s.key,
            label: s.label,
            value: JSON.parse(s.value) === true
          }))
        
        if (!exposed.some((s: any) => s.key === 'meetings.autoApprove')) {
          exposed.push({
            key: 'meetings.autoApprove',
            label: 'تایید خودکار رزرو جلسات پرسنل',
            value: true
          })
        }
        
        setSystemSettings(exposed)
      } else {
        setSystemSettings(DEFAULT_SYSTEM_SETTINGS)
      }
    } catch (err) {
      console.error('Error fetching system settings:', err)
      setSystemSettings(DEFAULT_SYSTEM_SETTINGS)
    } finally {
      setLoadingSettings(false)
    }
  }

  const toggleSystemSetting = (key: string, val: boolean) => {
    setSystemSettings(prev => prev.map(s => s.key === key ? { ...s, value: val } : s))
  }

  const saveSystemSettings = async () => {
    try {
      const token = await AsyncStorage.getItem('@auth_accessToken')
      const updates = systemSettings.map(s => ({
        key: s.key,
        value: JSON.stringify(s.value)
      }))

      const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ updates })
      })

      if (!res.ok) {
        throw new Error('خطا در ذخیره تنظیمات داینامیک سیستم')
      }
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const colors = [
    { label: 'قرمز (خط ۱)', hex: '#ae0011' },
    { label: 'سبز (ایمنی)', hex: '#166534' },
    { label: 'آبی (سیگنالینگ)', hex: '#0284c7' },
    { label: 'بنفش (لوجستیک)', hex: '#4f46e5' },
    { label: 'طلایی (ستادی)', hex: '#ca8a04' },
  ]

  const radii = [0, 4, 8, 12, 16, 24]

  const handleSave = async () => {
    setSaving(true)
    try {
      // Sync local edits back to zustand stores before publishing
      updateMenuLocal(localMenuItems)
      updateWidgetsLocal(localWidgets)

      await Promise.all([
        saveThemeToServer(),
        saveMenuToServer(),
        saveWidgetsToServer(),
        saveSystemSettings(),
      ])
      Alert.alert('موفقیت', 'تغییرات چیدمان و تنظیمات با موفقیت ذخیره و منتشر شد.')
      navigation.goBack()
    } catch (err: any) {
      Alert.alert('خطا', 'ثبت تغییرات با خطا مواجه شد: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const moveMenu = (index: number, direction: 'up' | 'down') => {
    const updated = [...localMenuItems]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= updated.length) return

    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp

    updated.forEach((item, idx) => {
      item.orderIndex = idx
    })

    setLocalMenuItems(updated)
    updateMenuLocal(updated)
  }

  const toggleMenuVisibility = (index: number, val: boolean) => {
    const updated = [...localMenuItems]
    updated[index] = { ...updated[index], isVisible: val }
    setLocalMenuItems(updated)
    updateMenuLocal(updated)
  }

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const updated = [...localWidgets]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= updated.length) return

    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp

    updated.forEach((item, idx) => {
      item.orderIndex = idx
    })

    setLocalWidgets(updated)
    updateWidgetsLocal(updated)
  }

  const toggleWidgetVisibility = (index: number, val: boolean) => {
    const updated = [...localWidgets]
    updated[index] = { ...updated[index], isVisible: val }
    setLocalWidgets(updated)
    updateWidgetsLocal(updated)
  }

  const cycleWidgetSize = (index: number) => {
    const updated = [...localWidgets]
    const current = updated[index].size
    const next = current === 'sm' ? 'md' : current === 'md' ? 'lg' : 'sm'
    updated[index] = { ...updated[index], size: next }
    setLocalWidgets(updated)
    updateWidgetsLocal(updated)
  }

  // Open configurations edit modal for a widget
  const openWidgetEditor = (index: number) => {
    const widget = localWidgets[index]
    setEditingWidgetIndex(index)
    setEditingWidget({
      title: widget.title || '',
      size: widget.size,
      widgetType: widget.widgetType,
      configJson: widget.configJson ? { ...widget.configJson } : {}
    })
  }

  const saveWidgetConfig = () => {
    if (editingWidgetIndex === null || !editingWidget) return
    const updated = [...localWidgets]
    updated[editingWidgetIndex] = {
      ...updated[editingWidgetIndex],
      title: editingWidget.title,
      size: editingWidget.size,
      configJson: editingWidget.configJson
    }
    setLocalWidgets(updated)
    updateWidgetsLocal(updated)
    setEditingWidget(null)
    setEditingWidgetIndex(null)
  }

  const previewComponents = useMemo(() => {
    return localWidgets
      .filter((w) => w.isVisible)
      .map((w) => {
        let type = 'StatRow'
        let props = {}
        if (w.widgetType === 'stat_card') {
          type = 'StatRow'
          props = {
            items: [
              { label: w.title || 'آمار', value: '۵' }
            ]
          }
        } else if (w.widgetType === 'chart') {
          type = 'ChartWidget'
          props = {
            title: w.title || 'نمودار عملکرد',
            data: [
              { label: 'شنبه', value: 80 },
              { label: 'یکشنبه', value: 65 },
              { label: 'دوشنبه', value: 95 }
            ]
          }
        } else if (w.widgetType === 'list') {
          type = 'ListWidget'
          props = {
            title: w.title || 'لیست رویدادها',
            items: [
              { id: '1', title: 'جلسه با مدیریت خط ۱', date: 'امروز' },
              { id: '2', title: 'بررسی ایمنی ناوگان', date: 'فردا' }
            ]
          }
        } else {
          type = 'BannerWidget'
          props = {
            title: w.title || 'اطلاعیه مهم',
            content: w.configJson?.content || 'رعایت دستورالعمل فاصله ایمن از سکو الزامی است.'
          }
        }

        return {
          id: w.id,
          type,
          props,
          layout: { colSpan: w.size === 'sm' ? 4 : w.size === 'md' ? 6 : 12 }
        }
      })
  }, [localWidgets])

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: { padding: 4 },
    headerTitle: {
      fontFamily: theme.typography.screenTitle.fontFamily,
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'right',
    },
    tabBar: {
      flexDirection: 'row-reverse',
      backgroundColor: theme.colors.surfaceContainerLow,
      padding: 4,
      borderRadius: theme.borderRadius.lg,
      margin: 16,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
    },
    activeTabButton: {
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    tabText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 12,
      color: theme.colors.secondary,
    },
    activeTabText: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    content: { flex: 1, paddingHorizontal: 16 },
    section: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.xl,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
    },
    sectionTitle: {
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'right',
    },
    colorOption: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '50',
    },
    colorText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      color: theme.colors.text,
    },
    colorBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#ffffff50',
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '40',
    },
    itemInfo: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 12,
    },
    itemText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13.5,
      color: theme.colors.text,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    controlBtn: {
      padding: 6,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sizeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.primaryContainer + '20',
      borderWidth: 0.5,
      borderColor: theme.colors.primary,
    },
    sizeText: {
      fontSize: 9.5,
      color: theme.colors.primary,
      fontWeight: 'bold',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'column',
      gap: 10,
      backgroundColor: theme.colors.background,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonText: {
      color: '#ffffff',
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontSize: 14,
      fontWeight: 'bold',
    },
    previewButton: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewButtonText: {
      color: theme.colors.text,
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontFamily: theme.typography.screenTitle.fontFamily,
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    settingDesc: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      color: theme.colors.secondary,
      textAlign: 'right',
      marginTop: 2,
    },
    helperText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      color: theme.colors.secondary,
      fontSize: 11.5,
      textAlign: 'right',
      marginTop: 10,
    },
    // Config modal elements
    configLabel: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11.5,
      color: theme.colors.secondary,
      textAlign: 'right',
      marginBottom: 6,
      marginTop: 12,
    },
    configInput: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      color: theme.colors.text,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      textAlign: 'right',
    },
    sizeSelectorRow: {
      flexDirection: 'row-reverse',
      gap: 8,
      marginVertical: 4,
    },
    sizeSelectBtn: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sizeSelectActive: {
      backgroundColor: theme.colors.primaryContainer + '30',
      borderColor: theme.colors.primary,
    },
    sizeSelectText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11.5,
      color: theme.colors.text,
    }
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-forward" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>شخصی‌سازی رابط کاربری موبایل</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'system' && styles.activeTabButton]}
          onPress={() => setActiveTab('system')}
        >
          <Text style={[styles.tabText, activeTab === 'system' && styles.activeTabText]}>تنظیمات سیستم</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTabButton]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>داشبورد</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'menu' && styles.activeTabButton]}
          onPress={() => setActiveTab('menu')}
        >
          <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>منوی اصلی</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'theme' && styles.activeTabButton]}
          onPress={() => setActiveTab('theme')}
        >
          <Text style={[styles.tabText, activeTab === 'theme' && styles.activeTabText]}>تنظیمات تم</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tab content: Theme */}
        {activeTab === 'theme' && (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>رنگ شاخص اصلی برند</Text>
              {colors.map((c) => (
                <TouchableOpacity
                  key={c.hex}
                  style={styles.colorOption}
                  onPress={() => updateThemeLocal({ primaryColor: c.hex })}
                >
                  {storeTheme.primaryColor === c.hex ? (
                    <MaterialIcons name="check" size={20} color={theme.colors.primary} />
                  ) : <View />}
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                    <Text style={styles.colorText}>{c.label}</Text>
                    <View style={[styles.colorBadge, { backgroundColor: c.hex }]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>میزان انحنای گوشه‌ها (Radius)</Text>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around', marginVertical: 10 }}>
                {radii.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.controlBtn,
                      storeTheme.radius === r && { backgroundColor: theme.colors.primaryContainer }
                    ]}
                    onPress={() => updateThemeLocal({ radius: r })}
                  >
                    <Text style={[
                      styles.colorText,
                      storeTheme.radius === r && { color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }
                    ]}>{r}px</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Tab content: Menu */}
        {activeTab === 'menu' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ترتیب و نمایش زبانه‌های منوی پایین</Text>
            {localMenuItems.map((item, idx) => (
              <View key={item.id || idx} style={styles.itemRow}>
                <View style={styles.controls}>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    disabled={idx === 0}
                    onPress={() => moveMenu(idx, 'up')}
                  >
                    <MaterialIcons name="arrow-upward" size={16} color={idx === 0 ? '#cccccc' : theme.colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    disabled={idx === localMenuItems.length - 1}
                    onPress={() => moveMenu(idx, 'down')}
                  >
                    <MaterialIcons name="arrow-downward" size={16} color={idx === localMenuItems.length - 1 ? '#cccccc' : theme.colors.text} />
                  </TouchableOpacity>
                  <Switch
                    value={item.isVisible}
                    onValueChange={(val) => toggleMenuVisibility(idx, val)}
                  />
                </View>
                <View style={styles.itemInfo}>
                  <MaterialIcons name="menu" size={20} color={theme.colors.secondary} />
                  <Text style={styles.itemText}>{item.label}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab content: Dashboard */}
        {activeTab === 'dashboard' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>مدیریت ابزارک‌های روی صفحه داشبورد</Text>
            {localWidgets.map((item, idx) => (
              <View key={item.id || idx} style={styles.itemRow}>
                <View style={styles.controls}>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={() => openWidgetEditor(idx)}
                  >
                    <MaterialIcons name="edit" size={15} color={theme.colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    disabled={idx === 0}
                    onPress={() => moveWidget(idx, 'up')}
                  >
                    <MaterialIcons name="arrow-upward" size={16} color={idx === 0 ? '#cccccc' : theme.colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    disabled={idx === localWidgets.length - 1}
                    onPress={() => moveWidget(idx, 'down')}
                  >
                    <MaterialIcons name="arrow-downward" size={16} color={idx === localWidgets.length - 1 ? '#cccccc' : theme.colors.text} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.sizeBadge}
                    onPress={() => cycleWidgetSize(idx)}
                  >
                    <Text style={styles.sizeText}>{item.size === 'sm' ? '۱/۳' : item.size === 'md' ? 'نصف' : 'کامل'}</Text>
                  </TouchableOpacity>

                  <Switch
                    value={item.isVisible}
                    onValueChange={(val) => toggleWidgetVisibility(idx, val)}
                  />
                </View>
                <View style={styles.itemInfo}>
                  <MaterialIcons name="widgets" size={20} color={theme.colors.secondary} />
                  <Text style={styles.itemText}>{item.title}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab content: System Settings (Manager Personalization) */}
        {activeTab === 'system' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تنظیمات سیستمی و شخصی‌سازی مدیر</Text>
            {loadingSettings ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
            ) : systemSettings.length > 0 ? (
              systemSettings.map((s, idx) => (
                <View key={s.key || idx} style={styles.itemRow}>
                  <Switch
                    value={s.value}
                    onValueChange={(val) => toggleSystemSetting(s.key, val)}
                  />
                  <View style={[styles.itemInfo, { flex: 1, marginLeft: 16 }]}>
                    <View style={{ alignItems: 'flex-end', width: '100%' }}>
                      <Text style={[styles.itemText, { fontWeight: '700' }]}>{s.label}</Text>
                      <Text style={styles.settingDesc}>
                        {s.key === 'meetings.autoApprove'
                          ? 'درخواست جلسات پرسنل بدون نیاز به تایید دستی فوراً تایید می‌شود.'
                          : s.key === 'mobile.enableSos'
                          ? 'نمایش دکمه اضطراری SOS در صفحات اپلیکیشن پرسنل.'
                          : s.key === 'mobile.offlineCacheEnabled'
                          ? 'ذخیره خودکار شیفت‌ها و اطلاعات در حافظه داخلی برای مواقع قطعی خط.'
                          : 'امکان ثبت گزارش‌های خرابی ایستگاه بدون نیاز به فیلد شماره واگن.'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.helperText}>تنظیماتی یافت نشد.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>انتشار و اعمال نهایی (Publish)</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.previewButton} onPress={() => setPreviewVisible(true)}>
          <Text style={styles.previewButtonText}>پیش‌نمایش زنده</Text>
        </TouchableOpacity>
      </View>

      {/* Widget Editor Modal */}
      <Modal
        visible={editingWidget !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingWidget(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: Dimensions.get('window').width * 0.88, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.xl, borderWidth: 1, borderColor: theme.colors.border, padding: 20 }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border + '50', paddingBottom: 10 }}>
              <Text style={{ fontFamily: theme.typography.screenTitle.fontFamily, fontWeight: 'bold', fontSize: 15, color: theme.colors.text }}>تنظیمات ابزارک</Text>
              <TouchableOpacity onPress={() => setEditingWidget(null)}>
                <MaterialIcons name="close" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {editingWidget && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.configLabel}>عنوان ابزارک (فارسی)</Text>
                <TextInput
                  value={editingWidget.title}
                  onChangeText={(val) => setEditingWidget({ ...editingWidget, title: val })}
                  style={styles.configInput}
                  placeholder="عنوان نمایشی..."
                />

                <Text style={styles.configLabel}>اندازه ستون‌ها</Text>
                <View style={styles.sizeSelectorRow}>
                  {['sm', 'md', 'lg'].map((sz) => (
                    <TouchableOpacity
                      key={sz}
                      onPress={() => setEditingWidget({ ...editingWidget, size: sz })}
                      style={[styles.sizeSelectBtn, editingWidget.size === sz && styles.sizeSelectActive]}
                    >
                      <Text style={styles.sizeSelectText}>
                        {sz === 'sm' ? '۱/۳ عرض' : sz === 'md' ? 'نصف عرض' : 'تمام عرض'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {editingWidget.widgetType === 'stat_card' && (
                  <>
                    <Text style={styles.configLabel}>منبع آمار (Source)</Text>
                    <View style={styles.sizeSelectorRow}>
                      {['shift', 'performance', 'tickets'].map((src) => (
                        <TouchableOpacity
                          key={src}
                          onPress={() => setEditingWidget({
                            ...editingWidget,
                            configJson: { ...editingWidget.configJson, source: src }
                          })}
                          style={[styles.sizeSelectBtn, editingWidget.configJson?.source === src && styles.sizeSelectActive]}
                        >
                          <Text style={styles.sizeSelectText}>
                            {src === 'shift' ? 'شیفت‌ها' : src === 'performance' ? 'کارنامه' : 'تیکت‌ها'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {editingWidget.widgetType === 'chart' && (
                  <>
                    <Text style={styles.configLabel}>نوع نمودار (Type)</Text>
                    <View style={styles.sizeSelectorRow}>
                      {['bar', 'line'].map((t) => (
                        <TouchableOpacity
                          key={t}
                          onPress={() => setEditingWidget({
                            ...editingWidget,
                            configJson: { ...editingWidget.configJson, type: t }
                          })}
                          style={[styles.sizeSelectBtn, editingWidget.configJson?.type === t && styles.sizeSelectActive]}
                        >
                          <Text style={styles.sizeSelectText}>
                            {t === 'bar' ? 'میله‌ای' : 'خطی'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {editingWidget.widgetType === 'list' && (
                  <>
                    <Text style={styles.configLabel}>منبع لیست (Source)</Text>
                    <View style={styles.sizeSelectorRow}>
                      {['bulletins', 'tasks'].map((src) => (
                        <TouchableOpacity
                          key={src}
                          onPress={() => setEditingWidget({
                            ...editingWidget,
                            configJson: { ...editingWidget.configJson, source: src }
                          })}
                          style={[styles.sizeSelectBtn, editingWidget.configJson?.source === src && styles.sizeSelectActive]}
                        >
                          <Text style={styles.sizeSelectText}>
                            {src === 'bulletins' ? 'بخشنامه‌ها' : 'وظایف'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.configLabel}>تعداد سطرها (Limit)</Text>
                    <TextInput
                      value={String(editingWidget.configJson?.limit || 3)}
                      keyboardType="numeric"
                      onChangeText={(val) => setEditingWidget({
                        ...editingWidget,
                        configJson: { ...editingWidget.configJson, limit: Number(val) || 3 }
                      })}
                      style={styles.configInput}
                    />
                  </>
                )}

                {editingWidget.widgetType === 'banner' && (
                  <>
                    <Text style={styles.configLabel}>متن داخل بنر</Text>
                    <TextInput
                      value={editingWidget.configJson?.content || ''}
                      onChangeText={(val) => setEditingWidget({
                        ...editingWidget,
                        configJson: { ...editingWidget.configJson, content: val }
                      })}
                      style={styles.configInput}
                      placeholder="متن پیام ایمنی..."
                    />
                  </>
                )}

                <TouchableOpacity
                  style={[styles.saveButton, { marginTop: 20 }]}
                  onPress={saveWidgetConfig}
                >
                  <Text style={styles.saveButtonText}>ذخیره و ثبت موقت</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Live Preview Modal */}
      {previewVisible && (
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
              <MaterialIcons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>پیش‌نمایش زنده داشبورد پویا</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={{ flex: 1 }}>
            <Text style={{
              textAlign: 'center',
              color: theme.colors.secondary,
              fontFamily: theme.typography.captionSm.fontFamily,
              padding: 10,
              backgroundColor: theme.colors.surfaceContainerLow
            }}>
              این پیش‌نمایش چیدمان و ظاهر زنده پس از اعمال تغییرات جاری است.
            </Text>
            <DynamicRenderer components={previewComponents} />
          </ScrollView>
        </SafeAreaView>
      )}
    </SafeAreaView>
  )
}

export default UIBuilderScreen
