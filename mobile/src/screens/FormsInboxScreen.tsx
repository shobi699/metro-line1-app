import React, { useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Inbox, Clock, ChevronLeft } from 'lucide-react-native'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper as ScreenLayout } from '../shared/ScreenWrapper'
import { useFormsStore, FormSubmission } from '../stores/forms'
import { toFa, getJalaliDateString } from '../shared/jalali'
import dayjs from 'dayjs'

export function FormsInboxScreen() {
  const { theme } = useTheme()
  const navigation = useNavigation<NativeStackNavigationProp<any>>()
  const { inbox, inboxLoading, fetchInbox } = useFormsStore()

  useEffect(() => {
    fetchInbox()
  }, [])

  const onRefresh = () => {
    fetchInbox()
  }

  const renderItem = ({ item }: { item: FormSubmission }) => {
    let formattedDate = 'نامشخص'
    if (item.submittedAt) {
      const d = new Date(item.submittedAt)
      const dateStr = getJalaliDateString(d).replace(/-/g, '/')
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      formattedDate = toFa(`${dateStr} - ${timeStr}`)
    }

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => navigation.navigate('FormReview', { submissionId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            {item.template.title}
          </Text>
          <Text style={[styles.submissionNo, { color: theme.colors.secondary }]}>
            R-{toFa(item.submissionNo)}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.submitterName, { color: theme.colors.text }]}>
            متقاضی: {item.submitter?.name || 'نامشخص'}
          </Text>
          
          <View style={styles.row}>
            <Clock size={14} color={theme.colors.secondary} />
            <Text style={[styles.dateText, { color: theme.colors.secondary }]}>
              {formattedDate}
            </Text>
          </View>
          
          {item.currentStage && (
            <View style={[styles.stageBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.stageText, { color: theme.colors.primary }]}>
                مرحله: {item.currentStage}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>بررسی و اقدام</Text>
          <ChevronLeft size={16} color={theme.colors.primary} />
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <ScreenLayout title="کارتابل تاییدیه" showBack>
      <View style={styles.container}>
        {inboxLoading && inbox.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={inbox}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={inboxLoading} onRefresh={onRefresh} colors={[theme.colors.primary]} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Inbox size={48} color={theme.colors.border} />
                <Text style={[styles.emptyText, { color: theme.colors.secondary }]}>
                  هیچ فرمی در انتظار تایید شما نیست.
                </Text>
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
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 16,
    flex: 1,
  },
  submissionNo: {
    fontFamily: 'Vazirmatn',
    fontSize: 14,
  },
  cardBody: {
    marginBottom: 16,
  },
  submitterName: {
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontFamily: 'Vazirmatn',
    fontSize: 12,
  },
  stageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  stageText: {
    fontFamily: 'Vazirmatn-Bold',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row', // left aligned icon
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
  },
  actionText: {
    fontFamily: 'Vazirmatn-Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontFamily: 'Vazirmatn',
    fontSize: 16,
    marginTop: 16,
  }
})
