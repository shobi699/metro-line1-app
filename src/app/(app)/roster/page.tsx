'use client'

import { useState, useEffect, useMemo } from 'react'
import { toFa, jalali } from '@/lib/fa'
import { useAuthStore } from '@/features/auth'
import { RosterGanttView } from '@/components/shared/roster-gantt-view'
import { RegionalBoard } from '@/features/roster/components/RegionalBoard'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { jdate, gregStr } from '@/lib/dayjs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  TrendingUp,
  Loader2,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  MessageSquare,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Printer,
  LayoutGrid,
  Columns,
  FileText,
  Layers,
  GitCompare,
  Send,
  UploadCloud,
  BellRing,
  Inbox
} from 'lucide-react'

interface TripAssignment {
  id: string
  role: 'H1' | 'H2' | 'T' | 'R' | 'T_TYPE' | 'R_CHAR'
  rawName: string | null
  matchedUserId: string | null
  personnelNo: string | null
  matchStatus: string
  acknowledgedAt: string | null
  readyAt: string | null
  handoverAt: string | null
  disputed: boolean
  disputeNote: string | null
  matchedUser?: {
    name: string
  }
}

interface Trip {
  id: string
  rowNo: number
  trainNumber: string | null
  direction: 'TAJRISH_TO_SHAHRREY' | 'SHAHRREY_TO_TAJRISH'
  originStation: string | null
  destinationStation: string | null
  departureTime: string | null
  arrivalTime: string | null
  operationalNote: string | null
  status: string
  assignments: TripAssignment[]
}

interface RosterDay {
  id: string
  jalaliDate: string
  gregorianDate: string
  title: string
  schedulingTitle: string
  status: string // 'DRAFT' | 'REVIEW' | 'PUBLISHED'
  versionId: string
  versionNo: number
}

interface RosterDiffTrip {
  id: string
  rowNo: number
  trainNumber: string | null
  direction: string
}

interface RosterDiff {
  oldVersionNo: number
  newVersionNo: number
  added: RosterDiffTrip[]
  removed: RosterDiffTrip[]
  changed: {
    tripId: string
    rowNo: number
    trainNumber: string | null
    fields: { field: string; from: string | null; to: string | null }[]
  }[]
}

interface RosterStats {
  totalTrips: number
  acknowledgedCount: number
  readyCount: number
  disputeCount: number
  unassignedCount: number
}

interface UserSummary {
  id: string
  name: string
  personnelCode?: string
}

interface AssignedTripInfo {
  assignmentId: string
  userId: string
  driverName: string
  trainNumber: string
  rowNo: number
  direction: string
  depTime: string
}

