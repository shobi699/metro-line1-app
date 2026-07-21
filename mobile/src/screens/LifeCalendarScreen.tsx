import React, { useEffect, useMemo, useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { syncWidgetAndReminders } from '../shared/widget-sync'
import { toFa, getJalaliDateLabel, extractHijriDate } from '../shared/jalali'
import {
  useCalendarStore,
  type CalendarDay,
  type CalendarEventEntry,
} from '../stores/calendar'

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند',
]

const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

const STATUS_MENU = [
  { key: 'on_call', label: 'کشیک', color: '#3b82f6', textColor: '#ffffff' },
  { key: 'overtime', label: 'اضافه کار', color: '#a855f7', textColor: '#ffffff' },
  { key: 'leave_sick', label: 'مرخصی استعلاجی', color: '#059669', textColor: '#ffffff' },
  { key: 'leave_daily', label: 'مرخصی روزانه', color: '#22c55e', textColor: '#ffffff' },
  { key: 'note', label: 'یادداشت', color: '#f59e0b', textColor: '#ffffff' },
  { key: 'leave_hourly', label: 'مرخصی ساعتی', color: '#f97316', textColor: '#ffffff' },
  { key: 'other', label: 'سایر کارکرد', color: '#b91c1c', textColor: '#ffffff' },
  { key: 'reminder', label: 'یادآور', color: '#ef4444', textColor: '#ffffff' },
] as const

const OTHER_TYPES = [
  { key: 'event', label: 'رویداد', color: '#f43f5e' },
  { key: 'task', label: 'کار', color: '#3b82f6' },
  { key: 'work_log', label: 'گزارش کار', color: '#eab308' },
  { key: 'financial', label: 'مالی', color: '#10b981' },
] as const

// پالت شیفت — SHIFT_CALENDAR_UI_DESIGN.md §2.1 (روشن / تیره)
const SHIFT_PALETTE: Record<string, { label: string; icon: string; light: string; dark: string }> = {
  morning: { label: 'صبح', icon: '☀️', light: '#0e9f9f', dark: '#2dd4cf' },
  evening: { label: 'عصر', icon: '🌆', light: '#d97706', dark: '#fbbf24' },
  night: { label: 'شب', icon: '🌙', light: '#4f46e5', dark: '#818cf8' },
  off: { label: 'آف', icon: '🏖', light: '#16a34a', dark: '#4ade80' },
  office: { label: 'اداری', icon: '🏢', light: '#64748b', dark: '#94a3b8' },
}

const EVT_PERSONAL = { light: '#2563eb', dark: '#3b82f6' }
const EVT_ORG = { light: '#7c3aed', dark: '#a78bfa' }
const EVT_TASK = { light: '#0891b2', dark: '#22d3ee' }

function todayGregStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function LifeCalendarScreen({ navigation }: any) {
  const { theme, isDark } = useTheme()
  const {
    jYear,
    jMonth,
    days,
    isLoading,
    error,
    selectedDate,
    nextMonth,
    prevMonth,
    goToToday,
    selectDay,
    loadMonth,
    addEvent,
    deleteEvent,
    toggleTask,
  } = useCalendarStore()

  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<string>('event')
  const [newDescription, setNewDescription] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newHours, setNewHours] = useState('')
  const [newIsIncome, setNewIsIncome] = useState(true)
  const [newReminder, setNewReminder] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    void loadMonth()
    void syncWidgetAndReminders()
  }, [])

  const todayStr = todayGregStr()
  const today = useMemo(() => days.find((d) => d.date === todayStr) ?? null, [days, todayStr])
  const selectedDay = useMemo(
    () => days.find((d) => d.date === selectedDate) ?? null,
    [days, selectedDate],
  )
  const nextOff = useMemo(() => {
    const upcoming = days.filter((d) => d.date > todayStr)
    const idx = upcoming.findIndex(
      (d) => d.shift?.code === 'off' || d.holidays.some((h) => h.isOffDay),
    )
    return idx === -1 ? null : idx + 1
  }, [days, todayStr])

  const startOffset = days.length > 0 ? days[0].weekday : 0

  function shiftColor(code: string): string {
    const p = SHIFT_PALETTE[code]
    if (!p) return theme.colors.secondary
    return isDark ? p.dark : p.light
  }

  const calculatedNetBalance = useMemo(() => {
    if (!selectedDay) return null
    let balance = 0
    let hasFinancial = false
    selectedDay.events.forEach((e) => {
      if (e.type === 'financial' && e.metadata?.amount) {
        hasFinancial = true
        const isInc = e.metadata.isIncome !== false
        if (isInc) {
          balance += Number(e.metadata.amount)
        } else {
          balance -= Number(e.metadata.amount)
        }
      }
    })
    return hasFinancial ? balance : null
  }, [selectedDay])

  function handleSelectType(typeKey: string, defaultTitle: string) {
    setNewType(typeKey)
    setNewTitle(defaultTitle)
    setNewDescription('')
    setNewAmount('')
    setNewHours('')
  }

  async function handleAdd() {
    if (!selectedDay || newTitle.trim().length === 0) return
    setIsSaving(true)

    const metadata: any = {}
    if (newType === 'financial') {
      metadata.amount = Number(newAmount) || 0
      metadata.isIncome = newIsIncome
    } else if (newType === 'work_log' || newType === 'leave_hourly' || newType === 'overtime') {
      metadata.hours = Number(newHours) || 0
    }

    const ok = await addEvent({
      type: newType,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      startAt: `${selectedDay.date}T00:00:00.000Z`,
      allDay: true,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      reminders: newReminder !== null ? [{ minutesBefore: newReminder }] : undefined,
    })
    setIsSaving(false)
    if (ok) {
      setNewTitle('')
      setNewDescription('')
      setNewAmount('')
      setNewHours('')
      setNewIsIncome(true)
      setNewReminder(null)
    }
  }

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.containerMargin,
      paddingVertical: 10,
    },
    monthTitle: {
      fontFamily: theme.typography.screenTitle.fontFamily,
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    headerActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
    navBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    todayBtn: {
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: 9999,
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryContainer + '20',
    },
    todayBtnText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontWeight: '700',
    },

    content: { paddingHorizontal: theme.spacing.containerMargin, paddingBottom: 24, gap: 12 },

    errorBanner: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.errorContainer + '30',
      borderColor: theme.colors.error + '40',
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: 10,
    },
    errorText: {
      flex: 1,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: 12,
      textAlign: 'right',
    },
    retryText: { color: theme.colors.primary, fontWeight: '700', paddingHorizontal: 8 },

    todayCard: {
      borderRadius: theme.borderRadius.xl,
      borderWidth: 1,
      padding: 14,
      gap: 6,
    },
    todayCardTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
    todayCardIcon: { fontSize: 24 },
    todayCardTitle: {
      fontFamily: theme.typography.sectionTitle.fontFamily,
      fontSize: 16,
      fontWeight: '700',
    },
    todayCardTime: { fontSize: 14, textAlign: 'right', writingDirection: 'ltr' as const },
    todayCardHint: { fontSize: 11, opacity: 0.8, textAlign: 'right' },
    todayCardFooter: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    todayCardFooterText: {
      fontSize: 12,
      color: theme.colors.secondary,
      fontFamily: theme.typography.captionSm.fontFamily,
    },

    calendarCard: {
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderRadius: theme.borderRadius.xl,
      padding: 10,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      ...theme.shadows.level1,
    },
    weekDaysRow: {
      flexDirection: 'row-reverse',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
      paddingBottom: 8,
      marginBottom: 8,
    },
    weekDayHeader: {
      flex: 1,
      textAlign: 'center',
      fontFamily: theme.typography.captionSm.fontFamily,
      fontSize: theme.typography.captionSm.fontSize,
      color: theme.colors.secondary,
    },
    weekDayHeaderFriday: { color: theme.colors.primary },

    gridContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
    cellWrapper: { width: '14.28%', minHeight: 64, padding: 2 },
    cell: {
      flex: 1,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.surface,
      padding: 4,
      justifyContent: 'space-between',
      minHeight: 60,
    },
    cellToday: { borderWidth: 2, borderColor: theme.colors.primary },
    cellSelected: { backgroundColor: theme.colors.primaryContainer + '15' },
    cellNumRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
    cellNum: {
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    cellNumToday: {
      color: theme.colors.onPrimary,
      backgroundColor: theme.colors.primary,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      textAlign: 'center',
      lineHeight: 20,
      overflow: 'hidden',
    },
    cellNumHoliday: { color: theme.colors.error },
    orgMark: { fontSize: 8, color: isDark ? EVT_ORG.dark : EVT_ORG.light },
    shiftBar: {
      height: 14,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shiftBarForecast: { opacity: 0.5, borderWidth: 1, borderStyle: 'dashed' as const },
    shiftBarText: { fontSize: 8, fontWeight: '700', color: '#ffffff' },
    dotsRow: { flexDirection: 'row-reverse', gap: 2, alignItems: 'center', minHeight: 8 },
    evtDot: { width: 5, height: 5, borderRadius: 3 },
    moreText: { fontSize: 8, color: theme.colors.secondary },

    skeletonCell: {
      flex: 1,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.surfaceContainerLow,
      minHeight: 60,
    },

    // Bottom sheet (روز منتخب)
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      padding: 20,
      maxHeight: '85%',
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.outlineVariant,
      alignSelf: 'center',
      marginBottom: 12,
    },
    modalHeader: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle: {
      fontFamily: theme.typography.sectionTitle.fontFamily,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    holidayBox: {
      backgroundColor: theme.colors.errorContainer + '30',
      borderRadius: theme.borderRadius.md,
      padding: 10,
      marginBottom: 10,
    },
    holidayText: {
      color: theme.colors.error,
      fontSize: 12,
      textAlign: 'right',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    shiftDetailBox: {
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      padding: 12,
      marginBottom: 12,
      gap: 4,
    },
    orgEventRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 6,
    },
    mandatoryBadge: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    mandatoryBadgeText: { fontSize: 9, color: theme.colors.error, fontWeight: '700' },
    sectionLabel: {
      fontSize: 12,
      color: theme.colors.secondary,
      fontFamily: theme.typography.captionSm.fontFamily,
      textAlign: 'right',
      marginBottom: 6,
      fontWeight: '600',
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.secondary,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 13,
      paddingVertical: 12,
    },
    eventRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.lg,
      padding: 10,
      marginBottom: 6,
      minHeight: 48,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderWidth: 2,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    eventTitle: {
      flex: 1,
      textAlign: 'right',
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: 14,
    },
    eventTitleDone: { textDecorationLine: 'line-through', color: theme.colors.secondary },
    deleteBtn: { padding: 8 },

    quickAddBox: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceVariant,
      paddingTop: 12,
      marginTop: 8,
      gap: 8,
    },
    conflictBox: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.warning + '20',
      borderWidth: 1,
      borderColor: theme.colors.warning + '60',
      borderRadius: theme.borderRadius.md,
      padding: 10,
    },
    conflictText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.warning,
      textAlign: 'right',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    typeChipsRow: { flexDirection: 'row-reverse', gap: 8 },
    typeChip: {
      minHeight: 36,
      paddingHorizontal: 14,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
    },
    typeChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer + '20',
    },
    typeChipText: { fontSize: 12, color: theme.colors.secondary },
    typeChipTextActive: { color: theme.colors.primary, fontWeight: '700' },
    addRow: { flexDirection: 'row-reverse', gap: 8 },
    addInput: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 12,
      height: 48,
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      textAlign: 'right',
    },
    addBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: 16,
      height: 48,
      justifyContent: 'center',
    },
    addBtnText: { color: theme.colors.onPrimary, fontWeight: '700' },
    balanceCard: {
      borderWidth: 1,
      borderRadius: theme.borderRadius.lg,
      padding: 10,
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    balanceLabel: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    balanceValue: {
      fontSize: 13,
      fontWeight: '700',
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    statusGrid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    statusBtn: {
      width: '48%',
      height: 44,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    statusBtnText: {
      fontSize: 13,
      fontWeight: '700',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    dynamicFieldsRow: {
      flexDirection: 'row-reverse',
      gap: 8,
    },
    financialToggleRow: {
      flexDirection: 'row-reverse',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.borderRadius.md,
      padding: 2,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
      alignItems: 'center',
    },
    toggleBtn: {
      paddingHorizontal: 10,
      height: 36,
      borderRadius: theme.borderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.secondary,
      fontFamily: theme.typography.captionSm.fontFamily,
    },
    addBtnLarge: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
    },
    addBtnLargeText: {
      color: theme.colors.onPrimary,
      fontWeight: '700',
      fontSize: 14,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    eventWrapper: {
      marginBottom: 8,
    },
    eventDesc: {
      fontSize: 11,
      color: theme.colors.secondary,
      textAlign: 'right',
      marginTop: 4,
      marginRight: 16,
      backgroundColor: theme.colors.surfaceVariant + '30',
      padding: 6,
      borderRadius: theme.borderRadius.sm,
      fontFamily: theme.typography.bodyMd.fontFamily,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 9999,
      marginHorizontal: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      fontFamily: theme.typography.captionSm.fontFamily,
    },
  })

  function renderTodayCard() {
    if (!today) return null
    const meta = today.shift ? SHIFT_PALETTE[today.shift.code] : null
    const color = today.shift ? shiftColor(today.shift.code) : theme.colors.secondary

    return (
      <View
        style={[
          styles.todayCard,
          { borderColor: color + '50', backgroundColor: color + (isDark ? '22' : '14') },
        ]}
      >
        <View style={styles.todayCardTitleRow}>
          <Text style={styles.todayCardIcon}>{meta?.icon ?? '📅'}</Text>
          <Text style={[styles.todayCardTitle, { color }]}>
            {meta ? `امروز: شیفت ${meta.label}` : 'امروز شیفتی ثبت نشده'}
          </Text>
        </View>
        {today.shift?.startTime ? (
          <Text style={[styles.todayCardTime, { color }]}>
            {toFa(today.shift.startTime)}–{toFa(today.shift.endTime)}
          </Text>
        ) : null}
        {today.shift?.forecast ? (
          <Text style={[styles.todayCardHint, { color }]}>
            بر اساس سیکل — لوحه هنوز منتشر نشده
          </Text>
        ) : null}
        <View style={styles.todayCardFooter}>
          <Text style={styles.todayCardFooterText}>
            {today.events.length > 0 ? `${toFa(today.events.length)} رویداد/کار` : 'بدون رویداد'}
          </Text>
          {nextOff !== null && (
            <Text style={styles.todayCardFooterText}>{toFa(nextOff)} روز تا آف 🎉</Text>
          )}
        </View>
      </View>
    )
  }

  function getEventEmoji(type: string): string {
    switch (type) {
      case 'overtime':
      case 'work_log':
        return '⏱️'
      case 'financial':
        return '💰'
      case 'leave_sick':
      case 'leave_daily':
      case 'leave_hourly':
        return '🌴'
      case 'on_call':
        return '📞'
      case 'note':
        return '📝'
      case 'birthday':
        return '🎂'
      default:
        return '📌'
    }
  }

  function renderCell(day: CalendarDay) {
    const jDayNum = Number(day.jalali.slice(8))
    const isToday = day.date === todayStr
    const isSelected = day.date === selectedDate
    const isFriday = day.weekday === 6
    const isOffHoliday = day.holidays.some((h) => h.isOffDay)
    const meta = day.shift ? SHIFT_PALETTE[day.shift.code] : null
    const color = day.shift ? shiftColor(day.shift.code) : theme.colors.secondary
    const hasTasks = day.events.some((e) => e.type === 'task')
    const nonTaskEvents = day.events.filter((e) => e.type !== 'task')
    const uniqueEmojis = Array.from(new Set(nonTaskEvents.map((e) => getEventEmoji(e.type))))
    if (day.trips && day.trips.length > 0) {
      uniqueEmojis.unshift('🚇')
    }

    const holidayTitle = day.holidays.map((h) => h.title).join('، ')

    return (
      <TouchableOpacity
        key={day.date}
        style={styles.cellWrapper}
        accessibilityLabel={`${toFa(jDayNum)}${meta ? `، شیفت ${meta.label}` : ''}${day.events.length > 0 ? `، ${toFa(day.events.length)} رویداد` : ''}`}
        onPress={() => selectDay(day.date)}
      >
        <View style={[styles.cell, isToday && styles.cellToday, isSelected && styles.cellSelected]}>
          <View style={styles.cellNumRow}>
            <Text
              style={[
                styles.cellNum,
                isToday
                  ? styles.cellNumToday
                  : isFriday || isOffHoliday
                    ? styles.cellNumHoliday
                    : null,
              ]}
            >
              {toFa(jDayNum)}
            </Text>
            {day.orgEvents.length > 0 && <Text style={styles.orgMark}>◆</Text>}
          </View>

          {meta && day.shift ? (
            <View
              style={[
                styles.shiftBar,
                { backgroundColor: color },
                day.shift.forecast && [styles.shiftBarForecast, { borderColor: color }],
              ]}
            >
              <Text style={styles.shiftBarText}>{meta.label}</Text>
            </View>
          ) : (
            <View style={{ height: 14 }} />
          )}

          {holidayTitle ? (
            <Text
              numberOfLines={1}
              style={{
                fontSize: 8,
                fontWeight: isOffHoliday ? '700' : '500',
                color: isOffHoliday ? theme.colors.error : '#f59e0b',
                textAlign: 'right',
                marginTop: 1,
              }}
            >
              {holidayTitle}
            </Text>
          ) : null}

          <View style={styles.dotsRow}>
            {uniqueEmojis.slice(0, 2).map((emoji, idx) => (
              <Text key={idx} style={{ fontSize: 10, marginHorizontal: 1 }}>
                {emoji}
              </Text>
            ))}
            {uniqueEmojis.length > 2 && <Text style={styles.moreText}>+{toFa(uniqueEmojis.length - 2)}</Text>}
            {hasTasks && (
              <Text style={[styles.moreText, { color: isDark ? EVT_TASK.dark : EVT_TASK.light }]}>
                ☐
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  function getEventColor(type: string): string {
    switch (type) {
      case 'on_call':
        return '#3b82f6'
      case 'overtime':
        return '#a855f7'
      case 'leave_sick':
        return '#059669'
      case 'leave_daily':
        return '#22c55e'
      case 'note':
        return '#f59e0b'
      case 'leave_hourly':
        return '#f97316'
      case 'other':
        return '#b91c1c'
      case 'reminder':
        return '#ef4444'
      case 'task':
        return isDark ? EVT_TASK.dark : EVT_TASK.light
      default:
        return isDark ? EVT_PERSONAL.dark : EVT_PERSONAL.light
    }
  }

  function renderEventRow(e: CalendarEventEntry) {
    const personalColor = getEventColor(e.type)
    const taskColor = isDark ? EVT_TASK.dark : EVT_TASK.light

    return (
      <View key={e.id} style={styles.eventWrapper}>
        <View style={styles.eventRow}>
          {e.type === 'task' ? (
            <TouchableOpacity
              accessibilityLabel={`انجام شد: ${e.title}`}
              onPress={() => toggleTask(e.id, !e.isDone)}
              style={[
                styles.checkbox,
                { borderColor: taskColor },
                e.isDone && { backgroundColor: taskColor },
              ]}
            >
              {e.isDone && <MaterialIcons name="check" size={16} color="#fff" />}
            </TouchableOpacity>
          ) : e.type === 'financial' ? (
            <Text style={{ fontSize: 16 }}>💰</Text>
          ) : e.type === 'work_log' ? (
            <Text style={{ fontSize: 16 }}>⏱️</Text>
          ) : (
            <View style={[styles.evtDot, { width: 8, height: 8, backgroundColor: personalColor }]} />
          )}

          <Text style={[styles.eventTitle, e.type === 'task' && e.isDone && styles.eventTitleDone]}>
            {e.title}
          </Text>

          {e.type === 'financial' && e.metadata?.amount ? (
            <View style={[
              styles.badge,
              { backgroundColor: e.metadata.isIncome !== false ? '#10b98120' : '#ef444420' }
            ]}>
              <Text style={[
                styles.badgeText,
                { color: e.metadata.isIncome !== false ? '#10b981' : '#ef4444' }
              ]}>
                {e.metadata.isIncome !== false ? '+' : '−'} {toFa(Number(e.metadata.amount).toLocaleString())} تومان
              </Text>
            </View>
          ) : null}

          {(e.type === 'work_log' || e.type === 'overtime' || e.type === 'leave_hourly') && e.metadata?.hours ? (
            <View style={[styles.badge, { backgroundColor: '#0284c720' }]}>
              <Text style={[styles.badgeText, { color: '#0284c7' }]}>
                {toFa(e.metadata.hours)} ساعت
              </Text>
            </View>
          ) : null}

          {!e.occurrence && (
            <TouchableOpacity
              style={styles.deleteBtn}
              accessibilityLabel={`حذف ${e.title}`}
              onPress={() => deleteEvent(e.id)}
            >
              <MaterialIcons name="delete-outline" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
          )}
        </View>
        {e.description ? (
          <Text style={styles.eventDesc}>{e.description}</Text>
        ) : null}
      </View>
    )
  }

  return (
    <ScreenWrapper
      title={`${JALALI_MONTHS[jMonth - 1]} ${toFa(jYear)}`}
      navigation={navigation}
      scrollable={false}
    >
      <View style={styles.header}>
        <Text style={styles.monthTitle}>
          {JALALI_MONTHS[jMonth - 1]} {toFa(jYear)}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.todayBtn} onPress={goToToday}>
            <Text style={styles.todayBtnText}>امروز</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={prevMonth} accessibilityLabel="ماه قبل">
            <MaterialIcons name="chevron-right" size={26} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={nextMonth} accessibilityLabel="ماه بعد">
            <MaterialIcons name="chevron-left" size={26} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadMonth()}>
              <Text style={styles.retryText}>تلاش دوباره</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderTodayCard()}

        <View style={styles.calendarCard}>
          <View style={styles.weekDaysRow}>
            {WEEKDAYS.map((wd, i) => (
              <Text key={wd} style={[styles.weekDayHeader, i === 6 && styles.weekDayHeaderFriday]}>
                {wd}
              </Text>
            ))}
          </View>

          <View style={styles.gridContainer}>
            {isLoading && days.length === 0
              ? Array.from({ length: 35 }).map((_, i) => (
                  <View key={`sk-${i}`} style={styles.cellWrapper}>
                    <View style={styles.skeletonCell} />
                  </View>
                ))
              : [
                  ...Array.from({ length: startOffset }).map((_, i) => (
                    <View key={`off-${i}`} style={styles.cellWrapper} />
                  )),
                  ...days.map((day) => renderCell(day)),
                ]}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sheet روز منتخب */}
      <Modal
        visible={selectedDay !== null}
        animationType="slide"
        transparent
        onRequestClose={() => selectDay(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDay ? getJalaliDateLabel(new Date(`${selectedDay.date}T12:00:00`)) : ''}
              </Text>
              <TouchableOpacity onPress={() => selectDay(null)} accessibilityLabel="بستن">
                <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            {selectedDay && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {selectedDay.holidays.length > 0 && (
                  <View
                    style={[
                      styles.holidayBox,
                      !selectedDay.holidays.some((h) => h.isOffDay) && {
                        backgroundColor: '#f59e0b20',
                        borderColor: '#f59e0b40',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.holidayText,
                        !selectedDay.holidays.some((h) => h.isOffDay) && {
                          color: '#f59e0b',
                        },
                      ]}
                    >
                      {selectedDay.holidays.map((h) => {
                        const hijri = extractHijriDate(h.title)
                        return hijri ? `${h.title} (🌙 ${hijri})` : h.title
                      }).join('، ')}
                    </Text>
                  </View>
                )}

                {selectedDay.shift ? (
                  <View
                    style={[
                      styles.shiftDetailBox,
                      {
                        borderColor: shiftColor(selectedDay.shift.code) + '50',
                        backgroundColor: shiftColor(selectedDay.shift.code) + (isDark ? '22' : '14'),
                      },
                    ]}
                  >
                    <View style={styles.todayCardTitleRow}>
                      <Text style={styles.todayCardIcon}>
                        {SHIFT_PALETTE[selectedDay.shift.code]?.icon ?? '📅'}
                      </Text>
                      <Text
                        style={[styles.todayCardTitle, { color: shiftColor(selectedDay.shift.code) }]}
                      >
                        شیفت {SHIFT_PALETTE[selectedDay.shift.code]?.label ?? selectedDay.shift.code}
                      </Text>
                    </View>
                    {selectedDay.shift.startTime ? (
                      <Text style={[styles.todayCardTime, { color: shiftColor(selectedDay.shift.code) }]}>
                        {toFa(selectedDay.shift.startTime)}–{toFa(selectedDay.shift.endTime)}
                      </Text>
                    ) : null}
                    {selectedDay.shift.forecast && (
                      <Text
                        style={[styles.todayCardHint, { color: shiftColor(selectedDay.shift.code) }]}
                      >
                        پیش‌بینی سیکل — لوحه هنوز منتشر نشده
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>شیفتی ثبت نشده است</Text>
                )}

                {selectedDay.orgEvents.map((e) => (
                  <View key={e.id} style={styles.orgEventRow}>
                    <Text style={{ color: isDark ? EVT_ORG.dark : EVT_ORG.light }}>◆</Text>
                    <Text style={styles.eventTitle}>{e.title}</Text>
                    {e.mandatory && (
                      <View style={styles.mandatoryBadge}>
                        <Text style={styles.mandatoryBadgeText}>الزامی</Text>
                      </View>
                    )}
                  </View>
                ))}

                <Text style={styles.sectionLabel}>رویدادها و کارها</Text>
                {calculatedNetBalance !== null && (
                  <View style={[
                    styles.balanceCard,
                    {
                      borderColor: calculatedNetBalance >= 0 ? '#10b98150' : '#ef444450',
                      backgroundColor: calculatedNetBalance >= 0 ? '#10b98115' : '#ef444415'
                    }
                  ]}>
                    <Text style={[styles.balanceLabel, { color: calculatedNetBalance >= 0 ? '#10b981' : '#ef4444' }]}>
                      تراز مالی امروز (جمع و تفریق):
                    </Text>
                    <Text style={[styles.balanceValue, { color: calculatedNetBalance >= 0 ? '#10b981' : '#ef4444' }]}>
                      {calculatedNetBalance >= 0 ? '+' : '−'} {toFa(Math.abs(calculatedNetBalance).toLocaleString())} تومان
                    </Text>
                  </View>
                )}
                {selectedDay.events.length === 0 ? (
                  <Text style={styles.emptyText}>روز آزاد شماست ✨ رویدادی اضافه کنید.</Text>
                ) : (
                  selectedDay.events.map((e) => renderEventRow(e))
                )}

                <View style={styles.quickAddBox}>
                  {selectedDay.shift && selectedDay.shift.code !== 'off' && (
                    <View style={styles.conflictBox}>
                      <MaterialIcons name="warning-amber" size={16} color={theme.colors.warning} />
                      <Text style={styles.conflictText}>
                        این روز شیفت {SHIFT_PALETTE[selectedDay.shift.code]?.label ?? ''} هستید
                        {selectedDay.shift.startTime
                          ? ` (${toFa(selectedDay.shift.startTime)}–${toFa(selectedDay.shift.endTime)})`
                          : ''}
                      </Text>
                    </View>
                  )}

                  {/* منوی ثبت وضعیت روز */}
                  <Text style={styles.sectionLabel}>منوی ثبت وضعیت روز</Text>
                  <View style={styles.statusGrid}>
                    {STATUS_MENU.map((item) => {
                      const isSelected = newType === item.key
                      return (
                        <TouchableOpacity
                          key={item.key}
                          onPress={() => handleSelectType(item.key, item.label)}
                          style={[
                            styles.statusBtn,
                            { backgroundColor: item.color },
                            isSelected && { borderWidth: 2, borderColor: theme.colors.onSurface }
                          ]}
                        >
                          <Text style={[styles.statusBtnText, { color: item.textColor }]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>

                  {/* سایر موارد */}
                  <Text style={styles.sectionLabel}>سایر موارد</Text>
                  <View style={styles.typeChipsRow}>
                    {OTHER_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t.key}
                        style={[
                          styles.typeChip,
                          newType === t.key && [styles.typeChipActive, { borderColor: t.color, backgroundColor: t.color + '20' }]
                        ]}
                        onPress={() => handleSelectType(t.key, t.label)}
                      >
                        <Text
                          style={[
                            styles.typeChipText,
                            newType === t.key && [styles.typeChipTextActive, { color: t.color }]
                          ]}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Reminder selection (only for event / reminder) */}
                  {(newType === 'event' || newType === 'reminder') && (
                    <>
                      <Text style={styles.sectionLabel}>یادآور</Text>
                      <View style={styles.typeChipsRow}>
                        {(
                          [
                            { label: '🔕 بدون یادآور', value: null },
                            { label: '⏰ صبح همان روز', value: 0 },
                            { label: '⏰ ۱ روز قبل', value: 1440 },
                          ] as const
                        ).map((r) => (
                          <TouchableOpacity
                            key={String(r.value)}
                            style={[styles.typeChip, newReminder === r.value && styles.typeChipActive]}
                            onPress={() => setNewReminder(r.value)}
                          >
                            <Text
                              style={[
                                styles.typeChipText,
                                newReminder === r.value && styles.typeChipTextActive,
                              ]}
                            >
                              {r.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  {/* Dynamic Fields */}
                  <View style={styles.dynamicFieldsRow}>
                    <TextInput
                      style={styles.addInput}
                      placeholder={
                        newType === 'task'
                          ? 'کار جدید…'
                          : newType === 'financial'
                          ? 'عنوان تراکنش…'
                          : newType === 'work_log'
                          ? 'عنوان فعالیت…'
                          : 'مورد جدید…'
                      }
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={newTitle}
                      onChangeText={setNewTitle}
                    />

                    {newType === 'financial' && (
                      <>
                        <TextInput
                          style={[styles.addInput, { width: 110 }]}
                          placeholder="مبلغ (تومان)..."
                          placeholderTextColor={theme.colors.onSurfaceVariant}
                          value={newAmount}
                          onChangeText={setNewAmount}
                          keyboardType="numeric"
                        />
                        <View style={styles.financialToggleRow}>
                          <TouchableOpacity
                            onPress={() => setNewIsIncome(true)}
                            style={[
                              styles.toggleBtn,
                              newIsIncome && { backgroundColor: '#10b981' }
                            ]}
                          >
                            <Text style={[styles.toggleBtnText, newIsIncome && { color: '#ffffff' }]}>درآمد</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setNewIsIncome(false)}
                            style={[
                              styles.toggleBtn,
                              !newIsIncome && { backgroundColor: '#ef4444' }
                            ]}
                          >
                            <Text style={[styles.toggleBtnText, !newIsIncome && { color: '#ffffff' }]}>هزینه</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}

                    {(newType === 'work_log' || newType === 'leave_hourly' || newType === 'overtime') && (
                      <TextInput
                        style={[styles.addInput, { width: 80 }]}
                        placeholder="ساعت..."
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        value={newHours}
                        onChangeText={setNewHours}
                        keyboardType="numeric"
                      />
                    )}
                  </View>

                  {/* Description field */}
                  <TextInput
                    style={styles.addInput}
                    placeholder="توضیحات اختیاری (علت، جزئیات فعالیت، یادداشت روزانه...)"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={newDescription}
                    onChangeText={setNewDescription}
                  />

                  {/* Add button */}
                  <TouchableOpacity
                    style={[styles.addBtnLarge, (isSaving || newTitle.trim().length === 0) && { opacity: 0.5 }]}
                    onPress={handleAdd}
                    disabled={isSaving || newTitle.trim().length === 0}
                  >
                    <Text style={styles.addBtnLargeText}>{isSaving ? 'در حال ثبت…' : 'افزودن به تقویم زندگی'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  )
}

export default LifeCalendarScreen
