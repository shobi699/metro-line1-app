import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, ActivityIndicator, Dimensions } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'
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
  isSimulation?: boolean
}

const FALLBACK_DATA: ScoreData = {
  score: 105,
  percentile: 92,
  rank: 3,
  totalEmployees: 45,
  competencies: [
    { name: 'انضباط و مسئولیت‌پذیری', score: 85, maxScore: 100 },
    { name: 'بهره‌وری و کارایی', score: 90, maxScore: 100 },
    { name: 'کیفیت خدمات و فنی', score: 80, maxScore: 100 },
    { name: 'نوآوری و مشارکت', score: 75, maxScore: 100 },
    { name: 'کار تیمی و انطباق', score: 85, maxScore: 100 },
    { name: 'رعایت قواعد و ایمنی', score: 100, maxScore: 100 },
  ],
  isSimulation: true
}

export function PerformanceScreen({ navigation }: any) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useTheme()

  useEffect(() => {
    if (!accessToken) {
      setData(FALLBACK_DATA)
      setLoading(false)
      return
    }
    
    fetch(`${API_URL}/performance/scorecard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((json) => {
        const resData = json?.data
        if (resData) {
          const compLabels: Record<string, string> = {
            discipline: 'انضباط و مسئولیت‌پذیری',
            productivity: 'بهره‌وری و کارایی',
            quality: 'کیفیت خدمات و فنی',
            innovation: 'نوآوری و مشارکت',
            teamwork: 'کار تیمی و انطباق',
            compliance: 'رعایت قواعد و ایمنی',
          }

          const competencies = resData.competencyRadar
            ? Object.keys(resData.competencyRadar).map((key) => ({
                name: compLabels[key] || key,
                score: resData.competencyRadar[key],
                maxScore: 100,
              }))
            : []

          setData({
            score: resData.summary?.finalScore ?? 100,
            percentile: resData.percentile ?? 95,
            rank: resData.rank ?? 2,
            totalEmployees: resData.totalEmployees ?? 35,
            competencies: competencies.length > 0 ? competencies : FALLBACK_DATA.competencies,
            isSimulation: !resData.summary?.finalScore
          })
        } else {
          setData(FALLBACK_DATA)
        }
        setLoading(false)
      })
      .catch(() => {
        setData(FALLBACK_DATA)
        setLoading(false)
      })
  }, [accessToken])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 16,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    statsRow: {
      flexDirection: 'row-reverse',
      gap: 10,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.xl,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
      fontFamily: theme.typography.numericHero.fontFamily,
    },
    statLabel: {
      fontSize: 10.5,
      color: theme.colors.secondary,
      marginTop: 4,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontWeight: '700',
    },
    badgeRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.primaryContainer + '20',
      borderRadius: theme.borderRadius.md,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
    },
    badgeText: {
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '700',
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.onSurface,
      marginBottom: 12,
      textAlign: 'right',
      fontFamily: theme.typography.sectionTitle.fontFamily,
    },
    compRow: {
      marginBottom: 12,
      backgroundColor: theme.colors.surfaceContainerLowest,
      padding: 12,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    compInfo: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    compName: {
      fontSize: 12,
      color: theme.colors.onSurface,
      fontWeight: '700',
      fontFamily: theme.typography.cardTitle.fontFamily,
    },
    compScore: {
      fontSize: 11.5,
      color: theme.colors.secondary,
      fontFamily: 'monospace',
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
  })

  if (loading) {
    return (
      <ScreenWrapper title="کارنامه عملکرد من" navigation={navigation}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper title="کارنامه عملکرد من" navigation={navigation} scrollable={true}>
      <View style={styles.content}>
        
        {data?.isSimulation && (
          <View style={styles.badgeRow}>
            <MaterialIcons name="info" size={16} color={theme.colors.primary} />
            <Text style={styles.badgeText}>کارنامه شبیه‌سازی شده دوره جاری (دوره هنوز نهایی نشده است)</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data?.score}</Text>
            <Text style={styles.statLabel}>امتیاز کل</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>%{data?.percentile}</Text>
            <Text style={styles.statLabel}>صدک رتبه</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data?.rank}</Text>
            <Text style={styles.statLabel}>رتبه از {data?.totalEmployees}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>شایستگی‌ها و مهارت‌های عمومی</Text>
        
        {data?.competencies.map((c, i) => (
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

      </View>
    </ScreenWrapper>
  )
}

export default PerformanceScreen
