import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { MaterialIcons } from '@expo/vector-icons'
import { API_URL } from '../shared/config'
import { useAuthStore } from '../stores/auth'

export default function ChecklistsScreen({ navigation }: any) {
  const { accessToken } = useAuthStore()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [activeTemplate, setActiveTemplate] = useState<any>(null)
  const [formState, setFormState] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)
  
  const [trainId, setTrainId] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/checklists/templates`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const json = await res.json()
      if (res.ok) setTemplates(json.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenTemplate(tpl: any) {
    setActiveTemplate(tpl)
    const initialState: any = {}
    tpl.items.forEach((item: any) => {
      initialState[item.id] = { checked: false, value: '', note: '' }
    })
    setFormState(initialState)
    setTrainId('')
  }

  function updateForm(itemId: string, field: string, value: any) {
    setFormState({
      ...formState,
      [itemId]: { ...formState[itemId], [field]: value }
    })
  }

  async function handleSubmit() {
    // Validate required
    for (const item of activeTemplate.items) {
      if (item.required && item.type === 'boolean' && !formState[item.id].checked) {
        Alert.alert('خطا', `لطفاً مورد "${item.label}" را تایید کنید.`)
        return
      }
      if (item.required && item.type !== 'boolean' && !formState[item.id].value) {
        Alert.alert('خطا', `لطفاً مورد "${item.label}" را تکمیل کنید.`)
        return
      }
    }

    setSubmitting(true)
    let geoLocation = ''
    try {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          const pos = await new Promise<any>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          geoLocation = `${pos.coords.latitude},${pos.coords.longitude}`
        }
      } else {
        const Location = require('expo-location')
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({})
          geoLocation = `${loc.coords.latitude},${loc.coords.longitude}`
        }
      }
    } catch (e) {
      console.log('Location error', e)
    }

    const payload = {
      templateId: activeTemplate.id,
      trainId: trainId || null,
      geoLocation,
      items: activeTemplate.items.map((item: any) => ({
        id: item.id,
        label: item.label,
        checked: formState[item.id].checked,
        value: formState[item.id].value,
        note: formState[item.id].note
      }))
    }

    try {
      const res = await fetch(`${API_URL}/checklists/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        Alert.alert('موفقیت', 'چک‌لیست با موفقیت ثبت شد.', [{ text: 'باشه', onPress: () => setActiveTemplate(null) }])
      } else {
        const json = await res.json()
        Alert.alert('خطا', json.error?.message || 'خطا در ثبت چک‌لیست')
      }
    } catch (e) {
      Alert.alert('خطا', 'مشکل در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  if (activeTemplate) {
    return (
      <ScreenWrapper title={`چک‌لیست: ${activeTemplate.name}`} showBack onBack={() => setActiveTemplate(null)}>
        <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={s.card}>
            <Text style={s.cardDesc}>{activeTemplate.description || 'لطفاً تمامی موارد را به دقت بررسی کنید.'}</Text>
            
            <View style={s.inputGroup}>
              <Text style={s.label}>شماره قطار (اختیاری)</Text>
              <TextInput 
                style={s.input} 
                value={trainId} 
                onChangeText={setTrainId} 
                placeholder="مثال: 1204" 
                keyboardType="numeric"
              />
            </View>
          </View>

          {activeTemplate.items.map((item: any, idx: number) => {
            const state = formState[item.id] || {}
            return (
              <View key={item.id} style={s.itemCard}>
                <View style={s.itemHeader}>
                  <Text style={s.itemLabel}>{idx + 1}. {item.label}</Text>
                  {item.required && <Text style={s.requiredMark}>*</Text>}
                </View>

                {item.type === 'boolean' && (
                  <TouchableOpacity 
                    style={[s.checkBtn, state.checked && s.checkBtnActive]} 
                    onPress={() => updateForm(item.id, 'checked', !state.checked)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name={state.checked ? "check-circle" : "radio-button-unchecked"} size={20} color={state.checked ? "#fff" : "#64748b"} />
                    <Text style={[s.checkBtnText, state.checked && { color: '#fff' }]}>
                      {state.checked ? 'بررسی شد و مورد تایید است' : 'تایید انجام/بررسی'}
                    </Text>
                  </TouchableOpacity>
                )}

                {item.type !== 'boolean' && (
                  <TextInput
                    style={s.input}
                    value={state.value}
                    onChangeText={t => updateForm(item.id, 'value', t)}
                    placeholder="مقدار..."
                    keyboardType={item.type === 'number' ? 'numeric' : 'default'}
                  />
                )}

                <TextInput
                  style={[s.input, { marginTop: 8, height: 40, fontSize: 12 }]}
                  value={state.note}
                  onChangeText={t => updateForm(item.id, 'note', t)}
                  placeholder="توضیحات تکمیلی (در صورت وجود مشکل)..."
                />
              </View>
            )
          })}

          <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>ثبت چک‌لیست</Text>}
          </TouchableOpacity>
        </ScrollView>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper title="چک‌لیست‌ها" showBack onBack={() => navigation.goBack()}>
      <View style={s.container}>
        <Text style={s.title}>چک‌لیست‌های فعال</Text>
        <Text style={s.subtitle}>جهت شروع، روی قالب مورد نظر کلیک کنید</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#ae0011" />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {templates.map(tpl => (
              <TouchableOpacity key={tpl.id} style={s.templateCard} onPress={() => handleOpenTemplate(tpl)} activeOpacity={0.7}>
                <View style={s.templateIcon}>
                  <MaterialIcons name="fact-check" size={24} color="#ae0011" />
                </View>
                <View style={s.templateInfo}>
                  <Text style={s.templateName}>{tpl.name}</Text>
                  <Text style={s.templateItems}>{tpl.items.length} مورد بررسی</Text>
                </View>
                <MaterialIcons name="chevron-left" size={24} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
            {templates.length === 0 && (
              <Text style={{ textAlign: 'center', marginTop: 40, color: '#64748b', fontFamily: 'Vazirmatn' }}>چک‌لیست فعالی یافت نشد.</Text>
            )}
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontFamily: 'Vazirmatn-Bold', color: '#1e293b' },
  subtitle: { fontSize: 14, fontFamily: 'Vazirmatn', color: '#64748b', marginBottom: 16 },
  
  templateCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 1 },
  templateIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ae001115', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 16, fontFamily: 'Vazirmatn-Medium', color: '#1e293b' },
  templateItems: { fontSize: 13, fontFamily: 'Vazirmatn', color: '#64748b', marginTop: 4 },

  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16 },
  cardDesc: { fontSize: 14, fontFamily: 'Vazirmatn', color: '#334155', marginBottom: 16, lineHeight: 22 },
  
  itemCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  itemLabel: { flex: 1, fontSize: 15, fontFamily: 'Vazirmatn-Medium', color: '#1e293b', lineHeight: 24 },
  requiredMark: { color: '#ef4444', fontSize: 16, marginLeft: 4 },
  
  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  checkBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  checkBtnText: { marginLeft: 8, fontFamily: 'Vazirmatn-Medium', fontSize: 14, color: '#334155' },
  
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontFamily: 'Vazirmatn-Medium', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontFamily: 'Vazirmatn', fontSize: 14, textAlign: 'right' },
  
  submitBtn: { backgroundColor: '#ae0011', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  submitText: { color: '#fff', fontFamily: 'Vazirmatn-Bold', fontSize: 16 },
})
