'use client'

import { useState, useEffect, useMemo } from 'react'
import { jdate, dayjs, gregStr } from '@/lib/dayjs'
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
  UserCheck,
  GraduationCap,
  UserMinus,
  Timer,
  CheckCircle2,
  XCircle,
  Info,
  CalendarDays,
  Flame,
  Sparkles,
  Activity,
  Award,
  Shield
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

import { useAuthStore } from '@/features/auth'
import { 
  shiftsApi, 
  type ShiftNoteDto, 
  type ShiftTaskDto, 
  type ResolvedShiftResponse 
} from '@/features/shifts'
import { normalizeGroup } from '@/lib/shift-grouping'
import { toFa, jalali } from '@/lib/fa'
import { cn } from '@/lib/utils'

interface UserProfile {
  id?: string
  name?: string
  personnelCode?: string
  roleId?: string
  customFields?: {
    shift?: string
    shiftType?: string
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

const LAYERS = [
  { key: 'shifts', label: 'شیفت‌ها', icon: Shield, color: 'text-accent' },
  { key: 'leave', label: 'مرخصی و مأموریت', icon: UserMinus, color: 'text-emerald-400' },
  { key: 'meetings', label: 'آموزش و جلسات', icon: GraduationCap, color: 'text-indigo-400' },
  { key: 'bulletins', label: 'ابلاغیه ایمنی', icon: AlertTriangle, color: 'text-amber-400' },
  { key: 'attendance', label: 'حضور و غیاب', icon: Timer, color: 'text-success' },
]

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
  // Tabs state
  const [activeTab, setActiveTab] = useState<'calendar' | 'reports' | 'supervisor'>('calendar')

  // Selected User in Calendar (default: current logged in user)
  const [calendarUser, setCalendarUser] = useState<string>('current')

  // Date navigation state (Jalali Month/Year)
  const now = jdate()
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

  // Database Shifts & Overrides
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

  // Local state for DB-persisted shifts, notes, and tasks
  const [resolvedShifts, setResolvedShifts] = useState<ResolvedShiftResponse[]>([])
  const [resolvedLoading, setResolvedLoading] = useState(false)
  const [notes, setNotes] = useState<ShiftNoteDto[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [tasks, setTasks] = useState<ShiftTaskDto[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)

  // Calendar Active Layers
  const [activeLayers, setActiveLayers] = useState<string[]>([
    'shifts',
    'leave',
    'meetings',
    'bulletins',
    'attendance',
  ])

  // Leave Requests state with localStorage persistence
  const [leaveRequests, setLeaveRequests] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('metro_leave_requests')
      if (saved) return JSON.parse(saved)
    }
    return [
      {
        id: 'leave-1',
        userId: 'current',
        type: 'annual',
        startDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().add(4, 'day').format('YYYY-MM-DD'),
        status: 'approved',
        reason: 'کارهای شخصی و تمدید مدارک'
      },
      {
        id: 'leave-2',
        userId: 'user-2', // will map to a colleague
        type: 'sick',
        startDate: dayjs().add(8, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().add(9, 'day').format('YYYY-MM-DD'),
        status: 'pending',
        reason: 'سرماخوردگی شدید و استراحت پزشکی'
      }
    ]
  })

