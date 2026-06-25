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
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import {
  User,
  Shield,
  Phone,
  Mail,
  LogOut,
  Bell,
  Edit2,
  Car,
  Check,
  X,
  Palette,
} from 'lucide-react-native'
import { API_URL } from '../shared/config'

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'مدیر کل',
  admin: 'مدیر',
  operator: 'راهبر',
}

const AVAILABILITY_LABELS: Record<string, { label: string; color: string }> = {
  online: { label: 'آماده به کار', color: '#34c759' },
  busy: { label: 'مشغول', color: '#e53935' },
  on_shift: { label: 'در شیفت کاری', color: '#007aff' },
  offline: { label: 'خارج از شیفت / استراحت', color: '#8e8e93' },
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

export function ProfileScreen() {
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

  return (
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
              <User size={40} color={userTheme} />
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
          <View style={[styles.roleBadge, { backgroundColor: '#ffffff10' }]}>
            <Text style={[styles.roleText, { color: '#a0a3b0' }]}>
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
          <Edit2 size={14} color={userTheme} />
          <Text style={[styles.editButtonText, { color: userTheme }]}>
            ویرایش مشخصات و شخصی‌سازی
          </Text>
        </TouchableOpacity>
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
              <Shield size={14} color="#a0a3b0" />
              <Text style={styles.infoLabel}>شماره پرسنلی</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{user?.phone || 'ثبت‌نشده'}</Text>
            <View style={styles.infoLabelContainer}>
              <Phone size={14} color="#a0a3b0" />
              <Text style={styles.infoLabel}>تلفن همراه</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{user?.email || 'ثبت‌نشده'}</Text>
            <View style={styles.infoLabelContainer}>
              <Mail size={14} color="#a0a3b0" />
              <Text style={styles.infoLabel}>ایمیل</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>
              {user?.customFields?.carPlate || 'ثبت‌نشده'}
            </Text>
            <View style={styles.infoLabelContainer}>
              <Car size={14} color="#a0a3b0" />
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
              trackColor={{ false: '#262930', true: `${userTheme}40` }}
              thumbColor={circulars ? userTheme : '#a0a3b0'}
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
              trackColor={{ false: '#262930', true: `${userTheme}40` }}
              thumbColor={chat ? userTheme : '#a0a3b0'}
              disabled={saving}
            />
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchTitle}>پیام‌های گفتگو</Text>
              <Text style={styles.switchDesc}>دریافت اعلان برای پیام‌های جدید در چت‌روم‌ها</Text>
            </View>
          </View>

          <View style={styles.switchRow}>
            <Switch
              value={shifts}
              onValueChange={handleShiftsChange}
              trackColor={{ false: '#262930', true: `${userTheme}40` }}
              thumbColor={shifts ? userTheme : '#a0a3b0'}
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
          <LogOut size={18} color="#e53935" />
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
                <X size={20} color="#f2f2f7" />
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
                placeholderTextColor="#555860"
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
                placeholderTextColor="#555860"
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
                placeholderTextColor="#555860"
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
                placeholderTextColor="#555860"
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
                placeholderTextColor="#555860"
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
                      <Check size={16} color="#ffffff" />
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
                  <Text style={[styles.modalBtnText, { color: '#a0a3b0' }]}>انصراف</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#13151a', padding: 16 },
  loaderContainer: { paddingVertical: 8, alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 28, paddingTop: 12 },
  avatarWrapper: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    backgroundColor: '#1c1e24',
  },
  avatarImage: { width: 78, height: 78, borderRadius: 39 },
  avatarFallback: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#262930', justifyContent: 'center', alignItems: 'center' },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#13151a',
  },
  name: { fontSize: 18, fontWeight: 'bold', color: '#f2f2f7', textAlign: 'center' },
  headerBadges: { flexDirection: 'row-reverse', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  roleText: { fontSize: 11, fontWeight: '600' },
  statusTextLine: { fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  editButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 14,
  },
  editButtonText: { fontSize: 11, fontWeight: 'bold' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#f2f2f7', textAlign: 'right', marginBottom: 8 },
  card: { backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930', borderRadius: 12, padding: 12 },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#26293040',
  },
  infoLabelContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  infoLabel: { color: '#a0a3b0', fontSize: 12 },
  infoValue: { color: '#f2f2f7', fontSize: 12, fontWeight: '500', fontFamily: 'monospace' },
  switchRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#26293040',
  },
  switchTextContainer: { alignItems: 'flex-start', flex: 1, paddingStart: 12 },
  switchTitle: { color: '#f2f2f7', fontSize: 12, fontWeight: '600', textAlign: 'right' },
  switchDesc: { color: '#a0a3b0', fontSize: 9, marginTop: 2, textAlign: 'right' },
  logoutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1c1e24',
    borderWidth: 1,
    borderColor: '#e5393540',
    borderRadius: 12,
    padding: 12,
  },
  logoutText: { color: '#e53935', fontSize: 13, fontWeight: '600' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#13151a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#262930',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262930',
  },
  modalTitle: { color: '#f2f2f7', fontSize: 14, fontWeight: 'bold', flex: 1, textAlign: 'right' },
  closeBtn: { padding: 4 },
  modalForm: { padding: 16 },
  inputLabel: { color: '#a0a3b0', fontSize: 11, textAlign: 'right', marginBottom: 6, marginTop: 12, fontWeight: '600' },
  textInput: {
    backgroundColor: '#1c1e24',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 8,
    height: 40,
    color: '#f2f2f7',
    paddingHorizontal: 12,
    textAlign: 'right',
    fontSize: 13,
  },
  avatarPickerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 10 },
  avatarPickWrapper: { alignItems: 'center', width: '22%', borderWidth: 1, borderColor: '#262930', borderRadius: 8, padding: 4, backgroundColor: '#1c1e24' },
  avatarPickImg: { width: 44, height: 44, borderRadius: 22, marginBottom: 4 },
  avatarPickName: { color: '#a0a3b0', fontSize: 8, textAlign: 'center' },
  availabilityRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' },
  availabilityBtn: {
    flex: 1,
    minWidth: '22%',
    height: 34,
    backgroundColor: '#1c1e24',
    borderColor: '#262930',
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityBtnText: { color: '#a0a3b0', fontSize: 10 },
  colorRow: { flexDirection: 'row-reverse', gap: 10, marginTop: 4, justifyContent: 'center' },
  colorCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  colorCircleActive: { borderWidth: 2, borderColor: '#ffffff' },
  modalActions: { flexDirection: 'row-reverse', gap: 10, marginTop: 24, marginBottom: 20 },
  modalBtn: { flex: 1, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalBtnSave: { backgroundColor: '#e53935' },
  modalBtnCancel: { backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930' },
  modalBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
})

export default ProfileScreen
