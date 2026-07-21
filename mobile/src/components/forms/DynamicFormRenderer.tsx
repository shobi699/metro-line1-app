import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, Modal, FlatList } from 'react-native'
import { FormField } from '../../stores/forms'
import { useTheme } from '../../shared/ThemeProvider'

// A simple dynamic form renderer
export interface DynamicFormRendererProps {
  fields: FormField[]
  data: Record<string, any>
  onChange: (fieldName: string, value: any) => void
}

export function DynamicFormRenderer({ fields, data, onChange }: DynamicFormRendererProps) {
  const { theme } = useTheme()
  const [pickerModal, setPickerModal] = useState<{ field: FormField | null }>({ field: null })

  const isFieldVisible = (field: FormField) => {
    if (!field.visibleWhen) return true
    const { field: targetField, equals } = field.visibleWhen
    return data[targetField] === equals
  }

  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null

    const value = data[field.name]

    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'number':
        return (
          <View style={styles.fieldContainer} key={field.name}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
                field.type === 'textarea' && { height: 100, textAlignVertical: 'top' }
              ]}
              value={value?.toString() || ''}
              onChangeText={(text) => onChange(field.name, field.type === 'number' ? Number(text) : text)}
              keyboardType={field.type === 'number' ? 'numeric' : 'default'}
              multiline={field.type === 'textarea'}
              placeholder={field.label}
              placeholderTextColor={theme.colors.secondary}
            />
          </View>
        )
        
      case 'select':
        return (
          <View style={styles.fieldContainer} key={field.name}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.card, justifyContent: 'center' }
              ]}
              onPress={() => setPickerModal({ field })}
            >
              <Text style={{ color: value ? theme.colors.text : theme.colors.secondary, fontFamily: 'Vazirmatn' }}>
                {value || `انتخاب ${field.label}...`}
              </Text>
            </TouchableOpacity>
          </View>
        )

      case 'checkbox':
        return (
          <View style={[styles.fieldContainer, styles.rowField]} key={field.name}>
            <Text style={[styles.label, { color: theme.colors.text, flex: 1 }]}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <Switch
              value={!!value}
              onValueChange={(val) => onChange(field.name, val)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.card}
            />
          </View>
        )

      // Fallback for file or date since we need custom components for those
      case 'date':
      case 'file':
      default:
        return (
          <View style={styles.fieldContainer} key={field.name}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }
              ]}
              value={value?.toString() || ''}
              onChangeText={(text) => onChange(field.name, text)}
              placeholder={`${field.label} (${field.type}) - فعلا به صورت متن`}
              placeholderTextColor={theme.colors.secondary}
            />
          </View>
        )
    }
  }

  return (
    <View style={styles.container}>
      {fields.map(renderField)}
      
      {/* Custom Picker Modal */}
      <Modal
        visible={!!pickerModal.field}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModal({ field: null })}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setPickerModal({ field: null })}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {pickerModal.field?.label}
            </Text>
            <FlatList
              data={pickerModal.field?.options || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: theme.colors.border }]}
                  onPress={() => {
                    if (pickerModal.field) {
                      onChange(pickerModal.field.name, item)
                    }
                    setPickerModal({ field: null })
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: theme.colors.text }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  rowField: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 14,
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    fontFamily: 'Vazirmatn',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontFamily: 'Vazirmatn',
    fontSize: 14,
    textAlign: 'center',
  }
})
