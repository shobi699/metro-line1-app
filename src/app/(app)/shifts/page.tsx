'use client'

import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import 'dayjs-jalali'
import * as XLSX from 'xlsx'
import {
  Calendar as CalendarIcon,
  Plus,
  Trash,
  CheckSquare,
  Square,
  Clock,
  Briefcase,
  FileText,
  BarChart3,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeftRight,
  Send,
  UserCheck
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

import { useAuthStore } from '@/features/auth'
import { useShiftsStore } from '@/features/shifts'
import { getShiftForUserAndDate, MOCK_USERS_LIST } from '@/lib/cycle-math'
import { toFa, jalali } from '@/lib/fa'
import { cn } from '@/lib/utils'

interface UserProfile {
  id?: string
  name?: string
  nationalId?: string
  roleId?: string
  customFields?: {
    group?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface DbShift {
  id: string
  date: string
  code: string
  note: string | null
  source?: string
  userId: string
}

const SHIFT_COLORS: Record<string, string> = {
  morning: 'bg-success/10 text-success border-success/30 ring-1 ring-success/10',
  evening: 'bg-info/10 text-info border-info/30 ring-1 ring-info/10',
  night: 'bg-neutral-700/40 text-foreground-muted border-neutral-700',
  off: 'bg-background-subtle text-foreground-muted border-border-subtle',
  office: 'bg-accent/10 text-accent border-accent/30 ring-1 ring-accent/10',
}

const SHIFT_LABELS: Record<string, string> = {
  morning: 'صبح‌کار',
  evening: 'عصرکار',
  night: 'شب‌کار',
  off: 'استراحت (آف)',
  office: 'اداری',
}

function playAlertSound(type: 'info' | 'warning' | 'success') {
  if (typeof window === 'undefined') return
  try {
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    const ctx = new AudioCtor()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'warning') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } else if (type === 'success') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime)
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08)
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } else {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    }
  } catch {
    // Audio Context blocked or unsupported — silent
  }
}

