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
  Alert
} from 'react-native'

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Briefcase,
  CheckCircle,
  Plus,
  Trash2,
  Lock,
  Award,
  Edit2
} from 'lucide-react-native'

import { useAuthStore } from '../stores/auth'
import { useShiftsStore } from '../stores/shifts'
import {
  gregorianToJalali,
  jalaliToGregorian,
  getJalaliMonthLength,
  getJalaliDateString,
  getJalaliDateLabel,
  toFa
} from '../shared/jalali'
import { getShiftForUserAndDate } from '../shared/cycle-math'

const SHIFT_MAPPING: Record<string, { label: string; color: string; bg: string }> = {
  morning: { label: 'صبح‌کار', color: '#ffb300', bg: 'rgba(255, 179, 0, 0.15)' },
  evening: { label: 'عصرکار', color: '#00c3ff', bg: 'rgba(0, 195, 255, 0.15)' },
  night: { label: 'شب‌کار', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)' },
  office: { label: 'اداری', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' },
  off: { label: 'استراحت', color: '#8e8e93', bg: 'rgba(142, 142, 147, 0.15)' },
}

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
]

export function CalendarScreen() {
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

  // Determine current Jalali date to initialize the navigation
  const today = new Date()
  const [todayJy, todayJm, todayJd] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate())

  const [currentMonth, setCurrentMonth] = useState(todayJm)
  const [currentYear, setCurrentYear] = useState(todayJy)
  const [selectedDay, setSelectedDay] = useState(todayJd)

  // Personal task input states
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskTime, setNewTaskTime] = useState('08:00')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')

  // System task input states
  const [systemTitle, setSystemTitle] = useState('')
  const [systemOvertime, setSystemOvertime] = useState('0')
  const [systemKahrizak, setSystemKahrizak] = useState('0')
  const [systemTime, setSystemTime] = useState('12:00')
  const [systemPriority, setSystemPriority] = useState<'low' | 'medium' | 'high'>('medium')

  // Note input state
  const [noteText, setNoteText] = useState('')

  // Load persisted store data on mount
  useEffect(() => {
    loadPersistedData()
  }, [])

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

      cells.push({
        isOffset: false,
        key: `day-${d}`,
        dayNumber: d,
        dateStr: cellDateStr,
        isToday: currentYear === todayJy && currentMonth === todayJm && d === todayJd,
        isFriday: cellGregDate.getDay() === 5,
        resolvedShift: resolved,
        hasTasks: dayTasks.length > 0,
        allTasksDone: dayTasks.length > 0 && dayTasks.every(t => t.status === 'done'),
        hasNote: !!dayNote
      })
    }
    return cells
  }, [currentYear, currentMonth, daysCount, startWeekday, assignments, templates, tasks, notes, userGroup])

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

  // Selected Day Metadata
  const selectedDayData = useMemo(() => {
    const resolved = getShiftForUserAndDate('current', selectedGregDate, assignments, templates, userGroup)
    const dayTasks = tasks.filter((t) => t.userId === 'current' && t.date === selectedDateStr)
    const dayNote = notes.find((n) => n.userId === 'current' && n.date === selectedDateStr)
    return {
      resolved,
      tasks: dayTasks,
      note: dayNote
    }
  }, [selectedGregDate, selectedDateStr, assignments, templates, tasks, notes, userGroup])

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
      priority: newTaskPriority,
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
      priority: systemPriority,
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Navigation Month Header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity style={styles.navButton} onPress={prevMonth}>
            <ChevronRight size={20} color="#f2f2f7" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <CalendarIcon size={18} color="#e53935" style={{ marginLeft: 8 }} />
            <Text style={styles.monthTitle}>
              {JALALI_MONTHS[currentMonth - 1]} {toFa(currentYear)}
            </Text>
          </View>

          <TouchableOpacity style={styles.navButton} onPress={nextMonth}>
            <ChevronLeft size={20} color="#f2f2f7" />
          </TouchableOpacity>
        </View>

        {/* Admin Simulation Toggle Bar */}
        <View style={styles.adminSimulationBar}>
          <View style={styles.adminSimLabelContainer}>
            <Lock size={14} color={isAdminSimulated ? "#e53935" : "#8e8e93"} style={{ marginLeft: 6 }} />
            <Text style={styles.adminSimLabel}>شبیه‌ساز نقش مدیریت (ادمین):</Text>
          </View>
          <TouchableOpacity 
            style={[styles.adminSimButton, isAdminSimulated && styles.adminSimButtonActive]}
            onPress={toggleAdminSimulation}
          >
            <Text style={[styles.adminSimButtonText, isAdminSimulated && styles.adminSimButtonTextActive]}>
              {isAdminSimulated ? 'مدیریت (فعال)' : 'کاربر عادی'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Days of Week Header */}
        <View style={styles.weekHeader}>
          {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((dayName, idx) => (
            <Text key={idx} style={[styles.weekLabel, idx === 6 && styles.fridayLabel]}>
              {dayName}
            </Text>
          ))}
        </View>

        {/* Calendar Days Grid */}
        <View style={styles.daysGrid}>
          {daysGrid.map((cell) => {
            if (cell.isOffset) {
              return <View key={cell.key} style={styles.emptyDayCell} />
            }
            
            const isSel = cell.dayNumber === selectedDay
            const shiftCode = cell.resolvedShift?.shift?.code || 'off'
            const shiftStyle = SHIFT_MAPPING[shiftCode] || SHIFT_MAPPING.off

            return (
              <TouchableOpacity
                key={cell.key}
                style={[
                  styles.dayCell,
                  cell.isToday && styles.todayCell,
                  isSel && styles.selectedCell,
                  cell.isFriday && styles.fridayCell
                ]}
                onPress={() => setSelectedDay(cell.dayNumber!)}
              >
                <Text style={[
                  styles.dayNumberText,
                  cell.isToday && styles.todayNumberText,
                  isSel && styles.selectedNumberText,
                  cell.isFriday && styles.fridayNumberText
                ]}>
                  {toFa(cell.dayNumber!)}
                </Text>
                
                {/* Micro Shift indicator dot */}
                <View style={[styles.shiftDot, { backgroundColor: shiftStyle.color }]} />

                {/* Indicator dots for notes/tasks */}
                <View style={styles.indicatorContainer}>
                  {cell.hasNote && <View style={styles.noteIndicatorDot} />}
                  {cell.hasTasks && (
                    <View style={[styles.taskIndicatorDot, cell.allTasksDone && styles.taskDoneDot]} />
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Monthly Performance Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <Award size={16} color="#e53935" style={{ marginLeft: 6 }} />
            <Text style={styles.cardTitle}>خلاصه کارکرد و مأموریت‌های ماه</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>{toFa(monthlyMetrics.overtime)} ساعت</Text>
              <Text style={styles.summaryLbl}>اضافه‌کار تأیید شده</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>{toFa(monthlyMetrics.kahrizak)} بار</Text>
              <Text style={styles.summaryLbl}>اعزام کهریزک</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>{toFa(monthlyMetrics.workedHours)} ساعت</Text>
              <Text style={styles.summaryLbl}>حضور موظفی</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>{toFa(monthlyMetrics.completionRate)}٪</Text>
              <Text style={styles.summaryLbl}>اتمام تسک‌ها</Text>
            </View>
          </View>
        </View>

        {/* Agenda Selected Day Details */}
        <View style={styles.agendaContainer}>
          <Text style={styles.agendaTitle}>
            {getJalaliDateLabel(selectedGregDate)}
          </Text>

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
                  <Clock size={13} color="#a0a3b0" style={{ marginLeft: 4 }} />
                  <Text style={styles.shiftHoursText}>ساعت: {toFa(selectedDayData.resolved.shift.startTime)} الی {toFa(selectedDayData.resolved.shift.endTime)}</Text>
                </View>
                <View style={styles.shiftHoursCol}>
                  <Briefcase size={13} color="#a0a3b0" style={{ marginLeft: 4 }} />
                  <Text style={styles.shiftHoursText}>چرخه: {toFa(selectedDayData.resolved.dayOfCycle)} از {toFa(selectedDayData.resolved.cycleLength)} روزه ({selectedDayData.resolved.templateName})</Text>
                </View>
              </View>
            )}
          </View>

          {/* Notes Card */}
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Edit2 size={16} color="#e53935" style={{ marginLeft: 6 }} />
              <Text style={styles.cardTitle}>گزارش و یادداشت روزانه</Text>
            </View>
            <TextInput
              style={styles.textarea}
              placeholder="نوشتن گزارش روزانه، مشکلات فنی خط یا یادداشت..."
              placeholderTextColor="#555860"
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
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Tasks checklist card */}
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <CheckCircle size={16} color="#e53935" style={{ marginLeft: 6 }} />
              <Text style={styles.cardTitle}>برد مأموریت‌ها و تسک‌ها</Text>
            </View>

            {/* List Tasks */}
            <View style={styles.taskList}>
              {selectedDayData.tasks.length === 0 ? (
                <Text style={styles.emptyTasksText}>هیچ تسک یا مأموریتی ثبت نشده است.</Text>
              ) : (
                selectedDayData.tasks.map((task) => {
                  const isDone = task.status === 'done'
                  return (
                    <View
                      key={task.id}
                      style={[styles.taskItem, isDone && styles.taskItemDone]}
                    >
                      <TouchableOpacity
                        style={styles.taskCheckRow}
                        onPress={() => toggleTaskStatus(task.id)}
                      >
                        <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
                          {isDone && <Text style={styles.checkMark}>✓</Text>}
                        </View>
                        <Text style={[styles.taskTitleText, isDone && styles.taskTitleTextDone]}>
                          {task.title}
                        </Text>
                      </TouchableOpacity>

                      {/* Locked counts for system task */}
                      {task.type === 'system' && (
                        <View style={styles.systemFieldsBox}>
                          <View style={styles.systemTitleRow}>
                            <Lock size={10} color="#e53935" style={{ marginLeft: 4 }} />
                            <Text style={styles.systemFieldHeader}>مقادیر قفل شده سیستمی:</Text>
                          </View>
                          <Text style={styles.systemFieldDetail}>
                            اضافه‌کار: {toFa(task.overtime || 0)} ساعت  |  کهریزک: {toFa(task.kahrizakCount || 0)} بار
                          </Text>
                        </View>
                      )}

                      <View style={styles.taskMetaRow}>
                        <Clock size={11} color="#8e8e93" style={{ marginLeft: 3 }} />
                        <Text style={styles.taskMetaText}>{toFa(task.time)}</Text>
                        <Text style={styles.taskMetaText}> | {task.type === 'system' ? 'سیستمی' : 'شخصی'}</Text>
                        
                        {task.type === 'personal' && (
                          <TouchableOpacity
                            onPress={() => deleteTask(task.id)}
                            style={styles.taskDeleteBtn}
                          >
                            <Trash2 size={13} color="#8e8e93" />
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
                placeholderTextColor="#555860"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
              />
              <View style={styles.taskCreatorControls}>
                <View style={styles.timeInputBox}>
                  <Text style={styles.timeInputLabel}>ساعت انجام:</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="مثال: ۰۸:۰۰"
                    placeholderTextColor="#555860"
                    value={newTaskTime}
                    onChangeText={setNewTaskTime}
                  />
                </View>
                <TouchableOpacity style={styles.addTaskBtn} onPress={handleCreateTask}>
                  <Plus size={16} color="#f2f2f7" />
                  <Text style={styles.addTaskBtnText}>افزودن</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Inject System Task Form (Visible only when Admin Simulation is Active) */}
            {isAdminSimulated && (
              <View style={styles.systemTaskCreatorBox}>
                <View style={styles.systemCreatorHeader}>
                  <Lock size={14} color="#e53935" style={{ marginLeft: 6 }} />
                  <Text style={styles.systemCreatorHeaderTitle}>تزریق تسک سیستمی (پنل مدیریت):</Text>
                </View>
                
                <TextInput
                  style={styles.taskInput}
                  placeholder="عنوان تسک سیستمی (مثلا: شیفت فوق‌العاده...)"
                  placeholderTextColor="#555860"
                  value={systemTitle}
                  onChangeText={setSystemTitle}
                />
                
                <View style={styles.systemFieldsInputsRow}>
                  <View style={styles.systemFieldCol}>
                    <Text style={styles.systemFieldInputLabel}>اضافه‌کار (ساعت):</Text>
                    <TextInput
                      style={styles.systemNumericInput}
                      placeholder="۰"
                      placeholderTextColor="#555860"
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
                      placeholderTextColor="#555860"
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
                      placeholderTextColor="#555860"
                      value={systemTime}
                      onChangeText={setSystemTime}
                    />
                  </View>
                  <TouchableOpacity style={styles.addSystemTaskBtn} onPress={handleCreateSystemTask}>
                    <Plus size={16} color="#f2f2f7" />
                    <Text style={styles.addTaskBtnText}>تزریق تسک</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0d12',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  monthHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151821',
    borderWidth: 1,
    borderColor: '#212533',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navButton: {
    padding: 8,
  },
  titleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  weekHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  weekLabel: {
    width: '13%',
    textAlign: 'center',
    fontSize: 12,
    color: '#8c91a5',
    fontWeight: 'bold',
  },
  fridayLabel: {
    color: '#ef4444',
  },
  daysGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  emptyDayCell: {
    width: '13.2%',
    height: 54,
    margin: '0.5%',
  },
  dayCell: {
    width: '13.2%',
    height: 54,
    margin: '0.5%',
    backgroundColor: '#151821',
    borderWidth: 1,
    borderColor: '#212533',
    borderRadius: 8,
    padding: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayCell: {
    borderColor: '#e53935',
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
  },
  selectedCell: {
    borderColor: '#e53935',
    backgroundColor: '#151821',
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  fridayCell: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  dayNumberText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  todayNumberText: {
    color: '#e53935',
  },
  selectedNumberText: {
    color: '#e53935',
  },
  fridayNumberText: {
    color: '#ef4444',
  },
  shiftDot: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: 5,
  },
  noteIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e53935',
  },
  taskIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffb300',
  },
  taskDoneDot: {
    backgroundColor: '#34c759',
  },
  agendaContainer: {
    marginTop: 8,
  },
  agendaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 12,
    paddingRight: 4,
  },
  shiftDetailsBox: {
    backgroundColor: '#151821',
    borderWidth: 1,
    borderColor: '#212533',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  shiftDetailsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftDetailsLabel: {
    color: '#8c91a5',
    fontSize: 12,
  },
  shiftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  shiftBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  noShiftText: {
    color: '#8c91a5',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shiftHoursRow: {
    borderTopWidth: 1,
    borderTopColor: '#212533',
    marginTop: 8,
    paddingTop: 8,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  shiftHoursCol: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  shiftHoursText: {
    color: '#8c91a5',
    fontSize: 10.5,
  },
  detailsCard: {
    backgroundColor: '#151821',
    borderColor: '#212533',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#212533',
    paddingBottom: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  textarea: {
    backgroundColor: '#0c0d12',
    borderColor: '#212533',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'right',
    minHeight: 64,
  },
  cardActions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  saveNoteButton: {
    backgroundColor: '#e53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveNoteText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteNoteButton: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  taskList: {
    marginBottom: 12,
  },
  emptyTasksText: {
    textAlign: 'center',
    color: '#8c91a5',
    fontSize: 12,
    paddingVertical: 12,
  },
  taskItem: {
    backgroundColor: '#0c0d12',
    borderWidth: 1,
    borderColor: '#212533',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  taskItemDone: {
    borderColor: 'rgba(52, 199, 89, 0.2)',
    backgroundColor: 'rgba(52, 199, 89, 0.02)',
    opacity: 0.8,
  },
  taskCheckRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#8c91a5',
    borderRadius: 4,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#34c759',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  checkMark: {
    color: '#34c759',
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskTitleText: {
    color: '#ffffff',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  taskTitleTextDone: {
    textDecorationLine: 'line-through',
    color: '#8c91a5',
  },
  systemFieldsBox: {
    marginTop: 8,
    backgroundColor: '#151821',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.15)',
    padding: 8,
  },
  systemTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 3,
  },
  systemFieldHeader: {
    fontSize: 9.5,
    color: '#e53935',
    fontWeight: 'bold',
  },
  systemFieldDetail: {
    fontSize: 10,
    color: '#8c91a5',
    textAlign: 'right',
  },
  taskMetaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#212533',
    paddingTop: 6,
  },
  taskMetaText: {
    fontSize: 10,
    color: '#8c91a5',
  },
  taskDeleteBtn: {
    marginRight: 'auto',
    padding: 4,
  },
  taskCreatorBox: {
    borderTopWidth: 1,
    borderTopColor: '#212533',
    paddingTop: 12,
    marginTop: 6,
  },
  taskInput: {
    backgroundColor: '#0c0d12',
    borderColor: '#212533',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 8,
  },
  taskCreatorControls: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInputBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  timeInputLabel: {
    color: '#8c91a5',
    fontSize: 11,
    marginLeft: 6,
  },
  timeInput: {
    backgroundColor: '#0c0d12',
    borderColor: '#212533',
    borderWidth: 1,
    borderRadius: 6,
    width: 70,
    height: 30,
    color: '#ffffff',
    fontSize: 11,
    textAlign: 'center',
  },
  addTaskBtn: {
    backgroundColor: '#e53935',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 6,
  },
  addTaskBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  adminSimulationBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151821',
    borderWidth: 1,
    borderColor: '#212533',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  adminSimLabelContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  adminSimLabel: {
    fontSize: 12,
    color: '#8c91a5',
    fontWeight: 'bold',
  },
  adminSimButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3a3f4b',
    backgroundColor: '#0c0d12',
  },
  adminSimButtonActive: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderColor: 'rgba(229, 57, 53, 0.4)',
  },
  adminSimButtonText: {
    fontSize: 11,
    color: '#8c91a5',
    fontWeight: '600',
  },
  adminSimButtonTextActive: {
    color: '#e53935',
  },
  systemTaskCreatorBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 57, 53, 0.2)',
    paddingTop: 12,
    marginTop: 12,
  },
  systemCreatorHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  systemCreatorHeaderTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#e53935',
  },
  systemFieldsInputsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  systemFieldCol: {
    width: '48%',
  },
  systemFieldInputLabel: {
    color: '#8c91a5',
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'right',
  },
  systemNumericInput: {
    backgroundColor: '#0c0d12',
    borderColor: '#212533',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
  addSystemTaskBtn: {
    backgroundColor: '#e53935',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 6,
  },
  summaryCard: {
    backgroundColor: '#151821',
    borderColor: '#212533',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  summaryItem: {
    width: '48%',
    backgroundColor: '#0c0d12',
    borderWidth: 1,
    borderColor: '#212533',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 14,
    color: '#e53935',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  summaryLbl: {
    fontSize: 10,
    color: '#8c91a5',
    marginTop: 4,
    fontWeight: '600',
  },
})

export default CalendarScreen
