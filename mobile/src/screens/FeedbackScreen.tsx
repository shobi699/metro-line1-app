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

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  criticism: { label: 'انتقاد', color: '#e53935' },
  suggestion: { label: 'پیشنهاد', color: '#007aff' },
  complaint: { label: 'شکایت', color: '#ff9500' },
  appreciation: { label: 'تقدیر', color: '#34c759' },
}

export function FeedbackScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'suggestion', title: '', body: '' })
  const [submitting, setSubmitting] = useState(false)

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
  const statusColor: Record<string, string> = { submitted: '#007aff', under_review: '#ff9500', responded: '#34c759' }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.newButton} onPress={() => setShowForm(!showForm)} activeOpacity={0.7}>
        <Send size={16} color="#ffffff" />
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
                  style={[styles.typeButton, form.type === key && { backgroundColor: conf.color }]}
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
            placeholderTextColor="#555860"
            textAlign="right"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.body}
            onChangeText={(t) => setForm({ ...form, body: t })}
            placeholder="متن پیام..."
            placeholderTextColor="#555860"
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
        <View style={styles.centerContainer}><ActivityIndicator size="large" color="#e53935" /></View>
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
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor[item.status]}20` }]}>
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
              <MessageSquare size={40} color="#555860" />
              <Text style={styles.emptyText}>پیامی ارسال نشده است</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#13151a', padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  newButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#e53935', borderRadius: 10, height: 44, marginBottom: 16 },
  newButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  formCard: { backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930', borderRadius: 12, padding: 16, marginBottom: 16 },
  formTitle: { fontSize: 15, fontWeight: 'bold', color: '#f2f2f7', textAlign: 'right', marginBottom: 12 },
  formRow: { marginBottom: 12 },
  formLabel: { fontSize: 12, color: '#a0a3b0', textAlign: 'right', marginBottom: 6 },
  typeButtons: { flexDirection: 'row-reverse', gap: 6 },
  typeButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#262930' },
  typeButtonText: { color: '#a0a3b0', fontSize: 12, fontWeight: '500' },
  input: { backgroundColor: '#13151a', borderWidth: 1, borderColor: '#262930', borderRadius: 8, height: 44, color: '#f2f2f7', paddingHorizontal: 12, fontSize: 14, marginBottom: 10, textAlign: 'right' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 10 },
  submitButton: { backgroundColor: '#e53935', borderRadius: 8, height: 44, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  listContainer: { paddingBottom: 24 },
  card: { backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#f2f2f7', textAlign: 'right' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardBody: { fontSize: 13, color: '#a0a3b0', textAlign: 'right', lineHeight: 20 },
  cardFooter: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 8 },
  cardType: { fontSize: 11, color: '#555860' },
  cardTime: { fontSize: 11, color: '#555860' },
  replyContainer: { marginTop: 10, backgroundColor: '#34c75910', borderWidth: 1, borderColor: '#34c75930', borderRadius: 8, padding: 10 },
  replyLabel: { fontSize: 11, fontWeight: '600', color: '#34c759', textAlign: 'right', marginBottom: 4 },
  replyText: { fontSize: 13, color: '#f2f2f7', textAlign: 'right' },
  emptyText: { color: '#a0a3b0', fontSize: 14, marginTop: 8 },
})
export default FeedbackScreen
