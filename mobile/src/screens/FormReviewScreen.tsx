import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CheckCircle2, XCircle, AlertCircle, ArrowRightLeft, User, Clock, FileText } from 'lucide-react-native'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper as ScreenLayout } from '../shared/ScreenWrapper'
import { useFormsStore } from '../stores/forms'
import { toFa, getJalaliDateString } from '../shared/jalali'
import dayjs from 'dayjs'

export function FormReviewScreen() {
  const route = useRoute<any>()
  const submissionId = route.params?.submissionId
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  const { theme } = useTheme()
  const { getSubmissionDetails, submitFormAction } = useFormsStore()

  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Action Modal State
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'request_changes' | 'refer' | null>(null)
  const [note, setNote] = useState('')
  const [referTo, setReferTo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (submissionId) {
      loadDetails()
    }
  }, [submissionId])

  const loadDetails = async () => {
    setLoading(true)
    const data = await getSubmissionDetails(submissionId)
    setDetails(data)
    setLoading(false)
  }

  const handleAction = async () => {
    if (!selectedAction) return
    if (selectedAction === 'refer' && !referTo) {
      Alert.alert('خطا', 'لطفاً نقش گیرنده ارجاع را مشخص کنید.')
      return
    }

    setSubmitting(true)
    const res = await submitFormAction(submissionId, {
      decision: selectedAction,
      note,
      referTo: selectedAction === 'refer' ? referTo : undefined
    })
    setSubmitting(false)

    if (res.success) {
      Alert.alert('موفق', 'اقدام شما با موفقیت ثبت شد.', [
        { text: 'باشه', onPress: () => navigation.goBack() }
      ])
    } else {
      Alert.alert('خطا', res.error || 'خطایی رخ داد.')
    }
  }

  const openActionModal = (action: 'approve' | 'reject' | 'request_changes' | 'refer') => {
    setSelectedAction(action)
    setNote('')
    setReferTo('')
    setActionModalVisible(true)
  }

  const renderFieldValue = (key: string, value: any) => {
    // Basic rendering of values
    if (typeof value === 'boolean') return value ? 'بله' : 'خیر'
    if (value === null || value === undefined || value === '') return '---'
    return String(value)
  }

  if (loading || !details) {
    return (
      <ScreenLayout title="بررسی فرم" showBack>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout title={`درخواست ${toFa(details.submissionNo)}`} showBack>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Header Info */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{details.template?.title}</Text>
          <View style={styles.infoRow}>
            <User size={16} color={theme.colors.secondary} />
            <Text style={[styles.infoText, { color: theme.colors.secondary }]}>
              متقاضی: {details.submitter?.name}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color={theme.colors.secondary} />
            <Text style={[styles.infoText, { color: theme.colors.secondary }]}>
              {(() => {
                if (!details.submittedAt) return 'نامشخص'
                const d = new Date(details.submittedAt)
                const dateStr = getJalaliDateString(d).replace(/-/g, '/')
                const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                return `ثبت: ${toFa(`${dateStr} - ${timeStr}`)}`
              })()}
            </Text>
          </View>
        </View>

        {/* Form Data */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <FileText size={18} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>اطلاعات فرم</Text>
          </View>
          
          {Object.entries(details.data || {}).map(([key, value]) => {
            // Find field label if schema is available
            const fieldDef = details.version?.schema?.fields?.find((f: any) => f.name === key)
            const label = fieldDef?.label || key
            return (
              <View key={key} style={[styles.fieldRow, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.fieldLabel, { color: theme.colors.secondary }]}>{label}</Text>
                <Text style={[styles.fieldValue, { color: theme.colors.text }]}>{renderFieldValue(key, value)}</Text>
              </View>
            )
          })}
        </View>

        {/* Actions Grid */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#10b981' }]} // green
            onPress={() => openActionModal('approve')}
          >
            <CheckCircle2 size={24} color="#fff" />
            <Text style={styles.actionBtnText}>تایید</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} // red
            onPress={() => openActionModal('reject')}
          >
            <XCircle size={24} color="#fff" />
            <Text style={styles.actionBtnText}>رد</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} // amber
            onPress={() => openActionModal('request_changes')}
          >
            <AlertCircle size={24} color="#fff" />
            <Text style={styles.actionBtnText}>نیاز به اصلاح</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#6366f1' }]} // indigo
            onPress={() => openActionModal('refer')}
          >
            <ArrowRightLeft size={24} color="#fff" />
            <Text style={styles.actionBtnText}>ارجاع</Text>
          </TouchableOpacity>
        </View>

        {/* Action Modal */}
        <Modal
          visible={actionModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setActionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {selectedAction === 'approve' && 'تایید درخواست'}
                {selectedAction === 'reject' && 'رد درخواست'}
                {selectedAction === 'request_changes' && 'درخواست اصلاح'}
                {selectedAction === 'refer' && 'ارجاع به نقش دیگر'}
              </Text>
              
              {selectedAction === 'refer' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.text }]}>ارجاع به (کد نقش):</Text>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
                    value={referTo}
                    onChangeText={setReferTo}
                    placeholder="مثال: safety, hr"
                    placeholderTextColor={theme.colors.secondary}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>توضیحات (اختیاری):</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card, height: 80, textAlignVertical: 'top' }]}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  placeholder="علت رد یا نکات تکمیلی..."
                  placeholderTextColor={theme.colors.secondary}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: theme.colors.surfaceVariant, flex: 1 }]}
                  onPress={() => setActionModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={[styles.modalBtnText, { color: theme.colors.primary }]}>انصراف</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: theme.colors.primary, flex: 2 }]}
                  onPress={handleAction}
                  disabled={submitting}
                >
                  <Text style={[styles.modalBtnText, { color: theme.colors.background }]}>
                    {submitting ? 'در حال ثبت...' : 'ثبت اقدام'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 18,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Vazirmatn',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
  },
  fieldRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fieldLabel: {
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 14,
    flex: 1,
  },
  fieldValue: {
    fontFamily: 'Vazirmatn',
    fontSize: 14,
    flex: 1,
    textAlign: 'left',
  },
  actionsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  actionBtn: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 14,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
  },
  modalTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Vazirmatn',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 14,
  }
})
