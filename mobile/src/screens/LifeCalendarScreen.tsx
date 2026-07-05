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
import { toFa, getJalaliDateLabel } from '../shared/jalali'
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
  const [newType, setNewType] = useState<'event' | 'task'>('event')
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

  async function handleAdd() {
    if (!selectedDay || newTitle.trim().length === 0) return
    setIsSaving(true)
    const ok = await addEvent({
      type: newType,
      title: newTitle.trim(),
      startAt: `${selectedDay.date}T00:00:00.000Z`,
      allDay: true,
      reminders: newReminder !== null ? [{ minutesBefore: newReminder }] : undefined,
    })
    setIsSaving(false)
    if (ok) {
      setNewTitle('')
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

  function renderCell(day: CalendarDay) {
    const jDayNum = Number(day.jalali.slice(8))
    const isToday = day.date === todayStr
    const isSelected = day.date === selectedDate
    const isFriday = day.weekday === 6
    const isOffHoliday = day.holidays.some((h) => h.isOffDay)
    const meta = day.shift ? SHIFT_PALETTE[day.shift.code] : null
    const color = day.shift ? shiftColor(day.shift.code) : theme.colors.secondary
    const dotEvents = day.events.filter((e) => e.type !== 'task')
    const hasTasks = day.events.some((e) => e.type === 'task')

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

          <View style={styles.dotsRow}>
            {dotEvents.slice(0, 2).map((e) => (
              <View
                key={e.id}
                style={[
                  styles.evtDot,
                  { backgroundColor: isDark ? EVT_PERSONAL.dark : EVT_PERSONAL.light },
                ]}
              />
            ))}
            {dotEvents.length > 2 && <Text style={styles.moreText}>+{toFa(dotEvents.length - 2)}</Text>}
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

  function renderEventRow(e: CalendarEventEntry) {
    const personalColor = isDark ? EVT_PERSONAL.dark : EVT_PERSONAL.light
    const taskColor = isDark ? EVT_TASK.dark : EVT_TASK.light

    return (
      <View key={e.id} style={styles.eventRow}>
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
        ) : (
          <View style={[styles.evtDot, { width: 8, height: 8, backgroundColor: personalColor }]} />
        )}
        <Text style={[styles.eventTitle, e.type === 'task' && e.isDone && styles.eventTitleDone]}>
          {e.title}
        </Text>
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
                  <View style={styles.holidayBox}>
                    <Text style={styles.holidayText}>
                      {selectedDay.holidays.map((h) => h.title).join('، ')}
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
                {selectedDay.events.length === 0 ? (
                  <Text style={styles.emptyText}>روز آزاد شماست ✨ رویدادی اضافه کنید.</Text>
                ) : (
                  selectedDay.events.map((e) => renderEventRow(e))
                )}

                <View style={styles.quickAddBox}>
                  <View style={styles.typeChipsRow}>
                    <TouchableOpacity
                      style={[styles.typeChip, newType === 'event' && styles.typeChipActive]}
                      onPress={() => setNewType('event')}
                    >
                      <Text
                        style={[styles.typeChipText, newType === 'event' && styles.typeChipTextActive]}
                      >
                        رویداد
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeChip, newType === 'task' && styles.typeChipActive]}
                      onPress={() => setNewType('task')}
                    >
                      <Text
                        style={[styles.typeChipText, newType === 'task' && styles.typeChipTextActive]}
                      >
                        کار
                      </Text>
                    </TouchableOpacity>
                  </View>
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
                  <View style={styles.addRow}>
                    <TextInput
                      style={styles.addInput}
                      placeholder={newType === 'task' ? 'کار جدید…' : 'رویداد جدید…'}
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={newTitle}
                      onChangeText={setNewTitle}
                      onSubmitEditing={handleAdd}
                    />
                    <TouchableOpacity
                      style={[styles.addBtn, (isSaving || newTitle.trim().length === 0) && { opacity: 0.5 }]}
                      onPress={handleAdd}
                      disabled={isSaving || newTitle.trim().length === 0}
                    >
                      <Text style={styles.addBtnText}>{isSaving ? '…' : 'افزودن'}</Text>
                    </TouchableOpacity>
                  </View>
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
