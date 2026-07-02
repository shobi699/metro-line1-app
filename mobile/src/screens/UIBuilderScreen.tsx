import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../shared/ThemeProvider'
import { useUIBuilderStore, MenuItem, DashboardWidget } from '../stores/ui-builder'
import { DynamicRenderer } from '../shared/DynamicRenderer'

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
  const [activeTab, setActiveTab] = useState<'theme' | 'menu' | 'dashboard'>('theme')
  const [previewVisible, setPreviewVisible] = useState(false)

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
      await Promise.all([
        saveThemeToServer(),
        saveMenuToServer(),
        saveWidgetsToServer(),
      ])
      Alert.alert('موفقیت', 'تغییرات چیدمان و ظاهر با موفقیت ذخیره و منتشر شد.')
      navigation.goBack()
    } catch (err: any) {
      Alert.alert('خطا', 'ثبت تغییرات با خطا مواجه شد: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const moveMenu = (index: number, direction: 'up' | 'down') => {
    const updated = [...storeMenuItems]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= updated.length) return

    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp

    // Update orderIndex
    updated.forEach((item, idx) => {
      item.orderIndex = idx
    })

    updateMenuLocal(updated)
  }

  const toggleMenuVisibility = (index: number, val: boolean) => {
    const updated = [...storeMenuItems]
    updated[index] = { ...updated[index], isVisible: val }
    updateMenuLocal(updated)
  }

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    const updated = [...storeWidgets]
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= updated.length) return

    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp

    updated.forEach((w, idx) => {
      w.orderIndex = idx
    })

    updateWidgetsLocal(updated)
  }

  const toggleWidgetVisibility = (index: number, val: boolean) => {
    const updated = [...storeWidgets]
    updated[index] = { ...updated[index], isVisible: val }
    updateWidgetsLocal(updated)
  }

  const cycleWidgetSize = (index: number) => {
    const sizes: ('sm' | 'md' | 'lg')[] = ['sm', 'md', 'lg']
    const updated = [...storeWidgets]
    const currentSize = updated[index].size
    const nextIdx = (sizes.indexOf(currentSize) + 1) % sizes.length
    updated[index] = { ...updated[index], size: sizes[nextIdx] }
    updateWidgetsLocal(updated)
  }

  // Generate widgets mock components schema for the live preview modal
  const previewComponents = storeWidgets
    .filter(w => w.isVisible)
    .map(w => {
      let type = 'StatRow'
      let props = {}
      if (w.widgetType === 'stat_card') {
        type = 'StatRow'
        props = {
          items: [{ label: w.title || 'آمار', value: '۱۲.۵' }]
        }
      } else if (w.widgetType === 'chart') {
        type = 'ChartWidget'
        props = { title: w.title || 'کارکرد' }
      } else if (w.widgetType === 'list') {
        type = 'DataList'
        props = { title: w.title || 'بخشنامه‌ها' }
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

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
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
      fontSize: 13,
      color: theme.colors.textSecondary,
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
      ...theme.shadows.level1,
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
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      justifyContent: 'space-between',
    },
    colorBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    colorText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      color: theme.colors.text,
    },
    itemRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    itemInfo: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 12,
    },
    itemText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      color: theme.colors.text,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    controlBtn: {
      padding: 6,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.borderRadius.sm,
    },
    sizeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: theme.colors.primaryContainer + '30',
      borderRadius: theme.borderRadius.sm,
    },
    sizeText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: 'row-reverse',
      padding: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    saveButton: {
      flex: 2,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonText: {
      color: '#ffffff',
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontWeight: 'bold',
    },
    previewButton: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainerLowest,
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

    // Preview Modal styles
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
          style={[styles.tabButton, activeTab === 'theme' && styles.activeTabButton]}
          onPress={() => setActiveTab('theme')}
        >
          <Text style={[styles.tabText, activeTab === 'theme' && styles.activeTabText]}>تنظیمات تم</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'menu' && styles.activeTabButton]}
          onPress={() => setActiveTab('menu')}
        >
          <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>منوی اصلی</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTabButton]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>داشبورد</Text>
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
            <Text style={styles.sectionTitle}>ترتیب و نمایش زبانه های منوی پایین</Text>
            {storeMenuItems.map((item, idx) => (
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
                    disabled={idx === storeMenuItems.length - 1}
                    onPress={() => moveMenu(idx, 'down')}
                  >
                    <MaterialIcons name="arrow-downward" size={16} color={idx === storeMenuItems.length - 1 ? '#cccccc' : theme.colors.text} />
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
            {storeWidgets.map((item, idx) => (
              <View key={item.id || idx} style={styles.itemRow}>
                <View style={styles.controls}>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    disabled={idx === 0}
                    onPress={() => moveWidget(idx, 'up')}
                  >
                    <MaterialIcons name="arrow-upward" size={16} color={idx === 0 ? '#cccccc' : theme.colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.controlBtn}
                    disabled={idx === storeWidgets.length - 1}
                    onPress={() => moveWidget(idx, 'down')}
                  >
                    <MaterialIcons name="arrow-downward" size={16} color={idx === storeWidgets.length - 1 ? '#cccccc' : theme.colors.text} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.sizeBadge}
                    onPress={() => cycleWidgetSize(idx)}
                  >
                    <Text style={styles.sizeText}>{item.size === 'sm' ? '۱/۳ عرض' : item.size === 'md' ? 'نصف عرض' : 'تمام عرض'}</Text>
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
export default UIBuilderScreen;
