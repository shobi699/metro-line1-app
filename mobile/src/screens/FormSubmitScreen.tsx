import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper as ScreenLayout } from '../shared/ScreenWrapper'
import { useFormsStore, FormField } from '../stores/forms'
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer'
import { TouchableOpacity } from 'react-native'

export function FormSubmitScreen() {
  const { theme } = useTheme()
  const route = useRoute<any>()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  
  const formKey = route.params?.formKey
  const { getFormByKey, submitForm } = useFormsStore()

  const [formConfig, setFormConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    if (formKey) {
      loadForm()
    }
  }, [formKey])

  const loadForm = async () => {
    setLoading(true)
    const config = await getFormByKey(formKey)
    if (config) {
      setFormConfig(config)
      // Initialize default values if any (for Phase 1, just empty)
      const initialData: Record<string, any> = {}
      setFormData(initialData)
    } else {
      Alert.alert('خطا', 'دریافت اطلاعات فرم با مشکل مواجه شد.')
      navigation.goBack()
    }
    setLoading(false)
  }

  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const validate = () => {
    if (!formConfig?.schema) return false
    for (const field of formConfig.schema as FormField[]) {
      if (field.required && !formData[field.name]) {
        Alert.alert('خطا', `فیلد "${field.label}" الزامی است.`)
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setSubmitting(true)
    const res = await submitForm(formKey, formData)
    setSubmitting(false)

    if (res.success) {
      Alert.alert('موفق', 'فرم شما با موفقیت ثبت شد.', [
        { text: 'متوجه شدم', onPress: () => navigation.navigate('MyFormsScreen') }
      ])
    } else {
      Alert.alert('خطا در ثبت', res.error || 'مشکلی پیش آمد.')
    }
  }

  if (loading || !formConfig) {
    return (
      <ScreenLayout title="در حال بارگذاری..." showBack>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenLayout>
    )
  }

  return (
    <ScreenLayout title={formConfig.title} showBack>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {formConfig.description ? (
          <View style={[styles.descBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.descText, { color: theme.colors.text }]}>{formConfig.description}</Text>
          </View>
        ) : null}

        <View style={[styles.formCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <DynamicFormRenderer
            fields={formConfig.schema || []}
            data={formData}
            onChange={handleChange}
          />
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: submitting ? theme.colors.surfaceVariant : theme.colors.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={[styles.submitBtnText, { color: submitting ? theme.colors.secondary : theme.colors.background }]}>
              {submitting ? "در حال ثبت..." : "ارسال درخواست"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  descText: {
    fontFamily: 'Vazirmatn',
    fontSize: 14,
    lineHeight: 22,
  },
  formCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  actionContainer: {
    marginTop: 8,
  },
  submitBtn: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
  }
})
