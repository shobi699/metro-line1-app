import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../shared/ThemeProvider'
import { API_URL } from '../shared/config'
import { MessageSquare, Send, ThumbsUp, Star, AlertTriangle } from 'lucide-react-native'

interface FeedbackItem {
  id: string
  type: string
  title: string
  body: string
  status: string
  reply: string | null
  createdAt: string
}

export function FeedbackScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'suggestion', title: '', body: '' })
  const [submitting, setSubmitting] = useState(false)
  const { theme } = useTheme()

  const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    criticism: { label: 'انتقاد', color: theme.colors.error },
    suggestion: { label: 'پیشنهاد', color: theme.colors.info },
    complaint: { label: 'شکایت', color: theme.colors.warning },
    appreciation: { label: 'تقدیر', color: theme.colors.success },
  }

  useEffect(() => { loadItems() }, [accessToken])

  async function loadItems() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/feedback`, { headers: { Authorization: `Bearer ${accessToken}` } })
      if (res.ok) {
        const data = await res.json()
        setItems(data.data?.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!accessToken || !form.title || !form.body) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setForm({ type: 'suggestion', title: '', body: '' })
        setShowForm(false)
        loadItems()
        Alert.alert('ارسال شد', 'پیام شما با موفقیت ارسال شد.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const statusLabel: Record<string, string> = { submitted: 'دریافت شد', under_review: 'در حال بررسی', responded: 'پاسخ داده شد' }
  const statusColor: Record<string, string> = { submitted: theme.colors.info, under_review: theme.colors.warning, responded: theme.colors.success }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.containerMargin },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    newButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg, height: 44, marginBottom: 16, ...theme.shadows.level1 },
    newButtonText: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '800', fontFamily: theme.typography.cardTitle.fontFamily },
    formCard: { 
      backgroundColor: theme.colors.surfaceContainerLowest, 
      borderWidth: 1, 
      borderColor: theme.colors.border, 
      borderRadius: theme.borderRadius.xl, 
      padding: 16, 
      marginBottom: 16,
      ...theme.shadows.level1,
    },
    formTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.onSurface, textAlign: 'right', marginBottom: 12, fontFamily: theme.typography.cardTitle.fontFamily },
    formRow: { marginBottom: 12 },
    formLabel: { fontSize: 12, color: theme.colors.secondary, textAlign: 'right', marginBottom: 6, fontFamily: theme.typography.captionSm.fontFamily },
    typeButtons: { flexDirection: 'row-reverse', gap: 6 },
    typeButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.surfaceContainerLow, borderWidth: 1, borderColor: theme.colors.border },
    typeButtonText: { color: theme.colors.secondary, fontSize: 12, fontWeight: '600', fontFamily: theme.typography.captionSm.fontFamily },
    input: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, height: 44, color: theme.colors.onSurface, paddingHorizontal: 12, fontSize: 14, marginBottom: 10, textAlign: 'right', fontFamily: theme.typography.bodyMd.fontFamily },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 10 },
    submitButton: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg, height: 44, justifyContent: 'center', alignItems: 'center', ...theme.shadows.level1 },
    submitText: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '800', fontFamily: theme.typography.cardTitle.fontFamily },
    listContainer: { paddingBottom: 24 },
    card: { 
      backgroundColor: theme.colors.surfaceContainerLowest, 
      borderWidth: 1, 
      borderColor: theme.colors.border, 
      borderRadius: theme.borderRadius.xl, 
      padding: 14, 
      marginBottom: 10,
      ...theme.shadows.level1,
    },
    cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.onSurface, textAlign: 'right', fontFamily: theme.typography.cardTitle.fontFamily },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    statusText: { fontSize: 11, fontWeight: '800', fontFamily: theme.typography.captionSm.fontFamily },
    cardBody: { fontSize: 13, color: theme.colors.secondary, textAlign: 'right', lineHeight: 20, fontFamily: theme.typography.bodyMd.fontFamily },
    cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 8 },
    cardType: { fontSize: 11, color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, fontWeight: '700' },
    cardTime: { fontSize: 11, color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, fontWeight: '500' },
    replyContainer: { marginTop: 10, backgroundColor: theme.colors.success + '08', borderWidth: 1, borderColor: theme.colors.success + '20', borderRadius: theme.borderRadius.lg, padding: 10 },
    replyLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.success, textAlign: 'right', marginBottom: 4, fontFamily: theme.typography.captionSm.fontFamily },
    replyText: { fontSize: 13, color: theme.colors.onSurface, textAlign: 'right', fontFamily: theme.typography.bodyMd.fontFamily },
    emptyText: { color: theme.colors.secondary, fontSize: 14, marginTop: 8, fontFamily: theme.typography.bodyMd.fontFamily },
  })

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newButton} onPress={() => setShowForm(!showForm)} activeOpacity={0.7}>
        <Send size={16} color={theme.colors.onPrimary} style={{ transform: [{ scaleX: -1 }] }} />
        <Text style={styles.newButtonText}>پیام جدید</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>پیام جدید</Text>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>نوع</Text>
            <View style={styles.typeButtons}>
              {Object.entries(TYPE_CONFIG).map(([key, conf]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.typeButton, form.type === key && { backgroundColor: conf.color, borderColor: conf.color }]}
                  onPress={() => setForm({ ...form, type: key })}
                >
                  <Text style={[styles.typeButtonText, form.type === key && { color: '#ffffff' }]}>{conf.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(t) => setForm({ ...form, title: t })}
            placeholder="موضوع..."
            placeholderTextColor={theme.colors.secondary}
            textAlign="right"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.body}
            onChangeText={(t) => setForm({ ...form, body: t })}
            placeholder="متن پیام..."
            placeholderTextColor={theme.colors.secondary}
            textAlign="right"
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting} activeOpacity={0.7}>
            {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitText}>ارسال</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const conf = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.suggestion
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor[item.status]}1A` }]}>
                    <Text style={[styles.statusText, { color: statusColor[item.status] }]}>{statusLabel[item.status]}</Text>
                  </View>
                </View>
                <Text style={styles.cardBody}>{item.body}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardType}>{conf.label}</Text>
                  <Text style={styles.cardTime}>{new Date(item.createdAt).toLocaleDateString('fa-IR')}</Text>
                </View>
                {item.reply && (
                  <View style={styles.replyContainer}>
                    <Text style={styles.replyLabel}>پاسخ مدیریت</Text>
                    <Text style={styles.replyText}>{item.reply}</Text>
                  </View>
                )}
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <MessageSquare size={40} color={theme.colors.secondary} />
              <Text style={styles.emptyText}>پیامی ارسال نشده است</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

export default FeedbackScreen
