import React, { useState, useEffect, useMemo } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'

interface ManagerUser {
  id: string
  name: string
  role: { name: string }
}

interface MeetingRequest {
  id: string
  requesterId: string
  targetManagerId: string
  title: string
  description?: string
  scheduledAt: string
  durationMinutes: number
  status: 'pending' | 'approved' | 'rejected' | 'rescheduled'
  note?: string
  targetManager: { name: string }
  requester?: { name: string }
}

const MEETING_ROOMS = [
  { id: 'room-1', name: 'سالن کنفرانس کهریزک', capacity: 25, icon: 'room' },
  { id: 'room-2', name: 'اتاق جلسات ستادی صادقیه', capacity: 12, icon: 'meeting-room' },
  { id: 'room-3', name: 'دفتر ریاست پایانه فتح', capacity: 6, icon: 'business' },
]

const TIME_SLOTS = [
  { id: 'slot-1', label: '۰۸:۳۰ - ۱۰:۰۰', start: '08:30' },
  { id: 'slot-2', label: '۱۰:۰۰ - ۱۱:۳۰', start: '10:00' },
  { id: 'slot-3', label: '۱۱:۳۰ - ۱۳:۰۰', start: '11:30' },
  { id: 'slot-4', label: '۱۳:۰۰ - ۱۴:۳۰', start: '13:00' },
  { id: 'slot-5', label: '۱۴:۳۰ - ۱۶:۰۰', start: '14:30' },
]