export default function ShiftsPage() {
  const {
    templates,
    assignments,
    notes,
    tasks,
    saveNote,
    addTask,
    toggleTaskStatus,
    deleteTask
  } = useShiftsStore()

  // Tabs state
  const [activeTab, setActiveTab] = useState<'calendar' | 'reports'>('calendar')

  // Selected User in Calendar (default: current logged in user)
  const [calendarUser, setCalendarUser] = useState<string>('current')

  // Date navigation state (Jalali Month/Year)
  const now = dayjs().locale('jalali')
  const [currentMonth, setCurrentMonth] = useState(() => now.month() + 1)
  const [currentYear, setCurrentYear] = useState(() => now.year())

  // Selected day detail
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => dayjs().format('YYYY-MM-DD'))

  // Note text state
  const [noteContent, setNoteContent] = useState('')

  // Task creation states (Personal only for operators)
  const [personalTitle, setPersonalTitle] = useState('')
  const [personalTime, setPersonalTime] = useState('08:00')
  const [personalPriority, setPersonalPriority] = useState<'low' | 'medium' | 'high'>('medium')

  // Database Overrides
  const [dbShifts, setDbShifts] = useState<DbShift[]>([])
  const [dbShiftsLoading, setDbShiftsLoading] = useState(false)

  // Colleagues & Swap Requests states
  const [colleagues, setColleagues] = useState<UserProfile[]>([])
  const [swapTargetUserId, setSwapTargetUserId] = useState('')
  const [swapSourceShiftId, setSwapSourceShiftId] = useState('')
  const [swapTargetShiftId, setSwapTargetShiftId] = useState('')
  const [swapNote, setSwapNote] = useState('')
  const [submittingSwap, setSubmittingSwap] = useState(false)
  const [swapError, setSwapError] = useState('')
  const [swapSuccess, setSwapSuccess] = useState('')

  const accessToken = useAuthStore((s) => s.accessToken)
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!accessToken) return
      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          setCurrentUserProfile(data.data)
        }
      } catch {
        // silent
      }
    }
    void loadProfile()
  }, [accessToken])

  // Fetch Database Overrides for the active month
  useEffect(() => {
    async function loadDbShifts() {
      if (!accessToken) return
      setDbShiftsLoading(true)
      try {
        const firstDayOfMonth = dayjs()
          .locale('jalali')
          .year(currentYear)
          .month(currentMonth - 1)
          .date(1)
        const startStr = firstDayOfMonth.startOf('month').toISOString()
        const endStr = firstDayOfMonth.endOf('month').toISOString()

        const res = await fetch(`/api/shifts?startDate=${startStr}&endDate=${endStr}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const json = await res.json()
          setDbShifts(json.data || [])
        }
      } catch {
        // silent — failed to fetch shifts overrides
      } finally {
        setDbShiftsLoading(false)
      }
    }
    void loadDbShifts()
  }, [currentMonth, currentYear, accessToken])

  // Load colleagues from directory list
  useEffect(() => {
    async function loadColleagues() {
      if (!accessToken) return
      try {
        const res = await fetch('/api/users?pageSize=100', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const json = await res.json()
          setColleagues(json.data?.users || [])
        }
      } catch {
        // silent — failed to load colleagues
      }
    }
    void loadColleagues()
  }, [accessToken])

  // Synchronize note contents when selection changes
  useEffect(() => {
    const currentNote = notes.find((n) => n.userId === calendarUser && n.date === selectedDateStr)
    setNoteContent(currentNote?.content || '')
  }, [selectedDateStr, calendarUser, notes])

  // Calendar Calculation Helpers
  const firstDay = useMemo(() => {
    return dayjs()
      .locale('jalali')
      .year(currentYear)
      .month(currentMonth - 1)
      .date(1)
  }, [currentYear, currentMonth])

  const daysInMonth = firstDay.daysInMonth()
  
  // Align Saturday (Persian start of week) with index 0
  const startWeekday = (firstDay.day() + 1) % 7

  // Roster calculations merging templates + database overrides
  const daysGrid = useMemo(() => {
    const arr = []
    const todayStr = dayjs().format('YYYY-MM-DD')
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = firstDay.date(d)
      const dateStr = dateObj.format('YYYY-MM-DD')
      
      const userGroup = (calendarUser === 'current' && currentUserProfile?.customFields?.group)
        ? currentUserProfile.customFields.group
        : undefined

      // 1. Get default shift from template cycles
      const cycleRes = getShiftForUserAndDate(calendarUser, dateObj, assignments, templates, undefined, userGroup)
      
      // 2. Look up database override
      const realUserId = calendarUser === 'current' ? currentUserProfile?.id : calendarUser
      const override = dbShifts.find((s) => s.userId === realUserId && dayjs(s.date).format('YYYY-MM-DD') === dateStr)

      let resolved = cycleRes
      if (override) {
        resolved = {
          shift: {
            day: dateObj.day() + 1,
            code: override.code as 'morning' | 'evening' | 'night' | 'off' | 'office',
            label: SHIFT_LABELS[override.code as keyof typeof SHIFT_LABELS] || override.code,
            hours: override.code === 'morning' || override.code === 'evening' ? 9 : override.code === 'night' ? 12 : 0,
            startTime: override.code === 'morning' ? '07:00' : override.code === 'evening' ? '16:00' : override.code === 'night' ? '19:00' : '',
            endTime: override.code === 'morning' ? '16:00' : override.code === 'evening' ? '01:00' : override.code === 'night' ? '07:00' : '',
          },
          group: userGroup || 'A',
          templateName: 'اوراید دستی مدیریت',
          dayOfCycle: 1,
          cycleLength: 1
        }
      }

      const dayTasks = tasks.filter((t) => t.userId === calendarUser && t.date === dateStr)
      const dayNote = notes.find((n) => n.userId === calendarUser && n.date === dateStr)

      arr.push({
        day: d,
        dateStr,
        dateObj,
        isToday: dateStr === todayStr,
        isFriday: dateObj.day() === 5,
        resolvedShift: resolved,
        tasks: dayTasks,
        hasNote: !!dayNote,
      })
    }
    return arr
  }, [firstDay, daysInMonth, calendarUser, assignments, templates, tasks, notes, dbShifts, currentUserProfile])

  // Navigations
  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const selectedDayInfo = useMemo(() => {
    const dayData = daysGrid.find((d) => d.dateStr === selectedDateStr)
    const note = notes.find((n) => n.userId === calendarUser && n.date === selectedDateStr)
    const dayTasks = tasks.filter((t) => t.userId === calendarUser && t.date === selectedDateStr)
    return {
      data: dayData,
      note,
      tasks: dayTasks
    }
  }, [selectedDateStr, daysGrid, calendarUser, notes, tasks])

  // Note CRUD Handler
  function handleSaveNote() {
    saveNote(calendarUser, selectedDateStr, noteContent)
  }

  // Personal Task Creator
  function handleAddPersonalTask() {
    if (!personalTitle.trim()) return
    addTask({
      userId: calendarUser,
      date: selectedDateStr,
      title: personalTitle,
      time: personalTime,
      priority: personalPriority,
      status: 'todo',
      type: 'personal'
    })
    setPersonalTitle('')
  }

  // Swap Shift Form Helpers
  const myPhysicalShifts = useMemo(() => {
    const myId = currentUserProfile?.id
    if (!myId) return []
    return dbShifts.filter((s) => s.userId === myId && s.code !== 'off')
  }, [dbShifts, currentUserProfile])

  const colleaguePhysicalShifts = useMemo(() => {
    if (!swapTargetUserId) return []
    return dbShifts.filter((s) => s.userId === swapTargetUserId && s.code !== 'off')
  }, [dbShifts, swapTargetUserId])

  // Submit Shift Swap Request Handler
  const handleCreateSwapRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken || !swapTargetUserId || !swapSourceShiftId || !swapTargetShiftId) return

    setSubmittingSwap(true)
    setSwapError('')
    setSwapSuccess('')

    try {
      const res = await fetch('/api/swap-requests', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: swapTargetUserId,
          sourceShiftId: swapSourceShiftId,
          targetShiftId: swapTargetShiftId,
          note: swapNote.trim() || undefined,
        }),
      })

      const json = await res.json()

      if (res.ok) {
        playAlertSound('success')
        setSwapSuccess('درخواست تعویض شیفت با موفقیت ثبت گردید و به کارتابل همکار و مدیریت ارسال شد.')
        setSwapTargetUserId('')
        setSwapSourceShiftId('')
        setSwapTargetShiftId('')
        setSwapNote('')
      } else {
        playAlertSound('warning')
        if (json.violations && json.violations.length > 0) {
          setSwapError(`مغایرت با قوانین مترو: ${json.violations.map((v: { message: string }) => v.message).join(' - ')}`)
        } else {
          setSwapError(json.error || 'خطا در ثبت درخواست تعویض شیفت.')
        }
      }
    } catch {
      setSwapError('خطای ارتباط با سرور در ارسال درخواست.')
    } finally {
      setSubmittingSwap(false)
    }
  }

  // Personal BI Reports Aggregation
  const reportData = useMemo(() => {
    const repDaysCount = firstDay.daysInMonth()
    
    let workedShiftsCount = 0
    let totalShiftHours = 0
    let totalOvertimeHours = 0
    let totalKahrizakMissions = 0
    let completedTasksCount = 0
    let totalTasksCount = 0

    // Loop through all days of this month
    for (let d = 1; d <= repDaysCount; d++) {
      const dateObj = firstDay.date(d)
      const dateStr = dateObj.format('YYYY-MM-DD')

      const userGroup = (calendarUser === 'current' && currentUserProfile?.customFields?.group)
        ? currentUserProfile.customFields.group
        : undefined

      // 1. Resolve shift merging overrides
      const cycleRes = getShiftForUserAndDate(calendarUser, dateObj, assignments, templates, undefined, userGroup)
      const realUserId = calendarUser === 'current' ? currentUserProfile?.id : calendarUser
      const override = dbShifts.find((s) => s.userId === realUserId && dayjs(s.date).format('YYYY-MM-DD') === dateStr)

      let shiftRes = cycleRes
      if (override) {
        shiftRes = {
          shift: {
            day: dateObj.day() + 1,
            code: override.code as 'morning' | 'evening' | 'night' | 'off' | 'office',
            label: SHIFT_LABELS[override.code as keyof typeof SHIFT_LABELS] || override.code,
            hours: override.code === 'morning' || override.code === 'evening' ? 9 : override.code === 'night' ? 12 : 0,
            startTime: '',
            endTime: '',
          },
          group: userGroup || 'A',
          templateName: 'اوراید دستی مدیریت',
          dayOfCycle: 1,
          cycleLength: 1
        }
      }

      if (shiftRes && shiftRes.shift && shiftRes.shift.code !== 'off') {
        workedShiftsCount++
        totalShiftHours += shiftRes.shift.hours || 0
      }

      // 2. Aggregate tasks
      const userDayTasks = tasks.filter((t) => t.userId === calendarUser && t.date === dateStr)
      userDayTasks.forEach((t) => {
        totalTasksCount++
        if (t.status === 'done') {
          completedTasksCount++
          if (t.type === 'system') {
            totalOvertimeHours += t.overtime || 0
            totalKahrizakMissions += t.kahrizakCount || 0
          }
        }
      })
    }

    return {
      workedShiftsCount,
      totalShiftHours,
      totalOvertimeHours,
      totalKahrizakMissions,
      taskCompletionRate: totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 100,
      totalTasksCount,
      completedTasksCount
    }
  }, [firstDay, calendarUser, assignments, templates, tasks, dbShifts, currentUserProfile])

  // Team average hours calculation from database shifts
  const teamAverageHours = useMemo(() => {
    if (dbShifts.length === 0) return 145
    const userHours: Record<string, number> = {}
    dbShifts.forEach((s) => {
      if (s.code === 'off') return
      const hours = s.code === 'morning' || s.code === 'evening' ? 9 : s.code === 'night' ? 12 : 0
      userHours[s.userId] = (userHours[s.userId] || 0) + hours
    })
    const values = Object.values(userHours)
    if (values.length === 0) return 145
    const sum = values.reduce((a, b) => a + b, 0)
    return Math.round(sum / values.length)
  }, [dbShifts])

  // SheetJS Excel Generator for Personal Report
  function exportToExcel() {
    const userName = MOCK_USERS_LIST.find((u) => u.id === calendarUser)?.name || currentUserProfile?.name || 'پرسنل'
    const dataForSheet = [{
      'نام راهبر': userName,
      'ماه گزارش': firstDay.format('jMMMM jYYYY'),
      'تعداد شیفت‌های فعال': reportData.workedShiftsCount,
      'ساعات حضور موظفی': reportData.totalShiftHours,
      'اضافه کار تأیید شده (ساعت)': reportData.totalOvertimeHours,
      'تعداد ماموریت کهریزک': reportData.totalKahrizakMissions,
      'درصد انجام تسک‌ها': `${Math.round(reportData.taskCompletionRate)}٪`,
    }]

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet)
    worksheet['!dir'] = 'rtl'

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'گزارش شخصی حضور')

    XLSX.writeFile(workbook, `گزارش-حضور-${userName}-${currentYear}-${currentMonth}.xlsx`)
  }

  // Render SVG Hours Comparison Chart
  function renderHoursComparisonChart(userHours: number, avgHours: number, requiredHours: number) {
    const maxVal = Math.max(userHours, avgHours, requiredHours, 180)
    const chartWidth = 500
    const barHeight = 22
    const gap = 18
    const startX = 350 // Right edge alignment for RTL
    const maxBarW = 280 // Grow to the left
    const chartHeight = (barHeight + gap) * 3 + 20

    const items = [
      { label: 'ساعت کارکرد شما', value: userHours, color: 'var(--color-accent)' },
      { label: 'میانگین همکاران', value: avgHours, color: 'var(--color-info)' },
      { label: 'ساعات موظفی خط', value: requiredHours, color: 'var(--color-success)' }
    ]

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {items.map((item, idx) => {
          const y = 15 + (barHeight + gap) * idx
          const barWidth = (maxBarW * item.value) / maxVal
          
          return (
            <g key={idx}>
              {/* Farsi Label */}
              <text
                x={startX + 15}
                y={y + 15}
                fill="var(--color-foreground-muted)"
                className="text-[10px] font-semibold"
                textAnchor="start"
              >
                {item.label}
              </text>

              {/* Background bar */}
              <rect
                x={startX - maxBarW}
                y={y}
                width={maxBarW}
                height={barHeight}
                rx="6"
                fill="var(--color-border)"
                className="opacity-20"
              />

              {/* Foreground bar */}
              <rect
                x={startX - barWidth}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="6"
                fill={item.color}
                className="transition-all duration-1000 ease-out"
              />

              {/* Value metrics */}
              <text
                x={startX - barWidth - 10}
                y={y + 15}
                fill="var(--color-foreground)"
                className="text-[10px] font-mono font-bold"
                textAnchor="end"
              >
                {toFa(item.value)} ساعت
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 text-foreground antialiased selection:bg-accent selection:text-accent-foreground print:bg-white print:text-black" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-subtle pb-4 gap-4 print:hidden">
        <div>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CalendarIcon className="size-6 text-accent" />
            تقویم و برنامه شیفت‌های کاری پرسنل
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            مشاهده برنامه نوبت‌کاری چرخه‌ای، مدیریت تسک‌بردهای روزانه و ثبت درخواست تعویض نوبت سیر و حرکت
          </p>
        </div>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-border-subtle print:hidden gap-4">
        <button
          onClick={() => setActiveTab('calendar')}
          className={cn(
            "pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
            activeTab === 'calendar'
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <CalendarIcon className="size-4" />
          تقویم کاری و تسک‌برد روزانه
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            "pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
            activeTab === 'reports'
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <BarChart3 className="size-4" />
          گزارش حضور و فیش کارکرد ماهانه
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 1: CALENDAR VIEW */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
          {/* Calendar Grid Section */}
          <div className="lg:col-span-8 space-y-5 print:w-full">
            <Card className="border border-border-subtle bg-surface-container-low/40 backdrop-blur shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-sm font-bold text-foreground">تقویم شیفت کاری پرسنل</CardTitle>
                  <Badge variant="outline" className="text-xs bg-accent/5 text-accent border-accent/20">
                    {MOCK_USERS_LIST.find((u) => u.id === calendarUser)?.name || currentUserProfile?.name || 'کاربر جاری'}
                  </Badge>
                </div>
                
                {/* User Selector for calendar */}
                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <Label className="text-xs text-foreground-muted font-bold">نمایش تقویم همکاران:</Label>
                  <select
                    value={calendarUser}
                    onChange={(e) => setCalendarUser(e.target.value)}
                    className="w-52 h-9 text-xs bg-background border border-border rounded-lg px-2.5 outline-none text-foreground cursor-pointer"
                  >
                    <option value="current" className="text-xs bg-neutral-900 text-foreground">
                      {currentUserProfile?.name || 'مهندس حسینی (شما)'}
                    </option>
                    {MOCK_USERS_LIST.filter(u => u.id !== 'current').map((u) => (
                      <option key={u.id} value={u.id} className="text-xs bg-neutral-900 text-foreground">
                        {u.name} (گروه {u.group === 'Staff' ? 'ستادی' : u.group})
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-4">
                {/* Month Controller */}
                <div className="flex items-center justify-between border-b border-border-subtle/40 pb-3 print:hidden">
                  <h2 className="text-sm font-semibold text-accent flex items-center gap-1.5">
                    {firstDay.format('jMMMM jYYYY')}
                    {dbShiftsLoading && <Loader2 className="size-4 animate-spin text-accent" />}
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon-sm" onClick={prevMonth} className="cursor-pointer">
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon-sm" onClick={nextMonth} className="cursor-pointer">
                      <ChevronLeft className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="hidden print:block text-center font-bold text-lg mb-4">
                  برنامه شیفت کاری - {firstDay.format('jMMMM jYYYY')} - پرسنل: {MOCK_USERS_LIST.find((u) => u.id === calendarUser)?.name || currentUserProfile?.name}
                </div>

                {/* Weekdays headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-foreground-muted mb-2">
                  {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'].map((wd, idx) => (
                    <div key={idx} className={cn("py-1", idx === 6 && "text-critical")}>
                      {wd}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty offsets */}
                  {Array.from({ length: startWeekday }).map((_, i) => (
                    <div key={`offset-${i}`} className="min-h-[5.5rem] bg-neutral-950/20 border border-transparent rounded-lg opacity-20" />
                  ))}

                  {/* Month days */}
                  {daysGrid.map((dayData) => {
                    const resolved = dayData.resolvedShift
                    const isSelected = dayData.dateStr === selectedDateStr

                    return (
                      <div
                        key={dayData.day}
                        onClick={() => setSelectedDateStr(dayData.dateStr)}
                        className={cn(
                          "min-h-[5.5rem] rounded-lg border p-1.5 flex flex-col justify-between cursor-pointer transition-all hover:bg-neutral-900/40 select-none",
                          dayData.isToday ? "ring-2 ring-accent border-accent/40 bg-accent/5" : "border-border-subtle bg-neutral-950/30",
                          isSelected && "border-accent bg-neutral-900/60 ring-1 ring-accent/30 shadow-md",
                          dayData.isFriday && "border-critical/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-xs font-bold font-data-mono",
                            dayData.isToday ? "text-accent bg-accent/10 px-1 rounded" : "",
                            dayData.isFriday ? "text-critical" : "text-foreground-muted"
                          )}>
                            {toFa(dayData.day)}
                          </span>
                          
                          {/* Indicator dots for notes and tasks */}
                          <div className="flex gap-1">
                            {dayData.hasNote && (
                              <span className="size-1.5 rounded-full bg-accent" title="دارای یادداشت" />
                            )}
                            {dayData.tasks.length > 0 && (
                              <span className={cn(
                                "size-1.5 rounded-full",
                                dayData.tasks.every(t => t.status === 'done') ? "bg-success" : "bg-warning"
                              )} title="دارای تسک" />
                            )}
                          </div>
                        </div>

                        {/* Shift pill */}
                        {resolved ? (
                          <div className={cn(
                            "rounded px-1.5 py-0.5 text-center text-[10px] font-bold border truncate",
                            SHIFT_COLORS[resolved.shift?.code || ''] || ''
                          )}>
                            {resolved.shift?.label || resolved.shift?.code}
                          </div>
                        ) : (
                          <div className="rounded px-1.5 py-0.5 text-center text-[10px] font-medium border border-border-subtle bg-neutral-900/50 text-foreground-muted">
                            بدون شیفت
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
              <CardFooter className="text-xs text-foreground-muted border-t border-border-subtle/20 pt-4 flex flex-wrap gap-4 print:hidden">
                <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-success/10 border border-success/30" /> نوبت صبح</span>
                <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-info/10 border border-info/30" /> نوبت عصر</span>
                <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-neutral-700/40 border border-neutral-700" /> نوبت شب</span>
                <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-accent/10 border border-accent/30" /> اداری ستادی</span>
                <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-background-subtle border border-border-subtle" /> استراحت (Off)</span>
              </CardFooter>
            </Card>

            {/* ── VISUAL SHIFT SWAP FORM ── */}
            <Card className="border border-border-subtle bg-surface-container-low/40 backdrop-blur shadow-sm">
              <CardHeader className="border-b border-border/20 pb-3">
                <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ArrowLeftRight className="size-4 text-accent" />
                  <span>ثبت درخواست تعویض شیفت کاری با همکاران (کارتابل هوشمند)</span>
                </CardTitle>
                <CardDescription className="text-[10px]">
                  برای جابجایی نوبت کاری خود با یکی از همکاران خط ۱، فرم زیر را به دقت تکمیل نمایید.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                <form onSubmit={handleCreateSwapRequest} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* 1. My shift select */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-foreground-muted">۱. انتخاب نوبت کاری خودتان:</Label>
                      <select
                        value={swapSourceShiftId}
                        onChange={(e) => setSwapSourceShiftId(e.target.value)}
                        className="w-full h-9 text-xs bg-background border border-border rounded-lg px-2 outline-none text-foreground cursor-pointer"
                        required
                      >
                        <option value="">انتخاب شیفت...</option>
                        {myPhysicalShifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {jalali(s.date)} • {SHIFT_LABELS[s.code] || s.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Colleague select */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-foreground-muted">۲. انتخاب همکار جایگزین:</Label>
                      <select
                        value={swapTargetUserId}
                        onChange={(e) => {
                          setSwapTargetUserId(e.target.value)
                          setSwapTargetShiftId('')
                        }}
                        className="w-full h-9 text-xs bg-background border border-border rounded-lg px-2 outline-none text-foreground cursor-pointer"
                        required
                      >
                        <option value="">انتخاب همکار...</option>
                        {colleagues
                          .filter((c) => c.id !== currentUserProfile?.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* 3. Colleague shift select */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-foreground-muted">۳. انتخاب نوبت کاری همکار:</Label>
                      <select
                        value={swapTargetShiftId}
                        onChange={(e) => setSwapTargetShiftId(e.target.value)}
                        disabled={!swapTargetUserId}
                        className="w-full h-9 text-xs bg-background border border-border rounded-lg px-2 outline-none text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        required
                      >
                        <option value="">انتخاب شیفت همکار...</option>
                        {colleaguePhysicalShifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {jalali(s.date)} • {SHIFT_LABELS[s.code] || s.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-foreground-muted">علت درخواست جابجایی نوبت (اختیاری):</Label>
                    <Input
                      placeholder="علت جابجایی، جزئیات توافق یا مرخصی..."
                      value={swapNote}
                      onChange={(e) => setSwapNote(e.target.value)}
                      className="h-9 text-xs bg-background border-border text-start"
                    />
                  </div>

                  {/* Feedback alerts */}
                  {swapError && (
                    <div className="p-3 bg-critical/10 border border-critical/30 rounded-lg text-critical text-xs flex items-center gap-2">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>{swapError}</span>
                    </div>
                  )}

                  {swapSuccess && (
                    <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-success text-xs flex items-center gap-2">
                      <UserCheck className="size-4 shrink-0" />
                      <span>{swapSuccess}</span>
                    </div>
                  )}

                  {/* Action submit button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={submittingSwap}
                      className="px-6 h-9 text-xs font-semibold bg-accent hover:bg-accent-hover text-accent-foreground cursor-pointer flex items-center gap-1.5"
                    >
                      {submittingSwap ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>در حال ارسال...</span>
                        </>
                      ) : (
                        <>
                          <Send className="size-3.5" />
                          <span>ارسال درخواست تعویض شیفت</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Agenda Sidebar Panel */}
          <div className="lg:col-span-4 space-y-4 print:hidden">
            <Card className="border border-accent/20 bg-surface-container-low">
              <CardHeader className="pb-3 border-b border-border-subtle/30 bg-accent/5">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>کارهای روزانه و جزئیات شیفت</span>
                  <Badge variant="outline" className="font-data-mono text-accent bg-accent/5 border-accent/20">
                    {toFa(selectedDayInfo.data?.dateObj?.locale('jalali')?.format('dddd jD jMMMM') ?? '')}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6 pt-4">
                {/* 1. Shift Info Pill Box */}
                <div className="bg-neutral-950/40 p-3 rounded-lg border border-border-subtle/60 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-foreground-muted">شیفت کاری امروز شما:</span>
                    {selectedDayInfo.data?.resolvedShift ? (
                      <Badge className={cn(
                        "text-[11px] px-2 py-0.5",
                        selectedDayInfo.data.resolvedShift.shift?.code === 'morning' && "bg-success/20 text-success border-success/30",
                        selectedDayInfo.data.resolvedShift.shift?.code === 'evening' && "bg-info/20 text-info border-info/30",
                        selectedDayInfo.data.resolvedShift.shift?.code === 'night' && "bg-neutral-700/40 text-foreground-muted border-neutral-700",
                        selectedDayInfo.data.resolvedShift.shift?.code === 'office' && "bg-accent/20 text-accent border-accent/30",
                        selectedDayInfo.data.resolvedShift.shift?.code === 'off' && "bg-background-subtle text-foreground-muted border-border-subtle"
                      )}>
                        {selectedDayInfo.data.resolvedShift.shift?.label}
                      </Badge>
                    ) : (
                      <span className="text-foreground-muted">مرخصی / استراحت</span>
                    )}
                  </div>
                  
                  {selectedDayInfo.data?.resolvedShift?.shift && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border-subtle/20 text-xs">
                      <div className="flex items-center gap-1.5 text-foreground-muted">
                        <Clock className="size-3.5 text-accent" />
                        <span>ساعت: {toFa(selectedDayInfo.data.resolvedShift.shift.startTime || 'آف')} الی {toFa(selectedDayInfo.data.resolvedShift.shift.endTime || 'آف')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-foreground-muted">
                        <Briefcase className="size-3.5 text-accent" />
                        <span>الگو: {selectedDayInfo.data.resolvedShift.templateName}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Personal Note Section (CRUD) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1">
                      <FileText className="size-4 text-accent" />
                      یادداشت شخصی راهبر
                    </Label>
                    {selectedDayInfo.note && (
                      <span className="text-[10px] text-success">ثبت شده در مرورگر</span>
                    )}
                  </div>
                  <Textarea
                    placeholder="نوشتن یادداشت روزانه، وظایف فنی واگن یا موارد شخصی..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-16 text-xs bg-neutral-950/20"
                  />
                  <div className="flex justify-between items-center">
                    <Button size="xs" onClick={handleSaveNote} className="text-xs cursor-pointer">
                      ذخیره یادداشت
                    </Button>
                    {selectedDayInfo.note && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => saveNote(calendarUser, selectedDateStr, '')}
                        className="text-critical hover:bg-critical/10 text-xs cursor-pointer"
                      >
                        <Trash className="size-3 me-1" />
                        حذف یادداشت
                      </Button>
                    )}
                  </div>
                </div>

                {/* 3. Tasks checklist board */}
                <div className="space-y-3 pt-2 border-t border-border-subtle/20">
                  <Label className="text-xs font-bold flex items-center gap-1 text-foreground">
                    <CheckSquare className="size-4 text-accent" />
                    لیست کارهای شخصی امروز
                  </Label>

                  {/* Task list items */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {selectedDayInfo.tasks.length === 0 ? (
                      <p className="text-xs text-foreground-muted text-center py-4 bg-neutral-950/10 rounded border border-dashed border-border-subtle">
                        تسکی برای این تاریخ ثبت نکرده‌اید.
                      </p>
                    ) : (
                      selectedDayInfo.tasks.map((task) => {
                        const isDone = task.status === 'done'
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "flex flex-col p-2.5 rounded-lg border text-xs gap-1.5 transition-all",
                              isDone
                                ? "bg-success/5 border-success/30 opacity-75"
                                : "bg-neutral-950/30 border-border-subtle",
                              task.priority === 'high' && !isDone && "border-critical/30 bg-critical/5"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <button
                                onClick={() => toggleTaskStatus(task.id)}
                                className="flex items-center gap-2 font-medium text-start flex-1 cursor-pointer"
                              >
                                {isDone ? (
                                  <CheckSquare className="size-4 text-success shrink-0" />
                                ) : (
                                  <Square className="size-4 text-foreground-muted shrink-0" />
                                )}
                                <span className={cn(isDone && "line-through text-foreground-muted")}>
                                  {task.title}
                                </span>
                              </button>

                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-foreground-muted hover:text-critical cursor-pointer shrink-0"
                                title="حذف تسک"
                              >
                                <Trash className="size-3.5" />
                              </button>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] text-foreground-muted border-t border-border/10 pt-1.5">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3 text-accent" />
                                {toFa(task.time)}
                              </span>
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[9px] font-bold",
                                task.priority === 'high' && "bg-critical/20 text-critical-foreground",
                                task.priority === 'medium' && "bg-warning/20 text-warning",
                                task.priority === 'low' && "bg-success/20 text-success"
                              )}>
                                {task.priority === 'high' ? 'فوری' : task.priority === 'medium' ? 'متوسط' : 'عادی'}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Add Personal Task Form */}
                  <div className="bg-neutral-950/20 p-3 rounded-lg border border-border-subtle space-y-2 pt-3">
                    <div className="text-[10px] font-bold text-foreground flex justify-start">ایجاد کار یا یادآوری جدید:</div>
                    <Input
                      placeholder="مثلاً: تحویل دفترچه سلامت..."
                      value={personalTitle}
                      onChange={(e) => setPersonalTitle(e.target.value)}
                      className="h-8 text-xs bg-background border-border text-start"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <Label className="text-[9px] text-foreground-muted font-bold shrink-0">ساعت:</Label>
                        <Input
                          type="time"
                          value={personalTime}
                          onChange={(e) => setPersonalTime(e.target.value)}
                          className="h-7 text-xs bg-background border-border text-center font-data-mono p-1"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <Label className="text-[9px] text-foreground-muted font-bold shrink-0">اولویت:</Label>
                        <select
                          value={personalPriority}
                          onChange={(e) => setPersonalPriority(e.target.value as 'low' | 'medium' | 'high')}
                          className="h-7 text-[10px] bg-background border border-border rounded px-1 outline-none text-foreground flex-1 cursor-pointer"
                        >
                          <option value="low">عادی</option>
                          <option value="medium">متوسط</option>
                          <option value="high">فوری</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      size="xs"
                      onClick={handleAddPersonalTask}
                      disabled={!personalTitle.trim()}
                      className="w-full text-xs h-7 cursor-pointer"
                    >
                      <Plus className="size-3.5 me-1" />
                      افزودن به لیست کارها
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 2: REPORTS VIEW */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border bg-surface/35 text-right">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-foreground-muted font-bold">کل شیفت‌های موظفی فعال</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-foreground font-data-mono">{toFa(reportData.workedShiftsCount)}</div>
                <p className="text-[10px] text-foreground-muted mt-1">نوبت کاری موظف ثبت شده در ماه</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-surface/35 text-right">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-foreground-muted font-bold">مجموع ساعات حضور حضوری</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-accent font-data-mono">{toFa(reportData.totalShiftHours)}</div>
                <p className="text-[10px] text-foreground-muted mt-1">ساعت حضور فیزیکی محاسبه شده</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-surface/35 text-right">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-foreground-muted font-bold">ساعات اضافه‌کار تأیید شده</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-success font-data-mono">{toFa(reportData.totalOvertimeHours)}</div>
                <p className="text-[10px] text-foreground-muted mt-1">ساعت اضافه کاری از تسک‌های سیستمی</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-surface/35 text-right">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-foreground-muted font-bold">درصد انجام کارهای محوله</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-warning font-data-mono">{toFa(Math.round(reportData.taskCompletionRate))}٪</div>
                <p className="text-[10px] text-foreground-muted mt-1">تسک‌های شخصی و سیستمی تکمیل شده</p>
              </CardContent>
            </Card>
          </div>

          {/* SVG COMPARATIVE WORK HOURS CHART */}
          <Card className="border border-border/40 bg-surface-container-low/40 backdrop-blur shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BarChart3 className="size-4 text-accent" />
                <span>نمودار مقایسه‌ای ساعات کارکرد ماهانه نسبت به خط و پرسنل</span>
              </CardTitle>
              <CardDescription className="text-[10px]">
                مقایسه کارکرد حضور شما نسبت به میانگین کل همکاران بخش عملیات و ساعات موظفی خط ۱ مترو تهران.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-52 flex items-center justify-center p-4">
              {renderHoursComparisonChart(reportData.totalShiftHours, teamAverageHours, 160)}
            </CardContent>
          </Card>

          {/* Details Table & Export */}
          <Card className="border-border bg-surface-container-low/60 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground">جزئیات حضورو غیاب راهبر در ماه جاری</CardTitle>
                <CardDescription className="text-xs">شامل نوبت کاری‌ها، ماموریت‌های کهریزک و آمارهای کل کارکرد شخصی</CardDescription>
              </div>
              <Button onClick={exportToExcel} className="h-9 text-xs font-bold bg-accent hover:bg-accent-hover text-accent-foreground flex items-center gap-1.5 cursor-pointer">
                <Download className="size-4" />
                خروجی اکسل گزارش حضور
              </Button>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="space-y-4 text-xs text-foreground-muted leading-relaxed pr-2 border-r border-border/50">
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span>نام پرسنل راهبری:</span>
                  <strong className="text-foreground">{currentUserProfile?.name || 'مهندس حسینی'}</strong>
                </div>
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span>کد ملی ثبت شده:</span>
                  <strong className="text-foreground font-data-mono">{toFa(currentUserProfile?.nationalId || '0012345678')}</strong>
                </div>
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span>تعداد مأموریت‌های اعزام اضطراری کهریزک:</span>
                  <strong className="text-foreground font-data-mono">{toFa(reportData.totalKahrizakMissions)} مأموریت</strong>
                </div>
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <span>مجموع تسک‌های محول شده در ماه:</span>
                  <strong className="text-foreground font-data-mono">{toFa(reportData.totalTasksCount)} تسک ({toFa(reportData.completedTasksCount)} انجام شده)</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
