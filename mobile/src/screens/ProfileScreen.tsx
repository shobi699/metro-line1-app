import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { pickAndUploadImage } from '../shared/uploader'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'مدیر کل',
  admin: 'مدیر',
  operator: 'راهبر',
  manager: 'مدیر میانی',
}

const PLATE_LETTERS = [
  'الف', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ', 'د',
  'ذ', 'ر', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ',
  'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'و', 'ه', 'ی',
  'معلولین', 'تشریفات', 'D', 'S',
]

type ActiveModal = null | 'edit' | 'info-org' | 'info-personal' | 'info-quals' | 'info-vehicle' | 'notifications' | 'letter-picker'

export function ProfileScreen({ navigation }: any) {
  const { theme } = useTheme()

  const AVAILABILITY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    online: { label: 'آماده', color: theme.colors.success, icon: 'check-circle' },
    busy: { label: 'مشغول', color: theme.colors.error, icon: 'do-not-disturb-on' },
    on_shift: { label: 'در شیفت', color: theme.colors.primary, icon: 'train' },
    offline: { label: 'استراحت', color: theme.colors.secondary, icon: 'pause-circle-filled' },
  }

  const DEFAULT_THEME_COLORS = [
    { name: 'قرمز (خط ۱)', hex: '#ae0011' },
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
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [activeEditTab, setActiveEditTab] = useState<'personal' | 'job' | 'qualifications' | 'contact' | 'vehicle'>('personal')

  // Notification states
  const notificationSettings = user?.customFields?.notificationSettings || { circulars: true, chat: true, shifts: true }
  const [circulars, setCirculars] = useState(notificationSettings.circulars !== false)
  const [chat, setChat] = useState(notificationSettings.chat !== false)
  const [shifts, setShifts] = useState(notificationSettings.shifts !== false)

  // Profile Edit states
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [personnelNo, setPersonnelNo] = useState('')
  const [availability, setAvailability] = useState('online')
  const [themeColor, setThemeColor] = useState('#ae0011')
  const [avatar, setAvatar] = useState('')
  const [customAvatarUrl, setCustomAvatarUrl] = useState('')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Detailed info states
  const [fatherName, setFatherName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [age, setAge] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [insuranceNo, setInsuranceNo] = useState('')
  const [education, setEducation] = useState('')

  const [post, setPost] = useState('')
  const [shift, setShift] = useState('')
  const [shiftType, setShiftType] = useState('')
  const [startLocation, setStartLocation] = useState('')
  const [hireDate, setHireDate] = useState('')
  const [group, setGroup] = useState('A')

  const [drivingStatus, setDrivingStatus] = useState('')
  const [licenseClass1Date, setLicenseClass1Date] = useState('')
  const [licenseClass2Date, setLicenseClass2Date] = useState('')
  const [medicalExamValidity, setMedicalExamValidity] = useState('')
  const [driverPercent, setDriverPercent] = useState('')
  const [coDriverPercent, setCoDriverPercent] = useState('')

  const [address, setAddress] = useState('')
  const [phone3, setPhone3] = useState('')
  const [phone4, setPhone4] = useState('')

  // Vehicle states
  const [plateNum1, setPlateNum1] = useState('')
  const [plateLetter, setPlateLetter] = useState('ب')
  const [plateNum2, setPlateNum2] = useState('')
  const [plateCity, setPlateCity] = useState('')
  const [carType, setCarType] = useState('')
  const [carColor, setCarColor] = useState('')

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
    setAvailability(user?.customFields?.availability || 'online')
    setThemeColor(user?.customFields?.themeColor || '#ae0011')

    const currentAvatar = user?.customFields?.avatar || ''
    setAvatar(currentAvatar)
    const isDefault = DEFAULT_AVATARS.some((a) => a.url === currentAvatar)
    setCustomAvatarUrl(isDefault ? '' : currentAvatar)

    setFatherName(user?.customFields?.fatherName || '')
    setIdNumber(user?.customFields?.idNumber || '')
    setBirthDate(user?.customFields?.birthDate || '')
    setAge(String(user?.customFields?.age || ''))
    setBirthPlace(user?.customFields?.birthPlace || '')
    setMaritalStatus(user?.customFields?.maritalStatus || '')
    setInsuranceNo(user?.customFields?.insuranceNo || '')
    setEducation(user?.customFields?.education || '')

    setPost(user?.customFields?.post || '')
    setShift(user?.customFields?.shift || '')
    setShiftType(user?.customFields?.shiftType || '')
    setStartLocation(user?.customFields?.startLocation || '')
    setHireDate(user?.customFields?.hireDate || '')
    setGroup(user?.customFields?.group || 'A')

    setDrivingStatus(user?.customFields?.drivingStatus || '')
    setLicenseClass1Date(user?.customFields?.licenseClass1Date || '')
    setLicenseClass2Date(user?.customFields?.licenseClass2Date || '')
    setMedicalExamValidity(user?.customFields?.medicalExamValidity || '')
    setDriverPercent(String(user?.customFields?.driverPercent || ''))
    setCoDriverPercent(String(user?.customFields?.coDriverPercent || ''))

    setAddress(user?.customFields?.address || '')
    setPhone3(user?.customFields?.phone3 || '')
    setPhone4(user?.customFields?.phone4 || '')

    // Parse national car plate
    const currentPlate = user?.customFields?.carPlate || ''
    const parts = currentPlate.split(/\s+/)
    if (parts.length >= 5) {
      setPlateNum1(parts[0])
      setPlateLetter(parts[1])
      setPlateNum2(parts[2])
      setPlateCity(parts[4])
    } else {
      const cleaned = currentPlate.replace(/\s+/g, '').replace('ایران', '')
      const match = cleaned.match(/^(\d{2})([الف-ی])(\d{3})(\d{2})$/)
      if (match) {
        setPlateNum1(match[1])
        setPlateLetter(match[2])
        setPlateNum2(match[3])
        setPlateCity(match[4])
      } else {
        setPlateNum1('')
        setPlateLetter('ب')
        setPlateNum2('')
        setPlateCity('')
      }
    }

    setCarType(user?.customFields?.carType || '')
    setCarColor(user?.customFields?.carColor || '')

    setActiveEditTab('personal')
    setActiveModal('edit')
  }

  // Save profile updates
  async function handleSaveProfile() {
    if (!accessToken || !refreshToken) return

    if (phone && !/^09\d{9}$/.test(phone)) {
      Alert.alert('خطا', 'شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد.')
      return
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('خطا', 'فرمت ایمیل نامعتبر است.')
      return
    }

    setSaving(true)
    try {
      const finalAvatar = customAvatarUrl ? customAvatarUrl : avatar
      const finalCarPlate = plateNum1 && plateNum2 && plateCity
        ? `${plateNum1} ${plateLetter} ${plateNum2} ایران ${plateCity}`
        : ''

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
          availability,
          themeColor,
          avatar: finalAvatar,
          carPlate: finalCarPlate,
          carType,
          carColor,
          fatherName,
          idNumber,
          birthDate,
          age: Number(age) || null,
          birthPlace,
          maritalStatus,
          insuranceNo,
          education,
          post,
          shift,
          shiftType,
          startLocation,
          hireDate,
          group,
          drivingStatus,
          licenseClass1Date,
          licenseClass2Date,
          medicalExamValidity,
          driverPercent: Number(driverPercent) || null,
          coDriverPercent: Number(coDriverPercent) || null,
          address,
          phone3,
          phone4
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
        setActiveModal(null)
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

  const handleCircularsChange = (val: boolean) => { setCirculars(val); updateNotificationSettings(val, chat, shifts) }
  const handleChatChange = (val: boolean) => { setChat(val); updateNotificationSettings(circulars, val, shifts) }
  const handleShiftsChange = (val: boolean) => { setShifts(val); updateNotificationSettings(circulars, chat, val) }

  async function handleLogout() {
    await logout()
  }

  const userTheme = user?.customFields?.themeColor || '#ae0011'
  const userAvailability = user?.customFields?.availability || 'online'
  const availabilityInfo = AVAILABILITY_LABELS[userAvailability] || { label: 'نامشخص', color: '#8e8e93', icon: 'help' }
  const userAvatar = user?.customFields?.avatar

  // Helper: count filled fields in a section
  function countFilledFields(fields: any[]): number {
    return fields.filter((f) => {
      if (f == null) return false;
      const str = String(f).trim();
      return str !== '' && str !== 'ثبت‌نشده';
    }).length
  }

  const orgCount = countFilledFields([user?.customFields?.personnelNo, user?.phone, user?.email, user?.customFields?.post, user?.customFields?.shift, user?.customFields?.group])
  const personalCount = countFilledFields([user?.customFields?.fatherName, user?.customFields?.idNumber, user?.customFields?.birthDate, user?.customFields?.education])
  const qualsCount = countFilledFields([user?.customFields?.drivingStatus, String(user?.customFields?.driverPercent || ''), user?.customFields?.medicalExamValidity])
  const vehicleCount = countFilledFields([user?.customFields?.carType, user?.customFields?.carColor, user?.customFields?.carPlate])

  // ─────────────── RENDER HELPERS ───────────────

  /** Render a single info row for detail modals */
  function InfoRow({ icon, label, value, isLast }: { icon: string; label: string; value: string; isLast?: boolean }) {
    return (
      <View style={[s.infoRow, isLast && s.infoRowNoBorder]}>
        <Text style={s.infoValue}>{value || 'ثبت‌نشده'}</Text>
        <View style={s.infoLabelContainer}>
          <MaterialIcons name={icon as any} size={16} color={theme.colors.secondary} />
          <Text style={s.infoLabel}>{label}</Text>
        </View>
      </View>
    )
  }

  /** Render graphical plate (read-only) */
  function renderPlateView() {
    const plateStr = user?.customFields?.carPlate || ''
    const parts = plateStr.split(/\s+/)
    if (parts.length < 5) return <Text style={s.infoValue}>{plateStr || 'ثبت‌نشده'}</Text>
    const [num1, letter, num2, , city] = parts
    return (
      <View style={s.plate}>
        <View style={s.plateBlue}>
          <View style={s.plateFlag}>
            <View style={{ height: 2, backgroundColor: '#4CAF50', width: 10 }} />
            <View style={{ height: 2, backgroundColor: '#FFFFFF', width: 10 }} />
            <View style={{ height: 2, backgroundColor: '#F44336', width: 10 }} />
          </View>
          <Text style={s.plateIR}>I.R.</Text>
          <Text style={s.plateIR}>IRAN</Text>
        </View>
        <Text style={s.plateDigit}>{num1}</Text>
        <View style={s.plateLetterBox}><Text style={s.plateLetterChar}>{letter}</Text></View>
        <Text style={[s.plateDigit, { width: 36 }]}>{num2}</Text>
        <View style={s.plateSep} />
        <View style={s.plateCity}>
          <Text style={s.plateCityLabel}>ایران</Text>
          <Text style={s.plateCityNum}>{city}</Text>
        </View>
      </View>
    )
  }

  /** Render a single text input field for edit modal */
  function EditField({ label, value, onChangeText, keyboardType, placeholder }: {
    label: string; value: string; onChangeText: (t: string) => void; keyboardType?: any; placeholder?: string
  }) {
    return (
      <>
        <Text style={s.inputLabel}>{label}</Text>
        <TextInput
          style={s.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || ''}
          placeholderTextColor={theme.colors.secondary}
          textAlign="right"
          keyboardType={keyboardType || 'default'}
        />
      </>
    )
  }

  // ─────────────── STYLES ───────────────
  const s = StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.colors.background, padding: 16, justifyContent: 'space-between' },

    // ── Top Profile Strip ──
    profileStrip: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.xl,
      padding: 12,
      ...theme.shadows.level1,
    },
    avatarSmall: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    avatarImg: { width: 46, height: 46, borderRadius: 23 },
    avatarFallback: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.surfaceContainer, justifyContent: 'center', alignItems: 'center' },
    statusDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: theme.colors.surfaceContainerLowest,
    },
    profileInfo: { flex: 1, marginEnd: 12 },
    nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 4 },
    nameText: { fontFamily: theme.typography.screenTitle.fontFamily, fontSize: 16, fontWeight: '700', color: theme.colors.onSurface },
    roleBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    roleText: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 9, fontWeight: '700' },
    metaRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
    metaChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3 },
    metaText: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 10, color: theme.colors.secondary },

    // ── Quick Stats Grid ──
    statsGrid: {
      flexDirection: 'row-reverse',
      gap: 8,
      marginTop: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
      ...theme.shadows.level1,
    },
    statIcon: { marginBottom: 4 },
    statValue: { fontFamily: theme.typography.cardTitle.fontFamily, fontSize: 11, fontWeight: '700', color: theme.colors.onSurface, textAlign: 'center' },
    statLabel: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 8.5, color: theme.colors.secondary, marginTop: 2, textAlign: 'center' },

    // ── Action Tiles Grid ──
    tilesGrid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 14,
    },
    tile: {
      width: (SCREEN_W - 32 - 20) / 3,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.level1,
    },
    tileIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    tileLabel: { fontFamily: theme.typography.cardTitle.fontFamily, fontSize: 10.5, fontWeight: '700', color: theme.colors.onSurface, textAlign: 'center', marginBottom: 2 },
    tileBadge: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 8,
      marginTop: 3,
    },
    tileBadgeText: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 8.5, fontWeight: '700' },

    // ── Bottom Actions ──
    bottomBar: {
      flexDirection: 'row-reverse',
      gap: 10,
      marginTop: 14,
    },
    logoutBtn: {
      flex: 1,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.errorContainer,
      borderWidth: 1,
      borderColor: theme.colors.error + '30',
      borderRadius: theme.borderRadius.lg,
      paddingVertical: 12,
      ...theme.shadows.level1,
    },
    logoutText: { color: theme.colors.error, fontFamily: theme.typography.cardTitle.fontFamily, fontSize: 12, fontWeight: '700' },
    uiBuilderBtn: {
      flex: 1,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.primaryContainer,
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
      borderRadius: theme.borderRadius.lg,
      paddingVertical: 12,
      ...theme.shadows.level1,
    },
    uiBuilderText: { color: theme.colors.primary, fontFamily: theme.typography.cardTitle.fontFamily, fontSize: 11, fontWeight: '700' },

    // ── Detail Modal (read-only info viewer) ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xxl,
      borderTopRightRadius: theme.borderRadius.xxl,
      maxHeight: SCREEN_H * 0.85,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      ...theme.shadows.level2,
    },
    modalHeader: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    modalTitle: { color: theme.colors.onSurface, fontFamily: theme.typography.screenTitle.fontFamily, fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'right' },
    closeBtn: { padding: 4 },
    modalBody: { padding: 20 },

    // Info rows
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
    infoLabel: { color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 12, fontWeight: '600' },
    infoValue: { color: theme.colors.onSurface, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 12, fontWeight: '700', textAlign: 'left' },

    // Notification switch rows
    switchRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    switchTextContainer: { alignItems: 'flex-start', flex: 1, paddingStart: 12 },
    switchTitle: { color: theme.colors.onSurface, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 13, fontWeight: '700', textAlign: 'right' },
    switchDesc: { color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, fontSize: 10, marginTop: 4, textAlign: 'right' },

    // ── Full Edit Modal ──
    editModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    editModalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xxl,
      borderTopRightRadius: theme.borderRadius.xxl,
      height: '92%',
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      ...theme.shadows.level2,
    },
    modalTabRow: {
      flexDirection: 'row-reverse',
      backgroundColor: theme.colors.surfaceContainerLow,
      padding: 4,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: 16,
      marginTop: 12,
    },
    modalTabItem: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: theme.borderRadius.sm,
    },
    modalTabItemActive: {
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    modalTabText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 10,
      color: theme.colors.secondary,
    },
    modalTabTextActive: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    modalForm: { padding: 20 },
    inputLabel: { color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 12, textAlign: 'right', marginBottom: 6, marginTop: 14, fontWeight: '700' },
    textInput: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      height: 44,
      color: theme.colors.onSurface,
      paddingHorizontal: 12,
      textAlign: 'right',
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
    },
    avatarPickerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 10 },
    avatarPickWrapper: { alignItems: 'center', width: '22%', borderWidth: 1, borderColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md, padding: 6, backgroundColor: theme.colors.surfaceContainerLowest, ...theme.shadows.level1 },
    avatarPickImg: { width: 44, height: 44, borderRadius: 22, marginBottom: 4 },
    avatarPickName: { color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, fontSize: 9, textAlign: 'center', fontWeight: '600' },
    availabilityRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' },
    availabilityBtn: {
      flex: 1,
      minWidth: '22%',
      height: 36,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    availabilityBtnText: { color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, fontSize: 11, fontWeight: '600' },
    colorRow: { flexDirection: 'row-reverse', gap: 12, marginTop: 6, justifyContent: 'center' },
    colorCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...theme.shadows.level1 },
    colorCircleActive: { borderWidth: 2.5, borderColor: '#ffffff' },
    modalActions: { flexDirection: 'row-reverse', gap: 12, marginTop: 24, marginBottom: 20 },
    modalBtn: { flex: 1, height: 46, borderRadius: theme.borderRadius.md, justifyContent: 'center', alignItems: 'center', ...theme.shadows.level1 },
    modalBtnSave: { backgroundColor: theme.colors.primary },
    modalBtnCancel: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.surfaceVariant },
    modalBtnText: { color: '#ffffff', fontFamily: theme.typography.cardTitle.fontFamily, fontSize: 13, fontWeight: '700' },

    // Graphical Plate in edit mode
    plateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderWidth: 1.5,
      borderColor: '#000000',
      borderRadius: 5,
      height: 38,
      overflow: 'hidden',
    },
    plateBlueBar: { width: 18, height: '100%', backgroundColor: '#062B90', alignItems: 'center', justifyContent: 'center', paddingVertical: 1 },
    plateFlagBar: { flexDirection: 'column', gap: 1, marginBottom: 2 },
    plateIranText: { color: '#ffffff', fontSize: 5, fontWeight: 'bold', fontFamily: 'monospace' },
    plateNumInput: { width: 32, height: '100%', textAlign: 'center', fontSize: 15, fontWeight: 'bold', color: '#000000', fontFamily: 'Vazirmatn', padding: 0 },
    plateLetterBtn: { width: 38, height: '100%', backgroundColor: '#f1f5f9', borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
    plateLetterText: { fontSize: 14, fontWeight: 'bold', color: '#000000', fontFamily: 'Vazirmatn' },
    plateDivider: { width: 1, height: '100%', backgroundColor: '#000000' },
    plateCitySection: { width: 38, height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
    plateIranLabel: { fontSize: 6, fontWeight: '700', color: '#475569', fontFamily: 'Vazirmatn' },
    plateCityInput: { width: '100%', height: 18, textAlign: 'center', fontSize: 13, fontWeight: 'bold', color: '#000000', fontFamily: 'Vazirmatn', padding: 0 },

    // Read-only plate display
    plate: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#000000', borderRadius: 5, height: 36, overflow: 'hidden' },
    plateBlue: { width: 18, height: '100%', backgroundColor: '#062B90', alignItems: 'center', justifyContent: 'center', paddingVertical: 1 },
    plateFlag: { flexDirection: 'column', gap: 1, marginBottom: 2 },
    plateIR: { color: '#ffffff', fontSize: 5, fontWeight: 'bold', fontFamily: 'monospace' },
    plateDigit: { width: 28, textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: '#000000', fontFamily: 'Vazirmatn' },
    plateLetterBox: { width: 32, height: '100%', backgroundColor: '#f1f5f9', borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
    plateLetterChar: { fontSize: 13, fontWeight: 'bold', color: '#000000', fontFamily: 'Vazirmatn' },
    plateSep: { width: 1, height: '100%', backgroundColor: '#000000' },
    plateCity: { width: 34, height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
    plateCityLabel: { fontSize: 5, fontWeight: '700', color: '#475569', fontFamily: 'Vazirmatn' },
    plateCityNum: { fontSize: 12, fontWeight: 'bold', color: '#000000', fontFamily: 'Vazirmatn' },
  })

  // ─────────────── MAIN RENDER (Single Screen — No Scroll) ───────────────
  return (
    <ScreenWrapper title="پروفایل من" navigation={navigation}>
      <View style={s.page}>

        {/* ── 1. Profile Strip ── */}
        <View style={s.profileStrip}>
          <View style={[s.avatarSmall, { borderColor: userTheme }]}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarFallback}>
                <MaterialIcons name="person" size={26} color={userTheme} />
              </View>
            )}
            <View style={[s.statusDot, { backgroundColor: availabilityInfo.color }]} />
          </View>

          <View style={s.profileInfo}>
            <View style={s.nameRow}>
              <Text style={s.nameText}>{user?.name}</Text>
              <View style={[s.roleBadge, { backgroundColor: `${userTheme}18` }]}>
                <Text style={[s.roleText, { color: userTheme }]}>
                  {ROLE_LABEL[user?.roleKey ?? ''] ?? user?.roleKey}
                </Text>
              </View>
            </View>
            <View style={s.metaRow}>
              <View style={s.metaChip}>
                <MaterialIcons name={availabilityInfo.icon as any} size={12} color={availabilityInfo.color} />
                <Text style={[s.metaText, { color: availabilityInfo.color }]}>{availabilityInfo.label}</Text>
              </View>
              <View style={s.metaChip}>
                <MaterialIcons name="fingerprint" size={12} color={theme.colors.secondary} />
                <Text style={s.metaText}>{user?.nationalId}</Text>
              </View>
              {user?.customFields?.group ? (
                <View style={s.metaChip}>
                  <MaterialIcons name="groups" size={12} color={theme.colors.secondary} />
                  <Text style={s.metaText}>گروه {user.customFields.group}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Edit button */}
          <TouchableOpacity
            onPress={handleOpenEdit}
            activeOpacity={0.7}
            style={{ padding: 8, backgroundColor: `${userTheme}14`, borderRadius: theme.borderRadius.md }}
          >
            <MaterialIcons name="edit" size={18} color={userTheme} />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={{ paddingVertical: 6, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={userTheme} />
          </View>
        )}

        {/* ── 2. Quick Stats ── */}
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <MaterialIcons name="badge" size={18} color={userTheme} style={s.statIcon} />
            <Text style={s.statValue} numberOfLines={1}>{user?.customFields?.personnelNo || '—'}</Text>
            <Text style={s.statLabel}>شماره پرسنلی</Text>
          </View>
          <View style={s.statCard}>
            <MaterialIcons name="phone" size={18} color={theme.colors.success} style={s.statIcon} />
            <Text style={s.statValue} numberOfLines={1}>{user?.phone || '—'}</Text>
            <Text style={s.statLabel}>تلفن همراه</Text>
          </View>
          <View style={s.statCard}>
            <MaterialIcons name="work" size={18} color={theme.colors.primary} style={s.statIcon} />
            <Text style={s.statValue} numberOfLines={1}>{user?.customFields?.post || '—'}</Text>
            <Text style={s.statLabel}>سمت</Text>
          </View>
          <View style={s.statCard}>
            <MaterialIcons name="schedule" size={18} color={theme.colors.warning || '#ff9500'} style={s.statIcon} />
            <Text style={s.statValue} numberOfLines={1}>{user?.customFields?.shift || '—'}</Text>
            <Text style={s.statLabel}>شیفت</Text>
          </View>
        </View>

        {/* ── 3. Action Tiles Grid (6 items, 2 rows × 3 cols) ── */}
        <View style={s.tilesGrid}>
          {/* 3.1: Org Info */}
          <TouchableOpacity style={s.tile} onPress={() => setActiveModal('info-org')} activeOpacity={0.7}>
            <View style={[s.tileIcon, { backgroundColor: `${theme.colors.primary}18` }]}>
              <MaterialIcons name="apartment" size={20} color={theme.colors.primary} />
            </View>
            <Text style={s.tileLabel}>اطلاعات سازمانی</Text>
            <View style={[s.tileBadge, { backgroundColor: orgCount > 0 ? `${theme.colors.success}20` : `${theme.colors.secondary}18` }]}>
              <Text style={[s.tileBadgeText, { color: orgCount > 0 ? theme.colors.success : theme.colors.secondary }]}>{orgCount} فیلد</Text>
            </View>
          </TouchableOpacity>

          {/* 3.2: Personal Info */}
          <TouchableOpacity style={s.tile} onPress={() => setActiveModal('info-personal')} activeOpacity={0.7}>
            <View style={[s.tileIcon, { backgroundColor: `${userTheme}18` }]}>
              <MaterialIcons name="person-outline" size={20} color={userTheme} />
            </View>
            <Text style={s.tileLabel}>اطلاعات فردی</Text>
            <View style={[s.tileBadge, { backgroundColor: personalCount > 0 ? `${theme.colors.success}20` : `${theme.colors.secondary}18` }]}>
              <Text style={[s.tileBadgeText, { color: personalCount > 0 ? theme.colors.success : theme.colors.secondary }]}>{personalCount} فیلد</Text>
            </View>
          </TouchableOpacity>

          {/* 3.3: Qualifications */}
          <TouchableOpacity style={s.tile} onPress={() => setActiveModal('info-quals')} activeOpacity={0.7}>
            <View style={[s.tileIcon, { backgroundColor: `${theme.colors.success}18` }]}>
              <MaterialIcons name="verified" size={20} color={theme.colors.success} />
            </View>
            <Text style={s.tileLabel}>صلاحیت‌ها</Text>
            <View style={[s.tileBadge, { backgroundColor: qualsCount > 0 ? `${theme.colors.success}20` : `${theme.colors.secondary}18` }]}>
              <Text style={[s.tileBadgeText, { color: qualsCount > 0 ? theme.colors.success : theme.colors.secondary }]}>{qualsCount} فیلد</Text>
            </View>
          </TouchableOpacity>

          {/* 3.4: Vehicle */}
          <TouchableOpacity style={s.tile} onPress={() => setActiveModal('info-vehicle')} activeOpacity={0.7}>
            <View style={[s.tileIcon, { backgroundColor: '#ff950018' }]}>
              <MaterialIcons name="directions-car" size={20} color="#ff9500" />
            </View>
            <Text style={s.tileLabel}>خودرو و پلاک</Text>
            <View style={[s.tileBadge, { backgroundColor: vehicleCount > 0 ? `${theme.colors.success}20` : `${theme.colors.secondary}18` }]}>
              <Text style={[s.tileBadgeText, { color: vehicleCount > 0 ? theme.colors.success : theme.colors.secondary }]}>{vehicleCount} فیلد</Text>
            </View>
          </TouchableOpacity>

          {/* 3.5: Notifications */}
          <TouchableOpacity style={s.tile} onPress={() => setActiveModal('notifications')} activeOpacity={0.7}>
            <View style={[s.tileIcon, { backgroundColor: `${theme.colors.primary}18` }]}>
              <MaterialIcons name="notifications-active" size={20} color={theme.colors.primary} />
            </View>
            <Text style={s.tileLabel}>تنظیم اعلانات</Text>
            <View style={[s.tileBadge, { backgroundColor: `${theme.colors.primary}18` }]}>
              <Text style={[s.tileBadgeText, { color: theme.colors.primary }]}>{[circulars, chat, shifts].filter(Boolean).length}/۳ فعال</Text>
            </View>
          </TouchableOpacity>

          {/* 3.6: Edit Profile */}
          <TouchableOpacity style={s.tile} onPress={handleOpenEdit} activeOpacity={0.7}>
            <View style={[s.tileIcon, { backgroundColor: `${userTheme}18` }]}>
              <MaterialIcons name="edit" size={20} color={userTheme} />
            </View>
            <Text style={s.tileLabel}>ویرایش پروفایل</Text>
            <View style={[s.tileBadge, { backgroundColor: `${userTheme}18` }]}>
              <Text style={[s.tileBadgeText, { color: userTheme }]}>مشخصات</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── 4. Bottom Actions ── */}
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <MaterialIcons name="logout" size={16} color={theme.colors.error} />
            <Text style={s.logoutText}>خروج</Text>
          </TouchableOpacity>

          {(user?.roleKey === 'admin' || user?.roleKey === 'super_admin') && (
            <TouchableOpacity style={s.uiBuilderBtn} onPress={() => navigation.navigate('UIBuilder')} activeOpacity={0.7}>
              <MaterialIcons name="dashboard-customize" size={16} color={theme.colors.primary} />
              <Text style={s.uiBuilderText}>صفحه‌ساز</Text>
            </TouchableOpacity>
          )}

          {/* Theme color indicator */}
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.lg, paddingHorizontal: 12, paddingVertical: 10 }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: userTheme, borderWidth: 1, borderColor: '#ffffff40' }} />
            <Text style={{ fontFamily: theme.typography.captionSm.fontFamily, fontSize: 9, color: theme.colors.secondary }}>تِم</Text>
          </View>
        </View>
      </View>

      {/* ═══════════ MODALS ═══════════ */}

      {/* ── Info Modal: Organizational ── */}
      <Modal visible={activeModal === 'info-org'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={s.closeBtn}><MaterialIcons name="close" size={22} color={theme.colors.onSurface} /></TouchableOpacity>
              <Text style={s.modalTitle}>اطلاعات سازمانی و تماس</Text>
            </View>
            <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
              <InfoRow icon="shield" label="شماره پرسنلی" value={user?.customFields?.personnelNo || ''} />
              <InfoRow icon="phone" label="تلفن همراه" value={user?.phone || ''} />
              <InfoRow icon="mail" label="ایمیل" value={user?.email || ''} />
              <InfoRow icon="work" label="سمت / پست" value={user?.customFields?.post || ''} />
              <InfoRow icon="schedule" label="شیفت" value={user?.customFields?.shift || ''} />
              <InfoRow icon="swap-horiz" label="نوع شیفت" value={user?.customFields?.shiftType || ''} />
              <InfoRow icon="groups" label="گروه" value={user?.customFields?.group || ''} />
              <InfoRow icon="location-on" label="محل شروع" value={user?.customFields?.startLocation || ''} />
              <InfoRow icon="event" label="تاریخ استخدام" value={user?.customFields?.hireDate || ''} />
              <InfoRow icon="home" label="نشانی منزل" value={user?.customFields?.address || ''} />
              <InfoRow icon="phone-in-talk" label="تلفن اضطراری ۱" value={user?.customFields?.phone3 || ''} />
              <InfoRow icon="phone-callback" label="تلفن اضطراری ۲" value={user?.customFields?.phone4 || ''} isLast />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Info Modal: Personal ── */}
      <Modal visible={activeModal === 'info-personal'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={s.closeBtn}><MaterialIcons name="close" size={22} color={theme.colors.onSurface} /></TouchableOpacity>
              <Text style={s.modalTitle}>اطلاعات فردی و شناسنامه‌ای</Text>
            </View>
            <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
              <InfoRow icon="people" label="نام پدر" value={user?.customFields?.fatherName || ''} />
              <InfoRow icon="card-membership" label="شماره شناسنامه" value={user?.customFields?.idNumber || ''} />
              <InfoRow icon="today" label="تاریخ تولد" value={user?.customFields?.birthDate || ''} />
              <InfoRow icon="cake" label="سن" value={user?.customFields?.age ? `${user.customFields.age} سال` : ''} />
              <InfoRow icon="pin-drop" label="محل تولد" value={user?.customFields?.birthPlace || ''} />
              <InfoRow icon="favorite" label="وضعیت تأهل" value={user?.customFields?.maritalStatus || ''} />
              <InfoRow icon="security" label="شماره بیمه" value={user?.customFields?.insuranceNo || ''} />
              <InfoRow icon="school" label="تحصیلات" value={user?.customFields?.education || ''} isLast />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Info Modal: Qualifications ── */}
      <Modal visible={activeModal === 'info-quals'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={s.closeBtn}><MaterialIcons name="close" size={22} color={theme.colors.onSurface} /></TouchableOpacity>
              <Text style={s.modalTitle}>صلاحیت‌ها و گواهینامه‌ها</Text>
            </View>
            <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
              <InfoRow icon="assignment-ind" label="وضعیت راهبری" value={user?.customFields?.drivingStatus || ''} />
              <InfoRow icon="speed" label="درصد راهبری" value={user?.customFields?.driverPercent ? `${user.customFields.driverPercent}٪` : ''} />
              <InfoRow icon="speed" label="درصد دستیار راهبری" value={user?.customFields?.coDriverPercent ? `${user.customFields.coDriverPercent}٪` : ''} />
              <InfoRow icon="event-available" label="تاریخ گواهینامه درجه ۱" value={user?.customFields?.licenseClass1Date || ''} />
              <InfoRow icon="event-available" label="تاریخ گواهینامه درجه ۲" value={user?.customFields?.licenseClass2Date || ''} />
              <InfoRow icon="fact-check" label="اعتبار کارت سلامت" value={user?.customFields?.medicalExamValidity || ''} isLast />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Info Modal: Vehicle ── */}
      <Modal visible={activeModal === 'info-vehicle'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={s.closeBtn}><MaterialIcons name="close" size={22} color={theme.colors.onSurface} /></TouchableOpacity>
              <Text style={s.modalTitle}>خودرو و پلاک ثبت‌شده</Text>
            </View>
            <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
              <InfoRow icon="directions-car" label="نوع خودرو" value={user?.customFields?.carType || ''} />
              <InfoRow icon="palette" label="رنگ خودرو" value={user?.customFields?.carColor || ''} isLast />
              <View style={{ alignItems: 'center', paddingVertical: 20, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: theme.borderRadius.md, marginTop: 12 }}>
                <Text style={{ fontFamily: theme.typography.captionSm.fontFamily, fontSize: 11, color: theme.colors.secondary, marginBottom: 10 }}>شماره پلاک ملی</Text>
                {renderPlateView()}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Notifications Modal ── */}
      <Modal visible={activeModal === 'notifications'} animationType="slide" transparent onRequestClose={() => setActiveModal(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={s.closeBtn}><MaterialIcons name="close" size={22} color={theme.colors.onSurface} /></TouchableOpacity>
              <Text style={s.modalTitle}>تنظیمات اعلانات</Text>
            </View>
            <View style={s.modalBody}>
              <View style={s.switchRow}>
                <Switch
                  value={circulars}
                  onValueChange={handleCircularsChange}
                  trackColor={{ false: theme.colors.surfaceVariant, true: `${userTheme}40` }}
                  thumbColor={circulars ? userTheme : theme.colors.secondary}
                  disabled={saving}
                />
                <View style={s.switchTextContainer}>
                  <Text style={s.switchTitle}>بخشنامه‌ها و ابلاغیه‌ها</Text>
                  <Text style={s.switchDesc}>دریافت اعلان هنگام صدور بخشنامه جدید ایمنی</Text>
                </View>
              </View>

              <View style={s.switchRow}>
                <Switch
                  value={chat}
                  onValueChange={handleChatChange}
                  trackColor={{ false: theme.colors.surfaceVariant, true: `${userTheme}40` }}
                  thumbColor={chat ? userTheme : theme.colors.secondary}
                  disabled={saving}
                />
                <View style={s.switchTextContainer}>
                  <Text style={s.switchTitle}>پیام‌های گفتگو</Text>
                  <Text style={s.switchDesc}>دریافت اعلان برای پیام‌های جدید در چت‌روم‌ها</Text>
                </View>
              </View>

              <View style={[s.switchRow, s.infoRowNoBorder]}>
                <Switch
                  value={shifts}
                  onValueChange={handleShiftsChange}
                  trackColor={{ false: theme.colors.surfaceVariant, true: `${userTheme}40` }}
                  thumbColor={shifts ? userTheme : theme.colors.secondary}
                  disabled={saving}
                />
                <View style={s.switchTextContainer}>
                  <Text style={s.switchTitle}>درخواست‌های تغییر شیفت</Text>
                  <Text style={s.switchDesc}>اعلان زمان موافقت، مخالفت یا پیشنهاد جابجایی شیفت</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Full Edit Profile Modal ── */}
      <Modal animationType="slide" transparent visible={activeModal === 'edit'} onRequestClose={() => setActiveModal(null)}>
        <View style={s.editModalOverlay}>
          <View style={s.editModalContent}>
            {/* Modal Header */}
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={s.closeBtn}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
              <Text style={s.modalTitle}>ویرایش پروفایل</Text>
            </View>

            {/* Edit Tabs */}
            <View style={s.modalTabRow}>
              {(['vehicle', 'contact', 'qualifications', 'job', 'personal'] as const).map((tab) => {
                const labels: Record<string, string> = {
                  personal: 'شناسنامه‌ای',
                  job: 'سازمانی',
                  qualifications: 'صلاحیت‌ها',
                  contact: 'تماس/نشانی',
                  vehicle: 'پلاک/خودرو',
                }
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[s.modalTabItem, activeEditTab === tab && s.modalTabItemActive]}
                    onPress={() => setActiveEditTab(tab)}
                  >
                    <Text style={[s.modalTabText, activeEditTab === tab && s.modalTabTextActive]}>{labels[tab]}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <ScrollView contentContainerStyle={s.modalForm} showsVerticalScrollIndicator={false}>
              {/* ── Tab: Personal ── */}
              {activeEditTab === 'personal' && (
                <View>
                  <Text style={s.inputLabel}>عکس پروفایل</Text>
                  <View style={s.avatarPickerRow}>
                    {DEFAULT_AVATARS.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          s.avatarPickWrapper,
                          avatar === item.url && !customAvatarUrl ? { borderColor: themeColor, borderWidth: 2 } : null,
                        ]}
                        onPress={() => { setAvatar(item.url); setCustomAvatarUrl('') }}
                      >
                        <Image source={{ uri: item.url }} style={s.avatarPickImg} />
                        <Text style={s.avatarPickName}>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={s.inputLabel}>عکس اختصاصی (از گالری)</Text>
                    <TouchableOpacity 
                      style={[s.avatarPickWrapper, { width: '100%', height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderColor: theme.colors.outlineVariant, borderWidth: 1 }]}
                      onPress={async () => {
                        setIsUploadingAvatar(true)
                        const res = await pickAndUploadImage(false)
                        setIsUploadingAvatar(false)
                        if (res?.url) {
                          setCustomAvatarUrl(res.url)
                          setAvatar(res.url)
                        }
                      }}
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? (
                        <ActivityIndicator color={themeColor} size="small" />
                      ) : (
                        <>
                          <MaterialIcons name="photo-library" size={20} color={themeColor} style={{ marginRight: 8 }} />
                          <Text style={[s.avatarPickName, { color: themeColor, fontSize: 14 }]}>
                            انتخاب تصویر جدید
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  <EditField label="نام پدر" value={fatherName} onChangeText={setFatherName} />
                  <EditField label="شماره شناسنامه" value={idNumber} onChangeText={setIdNumber} />
                  <EditField label="تاریخ تولد" value={birthDate} onChangeText={setBirthDate} placeholder="۱۳۷۰/۰۱/۱۵" />
                  <EditField label="سن" value={age} onChangeText={setAge} keyboardType="number-pad" />
                  <EditField label="محل تولد" value={birthPlace} onChangeText={setBirthPlace} />
                  <EditField label="وضعیت تأهل" value={maritalStatus} onChangeText={setMaritalStatus} />
                  <EditField label="شماره بیمه تأمین اجتماعی" value={insuranceNo} onChangeText={setInsuranceNo} />
                  <EditField label="مدرک تحصیلی" value={education} onChangeText={setEducation} />
                </View>
              )}

              {/* ── Tab: Job ── */}
              {activeEditTab === 'job' && (
                <View>
                  <EditField label="شماره پرسنلی" value={personnelNo} onChangeText={setPersonnelNo} />
                  <EditField label="سمت / پست سازمانی" value={post} onChangeText={setPost} />
                  <EditField label="شیفت" value={shift} onChangeText={setShift} />
                  <EditField label="نوع شیفت (ثابت، چرخشی)" value={shiftType} onChangeText={setShiftType} />
                  <EditField label="محل شروع کار" value={startLocation} onChangeText={setStartLocation} />
                  <EditField label="تاریخ استخدام" value={hireDate} onChangeText={setHireDate} placeholder="۱۳۹۸/۰۳/۲۵" />

                  <Text style={s.inputLabel}>گروه</Text>
                  <View style={s.availabilityRow}>
                    {['A', 'B', 'C', 'D', 'E'].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[s.availabilityBtn, group === g && { borderColor: userTheme, backgroundColor: `${userTheme}14` }]}
                        onPress={() => setGroup(g)}
                      >
                        <Text style={[s.availabilityBtnText, group === g && { color: userTheme, fontWeight: 'bold' }]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={s.inputLabel}>وضعیت حضور</Text>
                  <View style={s.availabilityRow}>
                    {Object.entries(AVAILABILITY_LABELS).map(([key, info]) => (
                      <TouchableOpacity
                        key={key}
                        style={[s.availabilityBtn, availability === key && { borderColor: info.color, backgroundColor: `${info.color}14` }]}
                        onPress={() => setAvailability(key)}
                      >
                        <Text style={[s.availabilityBtnText, availability === key && { color: info.color, fontWeight: 'bold' }]}>{info.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={s.inputLabel}>رنگ تِم اختصاصی</Text>
                  <View style={s.colorRow}>
                    {DEFAULT_THEME_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c.hex}
                        style={[s.colorCircle, { backgroundColor: c.hex }, themeColor === c.hex && s.colorCircleActive]}
                        onPress={() => setThemeColor(c.hex)}
                      >
                        {themeColor === c.hex && <MaterialIcons name="check" size={16} color="#ffffff" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* ── Tab: Qualifications ── */}
              {activeEditTab === 'qualifications' && (
                <View>
                  <EditField label="وضعیت راهبری" value={drivingStatus} onChangeText={setDrivingStatus} />
                  <EditField label="تاریخ گواهینامه درجه ۱" value={licenseClass1Date} onChangeText={setLicenseClass1Date} />
                  <EditField label="تاریخ گواهینامه درجه ۲" value={licenseClass2Date} onChangeText={setLicenseClass2Date} />
                  <EditField label="اعتبار کارت سلامت" value={medicalExamValidity} onChangeText={setMedicalExamValidity} />
                  <EditField label="درصد راهبری" value={driverPercent} onChangeText={setDriverPercent} keyboardType="number-pad" />
                  <EditField label="درصد دستیار راهبری" value={coDriverPercent} onChangeText={setCoDriverPercent} keyboardType="number-pad" />
                </View>
              )}

              {/* ── Tab: Contact ── */}
              {activeEditTab === 'contact' && (
                <View>
                  <EditField label="شماره موبایل" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="09XXXXXXXXX" />
                  <EditField label="ایمیل" value={email} onChangeText={setEmail} keyboardType="email-address" />
                  <EditField label="تلفن اضطراری ۱" value={phone3} onChangeText={setPhone3} keyboardType="phone-pad" />
                  <EditField label="تلفن اضطراری ۲" value={phone4} onChangeText={setPhone4} keyboardType="phone-pad" />
                  <EditField label="نشانی کامل منزل" value={address} onChangeText={setAddress} />
                </View>
              )}

              {/* ── Tab: Vehicle ── */}
              {activeEditTab === 'vehicle' && (
                <View>
                  <EditField label="نوع خودرو" value={carType} onChangeText={setCarType} />
                  <EditField label="رنگ خودرو" value={carColor} onChangeText={setCarColor} />

                  <Text style={s.inputLabel}>شماره پلاک ملی خودرو</Text>
                  <View style={s.plateContainer}>
                    <View style={s.plateBlueBar}>
                      <View style={s.plateFlagBar}>
                        <View style={{ height: 2, backgroundColor: '#4CAF50', width: 12 }} />
                        <View style={{ height: 2, backgroundColor: '#FFFFFF', width: 12 }} />
                        <View style={{ height: 2, backgroundColor: '#F44336', width: 12 }} />
                      </View>
                      <Text style={s.plateIranText}>I.R.</Text>
                      <Text style={s.plateIranText}>IRAN</Text>
                    </View>

                    <TextInput
                      style={s.plateNumInput}
                      value={plateNum1}
                      onChangeText={setPlateNum1}
                      placeholder="۱۲"
                      keyboardType="number-pad"
                    />

                    <View style={s.plateLetterBtn}>
                      <TextInput
                        style={[s.plateLetterText, { flex: 1, textAlign: 'center', padding: 0 }]}
                        value={plateLetter}
                        onChangeText={setPlateLetter}
                      />
                      <TouchableOpacity 
                        onPress={() => setActiveModal('letter-picker')} 
                        style={{ position: 'absolute', bottom: 1, right: 1, padding: 2 }}
                      >
                        <MaterialIcons name="arrow-drop-down" size={14} color="#64748b" />
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={[s.plateNumInput, { width: 44 }]}
                      value={plateNum2}
                      onChangeText={setPlateNum2}
                      placeholder="۳۴۵"
                      keyboardType="number-pad"
                    />

                    <View style={s.plateDivider} />

                    <View style={s.plateCitySection}>
                      <Text style={s.plateIranLabel}>ایران</Text>
                      <TextInput
                        style={s.plateCityInput}
                        value={plateCity}
                        onChangeText={setPlateCity}
                        placeholder="۱۱"
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  {/* Separate text input for letter removed as it is now typeable in the plate graphic */}
                </View>
              )}

              {/* Save / Cancel */}
              <View style={s.modalActions}>
                <TouchableOpacity
                  style={[s.modalBtn, s.modalBtnSave, { backgroundColor: userTheme }]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={s.modalBtnText}>ذخیره تغییرات</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.modalBtn, s.modalBtnCancel]}
                  onPress={() => setActiveModal(null)}
                  disabled={saving}
                >
                  <Text style={[s.modalBtnText, { color: theme.colors.secondary }]}>انصراف</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Letter Picker Modal ── */}
      <Modal visible={activeModal === 'letter-picker'} transparent animationType="fade" onRequestClose={() => setActiveModal('edit')}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: SCREEN_W * 0.9, maxHeight: SCREEN_H * 0.7, backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.xxl, borderWidth: 1, borderColor: theme.colors.surfaceVariant, padding: 20, ...theme.shadows.level2 }}>
            <Text style={{ fontFamily: theme.typography.screenTitle.fontFamily, color: theme.colors.onSurface, fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginBottom: 6 }}>انتخاب حرف پلاک</Text>
            <Text style={{ fontFamily: theme.typography.captionSm.fontFamily, color: theme.colors.secondary, fontSize: 11, textAlign: 'center', marginBottom: 16 }}>تمام حروف الفبای فارسی و حروف ویژه</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_H * 0.45 }}>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingBottom: 8 }}>
                {PLATE_LETTERS.map((letter) => (
                  <TouchableOpacity
                    key={letter}
                    style={{
                      minWidth: 48,
                      height: 42,
                      paddingHorizontal: letter.length > 2 ? 10 : 4,
                      borderRadius: theme.borderRadius.md,
                      backgroundColor: plateLetter === letter ? userTheme : theme.colors.surfaceContainerLow,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: plateLetter === letter ? 2 : 1,
                      borderColor: plateLetter === letter ? userTheme : theme.colors.surfaceVariant,
                      ...theme.shadows.level1,
                    }}
                    onPress={() => {
                      setPlateLetter(letter)
                      setActiveModal('edit')
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{
                      fontFamily: theme.typography.cardTitle.fontFamily,
                      color: plateLetter === letter ? '#ffffff' : theme.colors.onSurface,
                      fontWeight: 'bold',
                      fontSize: letter.length > 2 ? 11 : 15,
                    }}>{letter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={{
                marginTop: 16,
                backgroundColor: theme.colors.surfaceContainerHigh,
                borderRadius: theme.borderRadius.md,
                paddingVertical: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.colors.surfaceVariant,
              }}
              onPress={() => setActiveModal('edit')}
              activeOpacity={0.7}
            >
              <Text style={{ color: theme.colors.onSurface, fontFamily: theme.typography.bodyMd.fontFamily, fontWeight: '600' }}>بازگشت</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScreenWrapper>
  )
}

export default ProfileScreen