export function MeetingsScreen({ navigation }: any) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<'book' | 'list'>('book')
  const [loading, setLoading] = useState(false)
  const [managers, setManagers] = useState<ManagerUser[]>([])
  const [myMeetings, setMyMeetings] = useState<MeetingRequest[]>([])

  // Selection states
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedRoom, setSelectedRoom] = useState<string>(MEETING_ROOMS[0].id)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')

  // Form states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDesc, setMeetingDesc] = useState('')

  // Horizontal Jalali Calendar Dates (Today + next 4 days)
  const dates = useMemo(() => {
    const list = []
    const weekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
    for (let i = 0; i < 5; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const dayName = weekdays[d.getDay()]
      const jalaliStr = d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'short' })
      const isoStr = d.toISOString().split('T')[0]
      list.push({ isoStr, dayName, jalaliStr })
    }
    return list
  }, [])

  // Initialize selected date
  useEffect(() => {
    if (dates.length > 0) {
      setSelectedDate(dates[0].isoStr)
    }
  }, [dates])

  // Fetch managers & active meetings
  useEffect(() => {
    void fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // 1. Fetch managers/admins from user directory
      const usersRes = await fetch(`${API_URL}/users?pageSize=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (usersRes.ok) {
        const uJson = await usersRes.json()
        const fetchedUsers = uJson.data?.users || []
        // Filter to admins/super_admins/managers
        const filteredManagers = fetchedUsers.filter((u: any) => 
          u.roleKey === 'admin' || u.roleKey === 'super_admin' || u.roleKey === 'manager' || u.roleKey === 'chief'
        )
        setManagers(filteredManagers)
        if (filteredManagers.length > 0) {
          setSelectedManagerId(filteredManagers[0].id)
        }
      }

      // 2. Fetch meetings
      await fetchMeetings()

    } catch (err) {
      console.error('Error fetching meetings initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${API_URL}/meetings?view=mine`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const mJson = await res.json()
        setMyMeetings(mJson.data || [])
      }
    } catch (err) {
      console.error('Error fetching meetings:', err)
    }
  }

  const handleBooking = async () => {
    if (!meetingTitle.trim()) {
      Alert.alert('خطا', 'موضوع جلسه را وارد کنید')
      return
    }
    if (!selectedDate || !selectedSlot || !selectedManagerId) {
      Alert.alert('خطا', 'لطفا زمان، تاریخ و مدیر تایید کننده را انتخاب کنید')
      return
    }

    setLoading(true)
    setShowConfirmModal(false)

    try {
      const slot = TIME_SLOTS.find(s => s.id === selectedSlot)
      const scheduledTimeStr = `${selectedDate}T${slot ? slot.start : '08:30'}:00`

      const res = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetManagerId: selectedManagerId,
          title: meetingTitle,
          description: meetingDesc || `رزرو اتاق ${MEETING_ROOMS.find(r => r.id === selectedRoom)?.name}`,
          scheduledAt: new Date(scheduledTimeStr).toISOString(),
          durationMinutes: 90,
        }),
      })

      if (res.ok) {
        Alert.alert('موفقیت', 'درخواست رزرو شما ثبت شد و در انتظار تایید است.')
        setMeetingTitle('')
        setMeetingDesc('')
        setSelectedSlot('')
        await fetchMeetings()
        setActiveTab('list')
      } else {
        const errorJson = await res.json()
        Alert.alert('خطا', errorJson.error || 'خطا در ثبت رزرو')
      }
    } catch (err) {
      Alert.alert('خطا', 'ثبت رزرو با خطا مواجه شد')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelMeeting = async (meetingId: string) => {
    Alert.alert(
      'تایید لغو رزرو',
      'آیا مطمئن هستید که می‌خواهید این درخواست رزرو را لغو کنید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'بله، لغو شود',
          style: 'destructive',
          onPress: async () => {
            setLoading(true)
            try {
              // Delete or reject route
              const res = await fetch(`${API_URL}/meetings`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  meetingId,
                  status: 'rejected',
                  note: 'لغو شده توسط کاربر',
                }),
              })
              if (res.ok) {
                Alert.alert('موفقیت', 'رزرو با موفقیت لغو شد')
                await fetchMeetings()
              } else {
                Alert.alert('خطا', 'لغو رزرو ناموفق بود')
              }
            } catch (err) {
              console.error(err)
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  // Segmented control style buttons
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'list' && styles.activeTabButton]}
        onPress={() => setActiveTab('list')}
      >
        <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>رزروهای من</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'book' && styles.activeTabButton]}
        onPress={() => setActiveTab('book')}
      >
        <Text style={[styles.tabText, activeTab === 'book' && styles.activeTabText]}>ثبت رزرو جدید</Text>
      </TouchableOpacity>
    </View>
  )

  const renderBookContent = () => (
    <View style={styles.tabContent}>
      {/* 1. Date Picker Horizontal Bar */}
      <Text style={styles.sectionTitle}>۱. انتخاب تاریخ (شمسی)</Text>
      <View style={styles.datesContainer}>
        {dates.map((d) => {
          const isSelected = selectedDate === d.isoStr
          return (
            <TouchableOpacity
              key={d.isoStr}
              style={[
                styles.dateCard,
                isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              ]}
              onPress={() => setSelectedDate(d.isoStr)}
            >
              <Text style={[styles.dateDayName, isSelected && { color: '#fff' }]}>{d.dayName}</Text>
              <Text style={[styles.dateJalali, isSelected && { color: '#fff', fontWeight: 'bold' }]}>{d.jalaliStr}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 2. Room Picker Grid */}
      <Text style={styles.sectionTitle}>۲. انتخاب محل برگزاری</Text>
      <View style={styles.roomsGrid}>
        {MEETING_ROOMS.map((room) => {
          const isSelected = selectedRoom === room.id
          return (
            <TouchableOpacity
              key={room.id}
              style={[
                styles.roomCard,
                isSelected && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '0a' }
              ]}
              onPress={() => setSelectedRoom(room.id)}
            >
              <MaterialIcons name={room.icon as any} size={22} color={isSelected ? theme.colors.primary : theme.colors.secondary} />
              <View style={{ marginRight: 6, alignItems: 'flex-start' }}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomCap}>ظرفیت: {room.capacity} نفر</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 3. Time Slots Grid */}
      <Text style={styles.sectionTitle}>۳. بازه‌های زمانی خالی</Text>
      <View style={styles.slotsGrid}>
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot.id
          return (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotCard,
                isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              ]}
              onPress={() => setSelectedSlot(slot.id)}
            >
              <Text style={[styles.slotText, isSelected && { color: '#fff', fontWeight: '700' }]}>{slot.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 4. Manager Approver Selection */}
      <Text style={styles.sectionTitle}>۴. مقام تایید کننده جلسه</Text>
      <View style={styles.managerSelectRow}>
        <View style={styles.managerDropdown}>
          {managers.length > 0 ? (
            <FlatList
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              data={managers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedManagerId === item.id
                return (
                  <TouchableOpacity
                    style={[
                      styles.managerBadge,
                      isSelected && { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary }
                    ]}
                    onPress={() => setSelectedManagerId(item.id)}
                  >
                    <Text style={[styles.managerBadgeText, isSelected && { color: theme.colors.primary, fontWeight: '700' }]}>
                      {item.name} ({item.role?.name || 'مدیر'})
                    </Text>
                  </TouchableOpacity>
                )
              }}
            />
          ) : (
            <Text style={styles.helperText}>در حال بارگذاری لیست مسئولین...</Text>
          )}
        </View>
      </View>

      {/* Book Button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          (!selectedSlot || !selectedDate) && { opacity: 0.5 }
        ]}
        disabled={!selectedSlot || !selectedDate || loading}
        onPress={() => setShowConfirmModal(true)}
      >
        <Text style={styles.actionBtnText}>ادامه و ثبت رزرو</Text>
        <MaterialIcons name="chevron-left" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  )

  const renderListContent = () => (
    <View style={[styles.tabContent, { flex: 1 }]}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
      ) : myMeetings.length > 0 ? (
        <FlatList
          data={myMeetings}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const meetingDate = new Date(item.scheduledAt)
            const timeStr = meetingDate.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
            const dateStr = meetingDate.toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' })
            
            let statusColor = '#e2e8f0'
            let statusText = 'نامشخص'
            let textColor = '#475569'

            if (item.status === 'pending') {
              statusColor = '#fef3c7'
              textColor = '#d97706'
              statusText = 'در انتظار تایید'
            } else if (item.status === 'approved') {
              statusColor = '#dcfce7'
              textColor = '#16a34a'
              statusText = 'تایید شده'
            } else if (item.status === 'rejected') {
              statusColor = '#fee2e2'
              textColor = '#dc2626'
              statusText = 'رد شده'
            }

            return (
              <View style={styles.meetingCard}>
                <View style={styles.meetingHeader}>
                  <Text style={styles.meetingTitle}>{item.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={[styles.statusText, { color: textColor }]}>{statusText}</Text>
                  </View>
                </View>
                <View style={styles.meetingDetails}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="schedule" size={14} color={theme.colors.secondary} />
                    <Text style={styles.detailText}>{dateStr} - {timeStr}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="person-outline" size={14} color={theme.colors.secondary} />
                    <Text style={styles.detailText}>برگزارکننده: {item.targetManager?.name}</Text>
                  </View>
                </View>
                {item.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancelMeeting(item.id)}
                  >
                    <Text style={styles.cancelBtnText}>لغو درخواست رزرو</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event-busy" size={48} color={theme.colors.secondary + '70'} />
          <Text style={styles.emptyText}>هیچ جلسه رزرو شده‌ای یافت نشد.</Text>
        </View>
      )}
    </View>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    tabContainer: {
      flexDirection: 'row-reverse',
      backgroundColor: theme.colors.surfaceContainerLow,
      padding: 4,
      borderRadius: theme.borderRadius.lg,
      marginBottom: 12,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 9,
      alignItems: 'center',
      borderRadius: theme.borderRadius.md,
    },
    activeTabButton: {
      backgroundColor: theme.colors.surfaceContainerLowest,
    },
    tabText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 12.5,
      color: theme.colors.secondary,
    },
    activeTabText: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    tabContent: {
      flex: 1,
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onSurface,
      textAlign: 'right',
      marginVertical: 6,
    },
    datesContainer: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      marginVertical: 4,
    },
    dateCard: {
      width: (Dimensions.get('window').width - 32 - 32) / 5,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border + '50',
      alignItems: 'center',
    },
    dateDayName: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 10,
      color: theme.colors.secondary,
      marginBottom: 3,
    },
    dateJalali: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 11,
      color: theme.colors.onSurface,
    },
    roomsGrid: {
      flexDirection: 'column',
      gap: 5,
      marginVertical: 4,
    },
    roomCard: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      padding: 10,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1.5,
      borderColor: theme.colors.border + '30',
    },
    roomName: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    roomCap: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 10.5,
      color: theme.colors.secondary,
      marginTop: 2,
    },
    slotsGrid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 6,
      marginVertical: 4,
    },
    slotCard: {
      width: (Dimensions.get('window').width - 32 - 12) / 2,
      paddingVertical: 10,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border + '50',
      alignItems: 'center',
      justifyContent: 'center',
    },
    slotText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 11.5,
      color: theme.colors.onSurface,
    },
    managerSelectRow: {
      marginVertical: 4,
    },
    managerDropdown: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
    },
    managerBadge: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 6,
    },
    managerBadgeText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      color: theme.colors.secondary,
    },
    helperText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      color: theme.colors.secondary,
      fontSize: 11,
      textAlign: 'right',
    },
    actionBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 6,
      marginTop: 12,
      marginBottom: 8,
    },
    actionBtnText: {
      fontFamily: theme.typography.cardTitle.fontFamily,
      color: '#fff',
      fontSize: 13.5,
      fontWeight: '700',
    },
    // List item styles
    meetingCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 12,
      marginVertical: 4,
    },
    meetingHeader: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
      paddingBottom: 8,
      marginBottom: 8,
    },
    meetingTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    statusText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 10,
      fontWeight: 'bold',
    },
    meetingDetails: {
      flexDirection: 'column',
      gap: 6,
    },
    detailItem: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
    },
    detailText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      color: theme.colors.secondary,
    },
    cancelBtn: {
      borderWidth: 1,
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.errorContainer + '10',
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    cancelBtnText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      color: theme.colors.error,
      fontWeight: 'bold',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 80,
    },
    emptyText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 12.5,
      color: theme.colors.secondary,
      marginTop: 12,
    },
    // Confirmation Modal Styles
    confirmOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    confirmContent: {
      width: Dimensions.get('window').width * 0.88,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 20,
    },
    confirmTitle: {
      fontFamily: theme.typography.screenTitle.fontFamily,
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 16,
    },
    inputLabel: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      color: theme.colors.secondary,
      textAlign: 'right',
      marginBottom: 4,
      marginTop: 10,
    },
    textInput: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 12.5,
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      padding: 10,
      textAlign: 'right',
    },
    modalActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 20,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalConfirmBtn: {
      flex: 2,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })

  return (
    <ScreenWrapper title="رزرو وقت جلسه" navigation={navigation}>
      <View style={styles.container}>
        {renderTabs()}
        {activeTab === 'book' ? renderBookContent() : renderListContent()}
      </View>

      {/* Confirmation and Topic Selection Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContent}>
            <Text style={styles.confirmTitle}>موضوع و جزئیات جلسه</Text>

            <Text style={styles.inputLabel}>موضوع جلسه (اجباری)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="مثلاً: هماهنگی شیفت‌های اعزام خط ۱"
              placeholderTextColor={theme.colors.secondary + '70'}
              value={meetingTitle}
              onChangeText={setMeetingTitle}
            />

            <Text style={styles.inputLabel}>توضیحات تکمیلی (اختیاری)</Text>
            <TextInput
              style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="شرح مختصری در رابطه با اهداف جلسه..."
              placeholderTextColor={theme.colors.secondary + '70'}
              multiline
              value={meetingDesc}
              onChangeText={setMeetingDesc}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={[styles.tabText, { fontWeight: '700' }]}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleBooking}
              >
                <Text style={[styles.actionBtnText]}>ثبت نهایی درخواست</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  )
}

export default MeetingsScreen
