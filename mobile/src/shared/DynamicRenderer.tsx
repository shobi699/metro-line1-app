import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native'
import { useTheme } from './ThemeProvider'
import { MaterialIcons } from '@expo/vector-icons'

export interface ComponentSchema {
  id: string
  type: string
  props: Record<string, any>
  layout?: { colSpan?: number; rowSpan?: number }
  style?: Record<string, any>
  visibleFor?: string[]
}

interface DynamicRendererProps {
  components: ComponentSchema[]
  onAction?: (action: any) => void
}

export function DynamicRenderer({ components, onAction }: DynamicRendererProps) {
  const { theme } = useTheme()
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({})

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      padding: 10,
      width: '100%',
    },
    col12: { width: '100%' },
    col6: { width: '50%' },
    col4: { width: '33.33%' },
    
    // StatRow styles
    statRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      width: '100%',
      padding: 10,
      gap: 10,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.level1,
    },
    statValue: {
      fontFamily: theme.typography.numericHero.fontFamily,
      fontSize: theme.typography.numericHero.fontSize,
      color: theme.colors.primary,
      marginTop: 8,
    },
    statLabel: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      color: theme.colors.textSecondary,
    },

    // ChartWidget styles
    chartContainer: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginVertical: 10,
      ...theme.shadows.level1,
    },
    chartTitle: {
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontSize: theme.typography.cardTitle.fontSize,
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'right',
    },
    chartBars: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 120,
    },
    chartBarWrapper: {
      alignItems: 'center',
    },
    chartBar: {
      width: 24,
      backgroundColor: theme.colors.primary,
      borderRadius: 4,
    },
    chartBarLabel: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 10,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },

    // Button style
    button: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.lg,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginVertical: 8,
    },
    buttonText: {
      color: '#ffffff',
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: 'bold',
    },

    // DataList styles
    listContainer: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginVertical: 10,
      ...theme.shadows.level1,
    },
    listHeader: {
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontSize: theme.typography.cardTitle.fontSize,
      color: theme.colors.text,
      marginBottom: 12,
      textAlign: 'right',
    },
    listItem: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    listItemText: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      color: theme.colors.text,
      textAlign: 'right',
    },
    listItemSubText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      color: theme.colors.textSecondary,
    },
    
    // FormBuilder styles
    formContainer: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginVertical: 10,
      ...theme.shadows.level1,
    },
    formTitle: {
      fontFamily: theme.typography.cardTitle.fontFamily,
      fontSize: theme.typography.cardTitle.fontSize,
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'right',
    },
    fieldGroup: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      color: theme.colors.text,
      marginBottom: 6,
      textAlign: 'right',
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontFamily: theme.typography.bodyMd.fontFamily,
      color: theme.colors.text,
      textAlign: 'right',
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    submitButtonText: {
      color: '#ffffff',
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 15,
      fontWeight: 'bold',
    },
  })

  const renderComponent = (c: ComponentSchema) => {
    const colSpan = c.layout?.colSpan || 12
    const sizeStyle = colSpan === 6 ? styles.col6 : colSpan === 4 ? styles.col4 : styles.col12

    switch (c.type) {
      case 'StatRow':
        const stats = c.props.items || [
          { label: 'سفرهای امروز', value: '۱۲' },
          { label: 'ساعت باقیمانده استراحت', value: '۱۴.۵' }
        ]
        return (
          <View key={c.id} style={[styles.col12]}>
            <View style={styles.statRow}>
              {stats.map((item: any, idx: number) => (
                <View key={idx} style={styles.statCard}>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={styles.statValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )

      case 'ChartWidget':
        const chartData = c.props.data || [
          { label: 'شنبه', value: 80 },
          { label: 'یکشنبه', value: 65 },
          { label: 'دوشنبه', value: 95 },
          { label: 'سه‌شنبه', value: 40 },
          { label: 'چهارشنبه', value: 75 }
        ]
        return (
          <View key={c.id} style={[sizeStyle]}>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>{c.props.title || 'آمار عملکرد'}</Text>
              <View style={styles.chartBars}>
                {chartData.map((item: any, idx: number) => (
                  <View key={idx} style={styles.chartBarWrapper}>
                    <View style={[styles.chartBar, { height: item.value }]} />
                    <Text style={styles.chartBarLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )

      case 'Button':
        return (
          <View key={c.id} style={[sizeStyle, { paddingHorizontal: 5 }]}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: c.props.variant === 'secondary' ? theme.colors.secondary : theme.colors.primary }
              ]}
              onPress={() => onAction && onAction(c.props.action)}
            >
              {c.props.icon && (
                <MaterialIcons name={c.props.icon} size={20} color="#ffffff" />
              )}
              <Text style={styles.buttonText}>{c.props.label || 'دکمه'}</Text>
            </TouchableOpacity>
          </View>
        )

      case 'DataList':
        const listItems = c.props.items || [
          { title: 'بخشنامه سرعت مطمئنه در محدوده باز', desc: 'مهلت مطالعه: امروز' },
          { title: 'اعلام حریق ایستگاه شوش', desc: 'وضعیت: برطرف شده' },
        ]
        return (
          <View key={c.id} style={[sizeStyle]}>
            <View style={styles.listContainer}>
              <Text style={styles.listHeader}>{c.props.title || 'لیست داده‌ها'}</Text>
              {listItems.map((item: any, idx: number) => (
                <View key={idx} style={styles.listItem}>
                  <Text style={styles.listItemText}>{item.title}</Text>
                  <Text style={styles.listItemSubText}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )

      case 'FormBuilder':
        const fields = c.props.fields || [
          { id: 'name', type: 'text', label: 'نام راهبر', placeholder: 'وارد کنید' },
          { id: 'train', type: 'number', label: 'شماره قطار', placeholder: 'مثلا ۱۰۱' },
          { id: 'desc', type: 'text', label: 'شرح گزارش', placeholder: 'توضیح دهید' }
        ]
        const submitLabel = c.props.submitLabel || 'ارسال فرم'
        
        const handleFormSubmit = () => {
          const values = formValues[c.id] || {}
          Alert.alert('ثبت موفقیت‌آمیز', 'اطلاعات فرم با موفقیت ثبت و ارسال شد.')
          setFormValues(prev => ({
            ...prev,
            [c.id]: {}
          }))
          if (c.props.action && onAction) {
            onAction(c.props.action)
          }
        }

        return (
          <View key={c.id} style={[sizeStyle]}>
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>{c.props.title || 'فرم پویا'}</Text>
              {fields.map((field: any) => {
                if (field.visibleIf) {
                  const targetVal = formValues[c.id]?.[field.visibleIf.field]
                  if (field.visibleIf.operator === 'equals' && String(targetVal) !== String(field.visibleIf.value)) {
                    return null
                  }
                }

                return (
                  <View key={field.id} style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      {field.label} {field.required && <Text style={{ color: theme.colors.error }}>*</Text>}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={field.placeholder}
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                      value={formValues[c.id]?.[field.id] || ''}
                      onChangeText={(val) => {
                        setFormValues((prev) => ({
                          ...prev,
                          [c.id]: {
                            ...(prev[c.id] || {}),
                            [field.id]: val,
                          },
                        }))
                      }}
                    />
                  </View>
                )
              })}
              <TouchableOpacity style={styles.submitButton} onPress={handleFormSubmit} activeOpacity={0.8}>
                <Text style={styles.submitButtonText}>{submitLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )

      default:
        return (
          <View key={c.id} style={[sizeStyle, { padding: 10 }]}>
            <Text style={{ color: theme.colors.text }}>المان ناشناخته: {c.type}</Text>
          </View>
        )
    }
  }

  return (
    <View style={styles.container}>
      {components.map(renderComponent)}
    </View>
  )
}
export default DynamicRenderer;
