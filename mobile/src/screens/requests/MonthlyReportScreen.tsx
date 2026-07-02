import React, { useState, useEffect } from 'react'
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { ScreenWrapper } from '../../shared/ScreenWrapper'
import { useTheme } from '../../shared/ThemeProvider'
import { useAuthStore } from '../../stores/auth'
import { API_URL } from '../../shared/config'

export function MonthlyReportScreen({ navigation }: any) {
  const { theme } = useTheme()
  const accessToken = useAuthStore((s) => s.accessToken)
  
  const [data, setData] = useState<any>(null)
  const [types, setTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!accessToken) return
      try {
        const [resReq, resTypes] = await Promise.all([
          fetch(`${API_URL}/requests/me`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${API_URL}/requests/types`, { headers: { Authorization: `Bearer ${accessToken}` } })
        ])
        if (resReq.ok) setData(await resReq.json())
        if (resTypes.ok) setTypes((await resTypes.json()).data)
      } catch {
        // error
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [accessToken])

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12
    },
    title: { fontFamily: theme.typography.screenTitle.fontFamily, color: theme.colors.onSurface, marginBottom: 12 },
    row: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 },
    label: { fontFamily: theme.typography.captionSm.fontFamily, color: theme.colors.onSurfaceVariant },
    value: { fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.onSurface },
    summaryBox: {
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row-reverse',
      justifyContent: 'space-between'
    },
    summaryLabel: { fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.onSurface },
    summaryValue: { fontFamily: theme.typography.screenTitle.fontFamily, color: theme.colors.primary }
  })

  if (loading || !data) {
    return (
      <ScreenWrapper title="گزارش درخواست‌ها" navigation={navigation} showBack>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    )
  }

  const getTypeLabel = (typeId: string) => {
    const t = types.find((t) => t.id === typeId)
    return t ? t.label : typeId
  }

  return (
    <ScreenWrapper title="گزارش و پیگیری درخواست‌ها" navigation={navigation} showBack>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        
        <Text style={styles.title}>خلاصه عملکرد (تایید شده‌ها)</Text>
        <View style={styles.card}>
          {Object.entries(data.summary || {}).map(([typeId, summary]: [string, any]) => (
            <View key={typeId} style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>{getTypeLabel(typeId)}</Text>
              <Text style={styles.summaryValue}>
                {summary.totalCalculated} {summary.unit === 'hours' ? 'ساعت' : summary.unit === 'days' ? 'روز' : 'عدد'}
              </Text>
            </View>
          ))}
          {Object.keys(data.summary || {}).length === 0 && (
            <Text style={[styles.label, { textAlign: 'center' }]}>گزارشی برای نمایش وجود ندارد.</Text>
          )}
        </View>

        <Text style={[styles.title, { marginTop: 16 }]}>تاریخچه درخواست‌ها</Text>
        {data.data?.map((req: any) => (
          <View key={req.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.value}>{getTypeLabel(req.type)}</Text>
              <Text style={{
                fontFamily: theme.typography.captionSm.fontFamily,
                color: req.status === 'approved' ? '#16a34a' : req.status === 'rejected' ? '#dc2626' : theme.colors.onSurfaceVariant
              }}>
                {req.status === 'approved' ? 'تایید شده' : req.status === 'rejected' ? 'رد شده' : 'در انتظار بررسی'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>تاریخ:</Text>
              <Text style={styles.value}>{req.fromDate.split('T')[0]} تا {req.toDate.split('T')[0]}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>مقدار ثبت شده:</Text>
              <Text style={styles.value}>{req.amount} {req.unit}</Text>
            </View>
            {req.calculatedAmount !== null && (
              <View style={styles.row}>
                <Text style={styles.label}>ارزش محاسبه‌شده نهایی:</Text>
                <Text style={[styles.value, { color: theme.colors.primary }]}>{req.calculatedAmount}</Text>
              </View>
            )}
            {req.reviewNote && (
              <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-end', marginTop: 8 }]}>
                <Text style={styles.label}>توضیحات مدیر:</Text>
                <Text style={styles.value}>{req.reviewNote}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  )
}
