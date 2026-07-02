import React, { useState, useEffect, useMemo } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  Modal
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useAuthStore } from '../stores/auth'
import { useShiftsStore, DailyTask } from '../stores/shifts'
import { useLeaveStore } from '../stores/leaves'
import { useConfigStore } from '../stores/config'
import {
  gregorianToJalali,
  jalaliToGregorian,
  getJalaliMonthLength,
  getJalaliDateString,
  getJalaliDateLabel,
  toFa,
  getJalaliHoliday
} from '../shared/jalali'
import { useTheme } from '../shared/ThemeProvider'
import { ScreenWrapper } from '../shared/ScreenWrapper'
import { getShiftForUserAndDate } from '../shared/cycle-math'

const SHIFT_MAPPING: Record<string, { label: string; color: string; bg: string }> = {
  morning: { label: 'روزکار', color: '#f97316', bg: '#fff7ed' },
  evening: { label: 'عصرکار', color: '#0ea5e9', bg: '#f0f9ff' },
  night: { label: 'شب‌کار', color: '#4f46e5', bg: '#e0e7ff' },
  office: { label: 'اداری', color: '#a855f7', bg: '#faf5ff' },
  off: { label: 'استراحت', color: '#9ca3af', bg: '#f9fafb' },
}

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
]

export function CalendarScreen({ navigation }: any) {
  const { user } = useAuthStore()
  const {
    assignments,
    templates,
    notes,
    tasks,
    isLoading,
    isAdminSimulated,
    toggleAdminSimulation,
    loadPersistedData,
    saveNote,
    addTask,
    toggleTaskStatus,
    deleteTask
  } = useShiftsStore()

  const { leaves, fetchLeaves, addLeave } = useLeaveStore()
  const accessToken = useAuthStore(s => s.accessToken)
  const isAuthLoading = useAuthStore(s => s.isLoading)
  const config = useConfigStore(s => s.config)
  const showHolidays = config?.shifts?.showHolidays ?? true

  // Determine current Jalali date to initialize the navigation
  const today = new Date()
  const [todayJy, todayJm, todayJd] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate())

  const [currentMonth, setCurrentMonth] = useState(todayJm)
  const [currentYear, setCurrentYear] = useState(todayJy)
  const [selectedDay, setSelectedDay] = useState(todayJd)
  
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'list'>('month')

  // Personal task input states
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskTime, setNewTaskTime] = useState('08:00')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')

  // OCC Task inject states (Admin only)
  const [systemTitle, setSystemTitle] = useState('')
  const [systemTime, setSystemTime] = useState('08:00')
  const [systemPriority, setSystemPriority] = useState('high')
  const [systemOvertime, setSystemOvertime] = useState('0')
  const [systemKahrizak, setSystemKahrizak] = useState('0')

  // Note input state
  const [noteText, setNoteText] = useState('')

  // Modal state for day details
  const [isDetailsVisible, setIsDetailsVisible] = useState(false)

  // Load persisted store data on mount
  useEffect(() => {
    void loadPersistedData()
  }, [])

  useEffect(() => {
    if (accessToken) {
      // Fetch leaves for the current month. Format: YYYY-MM
      const yyyy = String(selectedGregDate.getFullYear())
      const mm = String(selectedGregDate.getMonth() + 1).padStart(2, '0')
      fetchLeaves(accessToken, `${yyyy}-${mm}`)
    }
  }, [accessToken, currentMonth, currentYear])

  // Resolve user work group from profile settings
  const userGroup = user?.customFields?.group || 'A'

  // Selected date object and string key
  const selectedGregDate = useMemo(() => {
    return jalaliToGregorian(currentYear, currentMonth, selectedDay)
  }, [currentYear, currentMonth, selectedDay])

  const selectedDateStr = useMemo(() => {
    return getJalaliDateString(selectedGregDate)
  }, [selectedGregDate])

  // Synchronize note input when day changes
  useEffect(() => {
    const currentNote = notes.find((n) => n.userId === 'current' && n.date === selectedDateStr)
    setNoteText(currentNote?.content || '')
  }, [selectedDateStr, notes])

  // Month Grid Calculation
  const firstDayGreg = useMemo(() => {
    return jalaliToGregorian(currentYear, currentMonth, 1)
  }, [currentYear, currentMonth])

  const daysCount = useMemo(() => {
    return getJalaliMonthLength(currentYear, currentMonth)
  }, [currentYear, currentMonth])

  // Start weekday offset: Saturday is index 0
  const startWeekday = (firstDayGreg.getDay() + 1) % 7

  // Day list helper for rendering the grid
  const daysGrid = useMemo(() => {
    const cells = []
    
    // Empty prefix cells
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ isOffset: true, key: `offset-${i}` })
    }

    // Actual month days
    for (let d = 1; d <= daysCount; d++) {
      const cellGregDate = jalaliToGregorian(currentYear, currentMonth, d)
      const cellDateStr = getJalaliDateString(cellGregDate)
      
      const resolved = getShiftForUserAndDate('current', cellGregDate, assignments, templates, userGroup)
      const dayTasks = tasks.filter((t) => t.userId === 'current' && t.date === cellDateStr)
      const dayNote = notes.find((n) => n.userId === 'current' && n.date === cellDateStr)
      const dayLeaves = leaves.filter((l) => {
        const from = new Date(l.fromDate)
        const to = new Date(l.toDate)
        // Set hours to 0 to compare dates purely
        from.setHours(0,0,0,0)
        to.setHours(23,59,59,999)
        const cellDt = new Date(cellGregDate)
        return cellDt >= from && cellDt <= to
      })

      cells.push({
        isOffset: false,
        key: `day-${d}`,
        dayNumber: d,
        dateStr: cellDateStr,
        gregDate: cellGregDate,
        resolvedShift: resolved,
        hasTasks: dayTasks.length > 0,
        hasNote: !!dayNote?.content,
        leaves: dayLeaves,
        isToday: currentYear === todayJy && currentMonth === todayJm && d === todayJd,
        isFriday: cellGregDate.getDay() === 5,
        holidayName: getJalaliHoliday(currentYear, currentMonth, d)
      })
    }
    return cells
  }, [currentYear, currentMonth, daysCount, startWeekday, assignments, templates, tasks, notes, leaves, userGroup, todayJy, todayJm, todayJd])

  const weekGrid = useMemo(() => {
    const selectedIndex = startWeekday + selectedDay - 1
    const weekStart = Math.floor(selectedIndex / 7) * 7
    return daysGrid.slice(weekStart, weekStart + 7)
  }, [daysGrid, startWeekday, selectedDay])

  const selectedDayData = useMemo(() => {
    const resolved = getShiftForUserAndDate('current', selectedGregDate, assignments, templates, userGroup)
    const dayTasks = tasks.filter((t) => t.userId === 'current' && t.date === selectedDateStr)
    const dayNote = notes.find((n) => n.userId === 'current' && n.date === selectedDateStr)
    const dayLeaves = leaves.filter((l) => {
      const from = new Date(l.fromDate)
      const to = new Date(l.toDate)
      from.setHours(0,0,0,0)
      to.setHours(23,59,59,999)
      const cellDt = new Date(selectedGregDate)
      return cellDt >= from && cellDt <= to
    })

    return {
      dateLabel: getJalaliDateLabel(selectedGregDate),
      resolved: resolved,
      tasks: dayTasks,
      note: dayNote,
      leaves: dayLeaves
    }
  }, [selectedGregDate, selectedDateStr, assignments, templates, tasks, notes, leaves, userGroup])

  // Monthly Performance Summary
  const monthlyMetrics = useMemo(() => {
    let overtime = 0
    let kahrizak = 0
    let workedHours = 0
    let totalTasks = 0
    let completedTasks = 0

    for (let d = 1; d <= daysCount; d++) {
      const cellGregDate = jalaliToGregorian(currentYear, currentMonth, d)
      const cellDateStr = getJalaliDateString(cellGregDate)
      
      const resolved = getShiftForUserAndDate('current', cellGregDate, assignments, templates, userGroup)
      if (resolved && resolved.shift && resolved.shift.code !== 'off') {
        workedHours += resolved.shift.hours || 0
      }

      const dayTasks = tasks.filter((t) => t.userId === 'current' && t.date === cellDateStr)
      dayTasks.forEach((t) => {
        totalTasks++
        if (t.status === 'done') {
          completedTasks++
          if (t.type === 'system') {
            overtime += t.overtime || 0
            kahrizak += t.kahrizakCount || 0
          }
        }
      })
    }

    return {
      overtime,
      kahrizak,
      workedHours,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100
    }
  }, [currentYear, currentMonth, daysCount, assignments, templates, tasks, userGroup])

  // Handlers
  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
    setSelectedDay(1)
  }

  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
    setSelectedDay(1)
  }

  function handleSaveNote() {
    saveNote('current', selectedDateStr, noteText)
    Alert.alert('موفقیت', 'یادداشت روزانه با موفقیت ذخیره شد.')
  }

  function handleDeleteNote() {
    saveNote('current', selectedDateStr, '')
    setNoteText('')
    Alert.alert('حذف', 'یادداشت روزانه حذف شد.')
  }

  function handleCreateTask() {
    if (!newTaskTitle.trim()) return
    addTask({
      userId: 'current',
      date: selectedDateStr,
      title: newTaskTitle,
      time: newTaskTime,
      priority: newTaskPriority as 'low' | 'medium' | 'high',
      status: 'todo',
      type: 'personal'
    })
    setNewTaskTitle('')
  }

  function handleCreateSystemTask() {
    if (!systemTitle.trim()) return
    addTask({
      userId: 'current',
      date: selectedDateStr,
      title: systemTitle,
      time: systemTime,
      priority: systemPriority as 'low' | 'medium' | 'high',
      status: 'todo',
      type: 'system',
      overtime: Number(systemOvertime) || 0,
      kahrizakCount: Number(systemKahrizak) || 0
    })
    setSystemTitle('')
    setSystemOvertime('0')
    setSystemKahrizak('0')
    Alert.alert('تزریق تسک', 'تسک سیستمی با مقادیر اضافه‌کار و مأموریت ثبت شد.')
  }

  const dynamicLeaveOptions = config?.leaveTypes || [
    { label: 'استحقاقی', value: 'annual' },
    { label: 'استعلاجی', value: 'sick' },
    { label: 'مأموریت', value: 'mission' },
    { label: 'اضافه کار', value: 'overtime' },
    { label: 'کشیک', value: 'oncall' },
  ]

  // Leave Form States
  const [leaveType, setLeaveType] = useState(dynamicLeaveOptions[0]?.value || 'annual')
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveAmount, setLeaveAmount] = useState('')
  const [leaveUnit, setLeaveUnit] = useState('hours')
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false)


  async function handleAddLeave() {
    if (!accessToken) return
    setIsSubmittingLeave(true)
    
    // We set both fromDate and toDate to the selected date since we are picking single day on the calendar
    const dateStr = selectedGregDate.toISOString()
    const success = await addLeave(accessToken, {
      type: leaveType,
      fromDate: dateStr,
      toDate: dateStr,
      reason: leaveReason,
      amount: leaveAmount ? parseFloat(leaveAmount) : undefined,
      unit: leaveAmount ? leaveUnit : undefined
    })
    
    setIsSubmittingLeave(false)
    if (success) {
      setLeaveReason('')
      setLeaveAmount('')
      Alert.alert('موفقیت', 'درخواست شما با موفقیت ثبت شد.')
    } else {
      Alert.alert('خطا', 'مشکلی در ثبت درخواست به وجود آمد.')
    }
  }

  const { theme } = useTheme()

  const shiftCounts = useMemo(() => {
    let day = 0, night = 0, off = 0, leaveCount = 0
    daysGrid.forEach(cell => {
      if (!cell.isOffset && cell.resolvedShift?.shift) {
        if (cell.resolvedShift.shift.code === 'morning') day++
        else if (cell.resolvedShift.shift.code === 'night') night++
        else if (cell.resolvedShift.shift.code === 'off') off++
      }
      if (!cell.isOffset && cell.leaves && cell.leaves.length > 0) {
        leaveCount++
      }
    })
    return { day, night, off, leaveCount }
  }, [daysGrid])

  function jumpToToday() {
    const today = new Date()
    const [jy, jm, jd] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate())
    setCurrentYear(jy)
    setCurrentMonth(jm)
    setSelectedDay(jd)
  }

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1 },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: theme.colors.surfaceContainerLow },
    monthSelectorBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
    monthSelectorText: { fontFamily: theme.typography.screenTitle.fontFamily, fontSize: 18, fontWeight: '700', color: theme.colors.primary },
    todayBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: theme.colors.primaryContainer + '20' },
    todayBtnText: { color: theme.colors.primary, fontFamily: theme.typography.captionSm.fontFamily, fontSize: theme.typography.captionSm.fontSize, fontWeight: '700' },
    
    content: { flex: 1, paddingHorizontal: theme.spacing.containerMargin, gap: theme.spacing.stackSpace, paddingBottom: 16 },
    viewSwitcher: { flexDirection: 'row-reverse', backgroundColor: theme.colors.surfaceContainerLow, padding: 4, borderRadius: 9999, marginVertical: 8 },
    viewTabActive: { flex: 1, backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: 9999, paddingVertical: 8, alignItems: 'center', ...theme.shadows.level1 },
    viewTabInactive: { flex: 1, paddingVertical: 8, alignItems: 'center' },
    viewTabTextActive: { fontFamily: theme.typography.cardTitle.fontFamily, fontSize: 13, color: theme.colors.primary, fontWeight: 'bold' },
    viewTabTextInactive: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: 13, color: theme.colors.secondary },
    
    legend: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    legendItemsRow: { flexDirection: 'row-reverse', gap: 12 },
    legendItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: 11, color: theme.colors.secondary },
    
    calendarCard: { backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.xl, padding: 10, borderWidth: 1, borderColor: theme.colors.surfaceVariant, ...theme.shadows.level1 },
    weekDaysRow: { flexDirection: 'row-reverse', borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant, paddingBottom: 8, marginBottom: 8 },
    weekDayHeader: { flex: 1, textAlign: 'center', fontFamily: theme.typography.captionSm.fontFamily, fontSize: theme.typography.captionSm.fontSize, color: theme.colors.secondary },
    weekDayHeaderFriday: { flex: 1, textAlign: 'center', fontFamily: theme.typography.captionSm.fontFamily, fontSize: theme.typography.captionSm.fontSize, color: theme.colors.primary },
    
    gridContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap' },
    gridCellWrapper: { width: '14.28%', minHeight: 60, padding: 2 },
    gridCellEmpty: { flex: 1, borderRadius: theme.borderRadius.lg },
    gridCell: { flex: 1, borderRadius: theme.borderRadius.lg, backgroundColor: theme.colors.surface, padding: 6, justifyContent: 'space-between' },
    gridCellSelected: { backgroundColor: theme.colors.primaryContainer + '10', borderWidth: 2, borderColor: theme.colors.primary, ...theme.shadows.level1 },
    gridCellTodayMarker: { position: 'absolute', top: 4, left: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
    gridCellLeaveMarker: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.error },
    gridCellNum: { fontFamily: theme.typography.bodyMd.fontFamily, fontSize: theme.typography.bodyMd.fontSize, color: theme.colors.onSurface, textAlign: 'right' },
    gridCellNumSelected: { color: theme.colors.primary, fontWeight: 'bold' },
    gridCellNumFriday: { color: theme.colors.primary },
    gridCellNumHoliday: { color: theme.colors.error },
    shiftBar: { width: '100%', height: 6, borderRadius: 3 },
    
    // List view styles
    listViewContainer: { flex: 1, paddingVertical: 4 },
    listItemWrapper: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.surfaceVariant, ...theme.shadows.level1 },
    listItemDateBox: { width: 60, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: theme.colors.surfaceVariant, paddingLeft: 8, marginLeft: 8 },
    listItemDayName: { fontSize: 11, color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily },
    listItemDayNum: { fontSize: 20, color: theme.colors.onSurface, fontFamily: theme.typography.numericHero.fontFamily, fontWeight: 'bold' },
    listItemDayNumToday: { color: theme.colors.primary },
    listItemDayNumFriday: { color: theme.colors.primary },
    listItemDayNumHoliday: { color: theme.colors.error },
    listItemContent: { flex: 1, gap: 4 },
    listItemHoliday: { color: theme.colors.error, fontSize: 11, fontFamily: theme.typography.captionSm.fontFamily },
    listItemTasksBox: { flexDirection: 'row-reverse', gap: 6, marginTop: 4 },
    listTaskBadge: { backgroundColor: theme.colors.surfaceContainerHighest, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    listTaskBadgeText: { fontSize: 10, color: theme.colors.primary, fontFamily: theme.typography.captionSm.fontFamily },

    summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 12, marginTop: 8 },
    summaryCard: { flex: 1, backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.xl, padding: 12, ...theme.shadows.level1, alignItems: 'center', gap: 4, borderBottomWidth: 3 },
    summaryCardLabel: { fontFamily: theme.typography.captionSm.fontFamily, fontSize: theme.typography.captionSm.fontSize, color: theme.colors.secondary },
    summaryCardValue: { fontFamily: theme.typography.numericHero.fontFamily, fontSize: 20, color: theme.colors.onSurface, fontWeight: '800' },
    
    // Bottom sections
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: theme.colors.background, borderTopLeftRadius: theme.borderRadius.xl, borderTopRightRadius: theme.borderRadius.xl, padding: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant, paddingBottom: 12 },
    modalTitleContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
    modalTitle: { fontFamily: theme.typography.sectionTitle.fontFamily, fontSize: theme.typography.sectionTitle.fontSize, fontWeight: '700', color: theme.colors.onSurface },
    modalHolidayText: { fontFamily: theme.typography.captionSm.fontFamily, color: theme.colors.error, fontSize: 12, marginTop: 4, textAlign: 'right' },
    closeModalBtn: { padding: 4 },
    
    shiftDetailsBox: { backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.xl, padding: 16, borderWidth: 1, borderColor: theme.colors.surfaceVariant, marginBottom: 16, ...theme.shadows.level1 },
    shiftDetailsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
    shiftDetailsLabel: { color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily, fontWeight: '700' },
    shiftBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999 },
    shiftBadgeText: { fontFamily: theme.typography.captionSm.fontFamily, fontWeight: '700' },
    noShiftText: { color: theme.colors.onSurfaceVariant, fontFamily: theme.typography.captionSm.fontFamily },
    shiftHoursRow: { borderTopWidth: 1, borderTopColor: theme.colors.surfaceVariant, marginTop: 12, paddingTop: 12, flexDirection: 'row-reverse', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
    shiftHoursCol: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
    shiftHoursText: { color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily },
    
    detailsCard: { backgroundColor: theme.colors.surfaceContainerLowest, borderRadius: theme.borderRadius.xl, padding: 16, borderWidth: 1, borderColor: theme.colors.surfaceVariant, marginBottom: 16, ...theme.shadows.level1 },
    cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant, paddingBottom: 8 },
    cardTitle: { fontFamily: theme.typography.sectionTitle.fontFamily, fontSize: 16, fontWeight: '700', color: theme.colors.onSurface },
    textarea: { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceVariant, borderWidth: 1, borderRadius: theme.borderRadius.md, padding: 12, color: theme.colors.onSurface, fontFamily: theme.typography.bodyMd.fontFamily, textAlign: 'right', minHeight: 80 },
    cardActions: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
    saveNoteButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.borderRadius.lg },
    saveNoteText: { color: theme.colors.onPrimary, fontFamily: theme.typography.cardTitle.fontFamily, fontWeight: '600' },
    deleteNoteButton: { padding: 10, backgroundColor: theme.colors.errorContainer, borderRadius: theme.borderRadius.lg },
    
    taskList: { marginBottom: 16 },
    emptyTasksText: { textAlign: 'center', color: theme.colors.secondary, fontFamily: theme.typography.bodyMd.fontFamily, paddingVertical: 16 },
    taskItem: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.lg, padding: 12, marginBottom: 8 },
    taskItemDone: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceContainerLow, opacity: 0.9 },
    taskCheckRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
    checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: theme.colors.secondary, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
    taskTitleText: { color: theme.colors.onSurface, fontFamily: theme.typography.bodyMd.fontFamily, flex: 1, textAlign: 'right', fontWeight: '600' },
    taskTitleTextDone: { textDecorationLine: 'line-through', color: theme.colors.secondary },
    systemFieldsBox: { marginTop: 8, backgroundColor: theme.colors.surfaceContainer, borderRadius: theme.borderRadius.sm, padding: 8 },
    systemTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginBottom: 4 },
    systemFieldHeader: { fontSize: 11, color: theme.colors.primary, fontWeight: 'bold' },
    systemFieldDetail: { fontSize: 11, color: theme.colors.secondary, textAlign: 'right' },
    taskMetaRow: { flexDirection: 'row-reverse', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.surfaceVariant, paddingTop: 8, gap: 4 },
    taskMetaText: { fontSize: 12, color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily },
    taskDeleteBtn: { marginRight: 'auto', padding: 6 },
    
    taskCreatorBox: { borderTopWidth: 1, borderTopColor: theme.colors.surfaceVariant, paddingTop: 16, marginTop: 8 },
    taskInput: { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceVariant, borderWidth: 1, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, height: 48, color: theme.colors.onSurface, fontFamily: theme.typography.bodyMd.fontFamily, textAlign: 'right', marginBottom: 12 },
    taskCreatorControls: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
    timeInputBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
    timeInputLabel: { color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, fontWeight: '600' },
    timeInput: { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceVariant, borderWidth: 1, borderRadius: theme.borderRadius.sm, width: 80, height: 40, color: theme.colors.onSurface, textAlign: 'center', fontFamily: theme.typography.bodyMd.fontFamily },
    addTaskBtn: { backgroundColor: theme.colors.surfaceContainerHighest, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, height: 40, borderRadius: theme.borderRadius.lg, gap: 6 },
    addTaskBtnText: { color: theme.colors.primary, fontFamily: theme.typography.cardTitle.fontFamily, fontWeight: 'bold' },
    
    adminSimulationBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', borderRadius: theme.borderRadius.lg, paddingHorizontal: 16, height: 56, marginBottom: 16, ...theme.shadows.level1 },
    adminSimLabelContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
    adminSimLabel: { fontSize: 13, color: '#b45309', fontWeight: 'bold', fontFamily: theme.typography.bodyMd.fontFamily },
    adminSimButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: '#fde68a', backgroundColor: '#ffffff' },
    adminSimButtonActive: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
    adminSimButtonText: { fontSize: 13, color: '#d97706', fontWeight: '600', fontFamily: theme.typography.bodyMd.fontFamily },
    adminSimButtonTextActive: { color: '#b45309', fontWeight: 'bold' },
    
    systemTaskCreatorBox: { borderTopWidth: 1, borderTopColor: '#fecaca', paddingTop: 16, marginTop: 16 },
    systemCreatorHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 12 },
    systemCreatorHeaderTitle: { fontSize: 13, fontWeight: 'bold', color: theme.colors.primary, fontFamily: theme.typography.bodyMd.fontFamily },
    systemFieldsInputsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 12 },
    systemFieldCol: { width: '48%' },
    systemFieldInputLabel: { color: theme.colors.secondary, fontSize: 12, marginBottom: 6, textAlign: 'right', fontWeight: '600', fontFamily: theme.typography.captionSm.fontFamily },
    systemNumericInput: { backgroundColor: theme.colors.background, borderColor: theme.colors.surfaceVariant, borderWidth: 1, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, height: 48, color: theme.colors.onSurface, textAlign: 'center', fontFamily: theme.typography.bodyMd.fontFamily },
    addSystemTaskBtn: { backgroundColor: theme.colors.primary, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 16, height: 40, borderRadius: theme.borderRadius.lg, gap: 6 },
    
    // Leave Select 
    leaveTypeOptions: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    leaveTypeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, borderWidth: 1, borderColor: theme.colors.surfaceVariant, backgroundColor: theme.colors.surfaceContainerLowest },
    leaveTypeBtnActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer },
    leaveTypeBtnText: { fontFamily: theme.typography.captionSm.fontFamily, color: theme.colors.secondary },
    leaveTypeBtnTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
    leaveRequestItem: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.surfaceVariant, borderRadius: theme.borderRadius.md, padding: 12, marginTop: 8 },
    leaveRequestTitle: { fontFamily: theme.typography.bodyMd.fontFamily, fontWeight: 'bold', color: theme.colors.onSurface },
    leaveRequestStatus: { fontSize: 11, fontFamily: theme.typography.captionSm.fontFamily, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
    leaveSubmitBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  })

  return (
    <ScreenWrapper title={`${JALALI_MONTHS[currentMonth - 1]} ${toFa(currentYear)}`} navigation={navigation} scrollable={false}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.container}
      >
        {/* Top App Bar (Header) */}
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <TouchableOpacity style={styles.headerBtn}>
            <MaterialIcons name="settings" size={24} color={theme.colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.todayBtn} onPress={jumpToToday}>
            <Text style={styles.todayBtnText}>امروز</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          
          {/* Admin Simulation Toggle Bar */}
          <View style={[styles.adminSimulationBar, { marginBottom: 8 }]}>
            <View style={styles.adminSimLabelContainer}>
              <MaterialIcons name="lock" size={16} color={showHolidays ? "#2e7d32" : "#8e8e93"} />
              <Text style={styles.adminSimLabel}>
                {showHolidays ? 'تعطیلات: روشن' : 'تعطیلات: خاموش'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.adminSimButton, isAdminSimulated && styles.adminSimButtonActive]} onPress={toggleAdminSimulation}>
              <Text style={[styles.adminSimButtonText, isAdminSimulated && styles.adminSimButtonTextActive]}>
                {isAdminSimulated ? 'مدیریت (فعال)' : 'کاربر عادی'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* View Switcher */}
          <View style={styles.viewSwitcher}>
            <TouchableOpacity style={currentView === 'month' ? styles.viewTabActive : styles.viewTabInactive} onPress={() => setCurrentView('month')}>
              <Text style={currentView === 'month' ? styles.viewTabTextActive : styles.viewTabTextInactive}>ماهانه</Text>
            </TouchableOpacity>
            <TouchableOpacity style={currentView === 'week' ? styles.viewTabActive : styles.viewTabInactive} onPress={() => setCurrentView('week')}>
              <Text style={currentView === 'week' ? styles.viewTabTextActive : styles.viewTabTextInactive}>هفتگی</Text>
            </TouchableOpacity>
            <TouchableOpacity style={currentView === 'list' ? styles.viewTabActive : styles.viewTabInactive} onPress={() => setCurrentView('list')}>
              <Text style={currentView === 'list' ? styles.viewTabTextActive : styles.viewTabTextInactive}>لیست</Text>
            </TouchableOpacity>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItemsRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
                <Text style={styles.legendText}>روز</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4f46e5' }]} />
                <Text style={styles.legendText}>شب</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#9ca3af' }]} />
                <Text style={styles.legendText}>آف</Text>
              </View>
            </View>
            <TouchableOpacity>
              <MaterialIcons name="info" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          {currentView !== 'list' && (
            <View style={styles.calendarCard}>
              <View style={styles.weekDaysRow}>
                {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((dayName, idx) => (
                  <Text key={idx} style={idx === 6 ? styles.weekDayHeaderFriday : styles.weekDayHeader}>{dayName}</Text>
                ))}
              </View>
              
              <View style={styles.gridContainer}>
                {(currentView === 'month' ? daysGrid : weekGrid).map((cell) => {
                  if (cell.isOffset) {
                    return <View key={cell.key} style={styles.gridCellWrapper}><View style={styles.gridCellEmpty} /></View>
                  }
                  
                  const isSel = cell.dayNumber === selectedDay
                  const shiftCode = cell.resolvedShift?.shift?.code || 'off'
                  const shiftStyle = SHIFT_MAPPING[shiftCode] || SHIFT_MAPPING.off
                  const isHoliday = showHolidays && (cell.isFriday || !!cell.holidayName)

                  return (
                    <TouchableOpacity
                      key={cell.key}
                      style={styles.gridCellWrapper}
                      onPress={() => {
                        setSelectedDay(cell.dayNumber!)
                        setIsDetailsVisible(true)
                      }}
                    >
                      <View style={[styles.gridCell, isSel && styles.gridCellSelected, isHoliday && { backgroundColor: theme.colors.errorContainer + '40', borderColor: theme.colors.error + '40', borderWidth: 1 }]}>
                        {cell.isToday && <View style={styles.gridCellTodayMarker} />}
                        {cell.leaves && cell.leaves.length > 0 && <View style={styles.gridCellLeaveMarker} />}
                        <Text style={[
                          styles.gridCellNum, 
                          isSel ? styles.gridCellNumSelected : (isHoliday ? styles.gridCellNumHoliday : (cell.isFriday ? styles.gridCellNumFriday : {}))
                        ]}>
                          {toFa(cell.dayNumber!)}
                        </Text>
                        <View style={[styles.shiftBar, { backgroundColor: shiftStyle.color }]} />
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )}

          {/* List View */}
          {currentView === 'list' && (
            <ScrollView style={styles.listViewContainer} showsVerticalScrollIndicator={false}>
              {daysGrid.filter(c => !c.isOffset).map(cell => {
                const shiftCode = cell.resolvedShift?.shift?.code || 'off'
                const shiftStyle = SHIFT_MAPPING[shiftCode] || SHIFT_MAPPING.off
                const isHoliday = showHolidays && (cell.isFriday || !!cell.holidayName)
                const dayTasks = tasks.filter((t) => t.userId === 'current' && t.date === cell.dateStr)
                const dayNote = notes.find((n) => n.userId === 'current' && n.date === cell.dateStr)
                
                const weekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
                const dayName = cell.gregDate ? weekdays[cell.gregDate.getDay()] : ''

                return (
                  <TouchableOpacity 
                    key={cell.key} 
                    style={styles.listItemWrapper}
                    onPress={() => {
                      setSelectedDay(cell.dayNumber!)
                      setIsDetailsVisible(true)
                    }}
                  >
                    <View style={styles.listItemDateBox}>
                      <Text style={styles.listItemDayName}>{dayName}</Text>
                      <Text style={[
                        styles.listItemDayNum,
                        cell.isToday ? styles.listItemDayNumToday : (isHoliday ? styles.listItemDayNumHoliday : (cell.isFriday ? styles.listItemDayNumFriday : {}))
                      ]}>
                        {toFa(cell.dayNumber!)}
                      </Text>
                    </View>
                    <View style={styles.listItemContent}>
                      <View style={[styles.shiftBadge, { alignSelf: 'flex-start', backgroundColor: shiftStyle.bg }]}>
                        <Text style={[styles.shiftBadgeText, { color: shiftStyle.color }]}>{shiftStyle.label}</Text>
                      </View>
                      {showHolidays && cell.holidayName && (
                        <Text style={styles.listItemHoliday}>{cell.holidayName}</Text>
                      )}
                      {(dayTasks.length > 0 || dayNote) && (
                        <View style={styles.listItemTasksBox}>
                          {dayTasks.length > 0 && (
                            <View style={styles.listTaskBadge}>
                              <Text style={styles.listTaskBadgeText}>{toFa(dayTasks.length)} تسک</Text>
                            </View>
                          )}
                          {dayNote && (
                            <View style={styles.listTaskBadge}>
                              <Text style={styles.listTaskBadgeText}>یادداشت</Text>
                            </View>
                          )}
                          {cell.leaves && cell.leaves.length > 0 && (
                            <View style={[styles.listTaskBadge, { backgroundColor: '#fee2e2' }]}>
                              <Text style={[styles.listTaskBadgeText, { color: '#ef4444' }]}>مرخصی/مأموریت</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}

          {/* Monthly Summary Cards */}
          <View style={[styles.summaryRow, { flexWrap: 'wrap' }]}>
            <View style={[styles.summaryCard, { borderBottomColor: '#f97316' }]}>
              <Text style={styles.summaryCardLabel}>روزکار</Text>
              <Text style={styles.summaryCardValue}>{toFa(shiftCounts.day)}</Text>
            </View>
            <View style={[styles.summaryCard, { borderBottomColor: '#4f46e5' }]}>
              <Text style={styles.summaryCardLabel}>شبکار</Text>
              <Text style={styles.summaryCardValue}>{toFa(shiftCounts.night)}</Text>
            </View>
            <View style={[styles.summaryCard, { borderBottomColor: '#9ca3af' }]}>
              <Text style={styles.summaryCardLabel}>آف</Text>
              <Text style={styles.summaryCardValue}>{toFa(shiftCounts.off)}</Text>
            </View>
            <View style={[styles.summaryCard, { borderBottomColor: '#dc2626' }]}>
              <Text style={styles.summaryCardLabel}>مرخصی‌ها</Text>
              <Text style={styles.summaryCardValue}>{toFa(shiftCounts.leaveCount)}</Text>
            </View>
          </View>

          <TouchableOpacity style={{ backgroundColor: theme.colors.primaryContainer, borderRadius: theme.borderRadius.md, padding: 12, marginTop: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center' }} onPress={() => navigation.navigate('LeaveReportScreen')}>
            <MaterialIcons name="assessment" size={20} color={theme.colors.onPrimaryContainer} style={{ marginLeft: 8 }} />
            <Text style={{ fontFamily: theme.typography.bodyMd.fontFamily, color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>جزئیات گزارش مرخصی‌ها</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
      
      {/* Modal for Day Details */}
      <Modal visible={isDetailsVisible} animationType="slide" transparent={true} onRequestClose={() => setIsDetailsVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{getJalaliDateLabel(selectedGregDate)}</Text>
                {showHolidays && getJalaliHoliday(currentYear, currentMonth, selectedDay) && (
                  <Text style={styles.modalHolidayText}>{getJalaliHoliday(currentYear, currentMonth, selectedDay)}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setIsDetailsVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Shift Details Box */}
            <View style={styles.shiftDetailsBox}>
              <View style={styles.shiftDetailsRow}>
                <Text style={styles.shiftDetailsLabel}>شیفت امروز:</Text>
                {selectedDayData.resolved?.shift ? (
                  <View style={[styles.shiftBadge, { backgroundColor: (SHIFT_MAPPING[selectedDayData.resolved.shift.code] || SHIFT_MAPPING.off).bg }]}>
                    <Text style={[styles.shiftBadgeText, { color: (SHIFT_MAPPING[selectedDayData.resolved.shift.code] || SHIFT_MAPPING.off).color }]}>
                      {selectedDayData.resolved.shift.label}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noShiftText}>تعریف نشده</Text>
                )}
              </View>
              
              {selectedDayData.resolved?.shift && (
                <View style={styles.shiftHoursRow}>
                  <View style={styles.shiftHoursCol}>
                    <MaterialIcons name="schedule" size={16} color={theme.colors.secondary} />
                    <Text style={styles.shiftHoursText}>ساعت: {toFa(selectedDayData.resolved.shift.startTime)} الی {toFa(selectedDayData.resolved.shift.endTime)}</Text>
                  </View>
                  <View style={styles.shiftHoursCol}>
                    <MaterialIcons name="work-outline" size={16} color={theme.colors.secondary} />
                    <Text style={styles.shiftHoursText}>چرخه: {toFa(selectedDayData.resolved.dayOfCycle)} از {toFa(selectedDayData.resolved.cycleLength)} روزه ({selectedDayData.resolved.templateName})</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Notes Card */}
            <View style={styles.detailsCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="edit-note" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>گزارش و یادداشت روزانه</Text>
              </View>
              <TextInput
                style={styles.textarea}
                placeholder="نوشتن گزارش روزانه، مشکلات فنی خط یا یادداشت..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                multiline
                numberOfLines={3}
                value={noteText}
                onChangeText={setNoteText}
              />
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.saveNoteButton} onPress={handleSaveNote}>
                  <Text style={styles.saveNoteText}>ذخیره گزارش</Text>
                </TouchableOpacity>
                {selectedDayData.note ? (
                  <TouchableOpacity style={styles.deleteNoteButton} onPress={handleDeleteNote}>
                    <MaterialIcons name="delete-outline" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Tasks checklist card */}
            <View style={styles.detailsCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="fact-check" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>برد مأموریت‌ها و تسک‌ها</Text>
              </View>

              <View style={styles.taskList}>
                {selectedDayData.tasks.length === 0 ? (
                  <Text style={styles.emptyTasksText}>هیچ تسک یا مأموریتی ثبت نشده است.</Text>
                ) : (
                  selectedDayData.tasks.map((task: DailyTask) => {
                    const isDone = task.status === 'done'
                    return (
                      <View key={task.id} style={[styles.taskItem, isDone && styles.taskItemDone]}>
                        <TouchableOpacity style={styles.taskCheckRow} onPress={() => toggleTaskStatus(task.id)}>
                          <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
                            {isDone && <MaterialIcons name="check" size={16} color="#fff" />}
                          </View>
                          <Text style={[styles.taskTitleText, isDone && styles.taskTitleTextDone]}>
                            {task.title}
                          </Text>
                        </TouchableOpacity>

                        {task.type === 'system' && (
                          <View style={styles.systemFieldsBox}>
                            <View style={styles.systemTitleRow}>
                              <MaterialIcons name="lock" size={14} color={theme.colors.primary} />
                              <Text style={styles.systemFieldHeader}>مقادیر قفل شده سیستمی:</Text>
                            </View>
                            <Text style={styles.systemFieldDetail}>
                              اضافه‌کار: {toFa(task.overtime || 0)} ساعت  |  کهریزک: {toFa(task.kahrizakCount || 0)} بار
                            </Text>
                          </View>
                        )}

                        <View style={styles.taskMetaRow}>
                          <MaterialIcons name="access-time" size={14} color={theme.colors.secondary} />
                          <Text style={styles.taskMetaText}>{toFa(task.time)}</Text>
                          <Text style={styles.taskMetaText}> | {task.type === 'system' ? 'سیستمی' : 'شخصی'}</Text>
                          
                          {task.type === 'personal' && (
                            <TouchableOpacity onPress={() => deleteTask(task.id)} style={styles.taskDeleteBtn}>
                              <MaterialIcons name="delete-outline" size={18} color={theme.colors.secondary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )
                  })
                )}
              </View>

              {/* Task Creator Form */}
              <View style={styles.taskCreatorBox}>
                <TextInput
                  style={styles.taskInput}
                  placeholder="تسک شخصی جدید..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                />
                <View style={styles.taskCreatorControls}>
                  <View style={styles.timeInputBox}>
                    <Text style={styles.timeInputLabel}>ساعت انجام:</Text>
                    <TextInput
                      style={styles.timeInput}
                      placeholder="مثال: ۰۸:۰۰"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={newTaskTime}
                      onChangeText={setNewTaskTime}
                    />
                  </View>
                  <TouchableOpacity style={styles.addTaskBtn} onPress={handleCreateTask}>
                    <MaterialIcons name="add" size={20} color={theme.colors.primary} />
                    <Text style={styles.addTaskBtnText}>افزودن</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Leave / Mission Card */}
            <View style={styles.detailsCard}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="event-available" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>ثبت مرخصی، مأموریت و اضافه‌کار</Text>
              </View>

              {/* View Existing Requests */}
              {selectedDayData.leaves.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, marginBottom: 8 }}>
                    درخواست‌های ثبت شده:
                  </Text>
                  {selectedDayData.leaves.map(l => {
                    const typeLabel = dynamicLeaveOptions.find(o => o.value === l.type)?.label || l.type
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
                      <View key={l.id} style={styles.leaveRequestItem}>
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.leaveRequestTitle}>{typeLabel}</Text>
                          <Text style={[styles.leaveRequestStatus, { color: statusColor, backgroundColor: statusBg }]}>
                            {statusText}
                          </Text>
                        </View>
                        {l.reason ? (
                          <Text style={{ fontSize: 12, color: theme.colors.secondary, marginTop: 4, textAlign: 'right' }}>{l.reason}</Text>
                        ) : null}
                      </View>
                    )
                  })}
                </View>
              )}

              {/* Create New Request */}
              <Text style={{ fontSize: 12, color: theme.colors.secondary, fontFamily: theme.typography.captionSm.fontFamily, marginBottom: 8, textAlign: 'right' }}>
                نوع درخواست جدید:
              </Text>
              <View style={styles.leaveTypeOptions}>
                {dynamicLeaveOptions.map(opt => (
                  <TouchableOpacity 
                    key={opt.value} 
                    style={[styles.leaveTypeBtn, leaveType === opt.value && styles.leaveTypeBtnActive]}
                    onPress={() => setLeaveType(opt.value)}
                  >
                    <Text style={[styles.leaveTypeBtnText, leaveType === opt.value && styles.leaveTypeBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                <TextInput
                  style={[styles.taskInput, { flex: 2 }]}
                  placeholder="مقدار (اختیاری، مثلا ۴)"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  keyboardType="numeric"
                  value={leaveAmount}
                  onChangeText={setLeaveAmount}
                />
                
                <View style={{ flex: 1, flexDirection: 'row-reverse', backgroundColor: theme.colors.surfaceVariant, borderRadius: 8, overflow: 'hidden' }}>
                   <TouchableOpacity 
                     style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: leaveUnit === 'hours' ? theme.colors.primary : 'transparent' }} 
                     onPress={() => setLeaveUnit('hours')}
                   >
                     <Text style={{ color: leaveUnit === 'hours' ? '#fff' : theme.colors.onSurfaceVariant, fontSize: 12 }}>ساعت</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: leaveUnit === 'days' ? theme.colors.primary : 'transparent' }} 
                     onPress={() => setLeaveUnit('days')}
                   >
                     <Text style={{ color: leaveUnit === 'days' ? '#fff' : theme.colors.onSurfaceVariant, fontSize: 12 }}>روز</Text>
                   </TouchableOpacity>
                </View>
              </View>

              <TextInput
                style={styles.taskInput}
                placeholder="توضیحات (اختیاری)..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={leaveReason}
                onChangeText={setLeaveReason}
              />
              <TouchableOpacity style={styles.leaveSubmitBtn} onPress={handleAddLeave} disabled={isSubmittingLeave}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontFamily: theme.typography.cardTitle.fontFamily }}>
                  {isSubmittingLeave ? 'در حال ثبت...' : 'ثبت درخواست'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Inject System Task Form */}
            {isAdminSimulated && (
                <View style={styles.systemTaskCreatorBox}>
                  <View style={styles.systemCreatorHeader}>
                    <MaterialIcons name="lock" size={18} color={theme.colors.primary} />
                    <Text style={styles.systemCreatorHeaderTitle}>تزریق تسک سیستمی (پنل مدیریت):</Text>
                  </View>
                  
                  <TextInput
                    style={styles.taskInput}
                    placeholder="عنوان تسک سیستمی (مثلا: شیفت فوق‌العاده...)"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={systemTitle}
                    onChangeText={setSystemTitle}
                  />
                  
                  <View style={styles.systemFieldsInputsRow}>
                    <View style={styles.systemFieldCol}>
                      <Text style={styles.systemFieldInputLabel}>اضافه‌کار (ساعت):</Text>
                      <TextInput
                        style={styles.systemNumericInput}
                        placeholder="۰"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        keyboardType="numeric"
                        value={systemOvertime}
                        onChangeText={setSystemOvertime}
                      />
                    </View>
                    <View style={styles.systemFieldCol}>
                      <Text style={styles.systemFieldInputLabel}>اعزام کهریزک:</Text>
                      <TextInput
                        style={styles.systemNumericInput}
                        placeholder="۰"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        keyboardType="numeric"
                        value={systemKahrizak}
                        onChangeText={setSystemKahrizak}
                      />
                    </View>
                  </View>

                  <View style={styles.taskCreatorControls}>
                    <View style={styles.timeInputBox}>
                      <Text style={styles.timeInputLabel}>ساعت:</Text>
                      <TextInput
                        style={styles.timeInput}
                        placeholder="۱۲:۰۰"
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                        value={systemTime}
                        onChangeText={setSystemTime}
                      />
                    </View>
                    <TouchableOpacity style={styles.addSystemTaskBtn} onPress={handleCreateSystemTask}>
                      <MaterialIcons name="add" size={20} color={theme.colors.onPrimary} />
                      <Text style={[styles.addTaskBtnText, { color: theme.colors.onPrimary }]}>تزریق تسک</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  )
}

export default CalendarScreen