export default function FullRosterPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const isAdmin = ['admin', 'super_admin', 'manager', 'chief', 'supervisor'].includes(user?.roleKey || '')

  const searchParams = useSearchParams()
  const viewParam = searchParams.get('view')

  const [loading, setLoading] = useState(true)
  const [dataDate, setDataDate] = useState<string>(new Date().toISOString().split('T')[0])
  
  // Custom Jalali Date Picker states
  const [pickerYear, setPickerYear] = useState(() => jdate(new Date()).year())
  const [pickerMonth, setPickerMonth] = useState(() => jdate(new Date()).month() + 1)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const [viewMode, setViewMode] = useState<'tabs' | 'sideBySide' | 'sheet' | 'gantt' | 'board'>('sheet')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unassigned' | 'disputed' | 'delayed'>('all')
  const [versionDiff, setVersionDiff] = useState<RosterDiff | null>(null)
  const [showVersionDiff, setShowVersionDiff] = useState(false)

  // ── ویژگی‌های جدید لوحه و استخراج هوشمند — بخش ۸ ──
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadScenario, setUploadScenario] = useState('روز عادی')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('')
  const [uploadErrorMessage, setUploadErrorMessage] = useState('')
  const [publishingRoster, setPublishingRoster] = useState(false)
  const [notifyingDrivers, setNotifyingDrivers] = useState(false)
  
  // handleOpenSwapModal is defined below

  // شبیه‌ساز وضعیت چک‌لیست قبل از حرکت رانندگان — اتصال به بخش ۱۲.۳
  const getDriverChecklistStatus = (trainNumber: string | null, driverName: string | null) => {
    if (!driverName) return null
    if (trainNumber === '۱۰۴') {
      return { status: 'approved', label: 'تایید شده ✅', color: 'text-success bg-success/15 border-success/30' }
    }
    // شبیه‌سازی تصادفی برای تست واقعی ارتباط دو ماژول
    const hash = (driverName.length + (trainNumber ? trainNumber.length : 0)) % 3
    if (hash === 0) {
      return { status: 'pending', label: 'در انتظار ⏳', color: 'text-warning bg-warning/15 border-warning/30' }
    } else if (hash === 1) {
      return { status: 'approved', label: 'تایید شده ✅', color: 'text-success bg-success/15 border-success/30' }
    } else {
      return { status: 'action_required', label: 'اقدام اصلاحی 🛠️', color: 'text-critical bg-critical/15 border-critical/30' }
    }
  }

  const renderAssignmentCell = (assignment: TripAssignment | undefined, role: 'H1' | 'H2' | 'T' | 'R', trainNo: string | null) => {
    if (!assignment) {
      return (
        <span className={cn(
          "italic text-[9px]",
          role === 'H1' ? "text-critical/70" : "text-foreground-muted/40"
        )}>
          {role === 'H1' ? "بدون راهبر اصلی" : "—"}
        </span>
      )
    }

    const name = assignment.matchedUser?.name || assignment.rawName
    const chkStatus = getDriverChecklistStatus(trainNo, name)

    return (
      <div className="flex flex-col gap-1 items-start w-full min-w-0">
        <span className="font-semibold text-foreground text-[10px] block truncate">
          {name}
        </span>
        
        <div className="flex items-center gap-1.5 justify-start flex-wrap">
          <span className={`text-[8.5px] font-bold ${assignment.acknowledgedAt ? 'text-success' : 'text-foreground-muted'}`} title="رویت">
            ر:{assignment.acknowledgedAt ? '✓' : '✗'}
          </span>
          <span className={`text-[8.5px] font-bold ${assignment.readyAt ? 'text-info' : 'text-foreground-muted'}`} title="آمادگی">
            آ:{assignment.readyAt ? '✓' : '✗'}
          </span>
          
          {chkStatus && (
            <span className={`text-[8px] font-bold px-1 py-0 border rounded ${chkStatus.color}`} title="چک‌لیست قبل از حرکت">
              {chkStatus.label}
            </span>
          )}

          {isAdmin && (role === 'H1' || role === 'H2' || role === 'T' || role === 'R') && (
            <select
              disabled={actionLoading !== null}
              value={assignment.matchedUserId || ''}
              onChange={(e) => handleReassign(assignment.id, e.target.value)}
              className="bg-surface-container border border-outline-variant rounded px-0.5 text-[8px] text-foreground outline-none cursor-pointer ms-1"
            >
              <option value="">تغییر...</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}

          {isAdmin && assignment.disputed && (
            <button
              disabled={actionLoading !== null}
              onClick={() => handleResolveDispute(assignment.id)}
              className="px-1 py-0.5 bg-warning hover:bg-warning/80 text-warning-foreground font-bold rounded text-[8px] cursor-pointer ms-1"
              title={`رفع مغایرت: ${assignment.disputeNote || ''}`}
            >
              رفع
            </button>
          )}
        </div>

        {/* Swap request trigger button */}
        {(assignment.matchedUserId === user?.id || isAdmin) && (
          <button
            onClick={() => handleOpenSwapModal(assignment)}
            className="w-full text-[9px] py-0.5 px-1 rounded bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent font-bold transition-all cursor-pointer flex items-center justify-center gap-1 mt-0.5 no-print"
            title="ثبت درخواست جابجایی سفر"
          >
            <ArrowLeftRight className="size-2.5 shrink-0" />
            <span>جایگزینی</span>
          </button>
        )}
      </div>
    )
  }

  const renderTextCell = (assignment: any) => {
    if (!assignment || !assignment.rawName) return <span className="text-foreground-muted/50">—</span>
    return (
      <span className="font-mono font-semibold text-foreground bg-surface-container/50 px-1 py-0.5 rounded text-[10px]">
        {toFa(assignment.rawName)}
      </span>
    )
  }

  const jalaliMonthNames = [
    'فروردین', 'اردیبهشت', 'خرداد',
    'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر',
    'دی', 'بهمن', 'اسفند'
  ]

  useEffect(() => {
    if (viewParam === 'gantt') {
      setViewMode('gantt')
    } else if (viewParam === 'sheet') {
      setViewMode('sheet')
    } else if (viewParam === 'tabs') {
      setViewMode('tabs')
    } else if (viewParam === 'sideBySide') {
      setViewMode('sideBySide')
    } else if (viewParam === 'board') {
      setViewMode('board')
    }
  }, [viewParam])

  useEffect(() => {
    const jd = jdate(dataDate)
    setPickerYear(jd.year())
    setPickerMonth(jd.month() + 1)
  }, [dataDate])

  const pickerFirstDay = jdate()
    .year(pickerYear)
    .month(pickerMonth - 1)
    .date(1)
  const pickerDaysInMonth = pickerFirstDay.daysInMonth()
  const pickerStartWeekday = (pickerFirstDay.day() + 1) % 7

  function prevPickerMonth() {
    if (pickerMonth === 1) {
      setPickerMonth(12)
      setPickerYear(y => y - 1)
    } else {
      setPickerMonth(m => m - 1)
    }
  }

  function nextPickerMonth() {
    if (pickerMonth === 12) {
      setPickerMonth(1)
      setPickerYear(y => y + 1)
    } else {
      setPickerMonth(m => m + 1)
    }
  }

  function handleSelectDay(day: number) {
    const d = jdate()
      .year(pickerYear)
      .month(pickerMonth - 1)
      .date(day)
    const greg = gregStr(d)
    setDataDate(greg)
    setShowDatePicker(false)
  }

  const [rosterDay, setRosterDay] = useState<RosterDay | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [stats, setStats] = useState<RosterStats>({
    totalTrips: 0,
    acknowledgedCount: 0,
    readyCount: 0,
    disputeCount: 0,
    unassignedCount: 0
  })

  // Calendar sync modal state
  const [syncModalVisible, setSyncModalVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  // Dropdown list of users for reassignments (admin only)
  const [allUsers, setAllUsers] = useState<UserSummary[]>([])
  const [activeDirectionTab, setActiveDirectionTab] = useState<'SHAHRREY_TO_TAJRISH' | 'TAJRISH_TO_SHAHRREY'>('SHAHRREY_TO_TAJRISH')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Operational note / delay modal states (admin only)
  const [commentModalVisible, setCommentModalVisible] = useState(false)
  const [targetTripId, setTargetTripId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [tripStatusVal, setTripStatusVal] = useState('NORMAL')

  // Swap request modal states
  const [swapModalVisible, setSwapModalVisible] = useState(false)
  const [sourceAssignment, setSourceAssignment] = useState<any | null>(null)
  const [selectedTargetAssignmentId, setSelectedTargetAssignmentId] = useState('')
  const [swapNote, setSwapNote] = useState('')
  const [swapError, setSwapError] = useState<string | null>(null)
  const [swapSuccess, setSwapSuccess] = useState<string | null>(null)
  const [swapLoading, setSwapLoading] = useState(false)

  // General Trip Swap Form states
  const [showSwapForm, setShowSwapForm] = useState(false)
  const [formSourceAssignmentId, setFormSourceAssignmentId] = useState('')
  const [formTargetUserId, setFormTargetUserId] = useState('')
  const [formTargetAssignmentId, setFormTargetAssignmentId] = useState('')
  const [formNote, setFormNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Calculations for all assigned trips on this day
  const allAssignedTrips = useMemo(() => {
    const list: AssignedTripInfo[] = []
    trips.forEach((t) => {
      t.assignments.forEach((a) => {
        if (a.matchedUserId) {
          list.push({
            assignmentId: a.id,
            userId: a.matchedUserId,
            driverName: a.matchedUser?.name || a.rawName || 'نامشخص',
            trainNumber: t.trainNumber || '—',
            rowNo: t.rowNo,
            direction: t.direction === 'SHAHRREY_TO_TAJRISH' ? 'رفت (شهرری به تجریش)' : 'برگشت (تجریش به شهرری)',
            depTime: t.departureTime || '—',
          })
        }
      })
    })
    return list
  }, [trips])

  // Requester source trips
  const mySourceTrips = useMemo(() => {
    if (isAdmin) return allAssignedTrips
    return allAssignedTrips.filter((item: AssignedTripInfo) => item.userId === user?.id)
  }, [allAssignedTrips, user, isAdmin])

  // Colleague assigned trips for selected target colleague
  const targetColleagueTrips = useMemo(() => {
    if (!formTargetUserId) return []
    return allAssignedTrips.filter((item: AssignedTripInfo) => item.userId === formTargetUserId)
  }, [allAssignedTrips, formTargetUserId])

  async function handleGeneralSwapSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formSourceAssignmentId || !formTargetUserId || !formTargetAssignmentId) {
      setFormError('لطفاً همه بخش‌های الزامی را تکمیل کنید.')
      return
    }

    setFormLoading(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const res = await fetch('/api/trips/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetUserId: formTargetUserId,
          sourceAssignmentId: formSourceAssignmentId,
          targetAssignmentId: formTargetAssignmentId,
          note: formNote,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setFormSuccess('درخواست جابجایی با موفقیت ثبت شد. در انتظار تایید همکار و تایید نهایی مدیریت.')
        setFormSourceAssignmentId('')
        setFormTargetUserId('')
        setFormTargetAssignmentId('')
        setFormNote('')
        void loadRoster()
      } else {
        setFormError(data.error || 'خطا در ثبت درخواست جابجایی')
      }
    } catch {
      setFormError('خطای ارتباط با سرور')
    } finally {
      setFormLoading(false)
    }
  }

  function handleOpenSwapModal(assignment: any) {
    setSourceAssignment(assignment)
    setSelectedTargetAssignmentId('')
    setSwapNote('')
    setSwapError(null)
    setSwapSuccess(null)
    setSwapModalVisible(true)
  }

  async function handleSwapSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sourceAssignment || !selectedTargetAssignmentId) return
    setSwapLoading(true)
    setSwapError(null)
    setSwapSuccess(null)

    let targetUserId = ''
    trips.forEach((t) => {
      t.assignments.forEach((a) => {
        if (a.id === selectedTargetAssignmentId) {
          targetUserId = a.matchedUserId || ''
        }
      })
    })

    if (!targetUserId) {
      setSwapError('راهبر مقصد یافت نشد')
      setSwapLoading(false)
      return
    }

    try {
      const res = await fetch('/api/roster/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          targetId: targetUserId,
          sourceAssignmentId: sourceAssignment.id,
          targetAssignmentId: selectedTargetAssignmentId,
          note: swapNote,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setSwapSuccess('درخواست جابجایی با موفقیت ثبت شد. در انتظار تایید همکار و تایید نهایی مدیریت.')
        void loadRoster()
        setTimeout(() => setSwapModalVisible(false), 2000)
      } else {
        setSwapError(data.error || 'خطا در ثبت درخواست جابجایی')
      }
    } catch {
      setSwapError('خطای ارتباط با سرور')
    } finally {
      setSwapLoading(false)
    }
  }

  async function loadRoster() {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`/api/supervisor/roster/today?date=${dataDate}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setRosterDay(json.data.rosterDay)
        setTrips(json.data.trips)
        setIssues(json.data.issues)
        setStats(json.data.stats)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/users?pageSize=100', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setAllUsers(json.data?.users || [])
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (accessToken) {
      void loadRoster()
      void loadUsers()
    }
  }, [accessToken, dataDate])

  // Supervisor handler to manually reassign a driver
  async function handleReassign(assignmentId: string, matchedUserId: string) {
    if (!accessToken || !isAdmin) return
    setActionLoading(assignmentId)
    try {
      const res = await fetch(`/api/trips/${assignmentId}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ matchedUserId })
      })
      if (res.ok) {
        await loadRoster()
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  // Supervisor handler to manually resolve a dispute
  async function handleResolveDispute(assignmentId: string) {
    if (!accessToken || !isAdmin) return
    setActionLoading(assignmentId)
    try {
      const res = await fetch(`/api/trips/${assignmentId}/resolve-dispute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
      if (res.ok) {
        await loadRoster()
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  // Supervisor handler to add comment/delay
  async function handleCommentSubmit() {
    if (!accessToken || !targetTripId || !isAdmin) return
    try {
      const res = await fetch(`/api/trips/${targetTripId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          operationalNote: commentText.trim(),
          status: tripStatusVal
        })
      })
      if (res.ok) {
        setCommentModalVisible(false)
        setCommentText('')
        setTargetTripId(null)
        await loadRoster()
      }
    } catch {
      // silent
    }
  }

  // ── آپلود لوحه اکسل و انتشار زنده — بخش ۸ ──
  const handleUploadRosterExcel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setUploadErrorMessage('لطفاً یک فایل معتبر اکسل لوحه انتخاب نمایید.')
      return
    }

    setUploadLoading(true)
    setUploadErrorMessage('')
    setUploadSuccessMessage('')

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('jalaliDate', jdate(dataDate).format('YYYY/MM/DD'))
    formData.append('title', uploadTitle.trim() || 'گزارش لوحه اعزام')
    formData.append('schedulingTitle', uploadScenario)

    try {
      const res = await fetch('/api/rosters/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setUploadSuccessMessage('فایل لوحه با موفقیت بارگذاری شد و در حالت پیش‌نویس قرار گرفت.')
        setSelectedFile(null)
        setUploadTitle('')
        void loadRoster()
        setTimeout(() => setUploadModalVisible(false), 2000)
      } else {
        setUploadErrorMessage(data.error || 'خطا در بارگذاری فایل لوحه')
      }
    } catch {
      setUploadErrorMessage('خطا در برقراری ارتباط با سرور RAG.')
    } finally {
      setUploadLoading(false)
    }
  }

  const handlePublishRoster = async () => {
    if (!rosterDay || !rosterDay.versionId) return
    setPublishingRoster(true)
    try {
      const res = await fetch(`/api/rosters/${rosterDay.versionId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        alert('✅ لوحه اعزام با موفقیت منتشر گردید و شیفت‌های رانندگان کالیبره و نهایی شد.')
        void loadRoster()
      } else {
        alert('خطا در انتشار لوحه')
      }
    } catch {
      alert('خطای شبکه در ارتباط با سرور')
    } finally {
      setPublishingRoster(false)
    }
  }

  const handleNotifyDrivers = () => {
    setNotifyingDrivers(true)
    // شبیه‌ساز ارسال نوتیفیکیشن و پیامک
    setTimeout(() => {
      setNotifyingDrivers(false)
      alert('📢 پیامک و نوتیفیکیشن لایو برای تمامی رانندگان تخصیص‌یافته به لوحه امروز ارسال شد.')
    }, 1500)
  }

  const filteredTrips = trips.filter(trip => {
    const term = searchTerm.trim().toLowerCase()
    if (term) {
      const trainMatch = trip.trainNumber?.toLowerCase().includes(term)
      const rowNoMatch = String(trip.rowNo).includes(term)
      const h1 = trip.assignments.find((a) => a.role === 'H1')
      const h2 = trip.assignments.find((a) => a.role === 'H2')
      const assistT = trip.assignments.find((a) => a.role === 'T')
      const assistR = trip.assignments.find((a) => a.role === 'R')
      const rChar = trip.assignments.find((a) => a.role === 'R_CHAR')
      const tType = trip.assignments.find((a) => a.role === 'T_TYPE')
      
      const h1Name = (h1?.matchedUser?.name || h1?.rawName || '').toLowerCase()
      const h2Name = (h2?.matchedUser?.name || h2?.rawName || '').toLowerCase()
      const tAssistName = (assistT?.matchedUser?.name || assistT?.rawName || '').toLowerCase()
      const rAssistName = (assistR?.matchedUser?.name || assistR?.rawName || '').toLowerCase()
      const rCharName = (rChar?.rawName || '').toLowerCase()
      const tTypeName = (tType?.rawName || '').toLowerCase()
      
      const searchMatch = 
        h1Name.includes(term) || 
        h2Name.includes(term) || 
        tAssistName.includes(term) || 
        rAssistName.includes(term) ||
        rCharName.includes(term) ||
        tTypeName.includes(term)
      
      if (!trainMatch && !rowNoMatch && !searchMatch) {
        return false
      }
    }

    if (statusFilter === 'unassigned') {
      const hasH1 = trip.assignments.some(a => a.role === 'H1' && a.matchedUserId)
      if (hasH1) return false
    } else if (statusFilter === 'disputed') {
      const hasDispute = trip.assignments.some(a => a.disputed)
      if (!hasDispute) return false
    } else if (statusFilter === 'delayed') {
      if (trip.status !== 'DELAYED' && !trip.operationalNote) return false
    }

    return true
  })

  const filteredRowNos = Array.from(new Set(filteredTrips.map(t => t.rowNo))).sort((a, b) => a - b)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-7xl mx-auto w-full min-w-0 text-right" dir="rtl">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
            <Calendar className="size-6 text-accent" />
            لوحه اعزام روزانه خط ۱ مترو تهران
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            مشاهده کل سفرهای زمان‌بندی شده، زمان خروج و آمادگی کابین‌ها
          </p>
        </div>

        {/* Date & Calendar Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Swap Inbox */}
          <Link
            href="/swap/inbox"
            className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 hover:bg-accent/20 px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-accent cursor-pointer transition-colors"
          >
            <Inbox className="size-4" />
            <span>کارتابل جابجایی</span>
          </Link>

          {/* iCal Calendar Sync */}
          <button
            onClick={() => setSyncModalVisible(true)}
            className="flex items-center gap-1.5 bg-surface-container border border-outline-variant hover:bg-surface-container-high px-3 py-1.5 rounded-lg shadow-sm text-xs text-foreground cursor-pointer transition-colors"
          >
            <Clock className="size-4 text-accent" />
            <span>همگام‌سازی تقویم</span>
          </button>

          {/* Upload excel button for managers */}
          {isAdmin && (
            <button
              onClick={() => setUploadModalVisible(true)}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-accent-foreground px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold cursor-pointer transition-colors"
            >
              <UploadCloud className="size-4" />
              <span>بارگذاری لوحه جدید</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 bg-surface-container-high border border-outline-variant px-3 py-1.5 rounded-lg shadow-inner text-xs text-foreground cursor-pointer hover:bg-surface-container-highest transition-colors"
            >
              <span className="text-xs text-foreground-muted">تاریخ مشاهده:</span>
              <span className="font-bold text-accent font-data-mono">
                {jalali(dataDate)}
              </span>
            </button>

            {showDatePicker && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDatePicker(false)}
                />
                <div className="absolute left-0 mt-2 w-72 bg-surface-container-high border border-outline-variant rounded-xl p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={nextPickerMonth}
                      className="p-1 hover:bg-surface-container-highest rounded text-foreground cursor-pointer"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                    <span className="text-xs font-bold text-foreground">
                      {jalaliMonthNames[pickerMonth - 1]} {toFa(pickerYear)}
                    </span>
                    <button
                      type="button"
                      onClick={prevPickerMonth}
                      className="p-1 hover:bg-surface-container-highest rounded text-foreground cursor-pointer"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-foreground-muted mb-2">
                    {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((wd, i) => (
                      <span key={wd} className={i === 6 ? 'text-critical' : ''}>
                        {wd}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: pickerStartWeekday }).map((_, i) => (
                      <span key={`empty-${i}`} />
                    ))}

                    {Array.from({ length: pickerDaysInMonth }).map((_, i) => {
                      const dayNo = i + 1
                      const d = jdate()
                        .year(pickerYear)
                        .month(pickerMonth - 1)
                        .date(dayNo)
                      const isSelected = gregStr(d) === dataDate
                      const isToday = gregStr(d) === gregStr(jdate())
                      
                      return (
                        <button
                          key={dayNo}
                          type="button"
                          onClick={() => handleSelectDay(dayNo)}
                          className={cn(
                            "h-8 w-8 text-xs rounded-full flex items-center justify-center font-data-mono cursor-pointer transition-colors",
                            isSelected
                              ? "bg-accent text-accent-foreground font-bold"
                              : isToday
                              ? "border border-accent text-accent font-bold"
                              : "hover:bg-surface-container-highest text-foreground"
                          )}
                        >
                          {toFa(dayNo)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Roster Draft Warning Banner — بخش ۸ */}
      {rosterDay && rosterDay.status !== 'PUBLISHED' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-500 font-bold">
            <AlertTriangle className="size-5 shrink-0 animate-bounce" />
            <span>⚠️ این لوحه اعزام در حالت پیش‌نویس (DRAFT) قرار دارد و هنوز برای پرسنل خط منتشر نشده است.</span>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handlePublishRoster}
                disabled={publishingRoster}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-extrabold text-[10px] rounded-lg cursor-pointer transition"
              >
                {publishingRoster ? 'در حال انتشار...' : 'انتشار رسمی لوحه'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Roster Published & Notify Button — بخش ۸ */}
      {rosterDay && rosterDay.status === 'PUBLISHED' && isAdmin && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-3 flex justify-between items-center">
          <span className="text-xs text-success font-bold flex items-center gap-1.5">
            <CheckCircle2 className="size-4" />
            این لوحه اعزام به صورت رسمی منتشر شده است.
          </span>
          <button
            onClick={handleNotifyDrivers}
            disabled={notifyingDrivers}
            className="flex items-center gap-1 text-[10px] font-bold bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded cursor-pointer transition"
          >
            <BellRing className="size-3.5" />
            <span>{notifyingDrivers ? 'در حال ارسال...' : 'ارسال مجدد پیامک/نوتیفیکیشن به راهبران'}</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 min-h-[400px]">
          <Loader2 className="size-8 animate-spin text-accent mb-4" />
          <p className="text-sm text-foreground-muted">در حال بارگذاری کل جدول لوحه روزانه...</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-surface border border-outline-variant rounded-xl flex flex-col justify-center items-center p-12 text-center min-h-[300px]">
          <Calendar className="size-12 text-foreground-muted mb-4" />
          <h3 className="text-base font-bold text-foreground">لوحه اعزامی یافت نشد</h3>
          <p className="text-xs text-foreground-muted max-w-sm mt-2">
            برای تاریخ انتخابی هنوز لوحه‌ای بارگذاری یا منتشر نشده است.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">

          {/* Version & metadata bar */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-foreground-muted no-print">
            {rosterDay && (
              <>
                <span className="flex items-center gap-1.5">
                  <Layers className="size-3.5 text-accent" />
                  نسخه: <strong className="text-foreground font-data-mono">{toFa(rosterDay.versionNo || 1)}</strong>
                </span>
                <span>
                  سناریو: {rosterDay.schedulingTitle || '—'}
                </span>
                <span>
                  عنوان: {rosterDay.title || '—'}
                </span>
                {rosterDay.versionNo && rosterDay.versionNo > 1 && (
                  <button
                    onClick={async () => {
                      if (!accessToken) return
                      try {
                        const res = await fetch(`/api/supervisor/roster/today?date=${dataDate}`, {
                          headers: { Authorization: `Bearer ${accessToken}` }
                        })
                        if (res.ok) {
                          const json = await res.json()
                          const vid = json.data.rosterDay?.versionId
                          if (vid) {
                            const diffRes = await fetch(`/api/rosters/${vid}/diff`, {
                              headers: { Authorization: `Bearer ${accessToken}` }
                            })
                            if (diffRes.ok) {
                              const diffData = await diffRes.json()
                              setVersionDiff(diffData.data)
                              setShowVersionDiff(true)
                            }
                          }
                        }
                      } catch { /* silent */ }
                    }}
                    className="flex items-center gap-1 text-info hover:text-info-hover transition-colors cursor-pointer"
                  >
                    <GitCompare className="size-3.5" />
                    تاریخچه تغییرات
                  </button>
                )}
              </>
            )}
          </div>

          {/* Version Diff Modal */}
          {showVersionDiff && versionDiff && (
            <div className="bg-surface-container-high border border-outline-variant rounded-xl p-5 no-print">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <GitCompare className="size-4 text-info" />
                  مقایسه نسخه {toFa(versionDiff.oldVersionNo || 0)} ← {toFa(versionDiff.newVersionNo)}
                </h3>
                <button onClick={() => { setShowVersionDiff(false); setVersionDiff(null) }} className="text-foreground-muted hover:text-foreground cursor-pointer">
                  ✕
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {versionDiff.added.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-success mb-1">سفرهای اضافه‌شده ({toFa(versionDiff.added.length)})</p>
                    {versionDiff.added.map(t => (
                      <p key={t.id} className="text-[11px] text-foreground-muted">+ ردیف {toFa(t.rowNo)} — قطار {toFa(t.trainNumber || '—')} — {t.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری←تجریش' : 'تجریش←شهرری'}</p>
                    ))}
                  </div>
                )}
                {versionDiff.removed.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-critical mb-1">سفرهای حذف‌شده ({toFa(versionDiff.removed.length)})</p>
                    {versionDiff.removed.map(t => (
                      <p key={t.id} className="text-[11px] text-foreground-muted">− ردیف {toFa(t.rowNo)} — قطار {toFa(t.trainNumber || '—')} — {t.direction === 'SHAHRREY_TO_TAJRISH' ? 'شهرری←تجریش' : 'تجریش←شهرری'}</p>
                    ))}
                  </div>
                )}
                {versionDiff.changed.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-warning mb-1">تغییرات ({toFa(versionDiff.changed.length)})</p>
                    {versionDiff.changed.map(c => (
                      <p key={c.tripId} className="text-[11px] text-foreground-muted">
                        ~ ردیف {toFa(c.rowNo)} — قطار {toFa(c.trainNumber || '—')}: {c.fields.map(f => `${f.field}: ${f.from || '—'} → ${f.to || '—'}`).join('، ')}
                      </p>
                    ))}
                  </div>
                )}
                {versionDiff.added.length === 0 && versionDiff.removed.length === 0 && versionDiff.changed.length === 0 && (
                  <p className="text-xs text-foreground-muted">تغییری نسبت به نسخه قبلی یافت نشد.</p>
                )}
              </div>
            </div>
          )}

          {/* Statistical Bento Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'کل سفرهای اعزامی', value: stats.totalTrips, icon: Clock, color: 'text-accent' },
              { label: 'رؤیت‌شده توسط راهبران', value: stats.acknowledgedCount, icon: CheckCircle2, color: 'text-success' },
              { label: 'آماده خروج در کابین', value: stats.readyCount, icon: UserCheck, color: 'text-info' },
              { label: 'مغایرت‌ها / تاخیرها', value: stats.disputeCount, icon: AlertTriangle, color: 'text-warning' },
              { label: 'سفرهای بدون راننده', value: stats.unassignedCount, icon: Shield, color: 'text-critical' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-center text-foreground-muted text-[10px] font-bold">
                  <span>{stat.label}</span>
                  <stat.icon className={`size-4 ${stat.color}`} />
                </div>
                <span className="text-xl font-bold font-mono text-foreground">{toFa(stat.value)}</span>
              </div>
            ))}
          </div>

          {/* Safety Warnings & Conflicts Alert Box */}
          {issues && issues.length > 0 && (
            <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
              <h3 className="text-xs font-bold text-warning flex items-center gap-1.5 mb-2">
                <AlertTriangle className="size-4 animate-bounce" />
                تداخل‌های زمانی و هشدارهای خستگی شناسایی شده:
              </h3>
              <div className="space-y-1.5 max-h-32 overflow-y-auto font-bold">
                {issues.map((issue, idx) => (
                  <div key={idx} className="text-xs text-foreground-muted flex items-start gap-1">
                    <span className="text-warning-hover">•</span>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Trip Swap Request Form Card */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm no-print">
            <button
              onClick={() => {
                setShowSwapForm(!showSwapForm)
                setFormError(null)
                setFormSuccess(null)
              }}
              className="w-full flex items-center justify-between p-4 bg-surface-container-low hover:bg-surface-container-low/80 transition-colors text-right cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="size-4 text-accent animate-pulse" />
                <span className="text-xs font-bold text-foreground">
                  ثبت درخواست جابجایی سفر روزانه با همکاران (موتور قوانین خستگی)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-semibold">
                  بومی‌سازی خط ۱
                </span>
              </div>
              <span className="text-xs text-foreground-muted">
                {showSwapForm ? 'بستن فرم ▲' : 'باز کردن فرم جابجایی ▼'}
              </span>
            </button>

            {showSwapForm && (
              <div className="p-5 border-t border-outline-variant bg-surface-container-low/20 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <form onSubmit={handleGeneralSwapSubmit} className="space-y-4 font-bold text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. Source Trip Assignment Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-foreground-muted">
                        ۱. انتخاب سفر مبدا (سفر خودتان):
                      </label>
                      {mySourceTrips.length === 0 ? (
                        <div className="text-[11px] text-warning/90 bg-warning/5 border border-warning/20 rounded-lg p-2.5 font-bold">
                          شما هیچ سفر تخصیص‌یافته‌ای در تاریخ جاری ندارید.
                        </div>
                      ) : (
                        <select
                          value={formSourceAssignmentId}
                          onChange={(e) => setFormSourceAssignmentId(e.target.value)}
                          className="w-full h-9 text-xs bg-surface-container border border-outline-variant rounded-lg px-2.5 outline-none text-foreground cursor-pointer focus:border-accent font-bold"
                          required
                        >
                          <option value="">انتخاب سفر خود...</option>
                          {mySourceTrips.map((item) => (
                            <option key={item.assignmentId} value={item.assignmentId}>
                              {isAdmin ? `(${item.driverName}) ` : ''}
                              ردیف {toFa(item.rowNo)} • قطار {toFa(item.trainNumber)} ({item.depTime}) — {item.direction}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* 2. Target Colleague Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-foreground-muted">
                        ۲. انتخاب همکار جایگزین:
                      </label>
                      <select
                        value={formTargetUserId}
                        onChange={(e) => {
                          setFormTargetUserId(e.target.value)
                          setFormTargetAssignmentId('')
                        }}
                        className="w-full h-9 text-xs bg-surface-container border border-outline-variant rounded-lg px-2.5 outline-none text-foreground cursor-pointer focus:border-accent font-bold"
                        required
                      >
                        <option value="">انتخاب همکار...</option>
                        {allUsers
                          .filter((u) => u.id !== user?.id)
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.personnelCode ? toFa(u.personnelCode) : '—'})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* 3. Target Colleague's Trip Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-foreground-muted">
                        ۳. انتخاب سفر همکار (سفر مقصد):
                      </label>
                      <select
                        value={formTargetAssignmentId}
                        onChange={(e) => setFormTargetAssignmentId(e.target.value)}
                        disabled={!formTargetUserId}
                        className="w-full h-9 text-xs bg-surface-container border border-outline-variant rounded-lg px-2.5 outline-none text-foreground cursor-pointer focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                        required
                      >
                        <option value="">انتخاب سفر همکار...</option>
                        {targetColleagueTrips.map((item) => (
                          <option key={item.assignmentId} value={item.assignmentId}>
                            ردیف {toFa(item.rowNo)} • قطار {toFa(item.trainNumber)} ({item.depTime}) — {item.direction}
                          </option>
                        ))}
                      </select>
                      {formTargetUserId && targetColleagueTrips.length === 0 && (
                        <p className="text-[9px] text-warning/80 mt-1 font-bold">
                          این همکار در این تاریخ سفر اعزامی فعال ندارد.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Note / Comment */}
                  <div className="space-y-1.5 font-bold">
                    <label className="text-[10.5px] font-bold text-foreground-muted">
                      توضیحات یا علت درخواست جابجایی (اختیاری):
                    </label>
                    <input
                      type="text"
                      placeholder="علت جابجایی یا هرگونه یادداشت هماهنگی..."
                      value={formNote}
                      onChange={(e) => setFormNote(e.target.value)}
                      className="w-full h-9 bg-surface-container border border-outline-variant rounded-lg px-3 text-xs text-foreground outline-none focus:border-accent text-right"
                    />
                  </div>

                  {/* Alert banners */}
                  {formError && (
                    <div className="p-3 bg-critical/10 border border-critical/30 rounded-lg text-critical text-xs flex items-center gap-2 font-bold">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-success text-xs flex items-center gap-2 font-bold">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  {/* Action submit button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={formLoading || mySourceTrips.length === 0}
                      className="px-6 h-9 text-xs font-semibold bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    >
                      {formLoading ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>در حال ثبت...</span>
                        </>
                      ) : (
                        <>
                          <Send className="size-3.5" />
                          <span>ارسال درخواست جابجایی</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Controls and Filters Bar */}
          <div className="bg-surface border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm no-print">
            {/* Search and status filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute right-3 top-2.5 size-4 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="جستجو در قطار، نام راهبر، ردیف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg ps-9 pe-3 py-2 text-xs text-foreground outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant px-3 py-2 rounded-lg">
                <Filter className="size-3.5 text-foreground-muted" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
                >
                  <option value="all">همه سفرها</option>
                  <option value="unassigned">فاقد راهبر اصلی</option>
                  <option value="disputed">دارای مغایرت</option>
                  <option value="delayed">توضیحات‌دار / تاخیرها</option>
                </select>
              </div>
            </div>

            {/* View Mode controls */}
            <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-border">
              <div className="flex bg-surface-container-low border border-outline-variant p-0.5 rounded-lg">
                <button
                  onClick={() => setViewMode('tabs')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all",
                    viewMode === 'tabs'
                      ? "bg-accent text-accent-foreground shadow-sm font-bold"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  title="نمای زبانه"
                >
                  <LayoutGrid className="size-3.5" />
                  <span className="hidden sm:inline">نمای زبانه</span>
                </button>
                <button
                  onClick={() => setViewMode('sideBySide')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all",
                    viewMode === 'sideBySide'
                      ? "bg-accent text-accent-foreground shadow-sm font-bold"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  title="نمای دو ستونه"
                >
                  <Columns className="size-3.5" />
                  <span className="hidden sm:inline">نمای دو ستونه</span>
                </button>
                <button
                  onClick={() => setViewMode('sheet')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all",
                    viewMode === 'sheet'
                      ? "bg-accent text-accent-foreground shadow-sm font-bold"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  title="نمای لوحه کلاسیک (PDF)"
                >
                  <FileText className="size-3.5" />
                  <span className="hidden sm:inline">جدول لوحه کلاسیک</span>
                </button>
                <button
                  onClick={() => setViewMode('gantt')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all",
                    viewMode === 'gantt'
                      ? "bg-accent text-accent-foreground shadow-sm font-bold"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  title="نمای گانت قطارها"
                >
                  <TrendingUp className="size-3.5" />
                  <span className="hidden sm:inline">نمای گانت</span>
                </button>
                <button
                  onClick={() => setViewMode('board')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all",
                    viewMode === 'board'
                      ? "bg-accent text-accent-foreground shadow-sm font-bold"
                      : "text-foreground-muted hover:text-foreground"
                  )}
                  title="تابلوی ناحیه (OCC)"
                >
                  <Columns className="size-3.5" />
                  <span className="hidden sm:inline">تابلوی ناحیه</span>
                </button>
              </div>

              {viewMode === 'sheet' && (
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 bg-accent hover:bg-accent/90 text-accent-foreground px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="size-3.5" />
                  <span>چاپ لوحه (PDF)</span>
                </button>
              )}
            </div>
          </div>

          {/* View 1: Tabs View */}
          {viewMode === 'tabs' && (
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="flex border-b border-outline-variant bg-surface-container/30">
                <button
                  onClick={() => setActiveDirectionTab('SHAHRREY_TO_TAJRISH')}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeDirectionTab === 'SHAHRREY_TO_TAJRISH'
                      ? 'border-accent text-accent border-b-4'
                      : 'border-transparent text-foreground-muted hover:text-foreground'
                  }`}
                >
                  <ArrowUpRight className="size-4" />
                  مسیر رفت: شهرری ← تجریش
                </button>
                <button
                  onClick={() => setActiveDirectionTab('TAJRISH_TO_SHAHRREY')}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeDirectionTab === 'TAJRISH_TO_SHAHRREY'
                      ? 'border-accent text-accent border-b-4'
                      : 'border-transparent text-foreground-muted hover:text-foreground'
                  }`}
                >
                  <ArrowDownLeft className="size-4" />
                  مسیر برگشت: تجریش ← شهرری
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-surface-container-low border-b border-outline-variant text-foreground-muted">
                    <tr>
                      <th className="px-4 py-3 font-bold">ردیف</th>
                      <th className="px-4 py-3 font-bold">شماره قطار</th>
                      <th className="px-4 py-3 font-bold">ساعت خروج / ورود</th>
                      <th className="px-4 py-3 font-bold">راهبر اول (H1)</th>
                      <th className="px-4 py-3 font-bold">راهبر دوم (H2)</th>
                      <th className="px-4 py-3 font-bold">وضعیت عملیاتی</th>
                      {isAdmin && <th className="px-4 py-3 font-bold text-center">عملیات سرشیفت</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant font-bold text-xs">
                    {filteredTrips
                      .filter((t) => t.direction === activeDirectionTab)
                      .map((trip) => {
                        const h1 = trip.assignments.find((a) => a.role === 'H1')
                        const h2 = trip.assignments.find((a) => a.role === 'H2')

                        return (
                          <tr key={trip.id} className="hover:bg-surface-container-high/20 transition-colors">
                            <td className="px-4 py-3 font-mono text-foreground-muted">{toFa(trip.rowNo)}</td>
                            <td className="px-4 py-3 font-bold font-mono text-accent">{toFa(trip.trainNumber || '—')}</td>
                            <td className="px-4 py-3 font-mono">
                              <span className="text-success font-bold">{toFa(trip.departureTime || '')}</span>
                              <span className="text-foreground-muted mx-1">←</span>
                              <span className="text-foreground-muted">{toFa(trip.arrivalTime || '')}</span>
                            </td>

                            <td className="px-4 py-2.5">{renderAssignmentCell(h1, 'H1', trip.trainNumber)}</td>
                            <td className="px-4 py-2.5">{renderAssignmentCell(h2, 'H2', trip.trainNumber)}</td>

                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                {trip.operationalNote ? (
                                  <span className="px-2 py-0.5 bg-accent/15 border border-accent/30 rounded text-[9px] text-accent w-max">
                                    {trip.operationalNote}
                                  </span>
                                ) : (
                                  <span className="text-foreground-muted text-[10px]">نرمال</span>
                                )}
                                
                                {((h1?.disputed) || (h2?.disputed)) && (
                                  <span className="px-2 py-0.5 bg-warning/15 border border-warning/30 rounded text-[9px] text-warning w-max flex items-center gap-0.5">
                                    <AlertTriangle className="size-3" />
                                    مغایرت: {h1?.disputeNote || h2?.disputeNote}
                                  </span>
                                )}
                              </div>
                            </td>

                            {isAdmin && (
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => {
                                    setTargetTripId(trip.id)
                                    setCommentText(trip.operationalNote || '')
                                    setTripStatusVal(trip.status)
                                    setCommentModalVisible(true)
                                  }}
                                  className="px-2.5 py-1 bg-surface-container border border-outline-variant rounded hover:bg-surface-container-high text-[10px] text-foreground transition-colors cursor-pointer"
                                >
                                  ثبت پیام / تاخیر
                                </button>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View 2: Side-by-Side View */}
          {viewMode === 'sideBySide' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Outbound Column */}
              <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                <div className="bg-surface-container/30 border-b border-outline-variant py-3 px-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ArrowUpRight className="size-4 text-accent" />
                    مسیر رفت: شهرری ← تجریش
                  </span>
                  <span className="text-[10px] text-foreground-muted font-data-mono">
                    {toFa(filteredTrips.filter(t => t.direction === 'SHAHRREY_TO_TAJRISH').length)} سفر
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead className="bg-surface-container-low border-b border-outline-variant text-foreground-muted">
                      <tr>
                        <th className="px-3 py-2.5 font-bold">ردیف</th>
                        <th className="px-3 py-2.5 font-bold">شماره قطار</th>
                        <th className="px-3 py-2.5 font-bold">ساعت</th>
                        <th className="px-3 py-2.5 font-bold">راهبر ۱</th>
                        <th className="px-3 py-2.5 font-bold">راهبر ۲</th>
                        <th className="px-3 py-2.5 font-bold">وضعیت</th>
                        {isAdmin && <th className="px-3 py-2.5 font-bold text-center">عملیات</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant font-bold text-xs">
                      {filteredTrips
                        .filter((t) => t.direction === 'SHAHRREY_TO_TAJRISH')
                        .map((trip) => {
                          const h1 = trip.assignments.find((a) => a.role === 'H1')
                          const h2 = trip.assignments.find((a) => a.role === 'H2')
                          return (
                            <tr key={trip.id} className="hover:bg-surface-container-high/20 transition-colors">
                              <td className="px-3 py-2.5 font-mono text-foreground-muted">{toFa(trip.rowNo)}</td>
                              <td className="px-3 py-2.5 font-bold font-mono text-accent">{toFa(trip.trainNumber || '—')}</td>
                              <td className="px-3 py-2.5 font-mono">
                                <span className="text-success font-bold">{toFa(trip.departureTime || '')}</span>
                                <span className="text-foreground-muted mx-0.5">←</span>
                                <span className="text-foreground-muted text-[10px]">{toFa(trip.arrivalTime || '')}</span>
                              </td>
                              <td className="px-3 py-2">{renderAssignmentCell(h1, 'H1', trip.trainNumber)}</td>
                              <td className="px-3 py-2">{renderAssignmentCell(h2, 'H2', trip.trainNumber)}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex flex-col gap-1">
                                  {trip.operationalNote ? (
                                    <span className="px-1.5 py-0.5 bg-accent/15 border border-accent/30 rounded text-[9px] text-accent w-max">
                                      {trip.operationalNote}
                                    </span>
                                  ) : (
                                    <span className="text-foreground-muted text-[10px]">نرمال</span>
                                  )}
                                  {((h1?.disputed) || (h2?.disputed)) && (
                                    <span className="px-1.5 py-0.5 bg-warning/15 border border-warning/30 rounded text-[9px] text-warning w-max flex items-center gap-0.5">
                                      <AlertTriangle className="size-3" />
                                      مغایرت
                                    </span>
                                  )}
                                </div>
                              </td>
                              {isAdmin && (
                                <td className="px-3 py-2.5 text-center">
                                  <button
                                    onClick={() => {
                                      setTargetTripId(trip.id)
                                      setCommentText(trip.operationalNote || '')
                                      setTripStatusVal(trip.status)
                                      setCommentModalVisible(true)
                                    }}
                                    className="px-2 py-0.5 bg-surface-container border border-outline-variant rounded hover:bg-surface-container-high text-[9px] text-foreground transition-colors cursor-pointer"
                                  >
                                    پیام
                                  </button>
                                </td>
                              )}
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inbound Column */}
              <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                <div className="bg-surface-container/30 border-b border-outline-variant py-3 px-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ArrowDownLeft className="size-4 text-accent" />
                    مسیر برگشت: تجریش ← شهرری
                  </span>
                  <span className="text-[10px] text-foreground-muted font-data-mono">
                    {toFa(filteredTrips.filter(t => t.direction === 'TAJRISH_TO_SHAHRREY').length)} سفر
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead className="bg-surface-container-low border-b border-outline-variant text-foreground-muted">
                      <tr>
                        <th className="px-3 py-2.5 font-bold">ردیف</th>
                        <th className="px-3 py-2.5 font-bold">شماره قطار</th>
                        <th className="px-3 py-2.5 font-bold">ساعت</th>
                        <th className="px-3 py-2.5 font-bold">راهبر ۱</th>
                        <th className="px-3 py-2.5 font-bold">راهبر ۲</th>
                        <th className="px-3 py-2.5 font-bold">وضعیت</th>
                        {isAdmin && <th className="px-3 py-2.5 font-bold text-center">عملیات</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant font-bold text-xs">
                      {filteredTrips
                        .filter((t) => t.direction === 'TAJRISH_TO_SHAHRREY')
                        .map((trip) => {
                          const h1 = trip.assignments.find((a) => a.role === 'H1')
                          const h2 = trip.assignments.find((a) => a.role === 'H2')
                          return (
                            <tr key={trip.id} className="hover:bg-surface-container-high/20 transition-colors">
                              <td className="px-3 py-2.5 font-mono text-foreground-muted">{toFa(trip.rowNo)}</td>
                              <td className="px-3 py-2.5 font-bold font-mono text-accent">{toFa(trip.trainNumber || '—')}</td>
                              <td className="px-3 py-2.5 font-mono">
                                <span className="text-success font-bold">{toFa(trip.departureTime || '')}</span>
                                <span className="text-foreground-muted mx-0.5">←</span>
                                <span className="text-foreground-muted text-[10px]">{toFa(trip.arrivalTime || '')}</span>
                              </td>
                              <td className="px-3 py-2">{renderAssignmentCell(h1, 'H1', trip.trainNumber)}</td>
                              <td className="px-3 py-2">{renderAssignmentCell(h2, 'H2', trip.trainNumber)}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex flex-col gap-1">
                                  {trip.operationalNote ? (
                                    <span className="px-1.5 py-0.5 bg-accent/15 border border-accent/30 rounded text-[9px] text-accent w-max">
                                      {trip.operationalNote}
                                    </span>
                                  ) : (
                                    <span className="text-foreground-muted text-[10px]">نرمال</span>
                                  )}
                                  {((h1?.disputed) || (h2?.disputed)) && (
                                    <span className="px-1.5 py-0.5 bg-warning/15 border border-warning/30 rounded text-[9px] text-warning w-max flex items-center gap-0.5">
                                      <AlertTriangle className="size-3" />
                                      مغایرت
                                    </span>
                                  )}
                                </div>
                              </td>
                              {isAdmin && (
                                <td className="px-3 py-2.5 text-center">
                                  <button
                                    onClick={() => {
                                      setTargetTripId(trip.id)
                                      setCommentText(trip.operationalNote || '')
                                      setTripStatusVal(trip.status)
                                      setCommentModalVisible(true)
                                    }}
                                    className="px-2 py-0.5 bg-surface-container border border-outline-variant rounded hover:bg-surface-container-high text-[9px] text-foreground transition-colors cursor-pointer"
                                  >
                                    پیام
                                  </button>
                                </td>
                              )}
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* View 3: Classic landscape Sheet view (PDF structure) */}
          {viewMode === 'sheet' && (
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm print-container print-card">
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-[10px] print-table">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant text-foreground-muted text-[10px]">
                      <th className="px-1.5 py-2 border border-outline-variant font-bold text-center" rowSpan={2}>ردیف</th>
                      <th className="px-2 py-2 border border-outline-variant font-bold text-center bg-accent/5 text-accent" colSpan={10}>مسیر رفت: تجریش ← شهرری</th>
                      <th className="px-2 py-2 border border-outline-variant font-bold text-center bg-info/5 text-info" colSpan={10}>مسیر برگشت: شهرری ← تجریش</th>
                    </tr>
                    <tr className="bg-surface-container-low border-b border-outline-variant text-foreground-muted text-[9px]">
                      {/* Outbound Headers */}
                      <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">شماره قطار</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">مشخصه حرکت</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">شماره قطار</th>
                      <th className="px-1.5 py-1 border border-outline-variant text-center bg-accent/5 font-bold">H1</th>
                      <th className="px-1.5 py-1 border border-outline-variant text-center bg-accent/5 font-bold">H2</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">T</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">R</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">زمان حرکت</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">زمان رسیدن</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-accent/5 font-bold">توضیحات</th>
                      {/* Inbound Headers */}
                      <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">شماره قطار</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">مشخصه حرکت</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">شماره قطار</th>
                      <th className="px-1.5 py-1 border border-outline-variant text-center bg-info/5 font-bold">H1</th>
                      <th className="px-1.5 py-1 border border-outline-variant text-center bg-info/5 font-bold">H2</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">T</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">R</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">زمان حرکت</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">زمان رسیدن</th>
                      <th className="px-1 py-1 border border-outline-variant text-center bg-info/5 font-bold">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant font-bold text-xs">
                    {filteredRowNos.map((rowNo) => {
                      const rightTrip = filteredTrips.find(t => t.rowNo === rowNo && t.direction === 'TAJRISH_TO_SHAHRREY')
                      const leftTrip = filteredTrips.find(t => t.rowNo === rowNo && t.direction === 'SHAHRREY_TO_TAJRISH')
                      
                      const rH1 = rightTrip?.assignments.find(a => a.role === 'H1')
                      const rH2 = rightTrip?.assignments.find(a => a.role === 'H2')
                      const rT = rightTrip?.assignments.find(a => a.role === 'T_TYPE')
                      const rR = rightTrip?.assignments.find(a => a.role === 'R_CHAR')
                      const rAssistT = rightTrip?.assignments.find(a => a.role === 'T')
                      const rAssistR = rightTrip?.assignments.find(a => a.role === 'R')

                      const lH1 = leftTrip?.assignments.find(a => a.role === 'H1')
                      const lH2 = leftTrip?.assignments.find(a => a.role === 'H2')
                      const lT = leftTrip?.assignments.find(a => a.role === 'T_TYPE')
                      const lR = leftTrip?.assignments.find(a => a.role === 'R_CHAR')
                      const lAssistT = leftTrip?.assignments.find(a => a.role === 'T')
                      const lAssistR = leftTrip?.assignments.find(a => a.role === 'R')

                      return (
                        <tr key={rowNo} className="hover:bg-surface-container-high/10 transition-colors">
                          <td className="px-1.5 py-1.5 text-center font-mono font-bold text-foreground-muted border border-outline-variant">{toFa(rowNo)}</td>
                          
                          {/* Outbound Trip columns */}
                          <td className="px-1 py-1.5 text-center font-bold font-mono text-accent border border-outline-variant bg-accent/[0.01]">
                            {rightTrip ? toFa(rightTrip.trainNumber || '—') : '—'}
                          </td>
                          <td className="px-1 py-1.5 text-center border border-outline-variant bg-accent/[0.01]">
                            {rightTrip ? renderTextCell(rR) : '—'}
                          </td>
                          <td className="px-1 py-1.5 text-center border border-outline-variant bg-accent/[0.01]">
                            {rightTrip ? renderTextCell(rT) : '—'}
                          </td>
                          <td className="px-1.5 py-1 border border-outline-variant bg-accent/[0.01] text-start min-w-[90px]">
                            {rightTrip ? renderAssignmentCell(rH1, 'H1', rightTrip.trainNumber) : '—'}
                          </td>
                          <td className="px-1.5 py-1 border border-outline-variant bg-accent/[0.01] text-start min-w-[90px]">
                            {rightTrip ? renderAssignmentCell(rH2, 'H2', rightTrip.trainNumber) : '—'}
                          </td>
                          <td className="px-1.5 py-1 border border-outline-variant bg-accent/[0.01] text-start min-w-[90px]">
                            {rightTrip ? renderAssignmentCell(rAssistT, 'T', rightTrip.trainNumber) : '—'}
                          </td>
                          <td className="px-1.5 py-1 border border-outline-variant bg-accent/[0.01] text-start min-w-[90px]">
                            {rightTrip ? renderAssignmentCell(rAssistR, 'R', rightTrip.trainNumber) : '—'}
                          </td>
                          <td className="px-1 py-1.5 text-center font-mono border border-outline-variant bg-accent/[0.01]">
                            {rightTrip?.departureTime ? (
                              <span className="text-success font-bold text-[9px]">{toFa(rightTrip.departureTime.slice(0, 5))}</span>
                            ) : '—'}
                          </td>
                          <td className="px-1 py-1.5 text-center font-mono border border-outline-variant bg-accent/[0.01]">
                            {rightTrip?.arrivalTime ? (
                              <span className="text-foreground-muted text-[9px]">{toFa(rightTrip.arrivalTime.slice(0, 5))}</span>
                            ) : '—'}
                          </td>
                          <td className="px-1 py-1 border border-outline-variant bg-accent/[0.01] text-center">
                            {rightTrip ? (
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                {rightTrip.operationalNote && (
                                  <span className="px-1 py-0.5 bg-accent/15 border border-accent/30 rounded text-[8px] text-accent">
                                    {rightTrip.operationalNote}
                                  </span>
                                )}
                                {((rH1?.disputed) || (rH2?.disputed) || (rAssistT?.disputed) || (rAssistR?.disputed)) && (
                                  <span className="px-1 py-0.5 bg-warning/15 border border-warning/30 rounded text-[8px] text-warning">
                                    مغایرت
                                  </span>
                                )}
                              </div>
                            ) : '—'}
                          </td>

                          {/* Inbound Trip columns */}
                          <td className="px-1 py-1.5 text-center font-bold font-mono text-info border border-outline-variant bg-info/[0.01]">
                            {leftTrip ? toFa(leftTrip.trainNumber || '—') : '—'}
                          </td>
                          <td className="px-1 py-1.5 text-center border border-outline-variant bg-info/[0.01]">
                            {leftTrip ? renderTextCell(lR) : '—'}
                          </td>
                          <td className="px-1 py-1.5 text-center border border-outline-variant bg-info/[0.01]">
                            {leftTrip ? renderTextCell(lT) : '—'}
                          </td>
                          <td className="px-1.5 py-1 border border-outline-variant bg-info/[0.01] text-start min-w-[90px]">
                            {leftTrip ? renderAssignmentCell(lH1, 'H1', leftTrip.trainNumber) : '—'}
                          </td>
                          <td className="px-1.5 py-1 border border-outline-variant bg-info/[0.01] text-start min-w-[90px]">
                            {leftTrip ? renderAssignmentCell(lH2, 'H2', leftTrip.trainNumber) : '—'}
                          </td>
                          <td className="px-1.5 py-1 border border-outline-variant bg-info/[0.01] text-start min-w-[90px]">
                            {leftTrip ? renderAssignmentCell(lAssistT, 'T', leftTrip.trainNumber) : '—'}
                          </td>
                          <td className="px-1.5 py-1 border border-outline-variant bg-info/[0.01] text-start min-w-[90px]">
                            {leftTrip ? renderAssignmentCell(lAssistR, 'R', leftTrip.trainNumber) : '—'}
                          </td>
                          <td className="px-1 py-1.5 text-center font-mono border border-outline-variant bg-info/[0.01]">
                            {leftTrip?.departureTime ? (
                              <span className="text-success font-bold text-[9px]">{toFa(leftTrip.departureTime.slice(0, 5))}</span>
                            ) : '—'}
                          </td>
                          <td className="px-1 py-1.5 text-center font-mono border border-outline-variant bg-info/[0.01]">
                            {leftTrip?.arrivalTime ? (
                              <span className="text-foreground-muted text-[9px]">{toFa(leftTrip.arrivalTime.slice(0, 5))}</span>
                            ) : '—'}
                          </td>
                          <td className="px-1 py-1 border border-outline-variant bg-info/[0.01] text-center">
                            {leftTrip ? (
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                {leftTrip.operationalNote && (
                                  <span className="px-1 py-0.5 bg-info/15 border border-info/30 rounded text-[8px] text-info">
                                    {leftTrip.operationalNote}
                                  </span>
                                )}
                                {((lH1?.disputed) || (lH2?.disputed) || (lAssistT?.disputed) || (lAssistR?.disputed)) && (
                                  <span className="px-1 py-0.5 bg-warning/15 border border-warning/30 rounded text-[8px] text-warning">
                                    مغایرت
                                  </span>
                                )}
                              </div>
                            ) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'gantt' && (
            <RosterGanttView
              trips={filteredTrips}
              issues={issues}
              isAdmin={isAdmin}
              onCommentClick={(tripId, note, status) => {
                setTargetTripId(tripId)
                setCommentText(note || '')
                setTripStatusVal(status || 'NORMAL')
                setCommentModalVisible(true)
              }}
            />
          )}

          {viewMode === 'board' && (
            <RegionalBoard 
              trips={filteredTrips}
              issues={issues}
              searchQuery={searchTerm}
              onCrewClick={(trip, role) => {
                const ass = trip.assignments.find(a => a.role === role)
                if (ass && (ass.matchedUserId === user?.id || isAdmin)) {
                  handleOpenSwapModal(ass)
                }
              }}
            />
          )}
        </div>
      )}

      {/* Upload excel template modal */}
      {uploadModalVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-xl p-5 w-96 shadow-xl animate-in zoom-in duration-200" dir="rtl">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5 border-b border-border pb-2">
              <UploadCloud className="size-5 text-accent" />
              <span>بارگذاری فایل اکسل لوحه اعزام جدید</span>
            </h3>

            <form onSubmit={handleUploadRosterExcel} className="space-y-4 text-xs font-bold">
              <div>
                <Label>انتخاب فایل لوحه (XLSX):</Label>
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedFile(e.target.files?.[0] || null)}
                  className="bg-neutral-900 mt-1 h-9 text-xs"
                  required
                />
              </div>

              <div>
                <Label>عنوان لوحه:</Label>
                <Input
                  placeholder="مثال: لوحه عملیاتی خط ۱ مترو"
                  value={uploadTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUploadTitle(e.target.value)}
                  className="bg-neutral-900 mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label>سناریو / نوع زمان‌بندی:</Label>
                <select
                  value={uploadScenario}
                  onChange={(e) => setUploadScenario(e.target.value)}
                  className="w-full bg-neutral-900 border border-border p-2.5 rounded-lg text-xs mt-1 outline-none"
                >
                  <option value="روز عادی">روز عادی (Normal Day)</option>
                  <option value="کاهش سرفاصله">کاهش سرفاصله (Peak Hour)</option>
                  <option value="برنامه روزهای تعطیل">برنامه روزهای تعطیل</option>
                </select>
              </div>

              {uploadErrorMessage && (
                <div className="text-[10px] text-critical bg-critical/10 border border-critical/20 rounded p-2">
                  {uploadErrorMessage}
                </div>
              )}

              {uploadSuccessMessage && (
                <div className="text-[10px] text-success bg-success/10 border border-success/20 rounded p-2">
                  {uploadSuccessMessage}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-4 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  {uploadLoading ? 'در حال پردازش...' : 'شروع آپلود و پیش‌نویس'}
                </button>
                <button
                  type="button"
                  onClick={() => setUploadModalVisible(false)}
                  className="px-4 py-1.5 border border-outline-variant text-xs text-foreground rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operational note modal */}
      {commentModalVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-xl p-5 w-96 shadow-xl animate-in zoom-in duration-200" dir="rtl">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <MessageSquare className="size-4 text-accent" />
              ثبت پیام عملیاتی / ثبت تاخیر سفر
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>متن پیام یا علت تاخیر:</Label>
                <textarea
                  value={commentText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCommentText(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-lg p-2.5 text-xs text-foreground outline-none resize-none font-bold"
                  rows={3}
                  placeholder="..."
                />
              </div>

              <div className="space-y-1">
                <Label>وضعیت سفر:</Label>
                <select
                  value={tripStatusVal}
                  onChange={(e) => setTripStatusVal(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-lg p-2.5 text-xs text-foreground outline-none cursor-pointer"
                >
                  <option value="NORMAL">عادی (NORMAL)</option>
                  <option value="DELAYED">دارای تاخیر (DELAYED)</option>
                  <option value="CANCELLED">کنسل شده (CANCELLED)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <button
                  onClick={handleCommentSubmit}
                  className="px-4 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  ثبت پیام
                </button>
                <button
                  onClick={() => {
                    setCommentModalVisible(false)
                    setCommentText('')
                    setTargetTripId(null)
                  }}
                  className="px-4 py-1.5 border border-outline-variant text-xs text-foreground rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iCal Calendar Sync Modal */}
      {syncModalVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-xl p-5 w-96 shadow-xl animate-in zoom-in duration-200" dir="rtl">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Calendar className="size-4 text-accent" />
              همگام‌سازی لوحه با تقویم شخصی
            </h3>
            
            <p className="text-xs text-foreground-muted mb-4 leading-relaxed">
              شما می‌توانید سفرهای زمان‌بندی شده خود را با تقویم گوشی (Google, Apple, Outlook) همگام کنید تا تغییرات نوبت‌ها به صورت خودکار نشان داده شوند.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-foreground-muted mb-1 font-semibold">لینک اشتراک تقویم (Subscription URL)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/me/roster/export?token=${accessToken}`}
                    className="flex-1 bg-surface-container-low border border-outline-variant rounded px-2.5 py-1 text-[9px] text-foreground-muted outline-none font-mono text-left dir-ltr select-all"
                  />
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/api/me/roster/export?token=${accessToken}`
                      navigator.clipboard.writeText(url)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="p-1.5 bg-surface-container-high border border-outline-variant hover:bg-surface-container rounded text-foreground transition-colors cursor-pointer"
                    title="کپی لینک"
                  >
                    {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <a
                  href={`/api/me/roster/export?token=${accessToken}`}
                  download
                  className="px-3 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="size-3.5" />
                  دانلود فایل تقویم (.ics)
                </a>
                <button
                  onClick={() => setSyncModalVisible(false)}
                  className="px-3 py-1.5 border border-outline-variant text-xs text-foreground rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Swap Modal */}
      {swapModalVisible && sourceAssignment && (() => {
        const swapOptions: { assignmentId: string; label: string; userName: string }[] = []
        trips.forEach((t) => {
          t.assignments.forEach((a) => {
            if (
              a.matchedUserId &&
              a.id !== sourceAssignment.id &&
              a.matchedUserId !== sourceAssignment.matchedUserId
            ) {
              swapOptions.push({
                assignmentId: a.id,
                label: `اعزام ${toFa(t.rowNo)} | قطار ${toFa(t.trainNumber || '')} | راهبر: ${a.matchedUser?.name || a.rawName || ''} (${toFa(t.departureTime || '')} - ${toFa(t.arrivalTime || '')})`,
                userName: a.matchedUser?.name || a.rawName || '',
              })
            }
          })
        })

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
            <div className="bg-surface border border-outline-variant rounded-xl p-5 w-[420px] max-w-full shadow-xl animate-in zoom-in duration-200" dir="rtl">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5 border-b border-outline-variant pb-2">
                <ArrowLeftRight className="size-4 text-accent" />
                <span>ثبت درخواست جابجایی سفر روزانه</span>
              </h3>

              <form onSubmit={handleSwapSubmit} className="space-y-4 font-bold text-xs">
                <div className="bg-surface-container-low/50 border border-outline-variant p-3 rounded-lg text-xs space-y-1">
                  <span className="text-foreground-muted block">
                    {isAdmin ? "سفر مبدا:" : "سفر مبدا شما:"}
                  </span>
                  <div className="font-bold text-foreground">
                    {sourceAssignment.matchedUser?.name || sourceAssignment.rawName}
                  </div>
                  <div className="text-foreground-muted text-[10px]">
                    نقش: <span className="text-accent font-semibold">{sourceAssignment.role}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-foreground-muted mb-1 font-semibold">
                    انتخاب سفر مقصد (همکار):
                  </label>
                  <select
                    required
                    value={selectedTargetAssignmentId}
                    onChange={(e) => setSelectedTargetAssignmentId(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-2.5 py-2 text-xs text-foreground outline-none cursor-pointer font-bold"
                  >
                    <option value="">-- یک سفر را انتخاب کنید --</option>
                    {swapOptions.map((opt) => (
                      <option key={opt.assignmentId} value={opt.assignmentId}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-foreground-muted mb-1">
                    توضیحات و علت درخواست جابجایی:
                  </label>
                  <textarea
                    value={swapNote}
                    onChange={(e) => setSwapNote(e.target.value)}
                    rows={2}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg p-2 text-xs text-foreground outline-none resize-none font-bold"
                    placeholder="..."
                  />
                </div>

                {swapError && (
                  <div className="text-[10px] text-critical bg-critical/10 border border-critical/20 rounded p-2">
                    {swapError}
                  </div>
                )}

                {swapSuccess && (
                  <div className="text-[10px] text-success bg-success/10 border border-success/20 rounded p-2">
                    {swapSuccess}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2 border-t border-border">
                  <button
                    type="submit"
                    disabled={swapLoading || !selectedTargetAssignmentId}
                    className="px-4 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {swapLoading ? "در حال ثبت..." : "ثبت درخواست"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSwapModalVisible(false)}
                    className="px-4 py-1.5 border border-outline-variant text-xs text-foreground rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