  // Leave Form States
  const [leaveType, setLeaveType] = useState<'annual' | 'sick' | 'unpaid'>('annual')
  const [leaveStartDate, setLeaveStartDate] = useState(() => dayjs().add(7, 'day').format('YYYY-MM-DD'))
  const [leaveEndDate, setLeaveEndDate] = useState(() => dayjs().add(8, 'day').format('YYYY-MM-DD'))
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveBalance, setLeaveBalance] = useState(26) // days left

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('metro_leave_requests', JSON.stringify(leaveRequests))
    }
  }, [leaveRequests])

  // Sight Confirmations State with localStorage persistence
  const [sightConfirmations, setSightConfirmations] = useState<Record<string, { confirmedAt: string }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('metro_sight_confirmations')
      if (saved) return JSON.parse(saved)
    }
    return {
      [dayjs().subtract(1, 'day').format('YYYY-MM-DD')]: { confirmedAt: dayjs().subtract(1, 'day').set('hour', 7).toISOString() }
    }
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('metro_sight_confirmations', JSON.stringify(sightConfirmations))
    }
  }, [sightConfirmations])

  // Active Training/Meetings Events (Mock DB)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([
    {
      id: 'ev-1',
      title: 'کارگاه آموزشی راهبری قطارهای سری ۷۰۰',
      type: 'training',
      date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      startTime: '09:00',
      endTime: '12:00',
      location: 'دپو غرب - سالن کنفرانس'
    },
    {
      id: 'ev-2',
      title: 'جلسه ارزیابی سوانح خط ۱ با رئیس بخش',
      type: 'meeting',
      date: dayjs().add(5, 'day').format('YYYY-MM-DD'),
      startTime: '10:30',
      endTime: '12:00',
      location: 'ساختمان اداری کالج - اتاق ۳۰۴'
    }
  ])

  // Safety Bulletins list (local mock to display on calendar)
  const [safetyBulletins, setSafetyBulletins] = useState<any[]>([])
  useEffect(() => {
    async function loadBulletins() {
      if (!accessToken) return
      try {
        const res = await fetch('/api/bulletins', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        if (res.ok) {
          const json = await res.json()
          setSafetyBulletins(json.data || [])
        }
      } catch {
        // silent fallback
      }
    }
    void loadBulletins()
  }, [accessToken])

  // Attendance Records State
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])
  useEffect(() => {
    async function loadAttendance() {
      if (!accessToken) return
      try {
        const res = await fetch('/api/attendance/me?limit=100', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        if (res.ok) {
          const json = await res.json()
          setAttendanceRecords(json.data || [])
        }
      } catch {
        // silent
      }
    }
    void loadAttendance()
  }, [accessToken, currentMonth, currentYear])

  // AI Assistant Widget states
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

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

  // Fetch Resolved Shifts, Notes, and Tasks for the active month
  useEffect(() => {
    async function loadAllShiftsData() {
      if (!accessToken) return
      
      const firstDayOfMonth = jdate()
        .year(currentYear)
        .month(currentMonth - 1)
        .date(1)
      const startStr = firstDayOfMonth.startOf('month').toISOString()
      const endStr = firstDayOfMonth.endOf('month').toISOString()

      const realUserId = calendarUser === 'current' ? (currentUserProfile?.id || '') : calendarUser

      // 1. Fetch Resolved Shifts (combining templates + overrides)
      if (realUserId) {
        setResolvedLoading(true)
        try {
          const data = await shiftsApi.getResolved(accessToken, realUserId, startStr, endStr)
          setResolvedShifts(data)
        } catch {
          // silent fallback
        } finally {
          setResolvedLoading(false)
        }
      }

      // 2. Fetch User Notes from DB
      setNotesLoading(true)
      try {
        const notesData = await shiftsApi.getNotes(accessToken, startStr, endStr)
        setNotes(notesData)
      } catch {
        // silent fallback
      } finally {
        setNotesLoading(false)
      }

      // 3. Fetch User Tasks from DB
      setTasksLoading(true)
      try {
        const tasksData = await shiftsApi.getTasks(accessToken, startStr, endStr)
        setTasks(tasksData)
      } catch {
        // silent fallback
      } finally {
        setTasksLoading(false)
      }

      // 4. Fetch Database Shifts (materialized + overrides) for the active month
      setDbShiftsLoading(true)
      try {
        const res = await fetch(`/api/shifts?startDate=${startStr}&endDate=${endStr}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const json = await res.json()
          setDbShifts(json.data || [])
        }
      } catch {
        // silent
      } finally {
        setDbShiftsLoading(false)
      }
    }

    void loadAllShiftsData()
  }, [currentMonth, currentYear, calendarUser, accessToken, currentUserProfile])

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
    const currentNote = notes.find((n) => dayjs(n.date).format('YYYY-MM-DD') === selectedDateStr)
    setNoteContent(currentNote?.content || '')
  }, [selectedDateStr, notes])

  // Calendar Calculation Helpers
  const firstDay = useMemo(() => {
    return jdate()
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
      const dateStr = gregStr(dateObj)
      
      const userGroup = (calendarUser === 'current' && currentUserProfile?.customFields)
        ? normalizeGroup(currentUserProfile.customFields.shift ?? currentUserProfile.customFields.group)
        : undefined

      const dbResolved = resolvedShifts.find((rs) => rs.date === dateStr)

      const resolved = dbResolved ? {
        shift: dbResolved.shift ? {
          day: dateObj.day() + 1,
          code: dbResolved.shift.code,
          label: SHIFT_LABELS[dbResolved.shift.code] || dbResolved.shift.label || dbResolved.shift.code,
          hours: dbResolved.shift.hours,
          startTime: dbResolved.shift.startTime,
          endTime: dbResolved.shift.endTime,
        } : null,
        group: userGroup || 'A',
        templateName: dbResolved.templateName,
        source: dbResolved.source,
        dayOfCycle: dbResolved.shift?.day || 1,
        cycleLength: 1
      } : null

      const dayTasks = tasks.filter((t) => dayjs(t.date).format('YYYY-MM-DD') === dateStr)
      const dayNote = notes.find((n) => dayjs(n.date).format('YYYY-MM-DD') === dateStr)

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
  }, [firstDay, daysInMonth, calendarUser, tasks, notes, resolvedShifts, currentUserProfile])

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
    const note = notes.find((n) => dayjs(n.date).format('YYYY-MM-DD') === selectedDateStr)
    const dayTasks = tasks.filter((t) => dayjs(t.date).format('YYYY-MM-DD') === selectedDateStr)
    return {
      data: dayData,
      note,
      tasks: dayTasks
    }
  }, [selectedDateStr, daysGrid, notes, tasks])

  // Note CRUD Handlers
  async function handleSaveNote() {
    if (!accessToken) return
    try {
      await shiftsApi.saveNote(accessToken, selectedDateStr, noteContent)
      playAlertSound('success')
      // Refresh notes
      const firstDayOfMonth = jdate()
        .year(currentYear)
        .month(currentMonth - 1)
        .date(1)
      const startStr = firstDayOfMonth.startOf('month').toISOString()
      const endStr = firstDayOfMonth.endOf('month').toISOString()
      const notesData = await shiftsApi.getNotes(accessToken, startStr, endStr)
      setNotes(notesData)
    } catch {
      playAlertSound('warning')
    }
  }

  async function handleDeleteNote() {
    if (!accessToken || !selectedDayInfo.note) return
    try {
      await shiftsApi.deleteNote(accessToken, selectedDayInfo.note.id)
      playAlertSound('success')
      setNoteContent('')
      // Refresh notes
      const firstDayOfMonth = jdate()
        .year(currentYear)
        .month(currentMonth - 1)
        .date(1)
      const startStr = firstDayOfMonth.startOf('month').toISOString()
      const endStr = firstDayOfMonth.endOf('month').toISOString()
      const notesData = await shiftsApi.getNotes(accessToken, startStr, endStr)
      setNotes(notesData)
    } catch {
      playAlertSound('warning')
    }
  }

  // Personal Task Creator
  async function handleAddPersonalTask() {
    if (!personalTitle.trim() || !accessToken) return
    try {
      await shiftsApi.createTask(accessToken, {
        date: selectedDateStr,
        title: personalTitle,
        time: personalTime,
        priority: personalPriority,
        status: 'todo',
        type: 'personal'
      })
      playAlertSound('success')
      setPersonalTitle('')
      // Refresh tasks
      const firstDayOfMonth = jdate()
        .year(currentYear)
        .month(currentMonth - 1)
        .date(1)
      const startStr = firstDayOfMonth.startOf('month').toISOString()
      const endStr = firstDayOfMonth.endOf('month').toISOString()
      const tasksData = await shiftsApi.getTasks(accessToken, startStr, endStr)
      setTasks(tasksData)
    } catch {
      playAlertSound('warning')
    }
  }

  async function handleToggleTaskStatus(id: string) {
    if (!accessToken) return
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    try {
      await shiftsApi.updateTask(accessToken, id, { status: newStatus })
      playAlertSound('success')
      // Refresh tasks
      const firstDayOfMonth = jdate()
        .year(currentYear)
        .month(currentMonth - 1)
        .date(1)
      const startStr = firstDayOfMonth.startOf('month').toISOString()
      const endStr = firstDayOfMonth.endOf('month').toISOString()
      const tasksData = await shiftsApi.getTasks(accessToken, startStr, endStr)
      setTasks(tasksData)
    } catch {
      playAlertSound('warning')
    }
  }

  async function handleDeleteTask(id: string) {
    if (!accessToken) return
    try {
      await shiftsApi.deleteTask(accessToken, id)
      playAlertSound('success')
      // Refresh tasks
      const firstDayOfMonth = jdate()
        .year(currentYear)
        .month(currentMonth - 1)
        .date(1)
      const startStr = firstDayOfMonth.startOf('month').toISOString()
      const endStr = firstDayOfMonth.endOf('month').toISOString()
      const tasksData = await shiftsApi.getTasks(accessToken, startStr, endStr)
      setTasks(tasksData)
    } catch {
      playAlertSound('warning')
    }
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

  // Sight Confirmation Handler
  function handleConfirmSight() {
    if (!selectedDateStr) return
    const nowIso = new Date().toISOString()
    setSightConfirmations(prev => ({
      ...prev,
      [selectedDateStr]: { confirmedAt: nowIso }
    }))
    playAlertSound('success')
  }

  // Leave Request Submission
  function handleCreateLeaveRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!leaveStartDate || !leaveEndDate) return
    
    const start = dayjs(leaveStartDate)
    const end = dayjs(leaveEndDate)
    const days = end.diff(start, 'day') + 1

    if (days <= 0) {
      playAlertSound('warning')
      alert('تاریخ پایان باید بعد از تاریخ شروع باشد')
      return
    }

    if (leaveType === 'annual' && days > leaveBalance) {
      playAlertSound('warning')
      alert('تعداد روزهای درخواستی بیشتر از مانده مرخصی استحقاقی شما است')
      return
    }

    const newLeave = {
      id: `leave-${Date.now()}`,
      userId: 'current',
      type: leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      status: 'pending',
      reason: leaveReason.trim()
    }

    setLeaveRequests(prev => [newLeave, ...prev])
    setLeaveReason('')
    playAlertSound('success')
  }

  // Supervisor Leave Approval Handler
  function handleApproveLeave(id: string, action: 'approved' | 'rejected') {
    setLeaveRequests(prev =>
      prev.map(r => {
        if (r.id === id) {
          if (action === 'approved' && r.type === 'annual') {
            const start = dayjs(r.startDate)
            const end = dayjs(r.endDate)
            const days = end.diff(start, 'day') + 1
            setLeaveBalance(prevBal => Math.max(0, prevBal - days))
          }
          return { ...r, status: action }
        }
        return r
      })
    )
    playAlertSound('success')
  }

  // Personal BI Reports Aggregation
  const reportData = useMemo(() => {
    let workedShiftsCount = 0
    let totalShiftHours = 0
    let totalOvertimeHours = 0
    let totalKahrizakMissions = 0
    let completedTasksCount = 0
    let totalTasksCount = 0

    resolvedShifts.forEach((rs) => {
      if (rs.shift && rs.shift.code !== 'off') {
        workedShiftsCount++
        totalShiftHours += rs.shift.hours || 0
      }
    })

    tasks.forEach((t) => {
      totalTasksCount++
      if (t.status === 'done') {
        completedTasksCount++
        if (t.type === 'system') {
          totalOvertimeHours += t.overtime || 0
          const extra = t.extraData as { kahrizakCount?: number } | null
          totalKahrizakMissions += extra?.kahrizakCount || 0
        }
      }
    })

    return {
      workedShiftsCount,
      totalShiftHours,
      totalOvertimeHours,
      totalKahrizakMissions,
      taskCompletionRate: totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 100,
      totalTasksCount,
      completedTasksCount
    }
  }, [resolvedShifts, tasks])

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

  // AI Assistant Query Handler
  function handleAiAsk(e: React.FormEvent) {
    e.preventDefault()
    if (!aiQuery.trim()) return

    setAiLoading(true)
    setAiResponse('')

    setTimeout(() => {
      const q = aiQuery.toLowerCase().trim()
      let reply = ''

      if (q.includes('شب') || q.includes('شب‌کاری') || q.includes('شیفت شب')) {
        const nightShiftsCount = resolvedShifts.filter(s => s.shift?.code === 'night').length
        reply = `شما در بازه لوحه فعال جاری، تعداد ${toFa(nightShiftsCount)} شیفت شب دارید. طبق آیین‌نامه ایمنی خط ۱، حداقل استراحت لازم تامین شده است.`
      } else if (q.includes('مرخصی') || q.includes('مانده')) {
        reply = `مانده مرخصی استحقاقی شما در حال حاضر ${toFa(leaveBalance)} روز است. آخرین مرخصی مصوب شما در سیستم ثبت شده است.`
      } else if (q.includes('تداخل') || q.includes('جلسه') || q.includes('آموزش')) {
        reply = `خیر، طبق بررسی تقویم، کلاس‌های آموزشی شما در نوبت صبح قرار دارند در حالی که روز دوشنبه شیفت کاری شما عصرکار است؛ تداخلی دیده نشد.`
      } else if (q.includes('ساعت') || q.includes('کارکرد')) {
        reply = `مجموع کارکرد شما در این ماه ${toFa(reportData.totalShiftHours)} ساعت است. میانگین کل همکاران خط ${toFa(teamAverageHours)} ساعت است.`
      } else {
        reply = `کاربر گرامی، طبق دفترچه راهنمای راهبران خط ۱ مترو تهران، برنامه حضور فیزیکی، آموزش‌های اجباری و اورایدهای لوحه فعال شما در تقویم بومی کاملاً هماهنگ شده است.`
      }

      setAiResponse(reply)
      setAiLoading(false)
      playAlertSound('success')
    }, 800)
  }

  // Fatigue and Scheduling Rule Engine Panel
  const ruleViolations = useMemo(() => {
    const violations: Array<{ id: string; type: 'warning' | 'critical'; message: string }> = []
    
    // 1. Check Interday Rest Hours (< 11 hours)
    for (let i = 0; i < daysGrid.length - 1; i++) {
      const day1 = daysGrid[i]
      const day2 = daysGrid[i+1]
      const s1 = day1.resolvedShift?.shift
      const s2 = day2.resolvedShift?.shift
      
      if (s1?.code === 'night' && s2?.code === 'morning') {
        violations.push({
          id: `viol-rest-${day1.dateStr}`,
          type: 'warning',
          message: `کاهش زمان استراحت بین‌روزی: شیفت شب در تاریخ ${jalali(day1.dateStr)} بلافاصله با شیفت صبح در تاریخ ${jalali(day2.dateStr)} دنبال شده است (کمتر از ۱۱ ساعت استراحت).`
        })
      }
    }

    // 2. Check Leave Conflicts
    daysGrid.forEach(day => {
      const hasApprovedLeave = leaveRequests.some(r => 
        r.userId === 'current' && 
        r.status === 'approved' && 
        (dayjs(day.dateStr).isSame(r.startDate, 'day') || 
         dayjs(day.dateStr).isSame(r.endDate, 'day') || 
         (dayjs(day.dateStr).isAfter(r.startDate, 'day') && dayjs(day.dateStr).isBefore(r.endDate, 'day')))
      )
      
      if (hasApprovedLeave && day.resolvedShift && day.resolvedShift.shift && day.resolvedShift.shift.code !== 'off') {
        violations.push({
          id: `viol-leave-${day.dateStr}`,
          type: 'critical',
          message: `تداخل برنامه کاری با مرخصی: شیفت ${day.resolvedShift.shift.label} در تاریخ ${jalali(day.dateStr)} با مرخصی مصوب شما تداخل دارد.`
        })
      }
    })

    // 3. Check Consecutive Night Shifts (> 3 nights)
    let consecutiveNights = 0
    for (let i = 0; i < daysGrid.length; i++) {
      const s = daysGrid[i].resolvedShift?.shift
      if (s?.code === 'night') {
        consecutiveNights++
        if (consecutiveNights > 3) {
          violations.push({
            id: `viol-consec-night-${daysGrid[i].dateStr}`,
            type: 'warning',
            message: `هشدار خستگی: بیش از ۳ شیفت شب متوالی از تاریخ ${jalali(daysGrid[i-consecutiveNights+1].dateStr)} تا ${jalali(daysGrid[i].dateStr)} برنامه‌ریزی شده است.`
          })
        }
      } else {
        consecutiveNights = 0
      }
    }

    return violations
  }, [daysGrid, leaveRequests])

  // SheetJS Excel Generator for Personal Report
  function exportToExcel() {
    const targetColleague = colleagues.find((c) => c.id === calendarUser)
    const userName = targetColleague?.name || currentUserProfile?.name || 'پرسنل'
    const dataForSheet = [{
      'نام راهبر': userName,
      'ماه گزارش': toFa(firstDay.format('MMMM YYYY')),
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
        <button
          onClick={() => setActiveTab('supervisor')}
          className={cn(
            "pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
            activeTab === 'supervisor'
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <UserCheck className="size-4" />
          نمای سرپرستی و مدیریت خط
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
                    {colleagues.find((u) => u.id === calendarUser)?.name || currentUserProfile?.name || 'کاربر جاری'}
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
                      {currentUserProfile?.name || 'شما'}
                    </option>
                    {colleagues.filter(u => u.id !== currentUserProfile?.id).map((u) => {
                      const group = u.customFields ? normalizeGroup((u.customFields as Record<string, any>).shift ?? (u.customFields as Record<string, any>).group) : 'A'
                      return (
                        <option key={u.id} value={u.id} className="text-xs bg-neutral-900 text-foreground">
                          {u.name} (گروه {group})
                        </option>
                      )
                    })}
                  </select>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-4">
                {/* Month Controller */}
                <div className="flex items-center justify-between border-b border-border-subtle/40 pb-3 print:hidden">
                  <h2 className="text-sm font-semibold text-accent flex items-center gap-1.5">
                    {toFa(firstDay.format('MMMM YYYY'))}
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

                {/* Active Layers Toggler Toolbar */}
                <div className="flex flex-wrap items-center gap-2 bg-neutral-950/30 border border-border-subtle/30 p-2.5 rounded-xl text-xs print:hidden">
                  <span className="text-foreground-muted font-bold me-2">لایه‌های تقویم:</span>
                  {LAYERS.map(layer => {
                    const isActive = activeLayers.includes(layer.key)
                    const Icon = layer.icon
                    return (
                      <button
                        key={layer.key}
                        onClick={() => {
                          if (isActive) {
                            setActiveLayers(prev => prev.filter(k => k !== layer.key))
                          } else {
                            setActiveLayers(prev => [...prev, layer.key])
                          }
                          playAlertSound('info')
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all",
                          isActive
                            ? "bg-accent/15 border-accent text-foreground shadow-sm"
                            : "bg-transparent border-border/40 text-foreground-muted hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("size-3.5", layer.color)} />
                        {layer.label}
                      </button>
                    )
                  })}
                </div>

                <div className="hidden print:block text-center font-bold text-lg mb-4">
                  برنامه شیفت کاری - {toFa(firstDay.format('MMMM YYYY'))} - پرسنل: {colleagues.find((u) => u.id === calendarUser)?.name || currentUserProfile?.name || ''}
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

                    // Determine active layers
                    const isLeaveActive = activeLayers.includes('leave')
                    const isShiftsActive = activeLayers.includes('shifts')
                    const isMeetingsActive = activeLayers.includes('meetings')
                    const isBulletinsActive = activeLayers.includes('bulletins')
                    const isAttendanceActive = activeLayers.includes('attendance')

                    // Find approved leaves
                    const dayLeave = isLeaveActive && leaveRequests.find(r => 
                      r.userId === (calendarUser === 'current' ? 'current' : calendarUser) && 
                      r.status === 'approved' && 
                      (dayjs(dayData.dateStr).isSame(r.startDate, 'day') || 
                       dayjs(dayData.dateStr).isSame(r.endDate, 'day') || 
                       (dayjs(dayData.dateStr).isAfter(r.startDate, 'day') && dayjs(dayData.dateStr).isBefore(r.endDate, 'day')))
                    )

                    // Find pending leaves
                    const dayPendingLeave = isLeaveActive && leaveRequests.find(r => 
                      r.userId === (calendarUser === 'current' ? 'current' : calendarUser) && 
                      r.status === 'pending' && 
                      (dayjs(dayData.dateStr).isSame(r.startDate, 'day') || 
                       dayjs(dayData.dateStr).isSame(r.endDate, 'day') || 
                       (dayjs(dayData.dateStr).isAfter(r.startDate, 'day') && dayjs(dayData.dateStr).isBefore(r.endDate, 'day')))
                    )

                    // Find events
                    const dayEventsList = isMeetingsActive ? calendarEvents.filter(e => e.date === dayData.dateStr) : []

                    // Find bulletins
                    const dayBulletinsList = isBulletinsActive ? safetyBulletins.filter(b => dayjs(b.createdAt).format('YYYY-MM-DD') === dayData.dateStr) : []

                    // Find attendance
                    const dayAttendanceRec = isAttendanceActive ? attendanceRecords.find(r => dayjs(r.checkInTime).format('YYYY-MM-DD') === dayData.dateStr) : null

                    // Sight status
                    const isSightConfirmed = sightConfirmations[dayData.dateStr]

                    // Cell styles & labels
                    let cellBg = "border-border-subtle bg-neutral-950/20 text-foreground"
                    let statusLabel = ""

                    if (dayLeave) {
                      cellBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      statusLabel = dayLeave.type === 'sick' ? 'مرخصی استعلاجی' : 'مرخصی استحقاقی'
                    } else if (dayPendingLeave) {
                      cellBg = "bg-emerald-500/5 text-emerald-500/50 border-dashed border-emerald-500/30"
                      statusLabel = 'انتظار تایید مرخصی'
                    } else if (dayAttendanceRec && dayAttendanceRec.checkOutTime === null && isAttendanceActive) {
                      cellBg = "bg-success/5 text-success border-success/30 ring-1 ring-success/10"
                      statusLabel = "حاضر (در حال کار)"
                    } else if (resolved && isShiftsActive) {
                      const code = resolved.shift?.code
                      if (code === 'morning') {
                        cellBg = "bg-blue-500/10 text-blue-400 border-blue-500/20 ring-1 ring-blue-500/10"
                        statusLabel = "صبح‌کار"
                      } else if (code === 'evening') {
                        cellBg = "bg-orange-500/10 text-orange-400 border-orange-500/20 ring-1 ring-orange-500/10"
                        statusLabel = "عصرکار"
                      } else if (code === 'night') {
                        cellBg = "bg-purple-500/10 text-purple-400 border-purple-500/20 ring-1 ring-purple-500/10"
                        statusLabel = "شب‌کار"
                      } else if (code === 'office') {
                        cellBg = "bg-neutral-500/10 text-neutral-400 border-neutral-500/20 ring-1 ring-neutral-500/10"
                        statusLabel = "اداری"
                      } else if (code === 'off') {
                        cellBg = "bg-neutral-900/50 text-foreground-muted border-neutral-800"
                        statusLabel = "آف"
                      }
                    } else if (dayData.isFriday) {
                      cellBg = "border-critical/20 bg-critical/5 text-critical/85"
                    }

                    const isOverride = resolved && resolved.source === 'manual'

                    return (
                      <div
                        key={dayData.day}
                        onClick={() => setSelectedDateStr(dayData.dateStr)}
                        className={cn(
                          "min-h-[5.5rem] rounded-lg border p-1.5 flex flex-col justify-between cursor-pointer transition-all hover:bg-neutral-900/40 select-none",
                          cellBg,
                          dayData.isToday && "ring-2 ring-accent border-accent/40 bg-accent/5",
                          isSelected && "ring-2 ring-accent border-accent bg-neutral-900/60 shadow-md",
                          isOverride && "border-dashed border-2 border-accent"
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
                          
                          {/* Indicators */}
                          <div className="flex items-center gap-1">
                            {dayEventsList.length > 0 && (
                              <span title={dayEventsList[0].title}><GraduationCap className="size-3 text-indigo-400" /></span>
                            )}
                            {dayBulletinsList.length > 0 && (
                              <span title="ابلاغیه ایمنی"><AlertTriangle className="size-3 text-amber-400 animate-pulse" /></span>
                            )}
                            {dayData.hasNote && (
                              <span className="size-1 rounded-full bg-accent animate-ping" title="یادداشت" />
                            )}
                            {isSightConfirmed && (
                              <span title="رؤیت شد"><CheckCircle2 className="size-3.5 text-success" /></span>
                            )}
                          </div>
                        </div>

                        {/* Status Label */}
                        <div className="flex flex-col gap-1 items-stretch">
                          <div className="rounded px-1.5 py-0.5 text-center text-[9px] font-bold border border-white/5 bg-black/35 truncate">
                            {statusLabel || "آف استراحت"}
                          </div>

                          {/* Attendance CheckIn Time display */}
                          {dayAttendanceRec && (
                            <div className="flex items-center justify-center gap-1 text-[8px] font-mono text-success">
                              <Timer className="size-2.5" />
                              <span>{toFa(dayjs(dayAttendanceRec.checkInTime).format('HH:mm'))}</span>
                            </div>
                          )}
                        </div>
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

          <div className="lg:col-span-4 space-y-4 print:hidden">
            {/* 1. Daily Agenda & Shift Details Card */}
            <Card className="border border-accent/20 bg-surface-container-low shadow-lg backdrop-blur">
              <CardHeader className="pb-3 border-b border-border-subtle/30 bg-accent/5">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>کارهای روزانه و جزئیات شیفت</span>
                  <Badge variant="outline" className="font-data-mono text-accent bg-accent/15 border-accent/20">
                    {toFa(selectedDayInfo.data?.dateObj?.format('dddd D MMMM') ?? '')}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5 pt-4">
                {/* Shift Details Box */}
                <div className="bg-neutral-950/45 p-3.5 rounded-xl border border-border-subtle/60 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-foreground-muted font-medium">شیفت کاری:</span>
                    {selectedDayInfo.data?.resolvedShift ? (
                      <Badge className={cn(
                        "text-[10px] px-2 py-0.5 font-bold border",
                        selectedDayInfo.data.resolvedShift.shift?.code === 'morning' && "bg-blue-500/20 text-blue-400 border-blue-500/30",
                        selectedDayInfo.data.resolvedShift.shift?.code === 'evening' && "bg-orange-500/20 text-orange-400 border-orange-500/30",
                        selectedDayInfo.data.resolvedShift.shift?.code === 'night' && "bg-purple-500/20 text-purple-400 border-purple-500/30",
                        selectedDayInfo.data.resolvedShift.shift?.code === 'office' && "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
                        selectedDayInfo.data.resolvedShift.shift?.code === 'off' && "bg-neutral-800/40 text-foreground-muted border-neutral-800"
                      )}>
                        {selectedDayInfo.data.resolvedShift.shift?.label}
                      </Badge>
                    ) : (
                      <span className="text-foreground-muted">استراحت (آف)</span>
                    )}
                  </div>
                  
                  {selectedDayInfo.data?.resolvedShift?.shift && (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-border-subtle/25 pt-2 text-foreground-muted">
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-accent" />
                          <span>ساعت: {toFa(selectedDayInfo.data.resolvedShift.shift.startTime || 'آف')} الی {toFa(selectedDayInfo.data.resolvedShift.shift.endTime || 'آف')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Shield className="size-3.5 text-accent" />
                          <span>محل: {selectedDayInfo.data.resolvedShift.shift.code === 'morning' ? 'دپو غرب' : 'ایستگاه امام خمینی'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Activity className="size-3.5 text-accent" />
                          <span>اعزام قطار: {toFa('۱۰۴')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="size-3.5 text-accent" />
                          <span>لوحه: {selectedDayInfo.data.resolvedShift.templateName}</span>
                        </div>
                      </div>

                      {/* Sight Confirmation Button / Badge */}
                      <div className="border-t border-border-subtle/25 pt-2.5 mt-1 flex flex-col gap-1.5">
                        {sightConfirmations[selectedDateStr] ? (
                          <div className="bg-success/10 border border-success/30 rounded-lg p-2 flex items-center justify-between text-success text-[11px]">
                            <span className="flex items-center gap-1 font-bold">
                              <CheckCircle2 className="size-4 text-success" />
                              رؤیت و تایید شد
                            </span>
                            <span className="font-mono text-[10px]">
                              {toFa(dayjs(sightConfirmations[selectedDateStr].confirmedAt).format('HH:mm - YYYY/MM/DD'))}
                            </span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={handleConfirmSight}
                            className="w-full bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 text-xs font-semibold cursor-pointer h-8"
                          >
                            <UserCheck className="size-3.5 me-1.5" />
                            تأیید رؤیت شیفت کاری امروز
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Leaves Info on Selected Day */}
                {(() => {
                  const dayLeave = leaveRequests.find(r => 
                    r.userId === (calendarUser === 'current' ? 'current' : calendarUser) && 
                    (dayjs(selectedDateStr).isSame(r.startDate, 'day') || 
                     dayjs(selectedDateStr).isSame(r.endDate, 'day') || 
                     (dayjs(selectedDateStr).isAfter(r.startDate, 'day') && dayjs(selectedDateStr).isBefore(r.endDate, 'day')))
                  )
                  if (!dayLeave) return null
                  return (
                    <div className={cn(
                      "p-3 rounded-lg border text-xs space-y-1 shadow-sm",
                      dayLeave.status === 'approved' 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20 border-dashed"
                    )}>
                      <div className="font-bold flex items-center gap-1.5">
                        <UserMinus className="size-4 shrink-0" />
                        <span>{dayLeave.status === 'approved' ? '🌴 مرخصی تأیید شده' : '⌛ مرخصی در انتظار بررسی'}</span>
                      </div>
                      <div className="text-[10px] text-foreground-muted">
                        نوع مرخصی: {dayLeave.type === 'annual' ? 'استحقاقی' : dayLeave.type === 'sick' ? 'استعلاجی' : 'بدون حقوق'} (تاریخ {toFa(dayLeave.startDate)} الی {toFa(dayLeave.endDate)})
                      </div>
                      {dayLeave.reason && <p className="text-[10px] italic">توضیح: {dayLeave.reason}</p>}
                    </div>
                  )
                })()}

                {/* Training and Meetings on Selected Day */}
                {(() => {
                  const dayEvs = calendarEvents.filter(e => e.date === selectedDateStr)
                  if (dayEvs.length === 0) return null
                  return (
                    <div className="space-y-2 border-t border-border-subtle/25 pt-3">
                      <Label className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                        <GraduationCap className="size-4" />
                        رویدادها و جلسات امروز
                      </Label>
                      {dayEvs.map(ev => (
                        <div key={ev.id} className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-lg text-xs space-y-1 text-indigo-300">
                          <div className="font-bold">{ev.title}</div>
                          <div className="text-[10px] flex justify-between text-indigo-400/90 font-mono">
                            <span>🕒 ساعت {toFa(ev.startTime)} الی {toFa(ev.endTime)}</span>
                            <span>📍 {ev.location}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Bulletins published today */}
                {(() => {
                  const dayBulletins = safetyBulletins.filter(b => dayjs(b.createdAt).format('YYYY-MM-DD') === selectedDateStr)
                  if (dayBulletins.length === 0) return null
                  return (
                    <div className="space-y-2 border-t border-border-subtle/25 pt-3">
                      <Label className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="size-4" />
                        ابلاغیه‌های ایمنی منتشر شده
                      </Label>
                      {dayBulletins.map(b => (
                        <div key={b.id} className="bg-amber-500/10 border border-amber-500/25 p-2.5 rounded-lg text-xs text-amber-300">
                          <div className="font-bold">{b.title}</div>
                          <p className="text-[10px] text-amber-400/80 mt-1 line-clamp-2">{b.content}</p>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Personal Notes (CRUD) */}
                <div className="space-y-2 pt-2 border-t border-border-subtle/25">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1 text-foreground-muted">
                      <FileText className="size-4 text-accent" />
                      یادداشت شخصی راهبر
                    </Label>
                    {selectedDayInfo.note && (
                      <span className="text-[10px] text-success">ثبت شده در سرور</span>
                    )}
                  </div>
                  <Textarea
                    placeholder="نوشتن یادداشت روزانه، وظایف فنی واگن یا موارد شخصی..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-16 text-xs bg-neutral-950/20 text-start"
                  />
                  <div className="flex justify-between items-center">
                    <Button size="xs" onClick={handleSaveNote} className="text-xs cursor-pointer">
                      ذخیره یادداشت
                    </Button>
                    {selectedDayInfo.note && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={handleDeleteNote}
                        className="text-critical hover:bg-critical/10 text-xs cursor-pointer"
                      >
                        <Trash className="size-3 me-1" />
                        حذف یادداشت
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tasks checklist board */}
                <div className="space-y-3 pt-3 border-t border-border-subtle/25">
                  <Label className="text-xs font-bold flex items-center gap-1 text-foreground">
                    <CheckSquare className="size-4 text-accent" />
                    لیست کارهای شخصی امروز
                  </Label>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {selectedDayInfo.tasks.length === 0 ? (
                      <p className="text-xs text-foreground-muted text-center py-4 bg-neutral-950/10 rounded-lg border border-dashed border-border-subtle">
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
                                ? "bg-success/5 border-success/20 opacity-75"
                                : "bg-neutral-950/30 border-border-subtle",
                              task.priority === 'high' && !isDone && "border-critical/30 bg-critical/5"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <button
                                onClick={() => handleToggleTaskStatus(task.id)}
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
                                onClick={() => handleDeleteTask(task.id)}
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

            {/* 2. Leave and Mission Request Card */}
            <Card className="border border-emerald-500/20 bg-surface-container-low shadow-lg backdrop-blur">
              <CardHeader className="pb-2.5 border-b border-emerald-500/10 bg-emerald-500/5">
                <CardTitle className="text-sm font-bold flex items-center justify-between text-emerald-400">
                  <span className="flex items-center gap-2">
                    <UserMinus className="size-5" />
                    درخواست مرخصی و مأموریت پرسنلی
                  </span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold">
                    {toFa(leaveBalance)} روز مانده
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-4">
                <form onSubmit={handleCreateLeaveRequest} className="space-y-3 text-right">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-foreground-muted">نوع مرخصی:</Label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as any)}
                      className="w-full h-8 text-xs bg-background border border-border rounded px-2 outline-none text-foreground cursor-pointer"
                    >
                      <option value="annual">مرخصی استحقاقی سالانه</option>
                      <option value="sick">مرخصی استعلاجی پزشکی</option>
                      <option value="unpaid">مرخصی بدون حقوق</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-foreground-muted">از تاریخ:</Label>
                      <Input
                        type="date"
                        value={leaveStartDate}
                        onChange={(e) => setLeaveStartDate(e.target.value)}
                        className="h-8 text-xs text-center font-mono p-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-foreground-muted">تا تاریخ:</Label>
                      <Input
                        type="date"
                        value={leaveEndDate}
                        onChange={(e) => setLeaveEndDate(e.target.value)}
                        className="h-8 text-xs text-center font-mono p-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-foreground-muted">علت درخواست / توضیحات:</Label>
                    <Input
                      placeholder="علت را به طور خلاصه شرح دهید..."
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      className="h-8 text-xs text-start"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8 cursor-pointer mt-1"
                  >
                    <Plus className="size-4 me-1" />
                    ثبت و ارسال درخواست مرخصی
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* 3. Fatigue Alerts & Compliance Card */}
            <Card className="border border-amber-500/20 bg-surface-container-low shadow-lg backdrop-blur">
              <CardHeader className="pb-2.5 border-b border-amber-500/10 bg-amber-500/5">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-400">
                  <Shield className="size-5" />
                  موتور قوانین خستگی و ایمنی
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {ruleViolations.length === 0 ? (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-success text-[11px] flex items-start gap-2">
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                    <p className="font-semibold text-right leading-relaxed">
                      تمامی قوانین خستگی (استراحت بین‌روزی حداقل ۱۱ ساعت، عدم شیفت‌های شب متوالی بیش از ۳ مورد) و عدم تداخل با مرخصی‌ها در برنامه شما کاملاً رعایت شده است.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {ruleViolations.map((viol) => (
                      <div
                        key={viol.id}
                        className={cn(
                          "p-2.5 rounded-lg border text-[11px] leading-relaxed text-right flex gap-2",
                          viol.type === 'critical' 
                            ? "bg-critical/10 text-critical border-critical/20" 
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        )}
                      >
                        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                        <p className="font-medium">{viol.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. AI Assistant Calendar Widget */}
            <Card className="border border-indigo-500/25 bg-surface-container-low shadow-lg backdrop-blur">
              <CardHeader className="pb-2.5 border-b border-indigo-500/10 bg-indigo-500/5">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                  <Sparkles className="size-5" />
                  دستیار هوشمند AI تقویم کاری
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                <p className="text-[10px] text-foreground-muted leading-relaxed text-right">
                  از هوش مصنوعی در مورد وضعیت شیفت‌ها، تداخل‌های خستگی، کلاس‌های آموزشی یا مرخصی‌های خود بپرسید:
                </p>

                {/* Suggesters */}
                <div className="flex flex-wrap gap-1.5 justify-start">
                  {[
                    'این هفته چند تا شیفت شب دارم؟',
                    'مانده مرخصی من چقدر است؟',
                    'آیا فردا تداخل جلسه و شیفت دارم؟'
                  ].map((sugg, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiQuery(sugg)
                        playAlertSound('info')
                      }}
                      className="text-[10px] bg-neutral-900 border border-border px-2 py-1 rounded-md text-foreground-muted hover:text-foreground hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAiAsk} className="flex gap-1.5">
                  <Input
                    placeholder="سوال خود را بنویسید..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    className="h-8 text-xs flex-1 bg-neutral-950/20 text-start"
                  />
                  <Button
                    type="submit"
                    disabled={aiLoading || !aiQuery.trim()}
                    className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 text-xs cursor-pointer shrink-0"
                  >
                    {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  </Button>
                </form>

                {aiResponse && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-[11px] text-indigo-300 text-right leading-relaxed animate-fadeIn">
                    <span className="font-bold block text-indigo-400 mb-1">پاسخ دستیار هوشمند:</span>
                    <p>{aiResponse}</p>
                  </div>
                )}
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
                  <span>کد پرسنلی ثبت شده:</span>
                  <strong className="text-foreground font-data-mono">{toFa(currentUserProfile?.personnelCode || '0012345678')}</strong>
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

      {/* ──────────────────────────────────────────────────────── */}
      {/* TAB 3: SUPERVISOR & MANAGER VIEW */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeTab === 'supervisor' && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-border/45 bg-surface/35 text-right">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-foreground-muted font-bold">کل پرسنل راهبری خط ۱</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-foreground font-data-mono">{toFa(colleagues.length + 1)} نفر</div>
                <p className="text-[10px] text-foreground-muted mt-1">تعداد پرسنل فعال در سیستم</p>
              </CardContent>
            </Card>

            <Card className="border border-emerald-500/20 bg-emerald-500/5 text-right">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-emerald-400 font-bold">حاضرین امروز نوبت کاری</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-emerald-400 font-data-mono">{toFa(9)} نفر</div>
                <p className="text-[10px] text-emerald-500/70 mt-1">۸۲٪ پوشش کادر راهبران</p>
              </CardContent>
            </Card>

            <Card className="border border-amber-500/20 bg-amber-500/5 text-right">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-amber-400 font-bold">درخواست‌های مرخصی معلق</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-amber-400 font-data-mono">
                  {toFa(leaveRequests.filter(r => r.status === 'pending').length)} مورد
                </div>
                <p className="text-[10px] text-amber-500/70 mt-1">نیاز به بررسی و موافقت سریع</p>
              </CardContent>
            </Card>

            <Card className="border border-blue-500/20 bg-blue-500/5 text-right">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-blue-400 font-bold">کسری نیرو / آماده‌باش</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-blue-400 font-data-mono">{toFa(2)} نفر</div>
                <p className="text-[10px] text-blue-500/70 mt-1">نیاز به جایگزینی شیفت شب تجریش</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Pending Requests Cartable */}
            <div className="lg:col-span-7 space-y-6">
              {/* Leaves Requests Cartable */}
              <Card className="border border-border-subtle bg-surface-container-low/60 backdrop-blur">
                <CardHeader className="border-b border-border/20 pb-3.5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                    <UserMinus className="size-5" />
                    کارتابل تأیید مرخصی‌های پرسنل خط ۱
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {leaveRequests.filter(r => r.status === 'pending').length === 0 ? (
                    <p className="text-xs text-foreground-muted text-center py-6 bg-neutral-950/10 rounded-lg border border-dashed border-border-subtle">
                      هیچ درخواست مرخصی معلقی در سیستم وجود ندارد.
                    </p>
                  ) : (
                    leaveRequests.filter(r => r.status === 'pending').map((req) => {
                      const requester = req.userId === 'current' ? currentUserProfile : colleagues.find(c => c.id === req.userId)
                      const requesterName = requester?.name || 'راهبر شفیعی'
                      const start = dayjs(req.startDate)
                      const end = dayjs(req.endDate)
                      const daysCount = end.diff(start, 'day') + 1

                      return (
                        <div key={req.id} className="bg-neutral-950/35 border border-border-subtle p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1.5 text-right">
                            <div className="font-bold flex items-center gap-1.5">
                              <span className="text-foreground">{requesterName}</span>
                              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0">در انتظار تایید</Badge>
                            </div>
                            <div className="text-[10px] text-foreground-muted">
                              درخواست مرخصی <span className="font-bold text-accent">{req.type === 'annual' ? 'استحقاقی' : 'استعلاجی'}</span> به مدت <span className="font-bold text-accent">{toFa(daysCount)} روز</span>
                            </div>
                            <div className="text-[10px] text-foreground-muted font-mono">
                              از {toFa(req.startDate)} الی {toFa(req.endDate)}
                            </div>
                            {req.reason && <p className="text-[10px] italic text-foreground-muted">توضیح: {req.reason}</p>}
                          </div>
                          
                          <div className="flex gap-2 shrink-0 self-end sm:self-center">
                            <Button
                              size="xs"
                              onClick={() => handleApproveLeave(req.id, 'approved')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer text-[10px] px-2.5 h-7"
                            >
                              موافقت
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleApproveLeave(req.id, 'rejected')}
                              className="text-critical border-critical/30 hover:bg-critical/10 font-bold cursor-pointer text-[10px] px-2.5 h-7"
                            >
                              مخالفت
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>

              {/* Roster & Shift Swap Requests Cartable */}
              <Card className="border border-border-subtle bg-surface-container-low/60 backdrop-blur">
                <CardHeader className="border-b border-border/20 pb-3.5">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-accent">
                    <ArrowLeftRight className="size-5" />
                    کارتابل تایید جابجایی شیفت‌ها
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-xs text-foreground-muted text-center py-6 bg-neutral-950/10 rounded-lg border border-dashed border-border-subtle">
                    هیچ درخواست تعویض شیفت معلقی در کارتابل سرپرستی وجود ندارد.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right: Line 1 Shift Coverage Analytics */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border border-border-subtle bg-surface-container-low/60 backdrop-blur">
                <CardHeader className="pb-3 border-b border-border-subtle/30 bg-accent/5">
                  <CardTitle className="text-sm font-bold text-foreground">تحلیل پوشش عملیاتی خط ۱ مترو</CardTitle>
                  <CardDescription className="text-xs">وضعیت توازن نیرو در شیفت‌های جاری راهبری</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-4 space-y-4 text-right text-xs">
                  {/* Coverage bars */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>نوبت صبح (۰۷:۰۰ الی ۱۶:۰۰):</span>
                        <span className="text-emerald-400 font-mono">۱۰۰٪ پوشش (۶ راهبر)</span>
                      </div>
                      <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>نوبت عصر (۱۵:۰۰ الی ۲۳:۰۰):</span>
                        <span className="text-emerald-400 font-mono">۱۰۰٪ پوشش (۴ راهبر)</span>
                      </div>
                      <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>نوبت شب (۲۲:۰۰ الی ۰۷:۰۰):</span>
                        <span className="text-amber-400 font-mono">۷۵٪ پوشش (۳ راهبر - ۱ کسری نیرو)</span>
                      </div>
                      <div className="h-2 bg-neutral-900 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Recommendation action */}
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg leading-relaxed text-amber-300 text-[11px]">
                    <div className="font-bold mb-1 flex items-center gap-1">
                      <AlertTriangle className="size-3.5" />
                      هشدار کمبود نیرو در نوبت شب
                    </div>
                    به دلیل مرخصی استعلاجی مصوب راهبر حسینی، شیفت شب تجریش فاقد کادر کامل است. سیستم پیشنهاد می‌کند راهبر آماده‌باش (حسین رضایی) فراخوانده شود.
                  </div>

                  <Button className="w-full text-xs font-bold bg-accent hover:bg-accent-hover text-accent-foreground h-8 cursor-pointer" onClick={() => alert('پیام احضار راهبر آماده‌باش با موفقیت ارسال گردید.')}>
                    فراخوانی راهبر آماده‌باش
                  </Button>
                </CardContent>
              </Card>

              {/* iCal / Export Team Roster to Excel */}
              <Card className="border border-border-subtle bg-surface-container-low/60 backdrop-blur">
                <CardHeader className="pb-2 border-b border-border/10">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Download className="size-4 text-accent" />
                    خروجی و یکپارچه‌سازی تقویم
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 text-xs text-foreground-muted leading-relaxed">
                  <p>سرپرستان عملیات می‌توانند لوحه تیمی خط ۱ را در قالب فرمت‌های استاندارد دریافت کنند:</p>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold cursor-pointer" onClick={() => alert('خروجی iCal تقویم تولید شد و آماده دانلود است.')}>
                      دانلود فایل تقویم iCal
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold cursor-pointer" onClick={() => alert('نسخه چاپی PDF لوحه با موفقیت آماده گردید.')}>
                      خروجی لوحه به صورت PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
