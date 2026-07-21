import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, Modal } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { useTheme } from '../shared/ThemeProvider'
import { MaterialIcons } from '@expo/vector-icons'

interface EquipmentItem {
  id: string
  name: string
  serialNo: string
  assignedDate: string
  status: 'active' | 'damaged' | 'lost'
  category: string
}

interface ActionHistory {
  id: string
  itemName: string
  action: 'assign' | 'return' | 'report_damaged' | 'report_lost'
  date: string
  signature: string | null
}

const defaultItems: EquipmentItem[] = [
  { id: 'eq-1', name: 'بی‌سیم دستی تترا Hytera', serialNo: 'TETRA-908123', assignedDate: '۱۴۰۴/۰۵/۱۰', status: 'active', category: 'radio' },
  { id: 'eq-2', name: 'لباس فرم کامل زمستانه (سایز L)', serialNo: 'UNIF-2026-L', assignedDate: '۱۴۰۴/۰۸/۱۵', status: 'active', category: 'uniform' },
  { id: 'eq-3', name: 'چراغ قوه عملیاتی ضد انفجار', serialNo: 'FLSH-30219', assignedDate: '۱۴۰۴/۰۵/۱۰', status: 'active', category: 'safety' },
  { id: 'eq-4', name: 'کارت پرسنلی مگنتیک خط ۱', serialNo: 'ID-00901', assignedDate: '۱۴۰۳/۱۲/۰۱', status: 'active', category: 'id_card' },
]

const defaultHistory: ActionHistory[] = [
  { id: 'hist-1', itemName: 'کارت پرسنلی مگنتیک خط ۱', action: 'assign', date: '۱۴۰۳/۱۲/۰۱', signature: 'امضا شده دیجیتال' },
  { id: 'hist-2', itemName: 'چراغ قوه عملیاتی ضد انفجار', action: 'assign', date: '۱۴۰۴/۰۵/۱۰', signature: 'امضا شده دیجیتال' },
  { id: 'hist-3', itemName: 'بی‌سیم دستی تترا Hytera', action: 'assign', date: '۱۴۰۴/۰۵/۱۰', signature: 'امضا شده دیجیتال' },
  { id: 'hist-4', itemName: 'لباس فرم کامل زمستانه (سایز L)', action: 'assign', date: '۱۴۰۴/۰۸/۱۵', signature: 'امضا شده دیجیتال' },
]

