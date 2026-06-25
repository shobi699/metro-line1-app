import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useAuthStore } from '../stores/auth'
import { API_URL } from './config'
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react-native'
import { toFa } from './jalali'

interface Bulletin {
  id: string
  title: string
  body: string
  createdAt: string
}

export function BulletinGuard({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [pending, setPending] = useState<Bulletin[]>([])
  const [loading, setLoading] = useState(true)
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [contentHeight, setContentHeight] = useState(0)
  const [layoutHeight, setLayoutHeight] = useState(0)

  useEffect(() => {
    async function loadPending() {
      if (!accessToken) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_URL}/bulletins/pending`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          setPending(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching pending bulletins:', err)
      } finally {
        setLoading(false)
      }
    }
    loadPending()
  }, [accessToken])

  // If text is too short and fits on screen, enable the button
  useEffect(() => {
    if (contentHeight > 0 && layoutHeight > 0) {
      if (contentHeight <= layoutHeight + 5) {
        setScrolledToEnd(true)
      }
    }
  }, [contentHeight, layoutHeight, pending])

  const current = pending[0]

  async function handleAcknowledge() {
    if (!current || submitting) return
    setSubmitting(true)
    try {
      const userAgent = `MetroApp/1.0 (${Platform.OS}; Version ${Platform.Version})`
      const res = await fetch(`${API_URL}/bulletins/${current.id}/acknowledge`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': userAgent,
        },
      })
      if (res.ok) {
        setPending((prev) => prev.filter((b) => b.id !== current.id))
        setScrolledToEnd(false)
        setContentHeight(0)
        setLayoutHeight(0)
      }
    } catch (err) {
      console.error('Error acknowledging bulletin:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent
    const isEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - 15
    if (isEnd) {
      setScrolledToEnd(true)
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e53935" />
      </View>
    )
  }

  if (pending.length === 0) {
    return <>{children}</>
  }

  return (
    <View style={styles.container}>
      {children}
      
      {/* Non-dismissible overlay */}
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.headerText}>بخشنامه ایمنی اجباری</Text>
            <AlertTriangle size={20} color="#ff9500" />
          </View>

          <Text style={styles.cardTitle}>{current.title}</Text>

          <View style={styles.scrollWrapper}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              onScroll={handleScroll}
              scrollEventThrottle={400}
              onContentSizeChange={(_, h) => setContentHeight(h)}
              onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}
            >
              <Text style={styles.cardBody}>{current.body}</Text>
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[styles.ackButton, !scrolledToEnd && styles.disabledButton]}
            disabled={!scrolledToEnd || submitting}
            onPress={handleAcknowledge}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <CheckCircle size={16} color="#ffffff" />
                <Text style={styles.ackButtonText}>مطالعه کردم و متوجه شدم</Text>
              </>
            )}
          </TouchableOpacity>

          {!scrolledToEnd && (
            <Text style={styles.tipText}>لطفاً بخشنامه را تا انتها اسکرول کنید تا دکمه تأیید فعال شود.</Text>
          )}

          {pending.length > 1 && (
            <Text style={styles.remainingText}>
              {toFa(pending.length - 1)} بخشنامه دیگر باقی مانده است.
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#13151a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10000,
  },
  card: {
    backgroundColor: '#1c1e24',
    borderWidth: 2,
    borderColor: '#e53935', // قرمز تیره لبه برند خط ۱
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#262930',
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9500',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f2f2f7',
    textAlign: 'right',
    marginBottom: 12,
  },
  scrollWrapper: {
    height: 180,
    borderWidth: 1,
    borderColor: '#262930',
    borderRadius: 8,
    backgroundColor: '#13151a',
    padding: 8,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  cardBody: {
    fontSize: 13,
    color: '#a0a3b0',
    textAlign: 'right',
    lineHeight: 22,
  },
  ackButton: {
    backgroundColor: '#e53935',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#4d1e1e',
    opacity: 0.6,
  },
  ackButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 11,
    color: '#ff9500',
    textAlign: 'center',
    marginTop: 8,
  },
  remainingText: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 12,
  },
})
