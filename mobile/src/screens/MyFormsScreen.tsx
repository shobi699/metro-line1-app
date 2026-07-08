import React, { useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CheckCircle2, Clock, XCircle, ChevronLeft } from 'lucide-react-native'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper as ScreenLayout } from '../shared/ScreenWrapper'
import { useFormsStore, FormSubmission } from '../stores/forms'
import { toFa, getJalaliDateString } from '../shared/jalali'
import dayjs from 'dayjs'

export function MyFormsScreen() {
  const { theme } = useTheme()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  
  const { mySubmissions, mySubmissionsLoading, fetchMySubmissions } = useFormsStore()

  useEffect(() => {
    fetchMySubmissions()
  }, [])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'approved': return { label: 'تایید شده', color: '#10b981', icon: CheckCircle2 }
      case 'rejected': return { label: 'رد شده', color: '#ef4444', icon: XCircle }
      case 'needs_changes': return { label: 'نیاز به اصلاح', color: '#f59e0b', icon: Clock }
      default: return { label: 'در حال بررسی', color: '#3b82f6', icon: Clock }
    }
  }

  const renderSubmissionCard = ({ item }: { item: FormSubmission }) => {
    const statusInfo = getStatusInfo(item.status)
    const StatusIcon = statusInfo.icon
    
    const d = new Date(item.submittedAt)
    const dateStr = getJalaliDateString(d).replace(/-/g, '/')
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    const dateFa = `${dateStr} ${timeStr}`

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => {
          // Future Phase: Open form details
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            {item.template?.title || 'فرم ناشناس'}
          </Text>
          <Text style={[styles.dateText, { color: theme.colors.secondary }]}>
            {toFa(dateFa)}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.statusBadge}>
            <StatusIcon color={statusInfo.color} size={14} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          
          <Text style={[styles.stageText, { color: theme.colors.secondary }]}>
            کد رهگیری: {toFa(item.submissionNo?.toString() || '—')}
          </Text>
          
          <ChevronLeft color={theme.colors.border} size={20} />
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <ScreenLayout title="فرم‌های من" showBack>
      <View style={styles.container}>
        {mySubmissionsLoading && mySubmissions.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={mySubmissions}
            keyExtractor={item => item.id}
            renderItem={renderSubmissionCard}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={mySubmissionsLoading} onRefresh={fetchMySubmissions} colors={[theme.colors.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={{ color: theme.colors.secondary, fontFamily: 'Vazirmatn' }}>شما تاکنون فرمی ارسال نکرده‌اید.</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenLayout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
  },
  dateText: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 12,
  },
  stageText: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  }
})
