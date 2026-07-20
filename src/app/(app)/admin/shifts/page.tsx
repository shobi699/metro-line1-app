'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { jdate, dayjs } from '@/lib/dayjs'
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Plus,
  AlertTriangle,
  Check,
  Users,
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  Calendar as CalendarIcon,
  Loader2,
  Info,
  Sliders,
  Settings,
  Trash,
  UserCheck,
  Shield,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { useAuthStore } from '@/features/auth'
import { type ShiftCodeValue } from '@/features/shifts'
import type { ShiftTemplateDto, ShiftAssignmentDto } from '@/features/shifts/api-client'
import { shiftsApi } from '@/features/shifts/api-client'
import { getShiftForUserAndDateFromDb } from '@/lib/cycle-math'
import {
  GROUPS_LIST,
  SHIFT_TYPE_LIST,
  groupKeyFor,
  normalizeGroup,
  shiftTypeKey,
  buildCompositeKey,
  parseTargetId,
  targetIdLabel,
} from '@/lib/shift-grouping'
import { toFa, jalali } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { JalaliDatePicker } from '@/components/ui/jalali-date-picker'

interface Shift {
  id: string
  date: string
  code: 'morning' | 'evening' | 'night' | 'off'
  note: string | null
  userId: string
  user: { id: string; name: string; personnelCode: string }
}

interface User {
  id: string
  name: string
  personnelCode: string
  phone: string | null
  email: string | null
  status: string
  roleId: string
  createdAt: string
  customFields: Record<string, unknown> | null
  role: { id: string; key: string; name: string; rank: number }
}

interface SwapRequest {
  id: string
  status: string
  note: string | null
  createdAt: string
  requester: { id: string; name: string; role?: { key: string; name: string } }
  target: { id: string; name: string; role?: { key: string; name: string } }
  sourceShift: { id: string; date: string; code: string }
  targetShift: { id: string; date: string; code: string }
}

interface Conflict {
  userName: string
  userId: string
  date: string
  reason: string
}

const shiftLabels: Record<string, string> = {
  morning: 'صبح',
  evening: 'عصر',
  night: 'شب',
  off: 'استراحت',
  office: 'اداری'
}

const shiftTimes: Record<string, string> = {
  morning: '۰۶:۰۰ - ۱۴:۰۰',
  evening: '۱۴:۰۰ - ۲۲:۰۰',
  night: '۲۲:۰۰ - ۰۶:۰۰',
  off: 'استراحت',
  office: '۰۷:۳۰ - ۱۶:۱۵'
}

const shiftColors: Record<string, string> = {
  morning: 'bg-success/10 text-success border-success/20 hover:bg-success/15',
  evening: 'bg-info/10 text-info border-info/20 hover:bg-info/15',
  night: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/15',
  office: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/15',
  off: 'bg-background/45 text-foreground-muted border-border border-dashed hover:bg-background/60',
}

