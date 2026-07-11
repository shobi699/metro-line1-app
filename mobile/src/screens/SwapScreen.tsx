import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Alert, TextInput, Modal, FlatList } from 'react-native'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../shared/ThemeProvider'
import { API_URL } from '../shared/config'
import { MaterialIcons } from '@expo/vector-icons'

interface ShiftOption {
  id: string
  date: string
  code: string
}

interface UserOption {
  id: string
  name: string
  personnelCode: string
}

interface SwapRequest {
  id: string
  status: string
  note: string | null
  createdAt: string
  requester: { id: string; name: string }
  target: { id: string; name: string }
  sourceShift: { id: string; date: string; code: string }
  targetShift: { id: string; date: string; code: string }
  violations?: { rule: string; message: string }[]
}

const SHIFT_LABELS: Record<string, string> = {
  morning: 'صبح',
  evening: 'عصر',
  night: 'شب',
  off: 'استراحت (OFF)',
}

export default function SwapScreen({ navigation }: any) {
  const { accessToken, user: currentUser } = useAuthStore()
  const { theme } = useTheme()
  
  const [activeTab, setActiveTab] = useState<'inbox' | 'create'>('inbox')
  const [requests, setRequests] = useState<SwapRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Creation State
  const [myShifts, setMyShifts] = useState<ShiftOption[]>([])
  const [colleagues, setColleagues] = useState<UserOption[]>([])
  const [selectedColleagueId, setSelectedColleagueId] = useState('')
  const [colleagueShifts, setColleagueShifts] = useState<ShiftOption[]>([])
  const [selectedMyShiftId, setSelectedMyShiftId] = useState('')
  const [selectedColleagueShiftId, setSelectedColleagueShiftId] = useState('')
  const [note, setNote] = useState('')
  const [creating, setCreating] = useState(false)
  const [violations, setViolations] = useState<{ rule: string; message: string }[]>([])
  const [fetchingColleagueShifts, setFetchingColleagueShifts] = useState(false)

  const [colleagueModalVisible, setColleagueModalVisible] = useState(false)
  const [myShiftModalVisible, setMyShiftModalVisible] = useState(false)
  const [colleagueShiftModalVisible, setColleagueShiftModalVisible] = useState(false)

  useEffect(() => {
    if (activeTab === 'inbox') {
      fetchInbox()
    } else {
      loadInitialData()
    }
  }, [activeTab])

  useEffect(() => {
    if (selectedColleagueId) {
      fetchColleagueShifts()
    } else {
      setColleagueShifts([])
    }
  }, [selectedColleagueId])

  const toFa = (numStr: string | number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return numStr.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)])
  }

  const formatJalali = (dateStr: string) => {
    // Simply converting format for mobile view
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('fa-IR')
    } catch {
      return dateStr
    }
  }

  const fetchInbox = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/swap-requests/inbox`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setRequests(json.data || [])
      } else {
        Alert.alert('خطا', 'مشکل در بارگذاری صندق ورودی تعویض شیفت')
      }
    } catch (e) {
      Alert.alert('خطا', 'مشکل در برقراری ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [myShiftsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/shifts/me`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API_URL}/users?pageSize=100`, { headers: { Authorization: `Bearer ${accessToken}` } })
      ])

      if (myShiftsRes.ok && usersRes.ok) {
        const myShiftsJson = await myShiftsRes.json()
        const usersJson = await usersRes.json()

        setMyShifts((myShiftsJson.data || []).filter((s: ShiftOption) => s.code !== 'off'))
        setColleagues((usersJson.data?.users || []).filter((u: UserOption) => u.id !== currentUser?.id))
      }
    } catch (e) {
      Alert.alert('خطا', 'مشکل در بارگذاری اطلاعات شیفت‌ها')
    } finally {
      setLoading(false)
    }
  }

  const fetchColleagueShifts = async () => {
    setFetchingColleagueShifts(true)
    try {
      const res = await fetch(`${API_URL}/shifts`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        const filtered = (json.data || []).filter(
          (s: ShiftOption & { user?: { id: string } }) => s.user?.id === selectedColleagueId && s.code !== 'off'
        )
        setColleagueShifts(filtered)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFetchingColleagueShifts(false)
    }
  }

  const handleAccept = async (swapRequestId: string) => {
    Alert.alert(
      'تایید جابه‌جایی',
      'آیا از تایید و پذیرش این جابه‌جایی شیفت مطمئن هستید؟ پس از تایید شما، درخواست جهت تایید نهایی برای سوپروایزر ارسال می‌گردد.',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'بله، تایید می‌کنم',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/swap-requests/accept`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${accessToken}`
                },
                body: JSON.stringify({ swapRequestId })
              })

              if (res.ok) {
                Alert.alert('موفقیت', 'جابه‌جایی شیفت توسط شما تایید شد.')
                fetchInbox()
              } else {
                const data = await res.json()
                Alert.alert('خطا', data.error || 'مشکلی در پذیرش درخواست پیش آمد.')
              }
            } catch (e) {
              Alert.alert('خطا', 'مشکل در برقراری ارتباط با سرور')
            }
          }
        }
      ]
    )
  }

  const handleCreateRequest = async () => {
    setViolations([])
    if (!selectedMyShiftId || !selectedColleagueId || !selectedColleagueShiftId) {
      Alert.alert('خطا', 'لطفاً تمامی فیلدهای الزامی را تکمیل کنید.')
      return
    }

    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/swap-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          targetUserId: selectedColleagueId,
          sourceShiftId: selectedMyShiftId,
          targetShiftId: selectedColleagueShiftId,
          note: note || undefined
        })
      })

      const json = await res.json()

      if (res.ok) {
        Alert.alert('موفقیت', 'درخواست تعویض شیفت شما با موفقیت ثبت و برای همکار ارسال شد.')
        setSelectedColleagueId('')
        setSelectedMyShiftId('')
        setSelectedColleagueShiftId('')
        setNote('')
        setActiveTab('inbox')
      } else if (res.status === 422 && json.violations) {
        setViolations(json.violations)
        Alert.alert('خطای قوانین شیفت کاری', 'امکان ثبت درخواست به علت نقض قوانین کاری وجود ندارد. جزئیات را در پایین فرم مشاهده فرمایید.')
      } else {
        Alert.alert('خطا', json.error || 'خطا در ثبت درخواست جابه‌جایی')
      }
    } catch (e) {
      Alert.alert('خطا', 'مشکل در برقراری ارتباط با سرور')
    } finally {
      setCreating(false)
    }
  }

  return (
    <ScreenWrapper title="درخواست تعویض شیفت" showBack onBack={() => navigation.goBack()}>
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tabBtn, activeTab === 'inbox' && s.tabActive]} onPress={() => setActiveTab('inbox')}>
          <Text style={[s.tabText, activeTab === 'inbox' && s.tabTextActive]}>صندوق ورودی</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, activeTab === 'create' && s.tabActive]} onPress={() => setActiveTab('create')}>
          <Text style={[s.tabText, activeTab === 'create' && s.tabTextActive]}>ثبت درخواست جدید</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'inbox' ? (
          loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#0f172a" />
          ) : requests.length === 0 ? (
            <Text style={s.emptyText}>هیچ درخواست جابه‌جایی شیفتی در صندوق ورودی شما نیست.</Text>
          ) : (
            requests.map(req => (
              <View key={req.id} style={s.reqCard}>
                <View style={s.reqHeader}>
                  <Text style={s.requesterName}>
                    {req.requester.id === currentUser?.id ? `درخواست شما به: ${req.target.name}` : `درخواست جابه‌جایی از: ${req.requester.name}`}
                  </Text>
                  <View style={[s.statusBadge, req.status === 'pending' ? s.badgePending : req.status === 'approved' ? s.badgeApproved : s.badgeRejected]}>
                    <Text style={s.badgeText}>
                      {req.status === 'pending' ? 'در انتظار' : req.status === 'accepted' ? 'تایید همکار' : req.status === 'approved' ? 'تایید نهایی' : 'رد شده'}
                    </Text>
                  </View>
                </View>

                <View style={s.shiftExchangeBox}>
                  <View style={s.shiftExchangeCol}>
                    <Text style={s.shiftExchangeTitle}>شیفت مبدأ (من)</Text>
                    <Text style={s.shiftExchangeDate}>{formatJalali(req.sourceShift.date)}</Text>
                    <Text style={s.shiftExchangeCode}>{SHIFT_LABELS[req.sourceShift.code] || req.sourceShift.code}</Text>
                  </View>
                  <MaterialIcons name="compare-arrows" size={24} color="#64748b" />
                  <View style={s.shiftExchangeCol}>
                    <Text style={s.shiftExchangeTitle}>شیفت مقصد (همکار)</Text>
                    <Text style={s.shiftExchangeDate}>{formatJalali(req.targetShift.date)}</Text>
                    <Text style={s.shiftExchangeCode}>{SHIFT_LABELS[req.targetShift.code] || req.targetShift.code}</Text>
                  </View>
                </View>

                {req.note && (
                  <View style={s.noteBox}>
                    <Text style={s.noteText}>توضیح: {req.note}</Text>
                  </View>
                )}

                {req.status === 'pending' && req.target.id === currentUser?.id && (
                  <TouchableOpacity style={s.acceptBtn} onPress={() => handleAccept(req.id)}>
                    <MaterialIcons name="check" size={16} color="#fff" />
                    <Text style={s.acceptBtnText}>قبول و تایید جابه‌جایی</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )
        ) : (
          <View style={s.formCard}>
            <Text style={s.formTitle}>ایجاد درخواست جدید</Text>

            <Text style={s.label}>۱. انتخاب همکار مورد نظر (طرف جابه‌جایی):</Text>
            <TouchableOpacity style={s.selectBtn} onPress={() => setColleagueModalVisible(true)}>
              <Text style={s.selectBtnText}>
                {selectedColleagueId ? (colleagues.find(c => c.id === selectedColleagueId)?.name || 'همکار انتخاب شده') : 'انتخاب همکار...'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#64748b" />
            </TouchableOpacity>

            <Modal visible={colleagueModalVisible} transparent animationType="slide">
              <View style={s.modalOverlay}>
                <View style={s.modalContent}>
                  <Text style={s.modalTitle}>انتخاب همکار</Text>
                  <FlatList
                    data={colleagues}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={s.modalItem} 
                        onPress={() => {
                          setSelectedColleagueId(item.id)
                          setColleagueModalVisible(false)
                        }}
                      >
                        <Text style={s.modalItemText}>{item.name} (کدملی: {toFa(item.personnelCode)})</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity style={s.modalCloseBtn} onPress={() => setColleagueModalVisible(false)}>
                    <Text style={s.modalCloseText}>بستن</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Text style={s.label}>۲. شیفت خودتان که می‌خواهید واگذار کنید:</Text>
            <TouchableOpacity 
              style={[s.selectBtn, myShifts.length === 0 && { opacity: 0.5 }]} 
              onPress={() => myShifts.length > 0 && setMyShiftModalVisible(true)}
              disabled={myShifts.length === 0}
            >
              <Text style={s.selectBtnText}>
                {selectedMyShiftId ? (
                  (() => {
                    const s = myShifts.find(sh => sh.id === selectedMyShiftId)
                    return s ? `${formatJalali(s.date)} - شیفت ${SHIFT_LABELS[s.code] || s.code}` : 'انتخاب شیفت من...'
                  })()
                ) : 'انتخاب شیفت من...'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#64748b" />
            </TouchableOpacity>

            <Modal visible={myShiftModalVisible} transparent animationType="slide">
              <View style={s.modalOverlay}>
                <View style={s.modalContent}>
                  <Text style={s.modalTitle}>انتخاب شیفت من</Text>
                  <FlatList
                    data={myShifts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={s.modalItem} 
                        onPress={() => {
                          setSelectedMyShiftId(item.id)
                          setMyShiftModalVisible(false)
                        }}
                      >
                        <Text style={s.modalItemText}>{formatJalali(item.date)} - شیفت {SHIFT_LABELS[item.code] || item.code}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity style={s.modalCloseBtn} onPress={() => setMyShiftModalVisible(false)}>
                    <Text style={s.modalCloseText}>بستن</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Text style={s.label}>۳. شیفت همکار که می‌خواهید بردارید:</Text>
            {fetchingColleagueShifts ? (
              <ActivityIndicator size="small" color="#0f172a" style={{ padding: 12 }} />
            ) : (
              <TouchableOpacity 
                style={[s.selectBtn, colleagueShifts.length === 0 && { opacity: 0.5 }]} 
                onPress={() => colleagueShifts.length > 0 && setColleagueShiftModalVisible(true)}
                disabled={colleagueShifts.length === 0}
              >
                <Text style={s.selectBtnText}>
                  {selectedColleagueShiftId ? (
                    (() => {
                      const s = colleagueShifts.find(sh => sh.id === selectedColleagueShiftId)
                      return s ? `${formatJalali(s.date)} - شیفت ${SHIFT_LABELS[s.code] || s.code}` : 'انتخاب شیفت همکار...'
                    })()
                  ) : selectedColleagueId ? 'انتخاب شیفت همکار...' : 'ابتدا همکار را انتخاب کنید'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#64748b" />
              </TouchableOpacity>
            )}

            <Modal visible={colleagueShiftModalVisible} transparent animationType="slide">
              <View style={s.modalOverlay}>
                <View style={s.modalContent}>
                  <Text style={s.modalTitle}>انتخاب شیفت همکار</Text>
                  <FlatList
                    data={colleagueShifts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={s.modalItem} 
                        onPress={() => {
                          setSelectedColleagueShiftId(item.id)
                          setColleagueShiftModalVisible(false)
                        }}
                      >
                        <Text style={s.modalItemText}>{formatJalali(item.date)} - شیفت {SHIFT_LABELS[item.code] || item.code}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity style={s.modalCloseBtn} onPress={() => setColleagueShiftModalVisible(false)}>
                    <Text style={s.modalCloseText}>بستن</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Text style={s.label}>۴. توضیحات (اختیاری):</Text>
            <TextInput 
              style={[s.input, s.textarea]}
              placeholder="مثال: تعویض به علت کارهای شخصی..."
              multiline
              value={note}
              onChangeText={setNote}
            />

            {violations.length > 0 && (
              <View style={s.violationsContainer}>
                <Text style={s.violationsTitle}>قوانین شیفت نقض شده است:</Text>
                {violations.map((v, i) => (
                  <View key={i} style={s.violationRow}>
                    <MaterialIcons name="error-outline" size={16} color="#ef4444" />
                    <Text style={s.violationText}>{v.message}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={[s.submitBtn, creating && { opacity: 0.7 }]} onPress={handleCreateRequest} disabled={creating}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>ارسال درخواست جابه‌جایی</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff', direction: 'rtl' },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#0f172a' },
  tabText: { fontFamily: 'Vazirmatn-Medium', fontSize: 13, color: '#64748b' },
  tabTextActive: { color: '#0f172a', fontFamily: 'Vazirmatn-Bold' },

  reqCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, direction: 'rtl' },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  requesterName: { fontFamily: 'Vazirmatn-Bold', fontSize: 14, color: '#1e293b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgePending: { backgroundColor: '#fef3c7' },
  badgeApproved: { backgroundColor: '#dcfce7' },
  badgeRejected: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 11, fontFamily: 'Vazirmatn-Medium', color: '#1e293b' },

  shiftExchangeBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 12 },
  shiftExchangeCol: { alignItems: 'center', flex: 1 },
  shiftExchangeTitle: { fontFamily: 'Vazirmatn', fontSize: 11, color: '#64748b', marginBottom: 4 },
  shiftExchangeDate: { fontFamily: 'Vazirmatn-Bold', fontSize: 13, color: '#334155' },
  shiftExchangeCode: { fontFamily: 'Vazirmatn-Medium', fontSize: 12, color: '#0f172a', marginTop: 2 },

  noteBox: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 6, marginBottom: 12 },
  noteText: { fontFamily: 'Vazirmatn', fontSize: 12, color: '#475569', textAlign: 'right' },

  acceptBtn: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  acceptBtnText: { color: '#fff', fontFamily: 'Vazirmatn-Bold', fontSize: 13, marginRight: 6 },

  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, direction: 'rtl' },
  formTitle: { fontFamily: 'Vazirmatn-Bold', fontSize: 16, color: '#1e293b', marginBottom: 16, textAlign: 'right' },
  label: { fontFamily: 'Vazirmatn-Medium', fontSize: 13, color: '#475569', marginBottom: 8, marginTop: 12, textAlign: 'right' },
  
  selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, backgroundColor: '#f8fafc', marginBottom: 12 },
  selectBtnText: { fontFamily: 'Vazirmatn', fontSize: 14, color: '#334155' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%', direction: 'rtl' },
  modalTitle: { fontFamily: 'Vazirmatn-Bold', fontSize: 16, color: '#1e293b', marginBottom: 16, textAlign: 'right' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalItemText: { fontFamily: 'Vazirmatn', fontSize: 14, color: '#334155', textAlign: 'right' },
  modalCloseBtn: { marginTop: 16, padding: 12, backgroundColor: '#0f172a', borderRadius: 8, alignItems: 'center' },
  modalCloseText: { fontFamily: 'Vazirmatn-Bold', fontSize: 14, color: '#fff' },

  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontFamily: 'Vazirmatn', fontSize: 14, textAlign: 'right' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontFamily: 'Vazirmatn-Bold', fontSize: 14 },

  violationsContainer: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 12, marginVertical: 12 },
  violationsTitle: { fontFamily: 'Vazirmatn-Bold', fontSize: 13, color: '#b91c1c', marginBottom: 6, textAlign: 'right' },
  violationRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, direction: 'rtl' },
  violationText: { fontFamily: 'Vazirmatn', fontSize: 12, color: '#991b1b', marginRight: 6 },

  emptyText: { fontFamily: 'Vazirmatn', fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 40 }
})
