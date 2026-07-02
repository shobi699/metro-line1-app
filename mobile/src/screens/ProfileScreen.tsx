import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { useTheme } from '../shared/ThemeProvider'

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'مدیر کل',
  admin: 'مدیر',
  operator: 'راهبر',
}

export function ProfileScreen({ navigation }: any) {
  const { theme } = useTheme()

  const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
    online: { label: 'آماده به کار', color: theme.colors.success },
    busy: { label: 'مشغول', color: theme.colors.error },
    on_shift: { label: 'در شیفت کاری', color: theme.colors.primary },
    offline: { label: 'خارج از شیفت / استراحت', color: theme.colors.secondary },
  }

  const DEFAULT_THEME_COLORS = [
    { name: 'قرمز (خط ۱)', hex: '#e53935' },
    { name: 'آبی (مرکزی)', hex: '#007aff' },
    { name: 'سبز (ایمنی)', hex: '#34c759' },
    { name: 'نارنجی (هشدار)', hex: '#ff9500' },
    { name: 'خاکستری (سرد)', hex: '#8e8e93' },
  ]

  const DEFAULT_AVATARS = [
    { id: 'driver', name: 'راهبر قطار', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'dispatcher', name: 'دیسپچر', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { id: 'operator', name: 'اپراتور', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { id: 'manager', name: 'مدیر', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  ]

  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setAuth = useAuthStore((s) => s.setAuth)
  const logout = useAuthStore((s) => s.logout)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  // Notification states
  const notificationSettings = user?.customFields?.notificationSettings || {
    circulars: true,
    chat: true,
    shifts: true,
  }
  const [circulars, setCirculars] = useState(notificationSettings.circulars !== false)
  const [chat, setChat] = useState(notificationSettings.chat !== false)
  const [shifts, setShifts] = useState(notificationSettings.shifts !== false)

  // Profile Edit states
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [personnelNo, setPersonnelNo] = useState('')
  const [carPlate, setCarPlate] = useState('')
  const [availability, setAvailability] = useState('online')
  const [themeColor, setThemeColor] = useState('#e53935')
  const [avatar, setAvatar] = useState('')
  const [customAvatarUrl, setCustomAvatarUrl] = useState('')

  // Sync notification state on user update
  useEffect(() => {
    if (user?.customFields?.notificationSettings) {
      const ns = user.customFields.notificationSettings
      setCirculars(ns.circulars !== false)
      setChat(ns.chat !== false)
      setShifts(ns.shifts !== false)
    }
  }, [user])

  // Fetch full user profile on mount
  async function fetchProfile() {
    if (!accessToken || !refreshToken) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        const prof = json.data
        // Update user in the store (preserve roleKey from current auth store since GET /profile returns nested role.key)
        const updatedUserProfile = {
          ...prof,
          roleKey: user?.roleKey || prof.role?.key,
        }
        await setAuth(updatedUserProfile, accessToken!, refreshToken!)
      }
    } catch (e) {
      console.error('Failed to load full profile:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [accessToken])

  // Initialize edit fields
  const handleOpenEdit = () => {
    setPhone(user?.phone || '')
    setEmail(user?.email || '')
    setPersonnelNo(user?.customFields?.personnelNo || '')
    setCarPlate(user?.customFields?.carPlate || '')
    setAvailability(user?.customFields?.availability || 'online')
    setThemeColor(user?.customFields?.themeColor || '#e53935')
    const currentAvatar = user?.customFields?.avatar || ''
    setAvatar(currentAvatar)
    
    // Check if current avatar is one of the default templates
    const isDefault = DEFAULT_AVATARS.some((a) => a.url === currentAvatar)
    if (!isDefault && currentAvatar) {
      setCustomAvatarUrl(currentAvatar)
    } else {
      setCustomAvatarUrl('')
    }
    setModalVisible(true)
  }

  // Save profile updates
  async function handleSaveProfile() {
    if (!accessToken || !refreshToken) return

    // Validation
    if (phone && !/^09\d{9}$/.test(phone)) {
      Alert.alert('خطا', 'شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد.')
      return
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('خطا', 'فرمت ایمیل نامعتبر است.')
      return
    }

    if (personnelNo && (!/^\d+$/.test(personnelNo) || personnelNo.length < 3 || personnelNo.length > 20)) {
      Alert.alert('خطا', 'شماره پرسنلی فقط شامل اعداد (بین ۳ تا ۲۰ رقم) باید باشد.')
      return
    }

    setSaving(true)
    try {
      const finalAvatar = customAvatarUrl ? customAvatarUrl : avatar

      const res = await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          phone,
          email,
          personnelNo,
          carPlate,
          availability,
          themeColor,
          avatar: finalAvatar,
        }),
      })

      const json = await res.json()

      if (res.ok) {
        Alert.alert('موفقیت', 'پروفایل شما با موفقیت بروزرسانی شد.')
        const updatedUserProfile = {
          ...json.data,
          roleKey: user?.roleKey || json.data.role?.key,
        }
        await setAuth(updatedUserProfile, accessToken, refreshToken)
        setModalVisible(false)
      } else {
        Alert.alert('خطا', json.error || 'خطا در ثبت تغییرات')
      }
    } catch (e) {
      console.error(e)
      Alert.alert('خطای ارتباط با سرور', 'لطفاً وضعیت اتصال شبکه خود را بررسی کنید.')
    } finally {
      setSaving(false)
    }
  }

  // Update notification settings
  async function updateNotificationSettings(newCirculars: boolean, newChat: boolean, newShifts: boolean) {
    if (!accessToken || !refreshToken) return
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/profile/notification-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          circulars: newCirculars,
          chat: newChat,
          shifts: newShifts,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const updatedUserProfile = {
          ...json.data,
          roleKey: user?.roleKey || json.data.role?.key,
        }
        await setAuth(updatedUserProfile, accessToken, refreshToken)
      }
    } catch (e) {
      console.error('Failed to update notification settings:', e)
    } finally {
      setSaving(false)
    }
  }

  const handleCircularsChange = (val: boolean) => {
    setCirculars(val)
    updateNotificationSettings(val, chat, shifts)
  }

  const handleChatChange = (val: boolean) => {
    setChat(val)
    updateNotificationSettings(circulars, val, shifts)
  }

  const handleShiftsChange = (val: boolean) => {
    setShifts(val)
    updateNotificationSettings(circulars, chat, val)
  }

  async function handleLogout() {
    await logout()
  }

  const userTheme = user?.customFields?.themeColor || '#e53935'
  const userAvailability = user?.customFields?.availability || 'online'
  const availabilityInfo = AVAILABILITY_LABELS[userAvailability] || { label: 'نامشخص', color: '#8e8e93' }
  const userAvatar = user?.customFields?.avatar

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.containerMargin },
    loaderContainer: { paddingVertical: 8, alignItems: 'center' },
    avatarSection: { alignItems: 'center', marginBottom: 32, paddingTop: 16 },
    avatarWrapper: {
      width: 86,
      height: 86,
      borderRadius: 43,
      borderWidth: 2.5,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      position: 'relative',
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    avatarImage: { width: 78, height: 78, borderRadius: 39 },
    avatarFallback: { width: 78, height: 78, borderRadius: 39, backgroundColor: theme.colors.surfaceContainer, justifyContent: 'center', alignItems: 'center' },
    statusIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    name: { fontFamily: theme.typography.screenTitle.fontFamily, fontSize: theme.typography.screenTitle.fontSize, fontWeight: '700', color: theme.colors.onSurface, textAlign: 'center' },
    headerBadges: { flexDirection: 'row-reverse', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' },
    roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.sm },
    roleText: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 11, fontWeight: '700' },
    statusTextLine: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: theme.typography.bodyMd.fontSize, fontWeight: '600', marginTop: 8, textAlign: 'center' },
    editButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginTop: 16,
    },
    editButtonText: { fontFamily: theme.typography.cardTitle.fontFamily, fontSize: 12, fontWeight: '700' },
    section: { marginBottom: 32 },
    sectionTitle: { fontFamily: theme.typography.cardTitle.fontFamily, fontSize: theme.typography.cardTitle.fontSize, fontWeight: '700', color: theme.colors.onSurface, textAlign: 'right', marginBottom: 16 },
    card: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.xl, padding: 16, ...theme.shadows.level1 },
    infoRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    infoRowNoBorder: { borderBottomWidth: 0 },
    infoLabelContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
    infoLabel: { color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: theme.typography.bodyMd.fontSize, fontWeight: '600' },
    infoValue: { color: theme.colors.onSurface, fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
    switchRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    switchTextContainer: { alignItems: 'flex-start', flex: 1, paddingStart: 12 },
    switchTitle: { color: theme.colors.onSurface, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: theme.typography.bodyMd.fontSize, fontWeight: '700', textAlign: 'right' },
    switchDesc: { color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, fontSize: 10, marginTop: 4, textAlign: 'right' },
    logoutButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.errorContainer,
      borderWidth: 1,
      borderColor: theme.colors.error + '40',
      borderRadius: theme.borderRadius.xl,
      padding: 16,
      ...theme.shadows.level1,
    },
    logoutText: { color: theme.colors.error, fontFamily: theme.typography.cardTitle.fontFamily, fontSize: theme.typography.cardTitle.fontSize, fontWeight: '700' },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xxl,
      borderTopRightRadius: theme.borderRadius.xxl,
      maxHeight: '90%',
      paddingBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      ...theme.shadows.level2,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    modalTitle: { color: theme.colors.onSurface, fontFamily: theme.typography.screenTitle.fontFamily, fontSize: theme.typography.screenTitle.fontSize, fontWeight: '700', flex: 1, textAlign: 'right' },
    closeBtn: { padding: 4 },
    modalForm: { padding: 24 },
    inputLabel: { color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: theme.typography.bodyMd.fontSize, textAlign: 'right', marginBottom: 8, marginTop: 16, fontWeight: '700' },
    textInput: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      height: 48,
      color: theme.colors.onSurface,
      paddingHorizontal: 12,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
    },
    avatarPickerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
    avatarPickWrapper: { alignItems: 'center', width: '22%', borderWidth: 1, borderColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md, padding: 6, backgroundColor: theme.colors.surfaceContainerLowest, ...theme.shadows.level1 },
    avatarPickImg: { width: 44, height: 44, borderRadius: 22, marginBottom: 4 },
    avatarPickName: { color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, fontSize: 9, textAlign: 'center', fontWeight: '600' },
    availabilityRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
    availabilityBtn: {
      flex: 1,
      minWidth: '22%',
      height: 40,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    availabilityBtnText: { color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, fontSize: 11, fontWeight: '600' },
    colorRow: { flexDirection: 'row-reverse', gap: 12, marginTop: 6, justifyContent: 'center' },
    colorCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', ...theme.shadows.level1 },
    colorCircleActive: { borderWidth: 3, borderColor: '#ffffff' },
    modalActions: { flexDirection: 'row-reverse', gap: 12, marginTop: 32, marginBottom: 20 },
    modalBtn: { flex: 1, height: 48, borderRadius: theme.borderRadius.md, justifyContent: 'center', alignItems: 'center', ...theme.shadows.level1 },
    modalBtnSave: { backgroundColor: theme.colors.primary },
    modalBtnCancel: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.surfaceVariant },
    modalBtnText: { color: '#ffffff', fontFamily: theme.typography.cardTitle.fontFamily, fontSize: theme.typography.cardTitle.fontSize, fontWeight: '700' },
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={userTheme} />
          </View>
        )}

        {/* Avatar & Profile Info Header */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarWrapper, { borderColor: userTheme }]}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <MaterialIcons name="person" size={40} color={userTheme} />
              </View>
            )}
            <View style={[styles.statusIndicator, { backgroundColor: availabilityInfo.color }]} />
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          
          <View style={styles.headerBadges}>
            <View style={[styles.roleBadge, { backgroundColor: `${userTheme}20` }]}>
              <Text style={[styles.roleText, { color: userTheme }]}>
                {ROLE_LABEL[user?.roleKey ?? ''] ?? user?.roleKey}
              </Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: theme.colors.surfaceContainer }]}>
              <Text style={[styles.roleText, { color: theme.colors.secondary }]}>
                کد ملی: {user?.nationalId}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.statusTextLine, { color: availabilityInfo.color }]}>
            وضعیت حضور: {availabilityInfo.label}
          </Text>

          <TouchableOpacity
            style={[styles.editButton, { borderColor: `${userTheme}40` }]}
            onPress={handleOpenEdit}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={14} color={userTheme} />
            <Text style={[styles.editButtonText, { color: userTheme }]}>
              ویرایش مشخصات و شخصی‌سازی
            </Text>
          </TouchableOpacity>

          {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
            <TouchableOpacity
              style={[styles.editButton, { borderColor: theme.colors.primary, marginTop: 8 }]}
              onPress={() => navigation.navigate('UIBuilder')}
              activeOpacity={0.7}
            >
              <MaterialIcons name="dashboard-customize" size={14} color={theme.colors.primary} />
              <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>
                مدیریت صفحه‌ساز و چیدمان (UI Builder)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Organizational Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>اطلاعات سازمانی و تماس</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>
                {user?.customFields?.personnelNo || 'ثبت‌نشده'}
              </Text>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="shield" size={16} color={theme.colors.secondary} />
                <Text style={styles.infoLabel}>شماره پرسنلی</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{user?.phone || 'ثبت‌نشده'}</Text>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="phone" size={16} color={theme.colors.secondary} />
                <Text style={styles.infoLabel}>تلفن همراه</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{user?.email || 'ثبت‌نشده'}</Text>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="mail" size={16} color={theme.colors.secondary} />
                <Text style={styles.infoLabel}>ایمیل</Text>
              </View>
            </View>
            <View style={[styles.infoRow, styles.infoRowNoBorder]}>
              <Text style={styles.infoValue}>
                {user?.customFields?.carPlate || 'ثبت‌نشده'}
              </Text>
              <View style={styles.infoLabelContainer}>
                <MaterialIcons name="directions-car" size={16} color={theme.colors.secondary} />
                <Text style={styles.infoLabel}>پلاک خودرو</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تنظیمات اعلانات شخصی</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <Switch
                value={circulars}
                onValueChange={handleCircularsChange}
                trackColor={{ false: theme.colors.surfaceVariant, true: `${userTheme}40` }}
                thumbColor={circulars ? userTheme : theme.colors.secondary}
                disabled={saving}
              />
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>بخشنامه‌ها و ابلاغیه‌ها</Text>
                <Text style={styles.switchDesc}>دریافت اعلان هنگام صدور بخشنامه جدید ایمنی</Text>
              </View>
            </View>

            <View style={styles.switchRow}>
              <Switch
                value={chat}
                onValueChange={handleChatChange}
                trackColor={{ false: theme.colors.surfaceVariant, true: `${userTheme}40` }}
                thumbColor={chat ? userTheme : theme.colors.secondary}
                disabled={saving}
              />
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>پیام‌های گفتگو</Text>
                <Text style={styles.switchDesc}>دریافت اعلان برای پیام‌های جدید در چت‌روم‌ها</Text>
              </View>
            </View>

            <View style={[styles.switchRow, styles.infoRowNoBorder]}>
              <Switch
                value={shifts}
                onValueChange={handleShiftsChange}
                trackColor={{ false: theme.colors.surfaceVariant, true: `${userTheme}40` }}
                thumbColor={shifts ? userTheme : theme.colors.secondary}
                disabled={saving}
              />
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchTitle}>درخواست‌های تغییر شیفت</Text>
                <Text style={styles.switchDesc}>اعلان زمان موافقت، مخالفت یا پیشنهاد جابجایی شیفت</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <MaterialIcons name="logout" size={20} color={theme.colors.error} />
            <Text style={styles.logoutText}>خروج از حساب</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Profile Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>ویرایش پروفایل و شخصی‌سازی</Text>
              </View>

              <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
                
                {/* Profile Avatar Picker */}
                <Text style={styles.inputLabel}>عکس پروفایل (انتخاب از قالب‌ها یا آدرس دلخواه)</Text>
                <View style={styles.avatarPickerRow}>
                  {DEFAULT_AVATARS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.avatarPickWrapper,
                        avatar === item.url && !customAvatarUrl ? { borderColor: themeColor, borderWidth: 2 } : null,
                      ]}
                      onPress={() => {
                        setAvatar(item.url)
                        setCustomAvatarUrl('')
                      }}
                    >
                      <Image source={{ uri: item.url }} style={styles.avatarPickImg} />
                      <Text style={styles.avatarPickName}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>یا آدرس اینترنتی تصویر دلخواه (URL)</Text>
                <TextInput
                  style={styles.textInput}
                  value={customAvatarUrl}
                  onChangeText={(text) => {
                    setCustomAvatarUrl(text)
                    if (text) setAvatar('')
                  }}
                  placeholder="https://example.com/avatar.jpg"
                  placeholderTextColor={theme.colors.secondary}
                  autoCapitalize="none"
                  keyboardType="url"
                />

                {/* Personnel Number Input */}
                <Text style={styles.inputLabel}>شماره پرسنلی</Text>
                <TextInput
                  style={styles.textInput}
                  value={personnelNo}
                  onChangeText={setPersonnelNo}
                  placeholder="مثال: 102345"
                  placeholderTextColor={theme.colors.secondary}
                  keyboardType="number-pad"
                  maxLength={20}
                />

                {/* Phone Input */}
                <Text style={styles.inputLabel}>تلفن همراه</Text>
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="مثال: 09123456789"
                  placeholderTextColor={theme.colors.secondary}
                  keyboardType="phone-pad"
                  maxLength={11}
                />

                {/* Email Input */}
                <Text style={styles.inputLabel}>ایمیل</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="example@mail.com"
                  placeholderTextColor={theme.colors.secondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Car Plate Input */}
                <Text style={styles.inputLabel}>پلاک خودرو</Text>
                <TextInput
                  style={styles.textInput}
                  value={carPlate}
                  onChangeText={setCarPlate}
                  placeholder="مثال: ۱۲ ب ۳۴۵ ایران ۱۱"
                  placeholderTextColor={theme.colors.secondary}
                />

                {/* Availability Status Select */}
                <Text style={styles.inputLabel}>وضعیت حضور</Text>
                <View style={styles.availabilityRow}>
                  {Object.entries(AVAILABILITY_LABELS).map(([key, item]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.availabilityBtn,
                        availability === key
                          ? { backgroundColor: item.color, borderColor: item.color }
                          : null,
                      ]}
                      onPress={() => setAvailability(key)}
                    >
                      <Text
                        style={[
                          styles.availabilityBtnText,
                          availability === key ? { color: '#ffffff', fontWeight: 'bold' } : null,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Theme Color Picker */}
                <Text style={styles.inputLabel}>رنگ تم پروفایل</Text>
                <View style={styles.colorRow}>
                  {DEFAULT_THEME_COLORS.map((item) => (
                    <TouchableOpacity
                      key={item.hex}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: item.hex },
                        themeColor === item.hex ? styles.colorCircleActive : null,
                      ]}
                      onPress={() => setThemeColor(item.hex)}
                    >
                      {themeColor === item.hex && (
                        <MaterialIcons name="check" size={16} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Save / Cancel buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSave, { backgroundColor: themeColor }]}
                    onPress={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.modalBtnText}>ذخیره تغییرات</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setModalVisible(false)}
                    disabled={saving}
                  >
                    <Text style={[styles.modalBtnText, { color: theme.colors.secondary }]}>انصراف</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  )
}

export default ProfileScreen