export default function EquipmentScreen({ navigation }: any) {
  const { theme } = useTheme()
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [history, setHistory] = useState<ActionHistory[]>([])
  const [activeTab, setActiveTab] = useState<'my-items' | 'request-item' | 'history'>('my-items')
  
  // Reporting Damage/Lost
  const [reportingItem, setReportingItem] = useState<EquipmentItem | null>(null)
  const [reportType, setReportType] = useState<'damaged' | 'lost' | null>(null)
  const [reportDescription, setReportDescription] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  // Request Form
  const [reqCategory, setReqCategory] = useState('uniform')
  const [reqName, setReqName] = useState('')
  const [reqReason, setReqReason] = useState('')
  const [reqSubmitting, setReqSubmitting] = useState(false)

  // Signature (Self Check receipt confirmation)
  const [signatureText, setSignatureText] = useState('')
  const [showSignatureBlock, setShowSignatureBlock] = useState(false)
  const [pendingConfirmItem, setPendingConfirmItem] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const savedItems = await AsyncStorage.getItem('metro_eq_items')
      const savedHistory = await AsyncStorage.getItem('metro_eq_hist')

      if (savedItems) setItems(JSON.parse(savedItems))
      else {
        setItems(defaultItems)
        await AsyncStorage.setItem('metro_eq_items', JSON.stringify(defaultItems))
      }

      if (savedHistory) setHistory(JSON.parse(savedHistory))
      else {
        setHistory(defaultHistory)
        await AsyncStorage.setItem('metro_eq_hist', JSON.stringify(defaultHistory))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const toFa = (numStr: string | number) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
    return numStr.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)])
  }

  const handleReportSubmit = async () => {
    if (!reportingItem || !reportType) return
    setSubmittingReport(true)

    try {
      const updatedItems = items.map(item => {
        if (item.id === reportingItem.id) {
          return { ...item, status: reportType }
        }
        return item
      })
      setItems(updatedItems)
      await AsyncStorage.setItem('metro_eq_items', JSON.stringify(updatedItems))

      const newHistoryItem: ActionHistory = {
        id: `hist-${Date.now()}`,
        itemName: reportingItem.name,
        action: reportType === 'damaged' ? 'report_damaged' : 'report_lost',
        date: new Date().toLocaleDateString('fa-IR'),
        signature: null
      }
      const updatedHistory = [newHistoryItem, ...history]
      setHistory(updatedHistory)
      await AsyncStorage.setItem('metro_eq_hist', JSON.stringify(updatedHistory))

      Alert.alert('ثبت موفق', 'گزارش خرابی/مفقودی با موفقیت ثبت شد.')
      setReportingItem(null)
      setReportType(null)
      setReportDescription('')
    } catch (e) {
      Alert.alert('خطا', 'مشکلی رخ داد.')
    } finally {
      setSubmittingReport(false)
    }
  }

  const handleRequestSubmit = async () => {
    if (!reqName || !reqReason) {
      Alert.alert('خطا', 'لطفا نام تجهیزات و دلیل درخواست را وارد کنید.')
      return
    }
    setReqSubmitting(true)

    try {
      const newItem: EquipmentItem = {
        id: `eq-${Date.now()}`,
        name: reqName,
        serialNo: 'در انتظار تحویل...',
        assignedDate: 'ثبت شده',
        status: 'active',
        category: reqCategory
      }

      const updatedItems = [...items, newItem]
      setItems(updatedItems)
      await AsyncStorage.setItem('metro_eq_items', JSON.stringify(updatedItems))

      Alert.alert('موفقیت', 'درخواست تجهیزات جدید شما با موفقیت ثبت شد.')
      setReqName('')
      setReqReason('')
      setActiveTab('my-items')
    } catch (e) {
      Alert.alert('خطا', 'مشکلی رخ داد.')
    } finally {
      setReqSubmitting(false)
    }
  }

  const confirmReceipt = async () => {
    if (!signatureText) {
      Alert.alert('خطا', 'لطفا نام خود را به عنوان امضا وارد کنید.')
      return
    }

    try {
      const updatedHistory = history.map(h => {
        if (h.id === pendingConfirmItem) {
          return { ...h, signature: signatureText }
        }
        return h
      })
      setHistory(updatedHistory)
      await AsyncStorage.setItem('metro_eq_hist', JSON.stringify(updatedHistory))

      Alert.alert('تایید شد', 'رسید تحویل با موفقیت امضا شد.')
      setShowSignatureBlock(false)
      setSignatureText('')
      setPendingConfirmItem(null)
    } catch (e) {
      Alert.alert('خطا', 'مشکلی در ثبت امضا پیش آمد.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Text style={[s.badge, s.badgeSuccess]}>سالم / در اختیار</Text>
      case 'damaged':
        return <Text style={[s.badge, s.badgeWarning]}>گزارش خرابی</Text>
      case 'lost':
        return <Text style={[s.badge, s.badgeDanger]}>مفقود شده</Text>
      default:
        return null
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'assign': return 'تحویل گرفته شد'
      case 'return': return 'عودت داده شد'
      case 'report_damaged': return 'گزارش خرابی'
      case 'report_lost': return 'گزارش مفقودی'
      default: return action
    }
  }

  return (
    <ScreenWrapper title="تجهیزات انفرادی من" showBack onBack={() => navigation.goBack()}>
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tabBtn, activeTab === 'my-items' && s.tabActive]} onPress={() => setActiveTab('my-items')}>
          <Text style={[s.tabText, activeTab === 'my-items' && s.tabTextActive]}>تجهیزات من</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, activeTab === 'request-item' && s.tabActive]} onPress={() => setActiveTab('request-item')}>
          <Text style={[s.tabText, activeTab === 'request-item' && s.tabTextActive]}>درخواست جدید</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, activeTab === 'history' && s.tabActive]} onPress={() => setActiveTab('history')}>
          <Text style={[s.tabText, activeTab === 'history' && s.tabTextActive]}>تاریخچه و رسیدها</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'my-items' && (
          <View>
            <View style={s.infoBox}>
              <MaterialIcons name="security" size={24} color="#0d9488" />
              <Text style={s.infoText}>راهبر گرامی، مراقبت و همراه داشتن تجهیزات انفرادی ذیل در حین شیفت الزامی و جزو اصول ایمنی می‌باشد.</Text>
            </View>

            {items.map(item => (
              <View key={item.id} style={s.itemCard}>
                <View style={s.itemHeader}>
                  <Text style={s.itemName}>{item.name}</Text>
                  {getStatusBadge(item.status)}
                </View>
                <View style={s.itemDetails}>
                  <Text style={s.detailText}>شماره سریال: {toFa(item.serialNo)}</Text>
                  <Text style={s.detailText}>تاریخ تحویل: {toFa(item.assignedDate)}</Text>
                </View>

                {item.status === 'active' && (
                  <View style={s.cardActions}>
                    <TouchableOpacity style={[s.actionBtn, s.btnAlert]} onPress={() => { setReportingItem(item); setReportType('damaged') }}>
                      <MaterialIcons name="report-problem" size={16} color="#d97706" />
                      <Text style={[s.actionBtnText, { color: '#d97706' }]}>اعلام خرابی</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, s.btnDanger]} onPress={() => { setReportingItem(item); setReportType('lost') }}>
                      <MaterialIcons name="cancel" size={16} color="#dc2626" />
                      <Text style={[s.actionBtnText, { color: '#dc2626' }]}>اعلام مفقودی</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'request-item' && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>فرم درخواست تجهیزات انفرادی جدید</Text>
            
            <Text style={s.label}>دسته‌بندی تجهیزات:</Text>
            <View style={s.row}>
              {['uniform', 'radio', 'safety'].map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[s.catBtn, reqCategory === cat && s.catBtnActive]}
                  onPress={() => setReqCategory(cat)}
                >
                  <Text style={[s.catBtnText, reqCategory === cat && s.catBtnTextActive]}>
                    {cat === 'uniform' ? 'لباس کار' : cat === 'radio' ? 'بیسیم' : 'ایمنی و فنی'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>نام تجهیزات درخواستی:</Text>
            <TextInput 
              style={s.input}
              placeholder="مثال: چراغ قوه شارژی ضدآب"
              value={reqName}
              onChangeText={setReqName}
            />

            <Text style={s.label}>دلیل یا لزوم درخواست:</Text>
            <TextInput 
              style={[s.input, s.textarea]}
              placeholder="توضیح کوتاه..."
              multiline
              value={reqReason}
              onChangeText={setReqReason}
            />

            <TouchableOpacity style={s.submitBtn} onPress={handleRequestSubmit} disabled={reqSubmitting}>
              {reqSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>ارسال درخواست تجهیزات</Text>}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'history' && (
          <View>
            {history.map(h => (
              <View key={h.id} style={s.histCard}>
                <View style={s.histHeader}>
                  <Text style={s.histItemName}>{h.itemName}</Text>
                  <Text style={s.histDate}>{toFa(h.date)}</Text>
                </View>
                <Text style={s.histAction}>عملیات: {getActionLabel(h.action)}</Text>
                
                {h.signature ? (
                  <View style={s.sigBox}>
                    <MaterialIcons name="draw" size={16} color="#059669" />
                    <Text style={s.sigText}>امضا شده توسط: {h.signature}</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={s.confirmBtn} onPress={() => { setPendingConfirmItem(h.id); setShowSignatureBlock(true) }}>
                    <MaterialIcons name="edit" size={16} color="#fff" />
                    <Text style={s.confirmBtnText}>امضای دیجیتال تحویل</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal for Damage/Lost Report */}
      <Modal visible={reportingItem !== null} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>گزارش {reportType === 'damaged' ? 'خرابی' : 'مفقودی'}: {reportingItem?.name}</Text>
            
            <Text style={s.label}>توضیحات و علت حادثه:</Text>
            <TextInput 
              style={[s.input, s.textarea]}
              placeholder="مثال: سقوط از ارتفاع هنگام بازدید قطار..."
              multiline
              value={reportDescription}
              onChangeText={setReportDescription}
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setReportingItem(null)}>
                <Text style={s.modalCancelText}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSubmit} onPress={handleReportSubmit} disabled={submittingReport}>
                {submittingReport ? <ActivityIndicator color="#fff" /> : <Text style={s.modalSubmitText}>ثبت گزارش</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Digital Signature Confirmation Modal */}
      <Modal visible={showSignatureBlock} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>تایید دیجیتال و امضای تحویل</Text>
            <Text style={s.modalDesc}>لطفاً برای تایید قطعی تحویل گرفتن تجهیزات، نام و نام خانوادگی خود را به عنوان امضای دیجیتال وارد نمایید.</Text>
            
            <TextInput 
              style={s.input}
              placeholder="نام و نام خانوادگی..."
              value={signatureText}
              onChangeText={setSignatureText}
            />

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => { setShowSignatureBlock(false); setSignatureText('') }}>
                <Text style={s.modalCancelText}>لغو</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalSubmit} onPress={confirmReceipt}>
                <Text style={s.modalSubmitText}>ثبت امضا</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  infoBox: { flexDirection: 'row', backgroundColor: '#f0fdfa', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center', direction: 'rtl' },
  infoText: { flex: 1, marginRight: 12, fontFamily: 'Vazirmatn', fontSize: 13, color: '#0f766e', lineHeight: 20, textAlign: 'right' },

  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, direction: 'rtl' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemName: { fontFamily: 'Vazirmatn-Bold', fontSize: 15, color: '#1e293b' },
  itemDetails: { gap: 4, marginBottom: 12 },
  detailText: { fontFamily: 'Vazirmatn', fontSize: 12, color: '#64748b', textAlign: 'right' },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1 },
  btnAlert: { borderColor: '#f59e0b20', backgroundColor: '#f59e0b10' },
  btnDanger: { borderColor: '#ef444420', backgroundColor: '#ef444410' },
  actionBtnText: { fontFamily: 'Vazirmatn-Medium', fontSize: 12, marginRight: 4 },

  badge: { fontSize: 11, fontFamily: 'Vazirmatn-Bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  badgeSuccess: { backgroundColor: '#dcfce7', color: '#16a34a' },
  badgeWarning: { backgroundColor: '#fef3c7', color: '#d97706' },
  badgeDanger: { backgroundColor: '#fee2e2', color: '#dc2626' },

  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, direction: 'rtl' },
  formTitle: { fontFamily: 'Vazirmatn-Bold', fontSize: 16, color: '#1e293b', marginBottom: 16, textAlign: 'right' },
  label: { fontFamily: 'Vazirmatn-Medium', fontSize: 13, color: '#475569', marginBottom: 8, marginTop: 12, textAlign: 'right' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontFamily: 'Vazirmatn', fontSize: 14, textAlign: 'right' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  catBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8 },
  catBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  catBtnText: { fontFamily: 'Vazirmatn-Medium', fontSize: 13, color: '#64748b' },
  catBtnTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontFamily: 'Vazirmatn-Bold', fontSize: 14 },

  histCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, direction: 'rtl' },
  histHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  histItemName: { fontFamily: 'Vazirmatn-Bold', fontSize: 14, color: '#1e293b' },
  histDate: { fontFamily: 'Vazirmatn', fontSize: 12, color: '#94a3b8' },
  histAction: { fontFamily: 'Vazirmatn', fontSize: 13, color: '#475569', textAlign: 'right', marginBottom: 8 },
  sigBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', padding: 8, borderRadius: 6 },
  sigText: { fontFamily: 'Vazirmatn-Medium', fontSize: 12, color: '#16a34a', marginRight: 6 },
  confirmBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6 },
  confirmBtnText: { color: '#fff', fontFamily: 'Vazirmatn-Medium', fontSize: 12, marginRight: 6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, direction: 'rtl' },
  modalTitle: { fontFamily: 'Vazirmatn-Bold', fontSize: 16, color: '#1e293b', marginBottom: 16, textAlign: 'right' },
  modalDesc: { fontFamily: 'Vazirmatn', fontSize: 13, color: '#64748b', marginBottom: 16, textAlign: 'right', lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  modalCancelText: { fontFamily: 'Vazirmatn-Medium', fontSize: 14, color: '#475569' },
  modalSubmit: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#0f172a', alignItems: 'center' },
  modalSubmitText: { fontFamily: 'Vazirmatn-Bold', fontSize: 14, color: '#fff' }
})
