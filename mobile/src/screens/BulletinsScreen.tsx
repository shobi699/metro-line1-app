import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { API_URL } from '../shared/config'
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react-native'

interface Bulletin {
  id: string
  title: string
  body: string
  active: boolean
  createdAt: string
}

export function BulletinsScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [bulletins, setBulletins] = useState<Bulletin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBulletins()
  }, [accessToken])

  async function loadBulletins() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/bulletins/pending`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setBulletins(data.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function acknowledgeBulletin(id: string) {
    Alert.alert('تأیید رؤیت', 'آیا این بخشنامه را مطالعه کرده‌اید؟', [
      { text: 'لغو', style: 'cancel' },
      {
        text: 'تأیید می‌کنم',
        onPress: async () => {
          if (!accessToken) return
          try {
            const res = await fetch(`${API_URL}/bulletins/${id}/acknowledge`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            if (res.ok) {
              setBulletins((prev) => prev.filter((b) => b.id !== id))
            }
          } catch {
            // silent
          }
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e53935" />
        </View>
      ) : bulletins.length === 0 ? (
        <View style={styles.centerContainer}>
          <CheckCircle size={40} color="#34c759" />
          <Text style={styles.emptyText}>بخشنامه خوانده‌نشده‌ای وجود ندارد</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <AlertTriangle size={16} color="#ff9500" />
            <Text style={styles.headerText}>
              {bulletins.length} بخشنامه خوانده‌نشده
            </Text>
          </View>
          <FlatList
            data={bulletins}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Shield size={18} color="#e53935" />
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
                <Text style={styles.cardBody}>{item.body}</Text>
                <Text style={styles.cardTime}>
                  {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                </Text>
                <TouchableOpacity
                  style={styles.ackButton}
                  onPress={() => acknowledgeBulletin(item.id)}
                >
                  <CheckCircle size={14} color="#ffffff" />
                  <Text style={styles.ackButtonText}>تأیید مطالعه</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#13151a' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 0 },
  headerText: { color: '#ff9500', fontSize: 13, fontWeight: '600' },
  listContainer: { padding: 16, paddingBottom: 24 },
  card: { backgroundColor: '#1c1e24', borderWidth: 1, borderColor: '#262930', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#f2f2f7', textAlign: 'right', flex: 1 },
  cardBody: { fontSize: 13, color: '#a0a3b0', textAlign: 'right', lineHeight: 20 },
  cardTime: { fontSize: 11, color: '#555860', textAlign: 'right', marginTop: 10 },
  ackButton: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, backgroundColor: '#e53935', borderRadius: 8, paddingVertical: 10 },
  ackButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#a0a3b0', fontSize: 14, marginTop: 8 },
})

export default BulletinsScreen
