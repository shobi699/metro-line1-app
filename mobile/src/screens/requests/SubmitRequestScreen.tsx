import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { ScreenWrapper } from '../../shared/ScreenWrapper'
import { useTheme } from '../../shared/ThemeProvider'
import { useAuthStore } from '../../stores/auth'
import { API_URL } from '../../shared/config'

export function SubmitRequestScreen({ navigation }: any) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)
  
  const [types, setTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // form state
  const [typeId, setTypeId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  // Using simple dates for now (today)
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await fetch(`${API_URL}/requests/types`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        const json = await res.json()
        setTypes(json.data || [])
        if (json.data?.length > 0) {
          setTypeId(json.data[0].id)
        }
      } catch {
        Alert.alert('خطا', 'عدم ارتباط با سرور')
      } finally {
        setLoading(false)
      }
    }
    loadTypes()
  }, [accessToken])

  const handleSubmit = async () => {
    if (!typeId || !amount) {
      Alert.alert('خطا', 'لطفاً مقادیر را پر کنید')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          typeId,
          amount: parseFloat(amount),
          fromDate: new Date(fromDate).toISOString(),
          toDate: new Date(toDate).toISOString(),
          reason
        })
      })
      const data = await res.json()
      if (res.ok) {
        Alert.alert('موفق', 'درخواست با موفقیت ثبت شد')
        navigation.goBack()
      } else {
        Alert.alert('خطا', data.error?.toString() || 'خطا در ثبت درخواست')
      }
    } catch {
      Alert.alert('خطا', 'مشکل در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  const styles = StyleSheet.create({
    label: { fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.onSurface, marginBottom: 8, marginTop: 16 },
    input: {
      backgroundColor: theme.colors.surfaceContainer,
      color: theme.colors.onSurface,
      borderRadius: 8,
      padding: 12,
      fontFamily: theme.typography.bodyMd.fontFamily,
      textAlign: 'right'
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 24
    },
    btnText: { color: theme.colors.onPrimary, fontFamily: theme.typography.bodyMd.fontFamily },
    typeBtn: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 8,
      alignItems: 'center'
    },
    typeBtnActive: {
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderColor: theme.colors.primary
    },
    typeText: { fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.onSurface }
  })

  if (loading) {
    return (
      <ScreenWrapper title="ثبت درخواست" navigation={navigation}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    )
  }

  const selectedType = types.find(t => t.id === typeId)

  return (
    <ScreenWrapper title="ثبت مرخصی / اضافه‌کار" navigation={navigation} showBack>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.label}>نوع درخواست</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {types.map(t => (
            <TouchableOpacity 
              key={t.id} 
              style={[styles.typeBtn, typeId === t.id && styles.typeBtnActive, { width: '48%' }]}
              onPress={() => setTypeId(t.id)}
            >
              <Text style={styles.typeText}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>تاریخ شروع (میلادی)</Text>
        <TextInput style={styles.input} value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>تاریخ پایان (میلادی)</Text>
        <TextInput style={styles.input} value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>
          مقدار درخواستی ({selectedType?.unit === 'days' ? 'روز' : selectedType?.unit === 'hours' ? 'ساعت' : 'عدد'})
        </Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="مثلاً 4" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>توضیحات (اختیاری)</Text>
        <TextInput style={[styles.input, { minHeight: 80 }]} value={reason} onChangeText={setReason} multiline placeholder="علت درخواست..." placeholderTextColor={theme.colors.onSurfaceVariant} />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.btnText}>ثبت درخواست</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  )
}

