import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { Trophy, TrendingUp, Award, Star } from 'lucide-react-native'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../shared/ThemeProvider'
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
  const { theme } = useTheme()

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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.containerMargin },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
    header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 20 },
    title: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary, fontFamily: theme.typography.screenTitle.fontFamily },
    statsRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 24 },
    statCard: { 
      flex: 1, 
      backgroundColor: theme.colors.surfaceContainerLowest, 
      borderRadius: theme.borderRadius.xl, 
      padding: 16, 
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...theme.shadows.level1,
    },
    statValue: { fontSize: 20, fontWeight: '800', color: theme.colors.primary, fontFamily: theme.typography.numericHero.fontFamily },
    statLabel: { fontSize: 11, color: theme.colors.secondary, marginTop: 4, fontFamily: theme.typography.captionSm.fontFamily, fontWeight: '700' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.onSurface, marginBottom: 16, textAlign: 'right', fontFamily: theme.typography.sectionTitle.fontFamily },
    compRow: { marginBottom: 16, backgroundColor: theme.colors.surfaceContainerLowest, padding: 12, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border },
    compInfo: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
    compName: { fontSize: 13, color: theme.colors.onSurface, fontWeight: '700', fontFamily: theme.typography.cardTitle.fontFamily },
    compScore: { fontSize: 12, color: theme.colors.secondary, fontFamily: 'monospace' },
    progressBar: { height: 6, backgroundColor: theme.colors.surfaceContainerLow, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: 6, backgroundColor: theme.colors.primary, borderRadius: 3 },
    emptyText: { fontSize: 14, color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily },
  })

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        <Trophy size={24} color={theme.colors.primary} />
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

export default PerformanceScreen
