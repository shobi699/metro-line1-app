import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { Trophy, TrendingUp, Award, Star } from 'lucide-react-native'
import { useAuthStore } from '../stores/auth'
import { Theme } from '../shared/theme'
import { API_URL } from '../shared/config'

interface ScoreData {
  score: number
  percentile: number
  rank: number
  totalEmployees: number
  competencies: Array<{
    name: string
    score: number
    maxScore: number
  }>
}

export function PerformanceScreen() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    fetch(`${API_URL}/performance/scorecard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((json) => {
        setData(json?.data ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [accessToken])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      </View>
    )
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>داده‌ای موجود نیست</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Trophy size={24} color={Theme.colors.accent} />
        <Text style={styles.title}>عملکرد من</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.score}</Text>
          <Text style={styles.statLabel}>امتیاز کل</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>%{data.percentile}</Text>
          <Text style={styles.statLabel}>صدک رتبه</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.rank}</Text>
          <Text style={styles.statLabel}>رتبه از {data.totalEmployees}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>شایستگی‌ها</Text>
      {data.competencies.map((c, i) => (
        <View key={i} style={styles.compRow}>
          <View style={styles.compInfo}>
            <Text style={styles.compName}>{c.name}</Text>
            <Text style={styles.compScore}>{c.score} / {c.maxScore}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(c.score / c.maxScore) * 100}%` }]} />
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: Theme.spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Theme.spacing.xl },
  title: { fontSize: Theme.fontSize.xl, fontWeight: 'bold', color: Theme.colors.text },
  statsRow: { flexDirection: 'row', gap: Theme.spacing.sm, marginBottom: Theme.spacing.xl },
  statCard: { flex: 1, backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, alignItems: 'center' },
  statValue: { fontSize: Theme.fontSize.xl, fontWeight: 'bold', color: Theme.colors.accent },
  statLabel: { fontSize: Theme.fontSize.xs, color: Theme.colors.textMuted, marginTop: 4 },
  sectionTitle: { fontSize: Theme.fontSize.lg, fontWeight: 'bold', color: Theme.colors.text, marginBottom: Theme.spacing.md },
  compRow: { marginBottom: Theme.spacing.md },
  compInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  compName: { fontSize: Theme.fontSize.sm, color: Theme.colors.text },
  compScore: { fontSize: Theme.fontSize.sm, color: Theme.colors.textMuted },
  progressBar: { height: 6, backgroundColor: Theme.colors.border, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: Theme.colors.accent, borderRadius: 3 },
  emptyText: { fontSize: Theme.fontSize.md, color: Theme.colors.textMuted },
})
