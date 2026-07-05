import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native'
import { ScreenWrapper } from '../../shared/ScreenWrapper'
import { useTheme } from '../../shared/ThemeProvider'
import { useAuthStore } from '../../stores/auth'
import { API_URL } from '../../shared/config'

interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'jalali_date' | 'time' | 'select' | 'checkbox' | 'file' | 'signature' | 'formula'
  required: boolean
  options?: string[]
  formula?: string
  visibleWhen?: { field: string; equals: any }
}

interface FormTemplate {
  id: string
  key: string
  title: string
  description: string | null
  category: string | null
  icon: string | null
  allowMobile: boolean
}

export function SubmitRequestScreen({ navigation }: any) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // States
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [fields, setFields] = useState<FormField[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    loadTemplates()
  }, [accessToken])

  // Live Formula Evaluator
  useEffect(() => {
    if (fields.length === 0) return

    let dataChanged = false
    const updatedData = { ...formData }

    for (const field of fields) {
      if (field.type === 'formula' && field.formula) {
        const newVal = evaluateLiveFormula(field.formula, updatedData)
        if (updatedData[field.name] !== newVal) {
          updatedData[field.name] = newVal
          dataChanged = true
        }
      }
    }

    if (dataChanged) {
      setFormData(updatedData)
    }
  }, [formData, fields])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      if (!accessToken) {
        Alert.alert('خطا', 'لطفاً ابتدا وارد شوید.', [
          { text: 'ورود', onPress: () => navigation.replace('Login') }
        ])
        return
      }
      const res = await fetch(`${API_URL}/forms`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.status === 401) {
        Alert.alert('نیاز به ورود مجدد', 'نشست شما منقضی شده است.', [
          { text: 'ورود', onPress: () => navigation.replace('Login') }
        ])
        return
      }
      const json = await res.json()
      if (res.ok) {
        const mobileAllowed = (json.data || []).filter((t: FormTemplate) => t.allowMobile)
        setTemplates(mobileAllowed)
      } else {
        Alert.alert('خطا', json.error || 'عدم دریافت لیست فرم‌ها')
      }
    } catch {
      Alert.alert('خطا', 'عدم ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = async (template: FormTemplate) => {
    setLoading(true)
    setSelectedTemplate(template)
    try {
      const res = await fetch(`${API_URL}/forms/${template.key}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      const json = await res.json()
      if (res.ok) {
        const schemaFields = json.data.schema?.fields || []
        setFields(schemaFields)
        
        // مقداردهی اولیه داده‌های فرم
        const initial: Record<string, any> = {}
        schemaFields.forEach((f: FormField) => {
          if (f.type === 'checkbox') initial[f.name] = false
          else if (f.type === 'number') initial[f.name] = 0
          else initial[f.name] = ''
        })
        setFormData(initial)
      } else {
        Alert.alert('خطا', 'عدم دریافت ساختار فرم')
        setSelectedTemplate(null)
      }
    } catch {
      Alert.alert('خطا', 'عدم ارتباط با سرور')
      setSelectedTemplate(null)
    } finally {
      setLoading(false)
    }
  }

  const evaluateLiveFormula = (formula: string, data: Record<string, any>): number => {
    try {
      let expression = formula
      const fieldPattern = /\[([a-zA-Z0-9_-]+)\]/g
      let match
      while ((match = fieldPattern.exec(formula)) !== null) {
        const fieldName = match[1]
        const val = Number(data[fieldName] ?? 0)
        expression = expression.replace(match[0], String(val))
      }
      expression = expression.replace(/[^0-9+\-*/().\s]/g, '')
      const fn = new Function(`return (${expression})`)
      const result = fn()
      return isNaN(result) || !isFinite(result) ? 0 : result
    } catch {
      return 0
    }
  }

  const isFieldVisible = (field: FormField): boolean => {
    if (!field.visibleWhen) return true
    const depVal = formData[field.visibleWhen.field]
    return depVal === field.visibleWhen.equals
  }

  const handleSubmit = async () => {
    if (!selectedTemplate) return

    // اعتبارسنجی اولیه فیلدهای الزامی
    for (const field of fields) {
      if (field.required && isFieldVisible(field)) {
        const val = formData[field.name]
        if (val === undefined || val === null || val === '') {
          Alert.alert('خطا', `پر کردن فیلد «${field.label}» الزامی است.`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/forms/${selectedTemplate.key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ data: formData })
      })

      const json = await res.json()
      if (res.ok) {
        Alert.alert('موفقیت', 'درخواست شما با موفقیت ثبت شد و به جریان افتاد.')
        navigation.goBack()
      } else {
        if (json.validationErrors) {
          Alert.alert('خطا در اعتبارسنجی', Object.values(json.validationErrors).join('\n'))
        } else {
          Alert.alert('خطا', json.error || 'خطا در ثبت فرم')
        }
      }
    } catch {
      Alert.alert('خطا', 'مشکل در ارتباط با سرور')
    } finally {
      setSubmitting(false)
    }
  }

  const styles = StyleSheet.create({
    label: { 
      fontFamily: theme.typography.bodyMd.fontFamily, 
      color: theme.colors.onSurface, 
      marginBottom: 8, 
      marginTop: 16,
      textAlign: 'right',
      fontWeight: 'bold'
    },
    input: {
      backgroundColor: theme.colors.surfaceContainer,
      color: theme.colors.onSurface,
      borderRadius: 8,
      padding: 12,
      fontFamily: theme.typography.bodyMd.fontFamily,
      textAlign: 'right',
      borderWidth: 1,
      borderColor: theme.colors.border
    },
    button: {
      backgroundColor: theme.colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 32,
      marginBottom: 20
    },
    btnText: { 
      color: theme.colors.onPrimary, 
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontWeight: 'bold'
    },
    card: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'flex-end'
    },
    cardTitle: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      color: theme.colors.onSurface,
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4
    },
    cardDesc: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
      textAlign: 'right',
      lineHeight: 16
    },
    rowContainer: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10
    },
    formulaBox: {
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary,
      marginTop: 4
    },
    formulaText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: 'bold'
    },
    optionBtn: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: 8,
      padding: 12,
      marginVertical: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center'
    },
    optionBtnActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary
    },
    optionText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      color: theme.colors.onSurface
    }
  })

  if (loading) {
    return (
      <ScreenWrapper title="فرم‌های پرسنلی" navigation={navigation} showBack>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    )
  }

  // نمایش لیست قالب‌های فرم مجاز
  if (!selectedTemplate) {
    return (
      <ScreenWrapper title="فرم‌های پرسنلی" navigation={navigation} showBack>
        <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
          <Text style={[styles.label, { fontSize: 13, marginBottom: 16 }]}>قالب مورد نظر خود را جهت ثبت درخواست انتخاب کنید:</Text>
          {templates.map((tpl) => (
            <TouchableOpacity key={tpl.id} style={styles.card} onPress={() => handleSelectTemplate(tpl)}>
              <Text style={styles.cardTitle}>{tpl.title}</Text>
              {tpl.description && <Text style={styles.cardDesc}>{tpl.description}</Text>}
            </TouchableOpacity>
          ))}
          {templates.length === 0 && (
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 40, fontFamily: theme.typography.bodyMd.fontFamily }}>
              هیچ فرم فعالی یافت نشد.
            </Text>
          )}
        </ScrollView>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper title={selectedTemplate.title} navigation={navigation} showBack>
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16 }}>
        {fields.filter(isFieldVisible).map((field) => (
          <View key={field.name}>
            <Text style={styles.label}>
              {field.label}
              {field.required && <Text style={{ color: theme.colors.error }}> *</Text>}
            </Text>

            {field.type === 'textarea' ? (
              <TextInput
                style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                value={formData[field.name] ?? ''}
                onChangeText={(text) => setFormData({ ...formData, [field.name]: text })}
                multiline
                placeholder="توضیحات خود را بنویسید..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            ) : field.type === 'checkbox' ? (
              <View style={styles.rowContainer}>
                <Switch
                  value={!!formData[field.name]}
                  onValueChange={(val) => setFormData({ ...formData, [field.name]: val })}
                  thumbColor={formData[field.name] ? theme.colors.primary : theme.colors.outline}
                  trackColor={{ false: theme.colors.surfaceContainerHighest, true: theme.colors.primaryContainer }}
                />
                <Text style={{ fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.onSurfaceVariant }}>تایید و موافقت</Text>
              </View>
            ) : field.type === 'select' ? (
              <View>
                {field.options?.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionBtn, formData[field.name] === opt && styles.optionBtnActive]}
                    onPress={() => setFormData({ ...formData, [field.name]: opt })}
                  >
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : field.type === 'formula' ? (
              <View style={styles.formulaBox}>
                <Text style={styles.formulaText}>{formData[field.name] ?? 0}</Text>
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={String(formData[field.name] ?? '')}
                onChangeText={(text) => setFormData({ ...formData, [field.name]: field.type === 'number' ? (Number(text) || 0) : text })}
                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.btnText}>ارسال درخواست</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  )
}
