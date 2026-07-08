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
  ScrollView,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
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
  status: 'pending' | 'approved' | 'rejected' | 'rescheduled' | 'completed'
  note?: string
  cancelReason?: string | null
  rescheduleOf?: string | null
  outcomeNote?: string | null
  targetManager: { name: string; id: string }
  requester?: { name: string; id: string }
  roomId?: string | null
  room?: { name: string } | null
  meetingType?: { key: string; title: string; needsRoom: boolean } | null
  formData?: any
}

const ROLE_NAMES: Record<string, string> = {
  super_admin: 'مدیر ارشد',
  admin: 'مدیر سیستم',
  manager: 'مدیر',
  chief: 'رئیس',
  supervisor: 'سرپرست',
  operator: 'اپراتور',
  shift_lead: 'مسئول شیفت',
  driver: 'راهبر',
  expert: 'کارشناس',
  dispatch_tech: 'تکنسین اعزام پذیرش',
  clerical: 'دفتری',
}

export function MeetingsScreen({ navigation }: any) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<'book' | 'list'>('book')
  const [loading, setLoading] = useState(false)
  const [managers, setManagers] = useState<ManagerUser[]>([])
  const [meetingTypes, setMeetingTypes] = useState<any[]>([])
  const [meetingRooms, setMeetingRooms] = useState<any[]>([])
  const [myMeetings, setMyMeetings] = useState<MeetingRequest[]>([])

  // Selection states
  const [selectedType, setSelectedType] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [selectedHostId, setSelectedHostId] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<string>('')

  // Form states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDesc, setMeetingDesc] = useState('')
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({})
  const [attendeesInput, setAttendeesInput] = useState('')

  // Dynamic slots state
  const [slots, setSlots] = useState<{ time: string; available: boolean; reason?: string }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Reschedule Modal States
  const [reschedulingMeeting, setReschedulingMeeting] = useState<MeetingRequest | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleSlots, setRescheduleSlots] = useState<{ time: string; available: boolean; reason?: string }[]>([])
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false)
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState('')

  // Text Input Modal States (for Cancel Reason / Outcome Note)
  const [textModalVisible, setTextModalVisible] = useState(false)
  const [textModalTitle, setTextModalTitle] = useState('')
  const [textModalLabel, setTextModalLabel] = useState('')
  const [textModalValue, setTextModalValue] = useState('')
  const [textModalSubmit, setTextModalSubmit] = useState<any>(null)

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

  // Fetch initial types, rooms, managers
  useEffect(() => {
    void fetchInitialData()
  }, [])

  // Fetch slots when criteria change
  useEffect(() => {
    if (selectedDate && selectedType && selectedHostId) {
      void fetchSlots()
    }
  }, [selectedDate, selectedHostId, selectedType, selectedRoom])

  // Fetch slots for rescheduling when date changes
  useEffect(() => {
    if (rescheduleDate && reschedulingMeeting) {
      void fetchRescheduleSlots()
    }
  }, [rescheduleDate, reschedulingMeeting])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // 1. Fetch managers/admins from user directory
      const usersRes = await fetch(`${API_URL}/users?pageSize=100`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      let fetchedManagers: ManagerUser[] = []
      if (usersRes.ok) {
        const uJson = await usersRes.json()
        const fetchedUsers = uJson.data?.users || []
        fetchedManagers = fetchedUsers.filter((u: any) =>
          u.roleKey === 'admin' || u.roleKey === 'super_admin' || u.roleKey === 'manager' || u.roleKey === 'chief' || u.roleKey === 'supervisor'
        )
        setManagers(fetchedManagers)
      }

      // 2. Fetch active meeting types
      const typesRes = await fetch(`${API_URL}/meetings/types`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      let firstType: any = null
      if (typesRes.ok) {
        const tJson = await typesRes.json()
        const types = tJson.data || []
        setMeetingTypes(types)
        if (types.length > 0) {
          firstType = types[0]
          setSelectedType(firstType)
        }
      }

      // 3. Fetch active rooms
      const roomsRes = await fetch(`${API_URL}/meetings/rooms`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (roomsRes.ok) {
        const rJson = await roomsRes.json()
        const rooms = rJson.data || []
        setMeetingRooms(rooms)
        if (rooms.length > 0) {
          setSelectedRoom(rooms[0].id)
        }
      }

      // Initialize selectedHostId based on firstType
      if (firstType) {
        if (firstType.hostMode === 'role' && firstType.hostRoleKey) {
          setSelectedHostId(`role:${firstType.hostRoleKey}`)
        } else if (fetchedManagers.length > 0) {
          setSelectedHostId(fetchedManagers[0].id)
        }
      }

      // 4. Fetch meetings
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

  const fetchSlots = async () => {
    setSlotsLoading(true)
    setSelectedSlot('')
    try {
      const typeKey = selectedType?.key || 'public_visit'
      const roomId = (selectedType?.needsRoom && selectedRoom) ? selectedRoom : ''
      const hostId = selectedHostId

      let url = `${API_URL}/meetings/slots?hostId=${encodeURIComponent(hostId)}&date=${encodeURIComponent(selectedDate)}&typeKey=${encodeURIComponent(typeKey)}`
      if (roomId) {
        url += `&roomId=${encodeURIComponent(roomId)}`
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setSlots(json.data || [])
      } else {
        setSlots([])
      }
    } catch (err) {
      console.error('Error fetching slots:', err)
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  const fetchRescheduleSlots = async () => {
    if (!reschedulingMeeting) return
    setRescheduleSlotsLoading(true)
    setSelectedRescheduleSlot('')
    try {
      const typeKey = reschedulingMeeting.meetingType?.key || 'public_visit'
      const hostId = reschedulingMeeting.targetManagerId
      const roomId = reschedulingMeeting.roomId || ''

      let url = `${API_URL}/meetings/slots?hostId=${encodeURIComponent(hostId)}&date=${encodeURIComponent(rescheduleDate)}&typeKey=${encodeURIComponent(typeKey)}`
      if (roomId) {
        url += `&roomId=${encodeURIComponent(roomId)}`
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setRescheduleSlots(json.data || [])
      } else {
        setRescheduleSlots([])
      }
    } catch (err) {
      console.error('Error fetching reschedule slots:', err)
      setRescheduleSlots([])
    } finally {
      setRescheduleSlotsLoading(false)
    }
  }

  const selectMeetingType = (type: any) => {
    setSelectedType(type)
    if (type.hostMode === 'role' && type.hostRoleKey) {
      setSelectedHostId(`role:${type.hostRoleKey}`)
    } else {
      if (managers.length > 0) {
        setSelectedHostId(managers[0].id)
      } else {
        setSelectedHostId('')
      }
    }
    setSelectedSlot('')
    setDynamicFields({})
  }

  const handleBooking = async () => {
    if (!meetingTitle.trim()) {
      Alert.alert('خطا', 'موضوع جلسه را وارد کنید')
      return
    }
    if (!selectedDate || !selectedSlot || !selectedHostId) {
      Alert.alert('خطا', 'لطفا زمان، تاریخ و میزبان جلسه را انتخاب کنید')
      return
    }

    // Validate dynamic fields
    if (selectedType?.fields) {
      for (const f of selectedType.fields) {
        if (f.required && !dynamicFields[f.name]?.trim()) {
          Alert.alert('خطا', `تکمیل فیلد "${f.label}" الزامی است`)
          return
        }
      }
    }

    setLoading(true)
    setShowConfirmModal(false)

    try {
      const scheduledTimeStr = `${selectedDate}T${selectedSlot}:00`

      const res = await fetch(`${API_URL}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetManagerId: selectedHostId,
          title: meetingTitle,
          description: meetingDesc || undefined,
          scheduledAt: new Date(scheduledTimeStr).toISOString(),
          durationMinutes: selectedType?.durationMin || 30,
          typeId: selectedType?.id,
          roomId: selectedType?.needsRoom ? selectedRoom : undefined,
          formData: dynamicFields,
          attendees: attendeesInput ? attendeesInput.split(',').map((s) => s.trim()) : undefined,
        }),
      })

      if (res.ok) {
        Alert.alert('موفقیت', 'درخواست رزرو شما با موفقیت ثبت شد.')
        setMeetingTitle('')
        setMeetingDesc('')
        setSelectedSlot('')
        setDynamicFields({})
        setAttendeesInput('')
        await fetchMeetings()
        setActiveTab('list')
      } else {
        const errorJson = await res.json()
        Alert.alert('خطا', errorJson.error?.message || errorJson.error || 'خطا در ثبت رزرو')
      }
    } catch (err) {
      Alert.alert('خطا', 'ثبت رزرو با خطا مواجه شد')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const triggerCancel = (meetingId: string) => {
    setTextModalTitle('لغو درخواست رزرو')
    setTextModalLabel('علت لغو جلسه را بنویسید (اجباری)')
    setTextModalValue('')
    setTextModalSubmit(() => async (reason: string) => {
      if (!reason.trim()) {
        Alert.alert('خطا', 'علت لغو الزامی است')
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/meetings/${meetingId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ reason }),
        })
        if (res.ok) {
          Alert.alert('موفقیت', 'جلسه با موفقیت لغو شد')
          setTextModalVisible(false)
          await fetchMeetings()
        } else {
          const errJ = await res.json()
          Alert.alert('خطا', errJ.error?.message || 'لغو جلسه ناموفق بود')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })
    setTextModalVisible(true)
  }

  const triggerOutcome = (meetingId: string) => {
    setTextModalTitle('ثبت صورت‌جلسه')
    setTextModalLabel('متن صورت‌جلسه و نتایج نهایی (اجباری)')
    setTextModalValue('')
    setTextModalSubmit(() => async (outcomeNote: string) => {
      if (!outcomeNote.trim()) {
        Alert.alert('خطا', 'متن صورت‌جلسه نمی‌تواند خالی باشد')
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/meetings/${meetingId}/outcome`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ outcomeNote }),
        })
        if (res.ok) {
          Alert.alert('موفقیت', 'نتیجه و صورت‌جلسه ثبت و جلسه تکمیل شد.')
          setTextModalVisible(false)
          await fetchMeetings()
        } else {
          const errJ = await res.json()
          Alert.alert('خطا', errJ.error?.message || 'ثبت صورت‌جلسه با خطا مواجه شد')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })
    setTextModalVisible(true)
  }

  const triggerReschedule = (item: MeetingRequest) => {
    setReschedulingMeeting(item)
    setRescheduleDate(dates[0].isoStr)
    setSelectedRescheduleSlot('')
  }

  const handleRescheduleSubmit = async () => {
    if (!reschedulingMeeting || !selectedRescheduleSlot || !rescheduleDate) return
    setLoading(true)
    try {
      const scheduledTimeStr = `${rescheduleDate}T${selectedRescheduleSlot}:00`
      const res = await fetch(`${API_URL}/meetings/${reschedulingMeeting.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newSlot: new Date(scheduledTimeStr).toISOString() }),
      })
      if (res.ok) {
        Alert.alert('موفقیت', 'جلسه با موفقیت جابه‌جا شد.')
        setReschedulingMeeting(null)
        await fetchMeetings()
      } else {
        const errJ = await res.json()
        Alert.alert('خطا', errJ.error?.message || 'جابه‌جایی جلسه ناموفق بود')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toJalaliDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return isoStr
    }
  }

  const toJalaliTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoStr
    }
  }

  const isUserManager =
    (currentUser?.roleKey as string) === 'super_admin' ||
    (currentUser?.roleKey as string) === 'admin' ||
    (currentUser?.roleKey as string) === 'manager' ||
    (currentUser?.roleKey as string) === 'chief' ||
    (currentUser?.roleKey as string) === 'supervisor'

  // Segmented control style buttons
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'list' && styles.activeTabButton]}
        onPress={() => {
          setActiveTab('list')
          void fetchMeetings()
        }}
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
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
                isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
              ]}
              onPress={() => setSelectedDate(d.isoStr)}
            >
              <Text style={[styles.dateDayName, isSelected && { color: '#fff' }]}>{d.dayName}</Text>
              <Text style={[styles.dateJalali, isSelected && { color: '#fff', fontWeight: 'bold' }]}>{d.jalaliStr}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 2. Meeting Type Selector */}
      <Text style={styles.sectionTitle}>۲. نوع جلسه</Text>
      <View style={styles.typesContainer}>
        {meetingTypes.length > 0 ? (
          <FlatList
            horizontal
            inverted
            showsHorizontalScrollIndicator={false}
            data={meetingTypes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedType?.id === item.id
              return (
                <TouchableOpacity
                  style={[
                    styles.typeBadge,
                    isSelected && { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => selectMeetingType(item)}
                >
                  <Text style={[styles.typeBadgeText, isSelected && { color: theme.colors.primary, fontWeight: '700' }]}>
                    {item.title} ({item.durationMin} دقیقه)
                  </Text>
                </TouchableOpacity>
              )
            }}
          />
        ) : (
          <Text style={styles.helperText}>در حال بارگذاری انواع جلسات...</Text>
        )}
      </View>

      {/* 3. Room Picker Grid (Only if type needsRoom is true) */}
      {selectedType?.needsRoom && (
        <>
          <Text style={styles.sectionTitle}>۳. انتخاب سالن جلسه</Text>
          <View style={styles.roomsGrid}>
            {meetingRooms.map((room) => {
              const isSelected = selectedRoom === room.id
              return (
                <TouchableOpacity
                  key={room.id}
                  style={[
                    styles.roomCard,
                    isSelected && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '0a' },
                  ]}
                  onPress={() => setSelectedRoom(room.id)}
                >
                  <MaterialIcons name="meeting-room" size={22} color={isSelected ? theme.colors.primary : theme.colors.secondary} />
                  <View style={{ marginRight: 6, alignItems: 'flex-start' }}>
                    <Text style={styles.roomName}>{room.name}</Text>
                    <Text style={styles.roomCap}>ظرفیت: {room.capacity} نفر</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </>
      )}

      {/* 4. Host Selection */}
      <Text style={styles.sectionTitle}>۴. میزبان و مقام تایید کننده</Text>
      <View style={styles.managerSelectRow}>
        {selectedType?.hostMode === 'role' ? (
          <View style={styles.roleHostBanner}>
            <MaterialIcons name="people" size={20} color={theme.colors.primary} />
            <Text style={styles.roleHostText}>
              میزبان نقشی: {ROLE_NAMES[selectedType.hostRoleKey] || selectedType.hostRoleKey} (توزیع عادلانه بر اساس حضور در شیفت)
            </Text>
          </View>
        ) : (
          <View style={styles.managerDropdown}>
            {managers.length > 0 ? (
              <FlatList
                horizontal
                inverted
                showsHorizontalScrollIndicator={false}
                data={managers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedHostId === item.id
                  return (
                    <TouchableOpacity
                      style={[
                        styles.managerBadge,
                        isSelected && { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary },
                      ]}
                      onPress={() => setSelectedHostId(item.id)}
                    >
                      <Text style={[styles.managerBadgeText, isSelected && { color: theme.colors.primary, fontWeight: '700' }]}>
                        {item.name} ({ROLE_NAMES[item.role?.name] || item.role?.name || 'مدیر'})
                      </Text>
                    </TouchableOpacity>
                  )
                }}
              />
            ) : (
              <Text style={styles.helperText}>در حال بارگذاری لیست مسئولین...</Text>
            )}
          </View>
        )}
      </View>

      {/* 5. Time Slots Grid */}
      <Text style={styles.sectionTitle}>۵. اسلات‌های زمانی خالی</Text>
      {slotsLoading ? (
        <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
      ) : slots.length > 0 ? (
        <View style={styles.slotsGrid}>
          {slots.map((slot) => {
            const isSelected = selectedSlot === slot.time
            const isAvailable = slot.available
            return (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.slotCard,
                  isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                  !isAvailable && styles.slotCardDisabled,
                ]}
                disabled={!isAvailable}
                onPress={() => setSelectedSlot(slot.time)}
              >
                <Text style={[styles.slotText, isSelected && { color: '#fff', fontWeight: '700' }, !isAvailable && { color: '#a3a3a3' }]}>
                  {slot.time}
                </Text>
                {!isAvailable && (
                  <Text style={styles.slotReasonText} numberOfLines={1}>
                    {slot.reason || 'شلوغ'}
                  </Text>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      ) : (
        <Text style={[styles.helperText, { marginVertical: 12 }]}>هیچ اسلات زمانی برای تاریخ و میزبان انتخابی یافت نشد.</Text>
      )}

      {/* Book Button */}
      <TouchableOpacity
        style={[
          styles.actionBtn,
          (!selectedSlot || !selectedDate) && { opacity: 0.5 },
        ]}
        disabled={!selectedSlot || !selectedDate || loading}
        onPress={() => setShowConfirmModal(true)}
      >
        <Text style={styles.actionBtnText}>ادامه و ثبت رزرو</Text>
        <MaterialIcons name="chevron-left" size={20} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
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
              statusText = 'لغو/رد شده'
            } else if (item.status === 'rescheduled') {
              statusColor = '#f3e8ff'
              textColor = '#7c3aed'
              statusText = 'جابه‌جا شده'
            } else if (item.status === 'completed') {
              statusColor = '#ccfbf1'
              textColor = '#0d9488'
              statusText = 'برگزار شده'
            }

            const canCancel = item.status === 'pending' || item.status === 'approved'
            const canReschedule = item.status === 'pending' || item.status === 'approved'
            const isHost = item.targetManagerId === currentUser?.id
            const canWriteOutcome = item.status === 'approved' && isHost && isUserManager

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
                    <Text style={styles.detailText}>
                      {toJalaliDate(item.scheduledAt)} - {toJalaliTime(item.scheduledAt)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="person-outline" size={14} color={theme.colors.secondary} />
                    <Text style={styles.detailText}>میزبان: {item.targetManager?.name}</Text>
                  </View>
                  {item.room && (
                    <View style={styles.detailItem}>
                      <MaterialIcons name="room" size={14} color={theme.colors.secondary} />
                      <Text style={styles.detailText}>سالن: {item.room.name}</Text>
                    </View>
                  )}
                  {item.description && (
                    <View style={styles.detailItem}>
                      <MaterialIcons name="info-outline" size={14} color={theme.colors.secondary} />
                      <Text style={styles.detailText}>توضیحات: {item.description}</Text>
                    </View>
                  )}
                  {item.cancelReason && (
                    <View style={styles.detailItem}>
                      <MaterialIcons name="error-outline" size={14} color={theme.colors.error} />
                      <Text style={[styles.detailText, { color: theme.colors.error }]}>علت لغو: {item.cancelReason}</Text>
                    </View>
                  )}
                  {item.outcomeNote && (
                    <View style={styles.outcomeNoteBlock}>
                      <Text style={styles.outcomeNoteTitle}>📝 خلاصه صورت‌جلسه:</Text>
                      <Text style={styles.outcomeNoteText}>{item.outcomeNote}</Text>
                    </View>
                  )}
                  {item.formData && Object.keys(item.formData).length > 0 && (
                    <View style={styles.customFieldsBlock}>
                      <Text style={styles.outcomeNoteTitle}>📋 اطلاعات تکمیلی:</Text>
                      {Object.entries(item.formData).map(([k, v]: any) => (
                        <Text key={k} style={styles.customFieldsText}>{k}: {v}</Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* Actions row */}
                <View style={styles.meetingActionsRow}>
                  {canCancel && (
                    <TouchableOpacity
                      style={[styles.meetingActionBtn, { borderColor: theme.colors.error, backgroundColor: theme.colors.errorContainer + '10' }]}
                      onPress={() => triggerCancel(item.id)}
                    >
                      <Text style={[styles.meetingActionBtnText, { color: theme.colors.error }]}>لغو جلسه</Text>
                    </TouchableOpacity>
                  )}
                  {canReschedule && (
                    <TouchableOpacity
                      style={[styles.meetingActionBtn, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer + '10' }]}
                      onPress={() => triggerReschedule(item)}
                    >
                      <Text style={[styles.meetingActionBtnText, { color: theme.colors.primary }]}>جابه‌جایی زمان</Text>
                    </TouchableOpacity>
                  )}
                  {canWriteOutcome && (
                    <TouchableOpacity
                      style={[styles.meetingActionBtn, { borderColor: '#0d9488', backgroundColor: '#ccfbf140' }]}
                      onPress={() => triggerOutcome(item.id)}
                    >
                      <Text style={[styles.meetingActionBtnText, { color: '#0d9488' }]}>ثبت صورت‌جلسه</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
    typesContainer: {
      marginVertical: 4,
    },
    typeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 6,
    },
    typeBadgeText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11.5,
      color: theme.colors.secondary,
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
    managerSelectRow: {
      marginVertical: 4,
    },
    roleHostBanner: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryContainer + '10',
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
      padding: 10,
      borderRadius: theme.borderRadius.md,
      gap: 8,
    },
    roleHostText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 11.5,
      color: theme.colors.primary,
      flex: 1,
      textAlign: 'right',
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
    slotsGrid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 6,
      marginVertical: 4,
    },
    slotCard: {
      width: (Dimensions.get('window').width - 32 - 12) / 2,
      paddingVertical: 8,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.border + '50',
      alignItems: 'center',
      justifyContent: 'center',
    },
    slotCardDisabled: {
      backgroundColor: theme.colors.surfaceContainerLow + '90',
      borderColor: theme.colors.border + '20',
      opacity: 0.6,
    },
    slotText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 12.5,
      color: theme.colors.onSurface,
    },
    slotReasonText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 9,
      color: theme.colors.error,
      marginTop: 2,
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    helperText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      color: theme.colors.secondary,
      fontSize: 11.5,
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
      marginTop: 16,
      marginBottom: 20,
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
      fontSize: 11.5,
      color: theme.colors.secondary,
      textAlign: 'right',
      flex: 1,
    },
    outcomeNoteBlock: {
      backgroundColor: theme.colors.surfaceContainerLow,
      padding: 8,
      borderRadius: theme.borderRadius.md,
      marginTop: 6,
      borderRightWidth: 3,
      borderRightColor: '#0d9488',
    },
    customFieldsBlock: {
      backgroundColor: theme.colors.surfaceContainerLow,
      padding: 8,
      borderRadius: theme.borderRadius.md,
      marginTop: 6,
      borderRightWidth: 3,
      borderRightColor: theme.colors.primary,
    },
    outcomeNoteTitle: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      textAlign: 'right',
      marginBottom: 3,
    },
    outcomeNoteText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      color: theme.colors.secondary,
      textAlign: 'right',
    },
    customFieldsText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 10.5,
      color: theme.colors.secondary,
      textAlign: 'right',
    },
    meetingActionsRow: {
      flexDirection: 'row-reverse',
      gap: 8,
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '15',
      paddingTop: 8,
    },
    meetingActionBtn: {
      flex: 1,
      paddingVertical: 6,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    meetingActionBtnText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
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

      {/* Confirmation and dynamic fields Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
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
                style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="شرح مختصری در رابطه با اهداف جلسه..."
                placeholderTextColor={theme.colors.secondary + '70'}
                multiline
                value={meetingDesc}
                onChangeText={setMeetingDesc}
              />

              {/* Dynamic form builder inputs */}
              {selectedType?.fields && (selectedType.fields as any[]).map((f) => (
                <View key={f.name}>
                  <Text style={styles.inputLabel}>
                    {f.label} {f.required && <Text style={{ color: theme.colors.error }}>*</Text>}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={f.placeholder || f.label}
                    placeholderTextColor={theme.colors.secondary + '70'}
                    value={dynamicFields[f.name] || ''}
                    onChangeText={(val) => setDynamicFields((prev) => ({ ...prev, [f.name]: val }))}
                  />
                </View>
              ))}

              <Text style={styles.inputLabel}>اسامی سایر شرکت‌کنندگان (جدا شده با کاما - اختیاری)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="مثال: احمدی, صادقی"
                placeholderTextColor={theme.colors.secondary + '70'}
                value={attendeesInput}
                onChangeText={setAttendeesInput}
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
          </ScrollView>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        visible={reschedulingMeeting !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReschedulingMeeting(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmContent, { maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.confirmTitle}>انتخاب زمان جدید جابه‌جایی</Text>

              <Text style={styles.sectionTitle}>۱. انتخاب تاریخ جدید</Text>
              <View style={styles.datesContainer}>
                {dates.map((d) => {
                  const isSelected = rescheduleDate === d.isoStr
                  return (
                    <TouchableOpacity
                      key={d.isoStr}
                      style={[
                        styles.dateCard,
                        isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                      ]}
                      onPress={() => setRescheduleDate(d.isoStr)}
                    >
                      <Text style={[styles.dateDayName, isSelected && { color: '#fff' }]}>{d.dayName}</Text>
                      <Text style={[styles.dateJalali, isSelected && { color: '#fff', fontWeight: 'bold' }]}>{d.jalaliStr}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <Text style={styles.sectionTitle}>۲. اسلات‌های زمانی خالی</Text>
              {rescheduleSlotsLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
              ) : rescheduleSlots.length > 0 ? (
                <View style={styles.slotsGrid}>
                  {rescheduleSlots.map((slot) => {
                    const isSelected = selectedRescheduleSlot === slot.time
                    const isAvailable = slot.available
                    return (
                      <TouchableOpacity
                        key={slot.time}
                        style={[
                          styles.slotCard,
                          isSelected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                          !isAvailable && styles.slotCardDisabled,
                        ]}
                        disabled={!isAvailable}
                        onPress={() => setSelectedRescheduleSlot(slot.time)}
                      >
                        <Text style={[styles.slotText, isSelected && { color: '#fff', fontWeight: '700' }, !isAvailable && { color: '#a3a3a3' }]}>
                          {slot.time}
                        </Text>
                        {!isAvailable && (
                          <Text style={styles.slotReasonText} numberOfLines={1}>
                            {slot.reason || 'شلوغ'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ) : (
                <Text style={styles.helperText}>هیچ اسلات زمانی برای تاریخ جدید یافت نشد.</Text>
              )}

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setReschedulingMeeting(null)}
                >
                  <Text style={[styles.tabText, { fontWeight: '700' }]}>انصراف</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, (!selectedRescheduleSlot || !rescheduleDate) && { opacity: 0.5 }]}
                  disabled={!selectedRescheduleSlot || !rescheduleDate}
                  onPress={handleRescheduleSubmit}
                >
                  <Text style={[styles.actionBtnText]}>تایید جابه‌جایی</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Text Input Modal (Reason or Outcome Note) */}
      <Modal
        visible={textModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTextModalVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContent}>
            <Text style={styles.confirmTitle}>{textModalTitle}</Text>
            <Text style={styles.inputLabel}>{textModalLabel}</Text>
            <TextInput
              style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
              multiline
              value={textModalValue}
              onChangeText={setTextModalValue}
              placeholder="اینجا بنویسید..."
              placeholderTextColor={theme.colors.secondary + '70'}
            />
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTextModalVisible(false)}
              >
                <Text style={[styles.tabText, { fontWeight: '700' }]}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => textModalSubmit(textModalValue)}
              >
                <Text style={[styles.actionBtnText]}>تایید و ثبت</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  )
}

export default MeetingsScreen