export default function AdminShiftsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)

  // Templates & Assignments from database (server-side source of truth)
  const [dbTemplates, setDbTemplates] = useState<ShiftTemplateDto[]>([])
  const [dbAssignments, setDbAssignments] = useState<ShiftAssignmentDto[]>([])

  // Tabs state
  const [activeTab, setActiveTab] = useState<'roster' | 'builder' | 'assignments' | 'swaps' | 'settings'>('roster')

  // Roster view configuration
  const [weekOffset, setWeekOffset] = useState(0)
  const [department, setDepartment] = useState('all')
  const [lineFilter, setLineFilter] = useState('line1')
  const [groupFilter, setGroupFilter] = useState('all')
  const [regimeFilter, setRegimeFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [viewType, setViewType] = useState<'weekly' | 'monthly'>('weekly')

  // Loaded data
  const [users, setUsers] = useState<User[]>([])

  // Extract unique starting locations dynamically from loaded users
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>()
    users.forEach((u) => {
      const loc = (u.customFields as Record<string, unknown> | null)?.startLocation
      if (loc && typeof loc === 'string') {
        const trimmed = loc.trim()
        if (trimmed) locations.add(trimmed)
      }
    })
    return Array.from(locations).sort()
  }, [users])

  // Year and Month states for Monthly View (Jalali Month/Year)
  const now = jdate()
  const [selectedYear, setSelectedYear] = useState(() => now.year())
  const [selectedMonth, setSelectedMonth] = useState(() => now.month() + 1)

  const [dbShifts, setDbShifts] = useState<Shift[]>([])
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([])

  // Dynamic Shift settings from database
  const [dbMinRestHours, setDbMinRestHours] = useState(12)
  const [dbMaxConsecutiveNights, setDbMaxConsecutiveNights] = useState(2)
  const [dbRoleParity, setDbRoleParity] = useState(true)

  // Loadings
  const [loading, setLoading] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [aiRunning, setAiRunning] = useState(false)
  const [aiStage, setAiStage] = useState(0)

  // Shift assignment modal states
  const [shiftModalOpen, setShiftModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedShiftCode, setSelectedShiftCode] = useState<ShiftCodeValue>('morning')
  const [selectedNote, setSelectedNote] = useState('')
  const [isCellEdit, setIsCellEdit] = useState(false)
  const [formSubmitLoading, setFormSubmitLoading] = useState(false)

  // Template Builder form states
  const [tplName, setTplName] = useState('')
  const [_tplType, setTplType] = useState<'rotational' | 'staff'>('rotational')
  const [tplRegime, setTplRegime] = useState<'rotational_9h' | 'rotational_12h' | 'staff'>('rotational_9h')
  const [tplLength, setTplLength] = useState<number>(6)
  const [tplShifts, setTplShifts] = useState<Array<{
    day: number
    code: 'morning' | 'evening' | 'night' | 'off' | 'office'
    label: string
    hours: number
    startTime: string
    endTime: string
  }>>([])

  // Shift Assignment form states
  const [assignTplId, setAssignTplId] = useState('')
  const [assignTargetType, setAssignTargetType] = useState<'user' | 'group'>('group')
  const [assignTargetId, setAssignTargetId] = useState('A')
  const [assignGroupType, setAssignGroupType] = useState<string>('9-15')
  const [assignAnchorDate, setAssignAnchorDate] = useState('2026-06-01')
  const [assignShiftFilter, setAssignShiftFilter] = useState<string>('all')
  const [assignShiftTypeFilter, setAssignShiftTypeFilter] = useState<string>('all')

  // Notification Banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Confirmation state for overwriting existing assignments (user requested)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [pendingAssignmentData, setPendingAssignmentData] = useState<{
    templateId: string
    targetType: 'user' | 'group'
    targetId: string
    anchorDate: string
    existingTplName?: string
    existingAnchorDate?: string
  } | null>(null)

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Synchronize shifts detail inputs dynamically for Template Builder
  useEffect(() => {
    const length = tplRegime === 'staff' ? 7 : tplLength
    const defaultShifts = Array.from({ length }).map((_, i) => {
      const d = i + 1
      if (tplRegime === 'staff') {
        const isWeekend = d === 6 || d === 7
        return {
          day: d,
          code: (isWeekend ? 'off' : 'office') as ShiftCodeValue,
          label: isWeekend ? 'تعطیل' : 'اداری',
          hours: isWeekend ? 0 : 8.75,
          startTime: isWeekend ? '' : '07:30',
          endTime: isWeekend ? '' : '16:15',
        }
      } else if (tplRegime === 'rotational_12h') {
        const isDay = tplLength === 4 ? (d % 4 === 1) : (d % 6 === 1 || d % 6 === 2)
        const isNight = tplLength === 4 ? (d % 4 === 2) : (d % 6 === 3 || d % 6 === 4)
        return {
          day: d,
          code: (isDay ? 'morning' : isNight ? 'night' : 'off') as ShiftCodeValue,
          label: isDay ? 'روزکار ۱۲ ساعته' : isNight ? 'شب‌کار ۱۲ ساعته' : 'استراحت (آف)',
          hours: isDay ? 12 : isNight ? 12 : 0,
          startTime: isDay ? '07:00' : isNight ? '19:00' : '',
          endTime: isDay ? '19:00' : isNight ? '07:00' : '',
        }
      } else {
        const isMorning = d % 6 === 1 || d % 6 === 2
        const isEvening = d % 6 === 3 || d % 6 === 4
        return {
          day: d,
          code: (isMorning ? 'morning' : isEvening ? 'evening' : 'off') as ShiftCodeValue,
          label: isMorning ? 'صبح‌کار ۹ ساعته' : isEvening ? 'عصرکار ۹ ساعته' : 'استراحت (آف)',
          hours: isMorning ? 9 : isEvening ? 9 : 0,
          startTime: isMorning ? '07:00' : isEvening ? '16:00' : '',
          endTime: isMorning ? '16:00' : isEvening ? '01:00' : '',
        }
      }
    })
    setTplShifts(defaultShifts)
  }, [tplLength, tplRegime])

  // Calculate Saturday & Friday of the current week offset
  const weekDays = useMemo(() => {
    const today = new Date()
    const jsDay = today.getDay()
    const daysSinceSaturday = (jsDay + 1) % 7
    const saturday = new Date(today)
    saturday.setDate(today.getDate() - daysSinceSaturday + (weekOffset * 7))
    saturday.setHours(0, 0, 0, 0)

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(saturday)
      d.setDate(saturday.getDate() + i)
      days.push(d)
    }
    return days
  }, [weekOffset])

  // Calculate all days in the selected month for Monthly View
  const monthlyDays = useMemo(() => {
    const start = jdate().year(selectedYear).month(selectedMonth - 1).startOf('month')
    const end = jdate().year(selectedYear).month(selectedMonth - 1).endOf('month')

    const days = []
    let curr = start
    while (curr.isBefore(end) || curr.isSame(end, 'day')) {
      days.push(curr.toDate())
      curr = curr.add(1, 'day')
    }
    return days
  }, [selectedYear, selectedMonth])

  const activeDays = viewType === 'weekly' ? weekDays : monthlyDays

  // Fetch all required data from server
  const loadData = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      // 1. Fetch Users from admin API (unlimited, active only) — synced with /admin/users
      const usersRes = await fetch('/api/admin/users?status=active', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.data || [])
      }

      // 2. Fetch Shift Overrides for active date range
      const startStr = activeDays[0].toISOString()
      const endStr = activeDays[activeDays.length - 1].toISOString()

      const shiftsRes = await fetch(`/api/shifts?startDate=${startStr}&endDate=${endStr}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json()
        setDbShifts(shiftsData.data || [])
      }

      // 3. Fetch Pending Swap Requests
      const swapsRes = await fetch('/api/swap-requests/inbox', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (swapsRes.ok) {
        const swapsData = await swapsRes.json()
        setSwapRequests(swapsData.data || [])
      }

      // 4. Fetch Shift Templates & Assignments from database (not localStorage)
      const [tplData, assignData] = await Promise.all([
        shiftsApi.getTemplates(accessToken),
        shiftsApi.getAssignments(accessToken),
      ])
      setDbTemplates(tplData)
      setDbAssignments(assignData)
    } catch {
      // shifts data fetch failed silently
    } finally {
      setLoading(false)
    }
  }, [accessToken, activeDays])

  // Fetch settings from database on mount
  const fetchSettings = useCallback(async () => {
    if (!accessToken) return
    setSettingsLoading(true)
    try {
      const settingsRes = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        const list = settingsData.data || []

        const restSetting = list.find((s: { key: string; value: string }) => s.key === 'shifts.minRestHours')
        const nightsSetting = list.find((s: { key: string; value: string }) => s.key === 'shifts.maxConsecutiveNights')
        const paritySetting = list.find((s: { key: string; value: string }) => s.key === 'shifts.roleParity')

        if (restSetting) setDbMinRestHours(JSON.parse(restSetting.value))
        if (nightsSetting) setDbMaxConsecutiveNights(JSON.parse(nightsSetting.value))
        if (paritySetting) setDbRoleParity(JSON.parse(paritySetting.value))
      }
    } catch {
      // settings fetch failed silently
    } finally {
      setSettingsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Save Settings to database
  async function handleSaveSettings() {
    if (!accessToken) return
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          updates: [
            { key: 'shifts.minRestHours', value: Number(dbMinRestHours) },
            { key: 'shifts.maxConsecutiveNights', value: Number(dbMaxConsecutiveNights) },
            { key: 'shifts.roleParity', value: Boolean(dbRoleParity) },
          ]
        })
      })
      if (res.ok) {
        setNotification({ type: 'success', text: 'تنظیمات قوانین زمان‌بندی با موفقیت ذخیره و در سیستم اعمال شد.' })
        await fetchSettings()
        await loadData()
      } else {
        const json = await res.json()
        setNotification({ type: 'error', text: json.error || 'خطا در ذخیره تنظیمات' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطای ارتباط با سرور' })
    } finally {
      setSettingsLoading(false)
    }
  }

  // Save specific setting reset
  async function handleResetSettings() {
    if (!accessToken) return
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          updates: [
            { key: 'shifts.minRestHours', value: 12 },
            { key: 'shifts.maxConsecutiveNights', value: 2 },
            { key: 'shifts.roleParity', value: true },
          ]
        })
      })
      if (res.ok) {
        setNotification({ type: 'success', text: 'تنظیمات به مقادیر پیش‌فرض بازگردانده شدند.' })
        await fetchSettings()
        await loadData()
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setSettingsLoading(false)
    }
  }

  // Reset templates and assignments is now server-side; no local reset available.
  // (Removed: handleResetTemplatesAndAssignments relied on Zustand localStorage state.)

  // ────────────────────────────────────────────────────────
  // SHARED CORE COMPUTATIONAL ENGINE
  // ────────────────────────────────────────────────────────
  // Combines: 1. Cycle math template shifts (DB) + 2. DB manual overrides
  const resolvedRosterMap = useMemo(() => {
    const roster: Record<string, Record<string, { code: string; label: string; note: string | null; isOverride: boolean; hours: number; startTime: string; endTime: string }>> = {}

    // Map DB overrides first
    const overrideMap: Record<string, Record<string, Shift>> = {}
    dbShifts.forEach((shift) => {
      const dateStr = dayjs(shift.date).format('YYYY-MM-DD')
      if (!overrideMap[shift.userId]) overrideMap[shift.userId] = {}
      overrideMap[shift.userId][dateStr] = shift
    })

    users.forEach((user) => {
      roster[user.id] = {}
      activeDays.forEach((day) => {
        const dateObj = dayjs(day)
        const dateStr = dateObj.format('YYYY-MM-DD')

        // 1. Get default shift from template cycle (database-backed)
        // گروه از فیلد shift و نوع از shiftType با هم کلید ترکیبی انتساب را می‌سازند
        const cycleRes = getShiftForUserAndDateFromDb(user.id, dateObj, dbAssignments, dbTemplates, user.customFields)

        // Default properties
        let code = cycleRes?.shift?.code || 'off'
        let label = cycleRes?.shift?.label || 'استراحت'
        let hours = cycleRes?.shift?.hours || 0
        let startTime = cycleRes?.shift?.startTime || ''
        let endTime = cycleRes?.shift?.endTime || ''
        let isOverride = false
        let note = null

        // 2. Apply database manual override if exists
        const override = overrideMap[user.id]?.[dateStr]
        if (override) {
          code = override.code
          label = shiftLabels[override.code] || override.code
          isOverride = true
          note = override.note

          // Set standard hours for overrides
          if (code === 'morning') { hours = 9; startTime = '07:00'; endTime = '16:00' }
          else if (code === 'evening') { hours = 9; startTime = '16:00'; endTime = '01:00' }
          else if (code === 'night') { hours = 12; startTime = '19:00'; endTime = '07:00' }
          else if (code === 'off') { hours = 0; startTime = ''; endTime = '' }
        }

        roster[user.id][dateStr] = {
          code,
          label,
          note,
          isOverride,
          hours,
          startTime,
          endTime
        }
      })
    })

    return roster
  }, [users, activeDays, dbShifts, dbAssignments, dbTemplates])

  // Filtered users for assignment based on shift and shiftType filters
  const filteredUsersForAssignment = useMemo(() => {
    if (assignTargetType !== 'user') return users
    
    return users.filter((u) => {
      const { group, type } = groupKeyFor(u.customFields as Record<string, unknown> | null)

      // فیلتر گروه شیفتی (نرمال‌شده تا Staff/ستادی یکی شوند)
      if (assignShiftFilter !== 'all' && group !== normalizeGroup(assignShiftFilter)) {
        return false
      }

      // فیلتر نوع شیفت (نرمال‌شده)
      if (assignShiftTypeFilter !== 'all' && type !== shiftTypeKey(assignShiftTypeFilter)) {
        return false
      }

      return true
    })
  }, [users, assignTargetType, assignShiftFilter, assignShiftTypeFilter])

  // Identify Conflicts based on rest hours and consecutive nights settings
  const conflicts = useMemo<Conflict[]>(() => {
    const list: Conflict[] = []
    const shiftStartHours: Record<string, number> = { morning: 6, evening: 14, night: 22, office: 7.5 }
    const shiftEndHours: Record<string, number> = { morning: 14, evening: 22, night: 30, office: 16.25 } // 30 is 06:00 next day

    users.forEach((user) => {
      const userShifts = resolvedRosterMap[user.id] || {}

      // 1. Check minimum rest hours between consecutive days
      for (let i = 0; i < activeDays.length - 1; i++) {
        const d1Str = dayjs(activeDays[i]).format('YYYY-MM-DD')
        const d2Str = dayjs(activeDays[i + 1]).format('YYYY-MM-DD')

        const s1 = userShifts[d1Str]
        const s2 = userShifts[d2Str]

        if (!s1 || !s2 || s1.code === 'off' || s2.code === 'off') continue

        const endHourVal = shiftEndHours[s1.code] || 0
        const startHourVal = shiftStartHours[s2.code] || 0

        const endMs = new Date(activeDays[i]).getTime() + endHourVal * 60 * 60 * 1000
        const startMs = new Date(activeDays[i + 1]).getTime() + startHourVal * 60 * 60 * 1000

        const gapHours = (startMs - endMs) / (1000 * 60 * 60)

        if (gapHours < dbMinRestHours) {
          const jalaliDateStr = toFa(jdate(activeDays[i + 1]).format('dddd D MMMM'))
          list.push({
            userName: user.name,
            userId: user.id,
            date: d2Str,
            reason: `تداخل استراحت روز ${jalaliDateStr}: فاصله بین پایان شیفت روز قبل (${s1.label}) و شروع شیفت امروز (${s2.label}) تنها ${toFa(gapHours.toFixed(1))} ساعت است که کمتر از حد قانونی (${toFa(dbMinRestHours)} ساعت) می‌باشد.`,
          })
        }
      }

      // 2. Check maximum consecutive nights limit
      let consecutiveNightsCount = 0
      for (let i = 0; i < activeDays.length; i++) {
        const dStr = dayjs(activeDays[i]).format('YYYY-MM-DD')
        const s = userShifts[dStr]

        if (s && s.code === 'night') {
          consecutiveNightsCount++
          if (consecutiveNightsCount > dbMaxConsecutiveNights) {
            const jalaliDateStr = toFa(jdate(activeDays[i]).format('dddd D MMMM'))
            list.push({
              userName: user.name,
              userId: user.id,
              date: dStr,
              reason: `نقض سقف شیفت شب در روز ${jalaliDateStr}: این پرسنل دارای ${toFa(consecutiveNightsCount)} شیفت شب متوالی است که فراتر از سقف مصوب (${toFa(dbMaxConsecutiveNights)} شب) می‌باشد.`,
            })
          }
        } else {
          consecutiveNightsCount = 0
        }
      }
    })

    return list
  }, [users, resolvedRosterMap, activeDays, dbMinRestHours, dbMaxConsecutiveNights])

  // Check if a shift cell is currently active/live
  const isShiftLive = (dateStr: string, code: string) => {
    const todayStr = dayjs().format('YYYY-MM-DD')
    if (dateStr !== todayStr) return false

    const currentHour = new Date().getHours()
    if (code === 'morning' && currentHour >= 6 && currentHour < 14) return true
    if (code === 'evening' && currentHour >= 14 && currentHour < 22) return true
    if (code === 'night' && (currentHour >= 22 || currentHour < 6)) return true
    return false
  }

  // Handle Swap approval or rejection (swap-skill)
  async function handleSwapDecision(swapRequestId: string, decision: 'approved' | 'rejected') {
    setActionLoading((prev) => ({ ...prev, [swapRequestId]: true }))
    try {
      const res = await fetch('/api/swap-requests/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ swapRequestId, decision }),
      })

      if (res.ok) {
        setNotification({ type: 'success', text: decision === 'approved' ? 'درخواست جابجایی با موفقیت تایید و در دیتابیس اعمال شد.' : 'درخواست جابجایی با موفقیت رد شد.' })
        await loadData()
      } else {
        const data = await res.json()
        setNotification({ type: 'error', text: data.error || 'خطا در اعمال تصمیم جابجایی' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطای ارتباط با سرور' })
    } finally {
      setActionLoading((prev) => ({ ...prev, [swapRequestId]: false }))
    }
  }

  // Swap Request Rule Engine (swap-skill) using dynamic DB settings
  const evaluateSwapRules = (req: SwapRequest) => {
    const roleParity = req.requester.role?.key === req.target.role?.key

    const date1 = dayjs(req.sourceShift.date)
    const date2 = dayjs(req.targetShift.date)
    const diffDays = Math.abs(date1.diff(date2, 'day'))

    let restViolation = false
    if (diffDays === 1) {
      if (req.targetShift.code === 'night' && req.sourceShift.code === 'morning') {
        restViolation = true
      }
    }

    const nightViolation = req.sourceShift.code === 'night' && req.targetShift.code === 'night' && diffDays === 1

    return [
      {
        name: 'همترازی رتبه و نقش سازمانی',
        status: !dbRoleParity ? 'success' : roleParity ? 'success' : 'warning',
        desc: !dbRoleParity
          ? 'قانون کنترل همترازی نقش در تنظیمات غیرفعال است.'
          : roleParity ? 'هر دو پرسنل دارای رتبه فنی همتراز هستند.' : 'عدم همترازی نقش! یکی از طرفین دارای رتبه فنی متفاوتی است.'
      },
      {
        name: 'رعایت سقف شیفت شب متوالی',
        status: nightViolation ? 'error' : 'success',
        desc: nightViolation
          ? `هشدار! جابجایی منجر به شیفت شب متوالی ناایمن (بیش از ${toFa(dbMaxConsecutiveNights)} شب) می‌شود.`
          : `سقف شیفت‌های شب متوالی (${toFa(dbMaxConsecutiveNights)} شب) به درستی رعایت شده است.`
      },
      {
        name: 'حداقل فاصله استراحت قانونی',
        status: restViolation ? 'error' : 'success',
        desc: restViolation
          ? `خطا! فاصله استراحت پرسنل پس از جابجایی کمتر از ${toFa(dbMinRestHours)} ساعت می‌شود.`
          : `فاصله استراحت قانونی (حداقل ${toFa(dbMinRestHours)} ساعت) حفظ می‌گردد.`
      }
    ]
  }

  // Visual AI Rescheduling auto-fix (autoresolve) that persists solutions to the DB
  async function runAiAutofix() {
    if (conflicts.length === 0) {
      setNotification({ type: 'success', text: 'هیچ تداخل استراحت یا شیفت شب متوالی در لوحه فعلی یافت نشد.' })
      return
    }

    setAiRunning(true)
    setAiStage(0)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setAiStage(1)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setAiStage(2)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setAiStage(3)
    await new Promise((resolve) => setTimeout(resolve, 600))

    try {
      // Save "off" overrides in the database for all conflicting cells
      for (const conflict of conflicts) {
        await fetch('/api/shifts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: conflict.userId,
            date: conflict.date,
            code: 'off',
            note: 'رفع خودکار تعارض زمان‌بندی توسط هوش مصنوعی سیستم',
          }),
        })
      }
      setNotification({ type: 'success', text: `هوش مصنوعی با موفقیت ${toFa(conflicts.length)} تعارض ایمنی را رفع و در دیتابیس ثبت کرد.` })
      await loadData()
    } catch {
      setNotification({ type: 'error', text: 'خطا در ثبت اصلاحات هوشمند هوش مصنوعی در سرور' })
    } finally {
      setAiRunning(false)
    }
  }

  // Open Cell Quick Edit Dialog
  function handleCellClick(userId: string, dateStr: string, currentShift?: { code: string; note: string | null }) {
    setSelectedUserId(userId)
    setSelectedDate(dateStr)
    setSelectedShiftCode((currentShift?.code as ShiftCodeValue) || 'morning')
    setSelectedNote(currentShift?.note || '')
    setIsCellEdit(true)
    setShiftModalOpen(true)
  }

  // Open New Shift Dialog
  function handleNewShiftClick() {
    setSelectedUserId(users[0]?.id || '')
    setSelectedDate(dayjs().format('YYYY-MM-DD'))
    setSelectedShiftCode('morning')
    setSelectedNote('')
    setIsCellEdit(false)
    setShiftModalOpen(true)
  }

  // Save Manual Shift Override (POST /api/shifts)
  async function handleSaveShift(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    setFormSubmitLoading(true)

    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          date: selectedDate,
          code: selectedShiftCode,
          note: selectedNote || null,
        }),
      })

      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'تغییر دستی شیفت با موفقیت ثبت و در دیتابیس لوحه ذخیره شد.' })
        setShiftModalOpen(false)
        await loadData()
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در ثبت تغییر شیفت' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setFormSubmitLoading(false)
    }
  }

  // Helper function to detect template regime label
  const getTemplateRegimeLabel = (tpl: ShiftTemplateDto) => {
    if (tpl.type === 'staff') return 'ستادی ثابت هفتگی'
    const has12hShift = tpl.shifts.some(s => s.hours === 12)
    if (has12hShift) return 'راهبران ۱۲ ساعته چرخشی'
    return 'راهبران ۹ ساعته چرخشی'
  }

  // Helper function to calculate average weekly hours for a template
  const getTemplateAvgWeeklyHours = (tpl: ShiftTemplateDto) => {
    const total = tpl.shifts.reduce((acc, s) => acc + s.hours, 0)
    const days = tpl.type === 'staff' ? 7 : tpl.length
    return days > 0 ? ((total / days) * 7).toFixed(1) : '0'
  }

  // Template Builder Save (persists to database)
  async function handleSaveTemplate() {
    if (!accessToken) return
    if (!tplName.trim()) return
    const finalType = tplRegime === 'staff' ? 'staff' : 'rotational'
    const finalLength = tplRegime === 'staff' ? 7 : tplLength
    setActionLoading((prev) => ({ ...prev, __template: true }))
    try {
      await shiftsApi.createTemplate(accessToken, {
        name: tplName,
        type: finalType,
        length: finalLength,
        shifts: tplShifts,
      })
      setTplName('')
      setTplLength(6)
      setNotification({ type: 'success', text: `قالب شیفت با موفقیت در دیتابیس ذخیره شد.` })
      await loadData()
    } catch {
      setNotification({ type: 'error', text: 'خطا در ثبت قالب شیفت در سرور' })
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev }
        delete next.__template
        return next
      })
    }
  }

  // Preset Applier for Metro Line 1 Shift Patterns
  const applyPreset = (presetType: '12_36' | 'rotational_12h_6d' | 'rotational_9h' | 'three_shift_9h' | 'staff_5d') => {
    if (presetType === '12_36') {
      setTplName('الگوی ۱۲/۳۶ چرخشی راهبران')
      setTplRegime('rotational_12h')
      setTplType('rotational')
      setTplLength(4)
      setTplShifts([
        { day: 1, code: 'morning', label: 'روزکار ۱۲ ساعته', hours: 12, startTime: '07:30', endTime: '19:30' },
        { day: 2, code: 'night', label: 'شب‌کار ۱۲ ساعته', hours: 12, startTime: '19:30', endTime: '07:30' },
        { day: 3, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
        { day: 4, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
      ])
    } else if (presetType === 'rotational_12h_6d') {
      setTplName('الگوی ۶ روزه چرخشی ۱۲ ساعته')
      setTplRegime('rotational_12h')
      setTplType('rotational')
      setTplLength(6)
      setTplShifts([
        { day: 1, code: 'morning', label: 'روزکار ۱۲ ساعته', hours: 12, startTime: '07:00', endTime: '19:00' },
        { day: 2, code: 'morning', label: 'روزکار ۱۲ ساعته', hours: 12, startTime: '07:00', endTime: '19:00' },
        { day: 3, code: 'night', label: 'شب‌کار ۱۲ ساعته', hours: 12, startTime: '19:00', endTime: '07:00' },
        { day: 4, code: 'night', label: 'شب‌کار ۱۲ ساعته', hours: 12, startTime: '19:00', endTime: '07:00' },
        { day: 5, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
        { day: 6, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
      ])
    } else if (presetType === 'rotational_9h') {
      setTplName('الگوی ۶ روزه چرخشی ۹ ساعته')
      setTplRegime('rotational_9h')
      setTplType('rotational')
      setTplLength(6)
      setTplShifts([
        { day: 1, code: 'morning', label: 'صبح‌کار ۹ ساعته', hours: 9, startTime: '07:00', endTime: '16:00' },
        { day: 2, code: 'morning', label: 'صبح‌کار ۹ ساعته', hours: 9, startTime: '07:00', endTime: '16:00' },
        { day: 3, code: 'evening', label: 'عصرکار ۹ ساعته', hours: 9, startTime: '16:00', endTime: '01:00' },
        { day: 4, code: 'evening', label: 'عصرکار ۹ ساعته', hours: 9, startTime: '16:00', endTime: '01:00' },
        { day: 5, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
        { day: 6, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
      ])
    } else if (presetType === 'three_shift_9h') {
      setTplName('الگوی ۵ روزه ۳ نوبته ۹ ساعته')
      setTplRegime('rotational_9h')
      setTplType('rotational')
      setTplLength(5)
      setTplShifts([
        { day: 1, code: 'morning', label: 'صبح‌کار ۹ ساعته', hours: 9, startTime: '07:00', endTime: '16:00' },
        { day: 2, code: 'evening', label: 'عصرکار ۹ ساعته', hours: 9, startTime: '16:00', endTime: '01:00' },
        { day: 3, code: 'night', label: 'شب‌کار ۹ ساعته', hours: 9, startTime: '22:00', endTime: '07:00' },
        { day: 4, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
        { day: 5, code: 'off', label: 'استراحت (آف)', hours: 0, startTime: '', endTime: '' },
      ])
    } else if (presetType === 'staff_5d') {
      setTplName('الگوی ستادی ثابت ۵ روزه')
      setTplRegime('staff')
      setTplType('staff')
      setTplLength(7)
      setTplShifts([
        { day: 1, code: 'office', label: 'اداری موظف', hours: 8.75, startTime: '07:30', endTime: '16:15' },
        { day: 2, code: 'office', label: 'اداری موظف', hours: 8.75, startTime: '07:30', endTime: '16:15' },
        { day: 3, code: 'office', label: 'اداری موظف', hours: 8.75, startTime: '07:30', endTime: '16:15' },
        { day: 4, code: 'office', label: 'اداری موظف', hours: 8.75, startTime: '07:30', endTime: '16:15' },
        { day: 5, code: 'office', label: 'اداری موظف', hours: 8.75, startTime: '07:30', endTime: '16:15' },
        { day: 6, code: 'off', label: 'تعطیل پایان هفته', hours: 0, startTime: '', endTime: '' },
        { day: 7, code: 'off', label: 'تعطیل پایان هفته', hours: 0, startTime: '', endTime: '' },
      ])
    }
  }

  // Shift Assignment Save (persists to database)
  async function handleSaveAssignment() {
    if (!accessToken) return
    if (!assignTplId) return

    const finalTargetId =
      assignTargetType === 'group'
        ? buildCompositeKey(assignTargetId, assignGroupType)
        : assignTargetId

    // Check if an assignment already exists for this target (user requested modal verification)
    const existing = dbAssignments.find(
      (a) => a.targetType === assignTargetType && a.targetId === finalTargetId
    )

    if (existing) {
      const tpl = dbTemplates.find((t) => t.id === existing.templateId)
      setPendingAssignmentData({
        templateId: assignTplId,
        targetType: assignTargetType,
        targetId: finalTargetId,
        anchorDate: assignAnchorDate,
        existingTplName: tpl?.name || 'الگوی قبلی',
        existingAnchorDate: existing.anchorDate,
      })
      setConfirmModalOpen(true)
      return
    }

    // Otherwise, execute the save immediately
    await executeSaveAssignment({
      templateId: assignTplId,
      targetType: assignTargetType,
      targetId: finalTargetId,
      anchorDate: assignAnchorDate,
    })
  }

  // Actual API call handler for shift assignment save/update
  async function executeSaveAssignment(data: {
    templateId: string
    targetType: 'user' | 'group'
    targetId: string
    anchorDate: string
  }) {
    setActionLoading((prev) => ({ ...prev, __assignment: true }))
    try {
      await shiftsApi.createAssignment(accessToken!, data)
      setNotification({ type: 'success', text: 'الگوی شیفت با موفقیت در دیتابیس انتساب داده شد و لوحه کاری به‌روزرسانی گردید.' })
      setConfirmModalOpen(false)
      setPendingAssignmentData(null)
      await loadData()
    } catch {
      setNotification({ type: 'error', text: 'خطا در ثبت انتساب شیفت در سرور' })
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev }
        delete next.__assignment
        return next
      })
    }
  }

  // Filtered users for grid
  const filteredUsers = useMemo(() => {
    let list = users

    // 1. Department Filter
    if (department !== 'all') {
      if (department === 'drivers') {
        list = list.filter((u) => {
          const post = String((u.customFields as Record<string, unknown> | null)?.post || '')
          return u.role?.key === 'operator' || u.role?.key === 'driver' || post === 'راهبر'
        })
      } else {
        list = list.filter((u) => {
          const post = String((u.customFields as Record<string, unknown> | null)?.post || '')
          return u.role?.key !== 'operator' && u.role?.key !== 'driver' && post !== 'راهبر'
        })
      }
    }

    // 2. Group Filter (A, B, C, ستادی)
    if (groupFilter !== 'all') {
      list = list.filter((u) => {
        const cf = u.customFields as Record<string, unknown> | null
        const shiftVal = String(cf?.shift || cf?.group || '').trim()
        return shiftVal === groupFilter
      })
    }

    // 3. Working Regime Filter (9-15, 12-24, ستادی)
    if (regimeFilter !== 'all') {
      list = list.filter((u) => {
        const cf = u.customFields as Record<string, unknown> | null
        const shiftTypeVal = String(cf?.shiftType || '').trim()
        return shiftTypeVal === regimeFilter
      })
    }

    // 4. Starting Location Filter
    if (locationFilter !== 'all') {
      list = list.filter((u) => {
        const cf = u.customFields as Record<string, unknown> | null
        const loc = String(cf?.startLocation || '').trim()
        return loc === locationFilter
      })
    }

    return list
  }, [users, department, groupFilter, regimeFilter, locationFilter])

  // Persian Months for selectors
  const persianMonths = [
    { value: 1, label: 'فروردین' },
    { value: 2, label: 'اردیبهشت' },
    { value: 3, label: 'خرداد' },
    { value: 4, label: 'تیر' },
    { value: 5, label: 'مرداد' },
    { value: 6, label: 'شهریور' },
    { value: 7, label: 'مهر' },
    { value: 8, label: 'آبان' },
    { value: 9, label: 'آذر' },
    { value: 10, label: 'دی' },
    { value: 11, label: 'بهمن' },
    { value: 12, label: 'اسفند' },
  ]

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground min-h-screen" dir="rtl">

      {/* Header Actions & Controls */}
      <div className="px-6 py-4 bg-surface/50 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl flex items-center gap-2">
            <CalendarIcon className="size-6 text-accent" />
            پنل مدیریت و بهینه‌سازی لوحه‌کاری شیفت‌ها
          </h1>
          <div className="flex items-center gap-2 mt-1 text-foreground-muted text-xs font-semibold">
            <Shield className="size-3.5 text-accent animate-pulse" />
            <span>بخش کنترل کلان عملیات راهبران و ایستگاه‌های خط ۱ مترو تهران</span>
          </div>
        </div>

        {/* Quick Date and AI Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {activeTab === 'roster' && (
            <>
              {viewType === 'weekly' ? (
                <div className="flex bg-surface rounded-lg p-1 border border-border/85">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setWeekOffset((o) => o - 1)}
                    className="hover:bg-surface-hover text-foreground-muted rounded-md h-8 w-8 cursor-pointer"
                    title="هفته قبل"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setWeekOffset(0)}
                    className="px-3 py-1 text-xs font-bold hover:bg-surface-hover rounded-md text-foreground h-8 cursor-pointer"
                  >
                    امروز
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setWeekOffset((o) => o + 1)}
                    className="hover:bg-surface-hover text-foreground-muted rounded-md h-8 w-8 cursor-pointer"
                    title="هفته بعد"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border/80">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent text-xs font-semibold text-foreground outline-none px-2 py-1 cursor-pointer border-none"
                  >
                    {persianMonths.map((m) => (
                      <option key={m.value} value={m.value} className="bg-surface">
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent text-xs font-semibold text-foreground outline-none px-2 py-1 cursor-pointer border-none"
                  >
                    <option value={2026} className="bg-surface">{toFa(2026)}</option>
                    <option value={2027} className="bg-surface">{toFa(2027)}</option>
                  </select>
                </div>
              )}

              <Button
                onClick={runAiAutofix}
                disabled={aiRunning || conflicts.length === 0}
                className="px-4 h-9 border border-border bg-surface hover:bg-surface-hover text-foreground rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="size-3.5 text-warning shrink-0" />
                حل تداخل‌ها با AI
              </Button>

              <Button
                onClick={handleNewShiftClick}
                className="px-4 h-9 bg-accent hover:bg-accent-hover text-accent-foreground rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="size-4 shrink-0" />
                اوراید شیفت جدید
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border bg-surface/25 px-6 shrink-0">
        <button
          onClick={() => setActiveTab('roster')}
          className={cn(
            "px-4 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
            activeTab === 'roster'
              ? "border-accent text-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <CalendarIcon className="size-4" />
          لوحه کاری پرسنل (Roster Grid)
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={cn(
            "px-4 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
            activeTab === 'builder'
              ? "border-accent text-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <Sliders className="size-4" />
          مدیریت قالب‌های شیفت (Template Builder)
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={cn(
            "px-4 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
            activeTab === 'assignments'
              ? "border-accent text-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <UserCheck className="size-4" />
          انتساب الگوها به پرسنل
        </button>
        <button
          onClick={() => setActiveTab('swaps')}
          className={cn(
            "px-4 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer relative",
            activeTab === 'swaps'
              ? "border-accent text-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <ArrowLeftRight className="size-4" />
          درخواست‌های جابجایی پرسنل
          {swapRequests.length > 0 && (
            <span className="absolute top-1.5 left-1 size-4 bg-accent text-accent-foreground text-[8px] font-black rounded-full flex items-center justify-center">
              {swapRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "px-4 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
            activeTab === 'settings'
              ? "border-accent text-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <Settings className="size-4" />
          تنظیمات قوانین شیفت
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={cn(
            "mx-6 mt-4 flex items-center gap-2 p-4 rounded-lg border text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300",
            notification.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-critical/10 border-critical/30 text-critical'
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertTriangle className="size-4 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Tab Contents */}
      <div className="flex-1 overflow-hidden">

        {/* ──────────────────────────────────────────────────────── */}
        {/* TAB 1: ROSTER GRID (THE MAIN TIMETABLE) */}
        {/* ──────────────────────────────────────────────────────── */}
        {activeTab === 'roster' && (
          <div className="h-full overflow-hidden p-4 md:p-6 flex flex-col lg:flex-row gap-6">

            {/* Left: Schedule Grid Container */}
            <div className="w-full lg:w-8/12 flex flex-col gap-4 h-full overflow-hidden">

              {/* Grid Top Filters */}
              <div className="bg-surface/40 border border-border rounded-xl p-3 flex justify-between items-center gap-3 shrink-0">
                <div className="flex flex-wrap gap-2 flex-1">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="bg-background/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-bold outline-none focus-visible:border-accent cursor-pointer"
                  >
                    <option value="all">همه دپارتمان‌ها</option>
                    <option value="drivers">راهبران قطار</option>
                    <option value="staff">پرسنل ایستگاهی و اداری</option>
                  </select>

                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="bg-background/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-bold outline-none focus-visible:border-accent cursor-pointer"
                  >
                    <option value="all">همه گروه‌ها</option>
                    <option value="A">گروه الف (A)</option>
                    <option value="B">گروه ب (B)</option>
                    <option value="C">گروه ج (C)</option>
                    <option value="ستادی">ستادی (ثابت)</option>
                  </select>

                  <select
                    value={regimeFilter}
                    onChange={(e) => setRegimeFilter(e.target.value)}
                    className="bg-background/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-bold outline-none focus-visible:border-accent cursor-pointer"
                  >
                    <option value="all">همه رژیم‌ها</option>
                    <option value="9-15">چرخشی ۹ ساعته</option>
                    <option value="12-24">چرخشی ۱۲ ساعته</option>
                    <option value="ستادی">ثابت اداری / ستادی</option>
                  </select>

                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="bg-background/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-bold outline-none focus-visible:border-accent cursor-pointer"
                  >
                    <option value="all">همه ایستگاه‌های شروع</option>
                    {uniqueLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>

                  <select
                    value={lineFilter}
                    onChange={(e) => setLineFilter(e.target.value)}
                    className="bg-background/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-bold outline-none focus-visible:border-accent cursor-pointer"
                  >
                    <option value="line1">خط ۱ - تجریش به کهریزک</option>
                  </select>
                </div>

                <div className="flex bg-background/50 rounded-lg p-0.5 border border-border">
                  <Button
                    variant="ghost"
                    onClick={() => setViewType('weekly')}
                    className={cn(
                      "px-3 h-7 text-xs font-bold rounded-md transition-all cursor-pointer",
                      viewType === 'weekly'
                        ? 'bg-accent text-accent-foreground shadow'
                        : 'text-foreground-muted hover:text-foreground'
                    )}
                  >
                    هفتگی
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setViewType('monthly')}
                    className={cn(
                      "px-3 h-7 text-xs font-bold rounded-md transition-all cursor-pointer",
                      viewType === 'monthly'
                        ? 'bg-accent text-accent-foreground shadow'
                        : 'text-foreground-muted hover:text-foreground'
                    )}
                  >
                    ماهانه
                  </Button>
                </div>
              </div>

              {/* Grid Timetable */}
              <div className="bg-surface/40 border border-border rounded-xl flex-1 overflow-hidden flex flex-col shadow-md backdrop-blur-sm">
                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <Loader2 className="size-8 animate-spin text-accent mb-3" />
                    <p className="text-sm text-foreground-muted font-medium">در حال دریافت اطلاعات لوحه سراسری خط ۱...</p>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <div className="overflow-auto flex-1 scrollbar-thin relative">
                    <table className="w-full text-right border-collapse min-w-[900px]">
                      <thead className="bg-surface/95 text-foreground sticky top-0 z-30 border-b border-border/80 backdrop-blur-md">
                        <tr>
                          <th className="py-3.5 px-4 text-xs font-black w-52 text-start sticky right-0 z-40 bg-surface border-l border-border/80 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                            مشخصات پرسنل
                          </th>
                          {activeDays.map((day, idx) => {
                            const isToday = dayjs(day).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
                            return (
                              <th
                                key={idx}
                                className={cn(
                                  "py-2 px-2 text-center text-xs font-bold border-l border-border/60 min-w-[100px]",
                                  isToday ? 'bg-accent/10 text-accent font-black' : ''
                                )}
                              >
                                <div className="text-[11px]">{jdate(day).format('dddd')}</div>
                                <div className="text-[9px] text-foreground-muted/85 font-data-mono mt-0.5">
                                  {toFa(`${String(jdate(day).month() + 1).padStart(2, '0')}/${String(jdate(day).date()).padStart(2, '0')}`)}
                                </div>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-surface-hover/10 transition-colors">
                            {/* Sticky User Info Cell */}
                            <td className="py-3 px-4 sticky right-0 z-20 bg-surface/90 border-l border-border/50 backdrop-blur-sm shadow-[2px_0_5px_rgba(0,0,0,0.15)]">
                              <div className="flex items-center gap-2.5 text-start">
                                <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold border border-accent/20 text-xs shrink-0">
                                  {user.name.slice(0, 2)}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="text-xs font-bold text-foreground truncate">{user.name}</div>
                                  <div className="text-[9px] text-foreground-muted/90 truncate mt-0.5 flex items-center gap-1">
                                    <span>{user.role?.name || 'راهبر'}</span>
                                    <span className="text-[8px] bg-surface-container border border-border rounded px-1">
                                      گروه {toFa(normalizeGroup((user.customFields as Record<string, unknown> | null)?.shift))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Shift Cells */}
                            {activeDays.map((day, idx) => {
                              const dateStr = dayjs(day).format('YYYY-MM-DD')
                              const shift = resolvedRosterMap[user.id]?.[dateStr]
                              const hasConflict = conflicts.some((c) => c.userId === user.id && c.date === dateStr)

                              return (
                                <td
                                  key={idx}
                                  onClick={() => handleCellClick(user.id, dateStr, shift)}
                                  className="p-1 border-l border-border/30 cursor-pointer min-w-[100px]"
                                >
                                  {shift ? (
                                    <div
                                      className={cn(
                                        "rounded-lg p-2 text-center border relative transition-all group",
                                        hasConflict
                                          ? 'bg-critical/10 border-critical/40 text-critical hover:bg-critical/15 ring-1 ring-critical/20'
                                          : shift.isOverride
                                            ? cn(shiftColors[shift.code], "border-accent/40 ring-1 ring-accent/10")
                                            : shiftColors[shift.code] || 'bg-surface border-border'
                                      )}
                                      title={shift.note || ''}
                                    >
                                      {/* Override Indicator */}
                                      {shift.isOverride && (
                                        <div className="absolute top-1 right-1" title="اوراید دستی شده توسط ادمین">
                                          <div className="size-1 bg-accent rounded-full animate-pulse" />
                                        </div>
                                      )}

                                      {/* Conflict icon */}
                                      {hasConflict && (
                                        <div className="absolute top-1 left-1" title="تداخل استراحت قانونی یا سقف شیفت شب">
                                          <AlertTriangle className="size-3 text-critical animate-pulse" />
                                        </div>
                                      )}

                                      {/* Pulsing indicator for active live shift */}
                                      {!hasConflict && isShiftLive(dateStr, shift.code) && (
                                        <span className="absolute top-1 left-1 flex h-1.5 w-1.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                                        </span>
                                      )}

                                      <div className="font-data-mono text-xs font-bold leading-none">{toFa(shiftTimes[shift.code] || '')}</div>
                                      <div className="text-[8.5px] text-foreground-muted/90 mt-1 font-bold leading-none truncate">
                                        {isShiftLive(dateStr, shift.code) ? 'در حال اجرا' : shift.label}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg p-2 text-center border border-dashed border-border/65 text-foreground-muted/55 hover:border-border/90 transition-colors">
                                      <div className="font-data-mono text-xs">-</div>
                                      <div className="text-[9px] mt-1">-</div>
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <Users className="size-12 text-foreground-muted/40 mb-3" />
                    <p className="text-sm text-foreground-muted font-medium">هیچ پرسنلی در دپارتمان مشخص شده یافت نشد.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sidebar widgets */}
            <div className="w-full lg:w-4/12 flex flex-col gap-6 h-full overflow-y-auto">

              {/* Roster Live Status Widget */}
              <div className="bg-surface/40 border border-border rounded-xl p-5 shadow-md relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-full h-[3px] bg-accent"></div>
                <h2 className="text-xs font-black text-foreground mb-4 flex items-center gap-2">
                  <Users className="size-4 text-accent" />
                  خلاصه آماری شیفت‌های امروز
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-surface/30 border border-border rounded-lg p-3 text-center">
                    <div className="text-xl font-black text-success">{toFa(12)}</div>
                    <div className="text-[10px] text-foreground-muted font-bold mt-1">حاضر در خدمت</div>
                  </div>
                  <div className="bg-surface/30 border border-border rounded-lg p-3 text-center">
                    <div className="text-xl font-black text-foreground">{toFa(8)}</div>
                    <div className="text-[10px] text-foreground-muted font-bold mt-1">آف / استراحت</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[11px] text-foreground-muted mb-1 font-bold">
                      <span>راهبران آماده‌باش (Standby)</span>
                      <span className="font-bold text-foreground">{toFa(3)} نفر</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1 border border-border">
                      <div className="bg-success h-1 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-[11px] text-foreground-muted mb-1 font-bold">
                      <span>تداخل‌های زمان‌بندی قرمز</span>
                      <span className="font-bold text-critical">{toFa(conflicts.length)} مورد</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1 border border-border">
                      <div className={cn("h-1 rounded-full", conflicts.length > 0 ? "bg-critical" : "bg-success")} style={{ width: conflicts.length > 0 ? '100%' : '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Conflicts Widget */}
              {conflicts.length > 0 && (
                <div className="bg-critical/5 border border-critical/20 rounded-xl p-5 shadow-md space-y-3.5 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute right-0 top-0 w-1.5 h-full bg-accent animate-pulse"></div>
                  <h2 className="text-xs font-black text-critical flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-critical animate-bounce" />
                    تداخل‌های قوانین ایمنی و سیر ({toFa(conflicts.length)})
                  </h2>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {conflicts.map((con, idx) => (
                      <div key={idx} className="bg-critical/10 border border-critical/20 rounded-lg p-2.5 space-y-1 hover:border-critical/30 transition-colors">
                        <div className="flex items-center justify-between border-b border-critical/15 pb-1">
                          <span className="text-xs font-bold text-critical">{con.userName}</span>
                        </div>
                        <p className="text-[10px] text-foreground-muted leading-relaxed font-semibold">
                          {con.reason}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={runAiAutofix}
                    disabled={aiRunning}
                    className="w-full bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold py-2 h-9 rounded-lg transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="size-3.5" />
                    رفع تمامی تداخل‌ها با هوش مصنوعی
                  </Button>
                </div>
              )}

              {/* Roster Guide Info Box */}
              <div className="bg-surface/35 border border-border/80 rounded-xl p-4.5 space-y-3 backdrop-blur-sm text-xs text-foreground-muted leading-relaxed">
                <h3 className="font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                  <Info className="size-4 text-accent" />
                  راهنمای کدهای لوحه‌کاری
                </h3>
                <p>لوحه سراسری حاصل ادغام چرخه‌های ثابت و متغیر با تغییرات دستی (اورایدها) است.</p>
                <ul className="space-y-1.5 pr-2 border-r border-border/50">
                  <li className="flex items-center gap-1.5"><span className="size-2 rounded bg-success/25 border border-success" /> شیفت صبح: ۹ ساعت (۰۷:۰۰ الی ۱۶:۰۰)</li>
                  <li className="flex items-center gap-1.5"><span className="size-2 rounded bg-info/25 border border-info" /> شیفت عصر: ۹ ساعت (۱۶:۰۰ الی ۰۱:۰۰)</li>
                  <li className="flex items-center gap-1.5"><span className="size-2 rounded bg-purple-500/25 border border-purple-500" /> شیفت شب: ۱۲ ساعت (۱۹:۰۰ الی ۰۷:۰۰ صبح)</li>
                  <li className="flex items-center gap-1.5"><span className="size-2 rounded bg-indigo-500/25 border border-indigo-500" /> شیفت ستادی: ۸.۷۵ ساعت اداری موظف</li>
                </ul>
              </div>

            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TAB 2: TEMPLATE BUILDER */}
        {/* ──────────────────────────────────────────────────────── */}
        {activeTab === 'builder' && (() => {
          const totalHours = tplShifts.reduce((acc, s) => acc + s.hours, 0)
          const cycleDays = tplRegime === 'staff' ? 7 : tplLength
          const avgWeeklyHours = cycleDays > 0 ? ((totalHours / cycleDays) * 7).toFixed(1) : '0'
          const workDays = tplShifts.filter(s => s.code !== 'off').length
          const offDays = tplShifts.filter(s => s.code === 'off').length

          return (
            <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Form: Create Template */}
                <div className="lg:col-span-5">
                  <Card className="border-border bg-surface-container-low/80 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="text-base font-bold flex items-center gap-1.5 justify-start">
                        <Sliders className="size-5 text-accent" />
                        طراحی و تعریف الگوی چرخه شیفت جدید
                      </CardTitle>
                      <CardDescription className="text-xs text-start">
                        یک الگوی زمانی اختصاصی برای راهبران ۹ ساعته، ۱۲ ساعته یا پرسنل ستادی تعریف کنید.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="tpl-name" className="text-xs font-bold flex justify-start">نام الگو</Label>
                        <Input
                          id="tpl-name"
                          placeholder="مثلاً: ۴ روزه ۱۲/۳۶ راهبران خط ۱"
                          value={tplName}
                          onChange={(e) => setTplName(e.target.value)}
                          className="h-10 text-sm border-border text-start"
                        />
                      </div>

                      {/* Work Regime Selection */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold flex justify-start">رژیم کاری و نوبت‌دهی</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {/* Card 1: 9-hour rotational */}
                          <button
                            type="button"
                            onClick={() => {
                              setTplRegime('rotational_9h')
                              setTplType('rotational')
                              setTplLength(6)
                            }}
                            className={cn(
                              "p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between h-24 w-full",
                              tplRegime === 'rotational_9h'
                                ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                                : "border-border bg-background/40 hover:bg-background/85"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={cn("text-xs font-bold", tplRegime === 'rotational_9h' ? "text-accent" : "text-foreground")}>۹ ساعته چرخشی</span>
                              <Clock className={cn("size-4", tplRegime === 'rotational_9h' ? "text-accent" : "text-foreground-muted")} />
                            </div>
                            <div className="text-[9px] text-foreground-muted leading-relaxed">
                              ویژه راهبران نوبت‌کاری صبح و عصر خط ۱. سیکل پیش‌فرض: ۶ روزه.
                            </div>
                          </button>

                          {/* Card 2: 12-hour rotational */}
                          <button
                            type="button"
                            onClick={() => {
                              setTplRegime('rotational_12h')
                              setTplType('rotational')
                              setTplLength(4)
                            }}
                            className={cn(
                              "p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between h-24 w-full",
                              tplRegime === 'rotational_12h'
                                ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                                : "border-border bg-background/40 hover:bg-background/85"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={cn("text-xs font-bold", tplRegime === 'rotational_12h' ? "text-accent" : "text-foreground")}>۱۲ ساعته چرخشی</span>
                              <CalendarIcon className={cn("size-4", tplRegime === 'rotational_12h' ? "text-accent" : "text-foreground-muted")} />
                            </div>
                            <div className="text-[9px] text-foreground-muted leading-relaxed">
                              رژیم سنگین ۱۲/۳۶ و ۱۲/۴۸ (روز، شب، استراحت). سیکل پیش‌فرض: ۴ روزه.
                            </div>
                          </button>

                          {/* Card 3: Staff */}
                          <button
                            type="button"
                            onClick={() => {
                              setTplRegime('staff')
                              setTplType('staff')
                              setTplLength(7)
                            }}
                            className={cn(
                              "p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between h-24 w-full",
                              tplRegime === 'staff'
                                ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                                : "border-border bg-background/40 hover:bg-background/85"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={cn("text-xs font-bold", tplRegime === 'staff' ? "text-accent" : "text-foreground")}>ستادی و پشتیبانی</span>
                              <Users className={cn("size-4", tplRegime === 'staff' ? "text-accent" : "text-foreground-muted")} />
                            </div>
                            <div className="text-[9px] text-foreground-muted leading-relaxed">
                              ساعت کار اداری ثابت هفتگی همگام با تقویم جلالی رسمی کشور.
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="space-y-2 border-t border-border/30 pt-4">
                        <Label className="text-xs font-bold flex justify-start text-foreground/90">الگوهای آماده و پیش‌فرض خط ۱</Label>
                        <div className="flex flex-wrap gap-1.5 justify-start">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => applyPreset('12_36')}
                            className="text-[10px] h-7 px-2 border-border/70 hover:border-accent hover:text-accent cursor-pointer"
                          >
                            <Sparkles className="size-3 me-1 text-accent animate-pulse" />
                            الگوی ۱۲/۳۶ چرخشی (روز، شب، ۲آف)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => applyPreset('rotational_12h_6d')}
                            className="text-[10px] h-7 px-2 border-border/70 hover:border-accent hover:text-accent cursor-pointer"
                          >
                            <CalendarIcon className="size-3 me-1 text-amber-500 animate-pulse" />
                            الگوی ۱۲ ساعته ۶ روزه (۲روز، ۲شب، ۲آف)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => applyPreset('rotational_9h')}
                            className="text-[10px] h-7 px-2 border-border/70 hover:border-accent hover:text-accent cursor-pointer"
                          >
                            <Clock className="size-3 me-1 text-success" />
                            الگوی ۹ ساعته چرخشی (۲صبح، ۲عصر، ۲آف)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => applyPreset('three_shift_9h')}
                            className="text-[10px] h-7 px-2 border-border/70 hover:border-accent hover:text-accent cursor-pointer"
                          >
                            <ArrowLeftRight className="size-3 me-1 text-info" />
                            الگوی ۳ نوبته ۹ ساعته (صبح، عصر، شب، ۲آف)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => applyPreset('staff_5d')}
                            className="text-[10px] h-7 px-2 border-border/70 hover:border-accent hover:text-accent cursor-pointer"
                          >
                            <UserCheck className="size-3 me-1 text-purple-400" />
                            الگوی ستادی ۵ روزه کاری
                          </Button>
                        </div>
                      </div>

                      {/* Cycle Length Input */}
                      {tplRegime !== 'staff' && (
                        <div className="space-y-1.5 border-t border-border/30 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                          <Label htmlFor="tpl-len" className="text-xs font-bold flex justify-start">طول چرخه تناوب (روز)</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              id="tpl-len"
                              type="number"
                              min={1}
                              max={30}
                              value={tplLength}
                              onChange={(e) => setTplLength(Math.max(1, Number(e.target.value)))}
                              className="h-9 text-sm border-border text-start w-24"
                            />
                            <span className="text-[10px] text-foreground-muted text-start leading-relaxed">
                              روزهای چرخه به صورت خودکار زیر اضافه و قابل ویرایش می‌شوند.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Roster shifts detail inputs */}
                      <div className="border-t border-border/30 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-foreground/95 flex justify-start">تنظیم نوبت‌های روزهای چرخه:</h3>
                          <Badge variant="secondary" className="text-[9px] font-bold">
                            {toFa(tplShifts.length)} روز در چرخه
                          </Badge>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {tplShifts.map((dayShift, idx) => (
                            <div key={dayShift.day} className="flex items-center gap-2 bg-background/40 border border-border/60 p-2.5 rounded-xl text-xs justify-between">
                              <span className="font-bold shrink-0 text-foreground-muted w-12 text-start">روز {toFa(dayShift.day)}:</span>

                              <select
                                value={dayShift.code}
                                onChange={(e) => {
                                  const newShifts = [...tplShifts]
                                  const code = e.target.value as ShiftCodeValue
                                  newShifts[idx].code = code

                                  if (tplRegime === 'rotational_12h') {
                                    if (code === 'morning') {
                                      newShifts[idx].label = 'روزکار ۱۲ ساعته'
                                      newShifts[idx].hours = 12
                                      newShifts[idx].startTime = '07:00'
                                      newShifts[idx].endTime = '19:00'
                                    } else if (code === 'night') {
                                      newShifts[idx].label = 'شب‌کار ۱۲ ساعته'
                                      newShifts[idx].hours = 12
                                      newShifts[idx].startTime = '19:00'
                                      newShifts[idx].endTime = '07:00'
                                    } else {
                                      newShifts[idx].label = 'استراحت (آف)'
                                      newShifts[idx].hours = 0
                                      newShifts[idx].startTime = ''
                                      newShifts[idx].endTime = ''
                                    }
                                  } else if (tplRegime === 'rotational_9h') {
                                    if (code === 'morning') {
                                      newShifts[idx].label = 'صبح‌کار ۹ ساعته'
                                      newShifts[idx].hours = 9
                                      newShifts[idx].startTime = '07:00'
                                      newShifts[idx].endTime = '16:00'
                                    } else if (code === 'evening') {
                                      newShifts[idx].label = 'عصرکار ۹ ساعته'
                                      newShifts[idx].hours = 9
                                      newShifts[idx].startTime = '16:00'
                                      newShifts[idx].endTime = '01:00'
                                    } else if (code === 'night') {
                                      newShifts[idx].label = 'شب‌کار ۹ ساعته'
                                      newShifts[idx].hours = 9
                                      newShifts[idx].startTime = '22:00'
                                      newShifts[idx].endTime = '07:00'
                                    } else {
                                      newShifts[idx].label = 'استراحت (آف)'
                                      newShifts[idx].hours = 0
                                      newShifts[idx].startTime = ''
                                      newShifts[idx].endTime = ''
                                    }
                                  } else {
                                    if (code === 'office') {
                                      newShifts[idx].label = 'اداری موظف'
                                      newShifts[idx].hours = 8.75
                                      newShifts[idx].startTime = '07:30'
                                      newShifts[idx].endTime = '16:15'
                                    } else {
                                      newShifts[idx].label = 'تعطیل پایان هفته'
                                      newShifts[idx].hours = 0
                                      newShifts[idx].startTime = ''
                                      newShifts[idx].endTime = ''
                                    }
                                  }
                                  setTplShifts(newShifts)
                                }}
                                className="bg-surface border border-border rounded-lg px-2 py-1 outline-none text-xs text-foreground cursor-pointer focus:ring-1 focus:ring-accent"
                              >
                                {tplRegime === 'rotational_12h' && (
                                  <>
                                    <option value="morning">روزکار (۱۲ ساعته)</option>
                                    <option value="night">شب‌کار (۱۲ ساعته)</option>
                                    <option value="off">استراحت (آف)</option>
                                  </>
                                )}
                                {tplRegime === 'rotational_9h' && (
                                  <>
                                    <option value="morning">صبح‌کار (۹ ساعته)</option>
                                    <option value="evening">عصرکار (۹ ساعته)</option>
                                    <option value="night">شب‌کار (۹ ساعته)</option>
                                    <option value="off">استراحت (آف)</option>
                                  </>
                                )}
                                {tplRegime === 'staff' && (
                                  <>
                                    <option value="office">اداری موظف (۸:۴۵ ساعته)</option>
                                    <option value="off">تعطیل پایان هفته</option>
                                  </>
                                )}
                              </select>

                              <span className="text-[10px] text-foreground-muted font-mono leading-none shrink-0 w-24 text-center bg-background/50 py-1 px-1.5 rounded border border-border/30">
                                {dayShift.startTime ? `${toFa(dayShift.startTime)} - ${toFa(dayShift.endTime)}` : 'بدون ساعت'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cycle Statistics Summary */}
                      <div className="border-t border-border/30 pt-4 space-y-3 bg-surface-container-highest/30 -mx-6 px-6 pb-2 rounded-b-lg">
                        <h3 className="text-xs font-bold text-foreground/95 flex items-center gap-1.5 justify-start">
                          <Info className="size-4 text-accent" />
                          مشخصات فنی و آماری چرخه:
                        </h3>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-background/45 border border-border/50 p-2 rounded-xl flex flex-col justify-between">
                            <span className="text-foreground-muted text-start">مجموع ساعات کار چرخه:</span>
                            <span className="font-bold text-foreground text-start mt-1 text-[11px]">
                              {toFa(totalHours)} ساعت
                            </span>
                          </div>
                          <div className="bg-background/45 border border-border/50 p-2 rounded-xl flex flex-col justify-between">
                            <span className="text-foreground-muted text-start">میانگین کار هفتگی پرسنل:</span>
                            <span className="font-bold text-accent text-start mt-1 text-[11px]">
                              {toFa(avgWeeklyHours)} ساعت در هفته
                            </span>
                          </div>
                          <div className="bg-background/45 border border-border/50 p-2 rounded-xl flex flex-col justify-between">
                            <span className="text-foreground-muted text-start">تعداد روزهای موظف کار:</span>
                            <span className="font-bold text-success text-start mt-1 text-[11px]">
                              {toFa(workDays)} روز کار
                            </span>
                          </div>
                          <div className="bg-background/45 border border-border/50 p-2 rounded-xl flex flex-col justify-between">
                            <span className="text-foreground-muted text-start">تعداد روزهای استراحت (آف):</span>
                            <span className="font-bold text-info text-start mt-1 text-[11px]">
                              {toFa(offDays)} روز استراحت
                            </span>
                          </div>
                        </div>

                        {/* Fatigue risk rating / warning */}
                        {Number(avgWeeklyHours) > 48 && (
                          <div className="bg-critical/10 text-critical border border-critical/20 p-2.5 rounded-xl flex items-start gap-2 text-[9px] leading-relaxed text-start">
                            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                            <span>
                              هشدار! میانگین ساعت کار هفتگی ({toFa(avgWeeklyHours)} ساعت) فراتر از سقف قانونی ۴۸ ساعت کار در هفته است. این الگو ممکن است منجر به خستگی شدید و کاهش ایمنی سیر و حرکت شود.
                            </span>
                          </div>
                        )}
                        {Number(avgWeeklyHours) <= 48 && Number(avgWeeklyHours) >= 40 && (
                          <div className="bg-success/10 text-success border border-success/20 p-2.5 rounded-xl flex items-start gap-2 text-[9px] leading-relaxed text-start">
                            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                            <span>
                              شاخص بار کاری ایمن و متوازن. میانگین ساعت کار هفتگی ({toFa(avgWeeklyHours)} ساعت) کاملاً در محدوده قانونی و استاندارد راه‌آهن شهری است.
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-border/30 pt-4 flex justify-end">
                      <Button onClick={handleSaveTemplate} disabled={!tplName.trim()} className="px-5 h-9 bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold cursor-pointer rounded-lg">
                        <Check className="size-4 me-1.5" />
                        ذخیره و ثبت الگو چرخه
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Right Cards: List of Templates */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-foreground">قالب‌های فعال و ثبت شده در سیستم ({toFa(dbTemplates.length)})</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dbTemplates.map((tpl) => (
                      <Card key={tpl.id} className="border border-border bg-surface/35 hover:border-border/80 transition-all flex flex-col justify-between rounded-xl">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xs font-bold text-foreground text-start leading-relaxed">{tpl.name}</CardTitle>
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-bold border",
                              tpl.type === 'staff' && "bg-purple-500/5 text-purple-400 border-purple-500/20",
                              tpl.type === 'rotational' && tpl.shifts.some(s => s.hours === 12) && "bg-amber-500/5 text-amber-400 border-amber-500/20",
                              tpl.type === 'rotational' && !tpl.shifts.some(s => s.hours === 12) && "bg-success/5 text-success border-success/20"
                            )}>
                              {getTemplateRegimeLabel(tpl)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3 text-[11px] text-foreground-muted">
                          <div className="flex flex-wrap gap-1 mt-1.5 justify-start">
                            {tpl.shifts.map((s) => (
                              <span
                                key={s.day}
                                className={cn(
                                  "px-1.5 py-0.5 rounded-md text-[9px] font-bold border",
                                  s.code === 'morning' && s.hours === 12 && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                  s.code === 'morning' && s.hours !== 12 && "bg-success/10 text-success border-success/20",
                                  s.code === 'evening' && "bg-info/10 text-info border-info/20",
                                  s.code === 'night' && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                                  s.code === 'office' && "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                                  s.code === 'off' && "bg-background text-foreground-muted border-border"
                                )}
                                title={`${s.label} (${s.startTime ? `${s.startTime}-${s.endTime}` : 'آف'})`}
                              >
                                {toFa(s.day)}: {s.label || shiftLabels[s.code] || s.code}
                              </span>
                            ))}
                          </div>

                          <div className="flex justify-between items-center mt-3.5 text-[10px] text-foreground-muted bg-background/30 p-2 rounded-lg border border-border/40">
                            <span>طول دوره: {toFa(tpl.type === 'staff' ? 7 : tpl.length)} روز</span>
                            <span>میانگین کار هفتگی: <strong className="text-accent">{toFa(getTemplateAvgWeeklyHours(tpl))} ساعت</strong></span>
                          </div>
                        </CardContent>
                        <CardFooter className="border-t border-border/10 pt-2.5 flex justify-end">
                          <Button
                            variant="ghost"
                            onClick={async () => {
                              if (!accessToken) return
                              if (!confirm(`آیا از حذف الگوی "${tpl.name}" اطمینان دارید؟`)) return
                              try {
                                await shiftsApi.deleteTemplate(accessToken, tpl.id)
                                setNotification({ type: 'success', text: `الگوی "${tpl.name}" با موفقیت حذف شد.` })
                                await loadData()
                              } catch {
                                setNotification({ type: 'error', text: 'خطا در حذف الگو از سرور' })
                              }
                            }}
                            className="text-critical hover:bg-critical/10 text-[10px] font-bold h-7 cursor-pointer disabled:opacity-30 rounded-md"
                          >
                            <Trash className="size-3.5 me-1" />
                            حذف الگو
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )
        })()}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TAB 3: SHIFT ASSIGNMENTS */}
        {/* ──────────────────────────────────────────────────────── */}
        {activeTab === 'assignments' && (
          <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Form: Assign Template */}
              <div className="lg:col-span-5">
                <Card className="border-border bg-surface-container-low/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-1.5">
                      <UserCheck className="size-5 text-accent" />
                      اتصال و انتساب الگو به پرسنل
                    </CardTitle>
                    <CardDescription className="text-xs">
                      سیکل زمانی الگوها را بر مبنای یک تاریخ لنگرگاه (Anchor) به پرسنل یا گروه متصل کنید.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold flex justify-start">انتخاب الگوی شیفت</Label>
                      <Select value={assignTplId} onValueChange={(v) => setAssignTplId(v || '')}>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue placeholder="یک الگو انتخاب کنید..." />
                        </SelectTrigger>
                        <SelectContent>
                          {dbTemplates.map((t) => (
                            <SelectItem key={t.id} value={t.id} className="text-xs">
                              {t.name} ({t.type === 'staff' ? 'ستادی' : `${toFa(t.length)} روزه چرخشی`})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filters for user assignment */}
                    {assignTargetType === 'user' && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold flex justify-start">فیلتر گروه شیفتی</Label>
                           <Select value={assignShiftFilter} onValueChange={(v) => setAssignShiftFilter(v ?? 'all')}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" className="text-xs">همه گروه‌ها</SelectItem>
                              <SelectItem value="A" className="text-xs">A (الف)</SelectItem>
                              <SelectItem value="B" className="text-xs">B (ب)</SelectItem>
                              <SelectItem value="C" className="text-xs">C (ج)</SelectItem>
                              <SelectItem value="ستادی" className="text-xs">ستادی</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold flex justify-start">فیلتر نوع شیفت</Label>
                           <Select value={assignShiftTypeFilter} onValueChange={(v) => setAssignShiftTypeFilter(v ?? 'all')}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" className="text-xs">همه نوع‌ها</SelectItem>
                              <SelectItem value="9-15" className="text-xs">9-15 (نه ساعته)</SelectItem>
                              <SelectItem value="12-24" className="text-xs">12-24 (دوازده ساعته)</SelectItem>
                              <SelectItem value="9 ساعته" className="text-xs">9 ساعته</SelectItem>
                              <SelectItem value="12 ساعته" className="text-xs">12 ساعته</SelectItem>
                              <SelectItem value="ستادی" className="text-xs">ستادی (اداری)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <p className="text-[10px] text-foreground-muted leading-relaxed">
                            💡 با انتخاب فیلترها، لیست پرسنل زیر محدود به کاربران مطابق می‌شود ({toFa(filteredUsersForAssignment.length)} نفر).
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold flex justify-start">نوع هدف انتساب</Label>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Select value={assignTargetType} onValueChange={(v: any) => setAssignTargetType(v)}>
                          <SelectTrigger className="h-10 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="group" className="text-xs">گروه شیفتی (A, B, C)</SelectItem>
                            <SelectItem value="user" className="text-xs">راهبر / کاربر خاص</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold flex justify-start">انتخاب هدف</Label>
                        {assignTargetType === 'group' ? (
                          <Select value={assignTargetId} onValueChange={(v) => setAssignTargetId(v || '')}>
                            <SelectTrigger className="h-10 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GROUPS_LIST.map((g) => (
                                <SelectItem key={g.key} value={g.key} className="text-xs">{g.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select value={assignTargetId} onValueChange={(v) => setAssignTargetId(v || '')}>
                            <SelectTrigger className="h-10 text-xs">
                              <SelectValue placeholder="یک پرسنل انتخاب کنید..." />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredUsersForAssignment.map((u) => {
                                const customFields = u.customFields as Record<string, unknown> | null
                                const shift = String(customFields?.shift || 'نامشخص')
                                const shiftType = String(customFields?.shiftType || 'نامشخص')
                                
                                return (
                                  <SelectItem key={u.id} value={u.id} className="text-xs">
                                    {u.name} — شیفت: {shift} | نوع: {shiftType}
                                  </SelectItem>
                                )
                              })}
                              {filteredUsersForAssignment.length === 0 && (
                                <div className="p-2 text-center text-xs text-foreground-muted">
                                  هیچ کاربری با فیلترهای انتخابی یافت نشد
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    {/* نوع شیفت برای هدف گروهی: همراه گروه، کلید ترکیبی انتساب را می‌سازد */}
                    {assignTargetType === 'group' && normalizeGroup(assignTargetId) !== 'ستادی' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold flex justify-start">نوع شیفت گروه (رژیم چرخه)</Label>
                        <Select value={assignGroupType} onValueChange={(v) => setAssignGroupType(v || '9-15')}>
                          <SelectTrigger className="h-10 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SHIFT_TYPE_LIST.filter((t) => t.key !== 'ستادی').map((t) => (
                              <SelectItem key={t.key} value={t.key} className="text-xs">{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-foreground-muted mt-1 text-right leading-relaxed pr-1">
                          ترکیب گروه و نوع شیفت، کلید انتساب را می‌سازد (مثلاً <span className="font-data-mono" dir="ltr">{buildCompositeKey(assignTargetId, assignGroupType)}</span>). فقط پرسنل با همین گروه و نوع، این الگو را دریافت می‌کنند.
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="anchor-date" className="text-xs font-bold flex justify-start">تاریخ لنگرگاه چرخه (شروع الگو)</Label>
                      <JalaliDatePicker
                        id="anchor-date"
                        value={assignAnchorDate}
                        onChange={(v) => setAssignAnchorDate(v)}
                        className="h-10 text-sm border-border text-start font-data-mono"
                      />
                      <p className="text-[10px] text-foreground-muted mt-1 text-right leading-relaxed pr-1">
                        تذکر: برای الگوهای چرخشی عملیاتی، محاسبات روز چرخه از تفاضل تاریخ هدف با این تاریخ لنگرگاه حاصل می‌شود.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-border/30 pt-4 flex justify-end">
                    <Button onClick={handleSaveAssignment} disabled={!assignTplId} className="px-5 h-9 bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold cursor-pointer">
                      <Check className="size-4 me-1.5" />
                      تایید و اعمال انتساب
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Right Cards: Active Assignments */}
              <div className="lg:col-span-7 space-y-4">
                <h2 className="text-sm font-black text-foreground">لیست انتساب‌های چرخه‌ای فعال سیستم ({toFa(dbAssignments.length)})</h2>

                <div className="space-y-3">
                  {dbAssignments.map((assign) => {
                    const tpl = dbTemplates.find((t) => t.id === assign.templateId)
                    const targetUser = assign.targetType === 'user' ? users.find((u) => u.id === assign.targetId) : null
                    const targetUserFields = targetUser?.customFields as Record<string, unknown> | null
                    const targetUserShift = targetUserFields ? String(targetUserFields.shift || 'نامشخص') : null
                    const targetUserShiftType = targetUserFields ? String(targetUserFields.shiftType || 'نامشخص') : null
                    
                    const targetLabel = assign.targetType === 'group'
                      ? `گروه شیفت ${targetIdLabel(assign.targetId)}`
                      : `پرسنل: ${targetUser?.name || assign.targetId}`

                    // شمارش اعضای منطبق: کلید ترکیبی یا (برای انتساب‌های قدیمیِ گروه‌ساده) تطبیق گروه
                    const assignIsComposite = assign.targetId.includes(':')
                    const assignGroupOnly = parseTargetId(assign.targetId).group
                    const groupUsersCount = assign.targetType === 'group'
                      ? users.filter((u) => {
                          const cf = u.customFields as Record<string, unknown> | null
                          const key = groupKeyFor(cf)
                          return assignIsComposite
                            ? key.compositeKey === assign.targetId
                            : key.group === assignGroupOnly
                        }).length
                      : 0

                    return (
                      <div key={assign.id} className="bg-surface/35 border border-border rounded-xl p-4 flex items-center justify-between hover:border-border/80 transition-all text-xs">
                        <div className="space-y-1.5 text-right flex-1">
                          <div className="font-bold text-foreground text-sm flex items-center gap-2">
                            <Shield className="size-4 text-accent" />
                            {targetLabel}
                            {assign.targetType === 'group' && (
                              <span className="text-[10px] font-normal text-foreground-muted">
                                ({toFa(groupUsersCount)} نفر)
                              </span>
                            )}
                          </div>
                          <div className="text-foreground-muted text-[11px]">
                            الگو: <span className="font-bold text-accent">{tpl?.name || '(حذف شده)'}</span>
                          </div>
                          {assign.targetType === 'user' && targetUserShift && targetUserShiftType && (
                            <div className="flex items-center gap-3 text-[10px]">
                              <span className="text-foreground-muted">
                                شیفت: <span className="font-bold text-foreground">{targetUserShift}</span>
                              </span>
                              <span className="text-foreground-muted">
                                نوع: <span className="font-bold text-foreground">{targetUserShiftType}</span>
                              </span>
                            </div>
                          )}
                          <div className="text-foreground-muted text-[10px] flex items-center gap-1">
                            <CalendarIcon className="size-3" />
                            لنگرگاه: {jalali(assign.anchorDate)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!accessToken) return
                            if (!confirm(`آیا از حذف این انتساب اطمینان دارید؟`)) return
                            try {
                              await shiftsApi.deleteAssignment(accessToken, assign.id)
                              setNotification({ type: 'success', text: 'انتساب با موفقیت حذف شد.' })
                              await loadData()
                            } catch {
                              setNotification({ type: 'error', text: 'خطا در حذف انتساب از سرور' })
                            }
                          }}
                          className="text-critical hover:bg-critical/10 text-[10px] font-bold h-8 cursor-pointer"
                        >
                          <Trash className="size-3.5 me-1" />
                          حذف انتساب
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TAB 4: SWAP REQUESTS */}
        {/* ──────────────────────────────────────────────────────── */}
        {activeTab === 'swaps' && (
          <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <ArrowLeftRight className="size-5 text-accent" />
                  صندوق درخواست‌های جابجایی لوحه شیفت کاری پرسنل
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">درخواست‌های تبادل زمان‌بندی کاری راهبران قطار که نیازمند تایید/رد ادمین است.</p>
              </div>
              <Badge className="bg-accent/10 border-accent/30 text-accent text-xs font-bold px-2.5 py-0.5">
                {toFa(swapRequests.length)} درخواست معلق
              </Badge>
            </div>

            <div className="space-y-4">
              {swapRequests.length > 0 ? (
                swapRequests.map((req) => {
                  const rules = evaluateSwapRules(req)
                  const hasRuleError = rules.some(r => r.status === 'error')
                  const hasRuleWarning = rules.some(r => r.status === 'warning')

                  return (
                    <div key={req.id} className="bg-surface/35 border border-border rounded-xl p-5 space-y-4 hover:border-border/80 transition-all shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent/10 text-accent border border-accent/25 flex items-center justify-center text-xs font-bold">
                            {req.requester.name.slice(0, 2)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-foreground block">{req.requester.name}</span>
                            <span className="text-[9px] text-foreground-muted font-bold mt-0.5 block">{req.requester.role?.name || 'راهبر قطار'}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-foreground-muted font-data-mono">
                          تاریخ ثبت: {toFa(new Date(req.createdAt).toLocaleDateString('fa-IR'))}
                        </span>
                      </div>

                      {/* Swap details block */}
                      <div className="grid grid-cols-1 md:grid-cols-12 items-center bg-background/55 border border-border/60 p-3.5 rounded-lg text-xs font-data-mono text-center gap-3">
                        <div className="md:col-span-5 bg-surface border border-border/40 p-2.5 rounded">
                          <div className="font-bold text-foreground">{req.requester.name}</div>
                          <div className="text-foreground-muted text-[10px] mt-1">{jalali(req.sourceShift.date)} ({jdate(req.sourceShift.date).format('dddd')})</div>
                          <Badge className="mt-2 text-[10px] bg-accent/10 text-accent border-accent/30">{shiftLabels[req.sourceShift.code]}</Badge>
                        </div>

                        <div className="md:col-span-2 flex justify-center">
                          <ArrowLeftRight className="size-6 text-foreground-muted/65" />
                        </div>

                        <div className="md:col-span-5 bg-surface border border-border/40 p-2.5 rounded">
                          <div className="font-bold text-foreground">{req.target.name}</div>
                          <div className="text-foreground-muted text-[10px] mt-1">{jalali(req.targetShift.date)} ({jdate(req.targetShift.date).format('dddd')})</div>
                          <Badge className="mt-2 text-[10px] bg-accent/10 text-accent border-accent/30">{shiftLabels[req.targetShift.code]}</Badge>
                        </div>
                      </div>

                      {/* Safety Rule Engine Panel (swap-skill) */}
                      <div className="bg-surface/50 border border-border/45 p-4 rounded-xl space-y-3">
                        <h3 className="text-[11px] font-black text-foreground flex items-center gap-1.5">
                          <Shield className="size-4 text-accent" />
                          ارزیابی خودکار انطباق با قوانین ایمنی سیر و حرکت خط ۱:
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {rules.map((rule, idx) => (
                            <div key={idx} className="bg-background/45 p-3 rounded-lg border border-border/40 flex flex-col gap-1 text-[10px]">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className={cn(
                                  "size-2 rounded-full",
                                  rule.status === 'success' ? 'bg-success' : rule.status === 'warning' ? 'bg-warning animate-pulse' : 'bg-critical animate-ping'
                                )}></span>
                                <span className={cn(
                                  rule.status === 'success' ? 'text-success' : rule.status === 'warning' ? 'text-warning' : 'text-critical'
                                )}>{rule.name}</span>
                              </div>
                              <p className="text-foreground-muted/80 leading-relaxed mt-1">{rule.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {req.note && (
                        <p className="text-[11px] text-foreground-muted border-r-2 border-border pr-2.5 leading-relaxed font-medium">
                          توضیح پرسنل: {req.note}
                        </p>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => handleSwapDecision(req.id, 'rejected')}
                          disabled={actionLoading[req.id]}
                          className="flex-1 border border-border bg-surface hover:bg-surface-hover text-foreground text-xs font-bold h-9.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                        >
                          رد درخواست جابجایی
                        </Button>
                        <Button
                          onClick={() => handleSwapDecision(req.id, 'approved')}
                          disabled={actionLoading[req.id]}
                          className={cn(
                            "flex-1 text-white text-xs font-bold h-9.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5",
                            hasRuleError ? 'bg-critical/85 hover:bg-critical' : hasRuleWarning ? 'bg-warning/85 hover:bg-warning' : 'bg-success/85 hover:bg-success'
                          )}
                        >
                          <Check className="size-4" />
                          تایید و اعمال جابجایی لوحه
                        </Button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl bg-surface/10">
                  <CheckCircle2 className="size-10 text-foreground-muted/40 mb-3" />
                  <p className="text-sm text-foreground-muted font-bold">تمام درخواست‌ها ارزیابی و پاسخ داده شده‌اند. صندوق ورودی خالی است.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────── */}
        {/* TAB 5: SHIFT RULES SETTINGS PANEL */}
        {/* ──────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto p-4 md:p-6 max-w-2xl mx-auto">
            <Card className="border border-accent/20 bg-surface-container-low/80 backdrop-blur relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-[4px] bg-accent"></div>
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <Settings className="size-5 text-accent" />
                  تنظیمات قوانین کار و زمان‌بندی پرسنل
                </CardTitle>
                <CardDescription className="text-xs">
                  پارامترها و سقف‌های مجاز ایمنی کار برای پرسنل سیر و حرکت خط ۱ تهران را در دیتابیس مدیریت کنید.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {settingsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-accent mb-2" />
                    <p className="text-xs text-foreground-muted">در حال دریافت پیکربندی قوانین از دیتابیس...</p>
                  </div>
                ) : (
                  <>
                    {/* 1. Min Rest Hours */}
                    <div className="space-y-3 p-4 rounded-xl bg-background/30 border border-border/60">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-black text-foreground">حداقل فاصله استراحت قانونی پرسنل</Label>
                        <Badge variant="outline" className="font-data-mono text-accent bg-accent/5">
                          {toFa(dbMinRestHours)} ساعت استراحت
                        </Badge>
                      </div>
                      <p className="text-[10.5px] text-foreground-muted leading-relaxed">
                        حداقل مدت زمان استراحت اجباری بین پایان شیفت کاری اول و شروع شیفت بعدی. در صورت کمتر بودن، تداخل ترافیکی قرمز رنگ در لوحه نمایش داده خواهد شد.
                      </p>
                      <div className="flex items-center gap-4 pt-1.5">
                        <input
                          type="range"
                          min={8}
                          max={24}
                          value={dbMinRestHours}
                          onChange={(e) => setDbMinRestHours(Number(e.target.value))}
                          className="flex-1 accent-accent cursor-pointer h-1.5 bg-surface rounded-lg border-none"
                        />
                        <span className="text-xs font-bold text-foreground-muted w-10 text-left font-data-mono">{toFa(dbMinRestHours)}h</span>
                      </div>
                    </div>

                    {/* 2. Max Consecutive Nights */}
                    <div className="space-y-3 p-4 rounded-xl bg-background/30 border border-border/60">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-black text-foreground">سقف شیفت شب متوالی مجاز</Label>
                        <Badge variant="outline" className="font-data-mono text-accent bg-accent/5">
                          حداکثر {toFa(dbMaxConsecutiveNights)} شب متوالی
                        </Badge>
                      </div>
                      <p className="text-[10.5px] text-foreground-muted leading-relaxed">
                        حداکثر شیفت‌های شب متناوب مجاز برای راهبران قطار جهت جلوگیری از خواب‌آلودگی و تضمین سلامت جسمی سیر و حرکت لوکوموتیورانان خط ۱.
                      </p>
                      <div className="flex items-center gap-4 pt-1.5">
                        <input
                          type="range"
                          min={1}
                          max={5}
                          value={dbMaxConsecutiveNights}
                          onChange={(e) => setDbMaxConsecutiveNights(Number(e.target.value))}
                          className="flex-1 accent-accent cursor-pointer h-1.5 bg-surface rounded-lg border-none"
                        />
                        <span className="text-xs font-bold text-foreground-muted w-10 text-left font-data-mono">{toFa(dbMaxConsecutiveNights)} شب</span>
                      </div>
                    </div>

                    {/* 3. Role Parity Swap Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-background/30 border border-border/60 gap-6">
                      <div className="space-y-1 text-right flex-1">
                        <Label className="text-xs font-black text-foreground">الزام همترازی نقش و رتبه سازمانی در جابجایی</Label>
                        <p className="text-[10.5px] text-foreground-muted leading-relaxed">
                          در صورت فعال بودن، درخواست تعویض شیفت در صورتی که نقش فنی پرسنل مبدا و مقصد یکسان نباشد (مثلاً راهبر ارشد با راهبر عادی) با هشدار عدم همترازی مواجه می‌شود.
                        </p>
                      </div>
                      <Switch
                        checked={dbRoleParity}
                        onCheckedChange={setDbRoleParity}
                      />
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="border-t border-border/30 pt-4 flex justify-between flex-wrap gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleResetSettings}
                    disabled={settingsLoading}
                    className="px-4 h-9.5 text-xs font-bold text-foreground hover:bg-surface border-border cursor-pointer disabled:opacity-50"
                  >
                    بازنشانی تنظیمات قوانین
                  </Button>
                  {/* Reset templates button removed: templates are now in database, not localStorage */}
                </div>
                <Button
                  onClick={handleSaveSettings}
                  disabled={settingsLoading}
                  className="px-6 h-9.5 bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold cursor-pointer shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {settingsLoading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  ذخیره و ثبت تنظیمات در دیتابیس
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

      </div>

      {/* Roster Assignment and Inline Cell Edit Modal */}
      <Dialog open={shiftModalOpen} onOpenChange={setShiftModalOpen}>
        <DialogContent className="max-w-sm w-full" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground text-start">
              {isCellEdit ? 'ویرایش دستی و ثبت اوراید شیفت کاری' : 'ثبت اوراید شیفت کاری جدید'}
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground-muted text-start">
              با ثبت اوراید، سیکل محاسباتی چرخه‌ای در این تاریخ به صورت کامل بازنویسی خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveShift} className="space-y-4 py-1.5">
            {isCellEdit ? (
              <div className="bg-surface/30 p-3 rounded-xl border border-border/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground-muted">نام پرسنل:</span>
                  <strong className="text-foreground">{users.find((u) => u.id === selectedUserId)?.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground-muted">تاریخ شیفت:</span>
                  <strong className="text-foreground font-data-mono">{jalali(selectedDate)} ({jdate(selectedDate).format('dddd')})</strong>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="assign-user" className="text-xs font-bold text-foreground flex justify-start">انتخاب پرسنل</Label>
                  <select
                    id="assign-user"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:border-accent cursor-pointer"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role?.name || 'راهبر'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assign-date" className="text-xs font-bold text-foreground flex justify-start">تاریخ شیفت</Label>
                  <JalaliDatePicker
                    id="assign-date"
                    value={selectedDate}
                    onChange={(v) => setSelectedDate(v)}
                    className="h-10 text-sm border-border font-data-mono text-start"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex justify-start">نوع شیفت کاری اوراید</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: 'morning', label: 'صبح (صبحکار)', color: 'border-success/30 hover:bg-success/5 text-success' },
                  { code: 'evening', label: 'عصر (عصرکار)', color: 'border-info/30 hover:bg-info/5 text-info' },
                  { code: 'night', label: 'شب (شب‌کار)', color: 'border-purple-500/30 hover:bg-purple-500/5 text-purple-400' },
                  { code: 'off', label: 'استراحت (Off)', color: 'border-border hover:bg-surface-hover text-foreground' },
                ].map((item) => {
                  const active = selectedShiftCode === item.code
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setSelectedShiftCode(item.code as ShiftCodeValue)}
                      className={cn(
                        "h-9 border rounded-lg text-xs font-bold transition-all cursor-pointer",
                        item.color,
                        active ? 'ring-1 ring-accent bg-accent/5 font-black' : 'opacity-80'
                      )}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assign-note" className="text-xs font-bold text-foreground flex justify-start">علت تغییر و اوراید</Label>
              <Input
                id="assign-note"
                placeholder="دلایلی نظیر مرخصی استعلاجی، شیفت جایگزین..."
                value={selectedNote}
                onChange={(e) => setSelectedNote(e.target.value)}
                className="h-10 text-sm focus-visible:ring-accent border-border text-start"
              />
            </div>

            <DialogFooter className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShiftModalOpen(false)}
                className="cursor-pointer text-xs"
              >
                لغو
              </Button>
              <Button
                type="submit"
                disabled={formSubmitLoading}
                className="bg-accent hover:bg-accent-hover text-accent-foreground font-bold px-5 h-9 rounded-lg cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                {formSubmitLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                ذخیره اوراید
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Solving Progress Dialog Overlay */}
      <Dialog open={aiRunning}>
        <DialogContent className="max-w-xs w-full text-center py-8 flex flex-col items-center justify-center" dir="rtl">
          <Loader2 className="size-10 animate-spin text-accent mb-4" />
          <DialogTitle className="text-sm font-bold text-foreground">
            در حال بهینه‌سازی لوحه شیفت‌ها با AI...
          </DialogTitle>
          <DialogDescription className="text-xs text-foreground-muted mt-1.5">
            سیستم در حال ارزیابی قوانین ایمنی خط ۱ و برطرف کردن تداخل‌ها در دیتابیس است.
          </DialogDescription>

          <div className="w-full mt-5 bg-surface p-3.5 rounded-xl border border-border/80 space-y-2.5 text-right text-[10px]">
            {[
              { label: 'بررسی فواصل استراحت کمتر از حد مصوب دیتابیس', stage: 0 },
              { label: 'کنترل متوالی شب‌کاری راهبران خط ۱ تهران', stage: 1 },
              { label: 'اصلاح سلول‌های تداخلی به استراحت ایمن', stage: 2 },
              { label: 'ثبت نهایی اورایدهای بهینه در سرور لوحه کاری', stage: 3 },
            ].map((step, index) => {
              const active = aiStage === step.stage
              const completed = aiStage > step.stage
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className={cn(
                    "size-2 rounded-full",
                    completed ? 'bg-success animate-none' : active ? 'bg-warning animate-ping' : 'bg-border/60'
                  )}></span>
                  <span className={cn(
                    "font-bold",
                    completed ? 'text-success' : active ? 'text-warning font-black' : 'text-foreground-muted'
                  )}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Overwriting Assignment (user requested) */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md w-full" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground text-start flex items-center gap-2">
              <Shield className="size-5 text-warning" />
              تایید به‌روزرسانی انتساب شیفت
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground-muted text-start mt-2">
              یک انتساب فعال برای این هدف وجود دارد. آیا مایلید آن را به‌روزرسانی کنید؟
            </DialogDescription>
          </DialogHeader>

          {pendingAssignmentData && (
            <div className="bg-surface/30 p-3.5 rounded-xl border border-border/80 space-y-2.5 text-xs text-right mt-1.5">
              <div>
                <span className="font-bold text-foreground-muted block mb-1">مشخصات انتساب فعلی (قبلی):</span>
                <div className="bg-surface/60 p-2 rounded border border-border/40 space-y-1">
                  <div>الگو: <span className="font-bold text-critical">{pendingAssignmentData.existingTplName}</span></div>
                  <div>لنگرگاه: <span className="font-data-mono font-bold text-foreground-muted">{jalali(pendingAssignmentData.existingAnchorDate || '')}</span></div>
                </div>
              </div>

              <div>
                <span className="font-bold text-foreground-muted block mb-1">مشخصات انتساب جدید:</span>
                <div className="bg-accent/10 p-2 rounded border border-accent/20 space-y-1">
                  <div>الگو: <span className="font-bold text-accent">{dbTemplates.find((t) => t.id === pendingAssignmentData.templateId)?.name || ''}</span></div>
                  <div>لنگرگاه: <span className="font-data-mono font-bold text-accent">{jalali(pendingAssignmentData.anchorDate)}</span></div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmModalOpen(false)
                setPendingAssignmentData(null)
              }}
              className="text-xs h-9 cursor-pointer"
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (pendingAssignmentData) {
                  executeSaveAssignment({
                    templateId: pendingAssignmentData.templateId,
                    targetType: pendingAssignmentData.targetType,
                    targetId: pendingAssignmentData.targetId,
                    anchorDate: pendingAssignmentData.anchorDate,
                  })
                }
              }}
              className="px-5 h-9 bg-accent hover:bg-accent-hover text-accent-foreground text-xs font-bold cursor-pointer"
            >
              بله، به‌روزرسانی شود
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
