import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { useTheme } from '../shared/ThemeProvider'
import { useAuthStore } from '../stores/auth'
import { useLeaveStore } from '../stores/leaves'
import { gregorianToJalali, getJalaliDateLabel, toFa } from '../shared/jalali'

export function LeaveReportScreen({ navigation }: any) {
  const { theme } = useTheme()
  const { leaves, fetchLeaves, isLoading } = useLeaveStore()
  const accessToken = useAuthStore(s => s.accessToken)
  
  const today = new Date()
  const [todayJy, todayJm] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate())
  
  const [currentYear, setCurrentYear] = useState(todayJy)
  const [currentMonth, setCurrentMonth] = useState(todayJm)

  useEffect(() => {
    if (accessToken) {
      // Just fetch all leaves for now, or filter by month
      fetchLeaves(accessToken)
    }
  }, [accessToken])

  const JALALI_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ]

  const monthName = JALALI_MONTHS[currentMonth - 1]

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const fromDate = new Date(l.fromDate)
      const [y, m] = gregorianToJalali(fromDate.getFullYear(), fromDate.getMonth() + 1, fromDate.getDate())
      return y === currentYear && m === currentMonth
    })
  }, [leaves, currentYear, currentMonth])

  const leaveOptions = [
    { label: 'استحقاقی', value: 'annual' },
    { label: 'استعلاجی', value: 'sick' },
    { label: 'مأموریت', value: 'mission' },
    { label: 'اضافه کار', value: 'overtime' },
    { label: 'کشیک', value: 'oncall' },
  ]

  const summary = useMemo(() => {
    const stats: Record<string, { count: number, sum: number, unit?: string }> = {}
    leaveOptions.forEach(opt => stats[opt.value] = { count: 0, sum: 0 })
    
    filteredLeaves.forEach(l => {
      if (stats[l.type]) {
        stats[l.type].count += 1
        if (l.amount) {
           stats[l.type].sum += l.calculatedAmount || l.amount
           stats[l.type].unit = l.unit === 'hours' ? 'ساعت' : l.unit === 'days' ? 'روز' : l.unit === 'count' ? 'مورد' : l.unit
        }
      }
    })
    return stats
  }, [filteredLeaves])

  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const styles = StyleSheet.create({
    monthSelector: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: theme.colors.surfaceContainerLowest },
    monthTitle: { fontFamily: theme.typography.sectionTitle.fontFamily, fontSize: 16, color: theme.colors.primary },
    monthBtn: { padding: 8, backgroundColor: theme.colors.surfaceVariant, borderRadius: 8 },
    
    summaryGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', padding: 16, gap: 12 },
    summaryCard: { flex: 1, minWidth: '45%', backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.borderRadius.lg, ...theme.shadows.level1, borderWidth: 1, borderColor: theme.colors.border },
    summaryValue: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary, textAlign: 'center', marginTop: 8 },
    summaryLabel: { fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.secondary, textAlign: 'center' },
    
    listContainer: { padding: 16 },
    listTitle: { fontFamily: theme.typography.sectionTitle.fontFamily, fontSize: 16, color: theme.colors.onSurface, marginBottom: 12, textAlign: 'right' },
    leaveItem: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: theme.borderRadius.md, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
    leaveHeaderRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    leaveType: { fontFamily: theme.typography.bodyMd.fontFamily, fontWeight: 'bold', color: theme.colors.onSurface },
    leaveStatus: { fontSize: 12, fontFamily: theme.typography.captionSm.fontFamily, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
    leaveDate: { fontFamily: theme.typography.captionSm.fontFamily, color: theme.colors.secondary, textAlign: 'right', marginBottom: 4 },
    leaveReason: { fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.onSurfaceVariant, textAlign: 'right', marginTop: 8, backgroundColor: theme.colors.surfaceVariant, padding: 8, borderRadius: 4 },
    
    emptyText: { fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.secondary, textAlign: 'center', marginTop: 32 }
  })

  return (
    <ScreenWrapper title="گزارش مرخصی و مأموریت" onBack={() => navigation.goBack()}>


      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthName} {toFa(currentYear)}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
          <MaterialIcons name="chevron-left" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.summaryGrid}>
          {leaveOptions.map(opt => {
            const stat = summary[opt.value]
            return (
            <View key={opt.value} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{opt.label}</Text>
              <Text style={styles.summaryValue}>
                 {stat?.sum > 0 ? `${toFa(stat.sum)} ${stat.unit || ''}` : `${toFa(stat?.count || 0)} مورد`}
              </Text>
            </View>
          )})}
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>جزئیات درخواست‌ها ({monthName})</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 32 }} />
          ) : filteredLeaves.length === 0 ? (
            <Text style={styles.emptyText}>هیچ درخواستی در این ماه ثبت نشده است.</Text>
          ) : (
            filteredLeaves.map(l => {
              const typeLabel = leaveOptions.find(o => o.value === l.type)?.label || l.type
              let statusColor = theme.colors.secondary
              let statusBg = theme.colors.surfaceVariant
              let statusText = 'در انتظار'
              
              if (l.status === 'approved') {
                statusColor = '#16a34a'
                statusBg = '#dcfce7'
                statusText = 'تایید شده'
              } else if (l.status === 'rejected') {
                statusColor = '#dc2626'
                statusBg = '#fee2e2'
                statusText = 'رد شده'
              }

              return (
                <View key={l.id} style={styles.leaveItem}>
                  <View style={styles.leaveHeaderRow}>
                    <Text style={styles.leaveType}>
                      {typeLabel} 
                      {l.amount ? ` (${toFa(l.calculatedAmount || l.amount)} ${l.unit === 'hours' ? 'ساعت' : l.unit === 'days' ? 'روز' : l.unit === 'count' ? 'مورد' : l.unit})` : ''}
                    </Text>
                    <Text style={[styles.leaveStatus, { color: statusColor, backgroundColor: statusBg }]}>
                      {statusText}
                    </Text>
                  </View>
                  <Text style={styles.leaveDate}>
                    تاریخ: {getJalaliDateLabel(new Date(l.fromDate))}
                  </Text>
                  {l.reason ? (
                    <Text style={styles.leaveReason}>{l.reason}</Text>
                  ) : null}
                </View>
              )
            })
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  )
}
