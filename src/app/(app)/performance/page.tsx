'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { TopAppBar } from '@/components/shared/top-app-bar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toFa, jalali, faTime } from '@/lib/fa'
import {
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronLeft,
  User,
  Users,
  Calendar,
  Activity,
  Clock,
  Trophy,
  ThumbsUp,
  Check,
  X,
  ShieldCheck,
  FileSpreadsheet,
  ChevronDown,
  Search,
  HelpCircle,
  Briefcase,
  AlertCircle,
  FileText
} from 'lucide-react'

// Interfaces for our state matching backend types
interface CompetencyRadar {
  discipline: number
  productivity: number
  quality: number
  innovation: number
  teamwork: number
  compliance: number
}

interface PerformanceLog {
  id: string
  employeeId: string
  recordedById: string
  actionTypeId: string
  severity: string
  scoreValue: number
  note: string | null
  evidenceUrl: string | null
  periodId: string
  status: 'active' | 'appealed' | 'overturned'
  createdAt: string
  actionType: {
    title: string
    defaultScore: number
    competencyId: string
    competency: {
      name: string
      direction: string
    }
  }
  recordedBy: {
    name: string
  }
  appeals?: {
    id: string
    status: string
    reason: string
  }[]
}

interface ScorecardData {
  employee: {
    id: string
    name: string
    customFields: any
    role: { name: string }
  }
  periodId: string
  baseScore: number
  logs: PerformanceLog[]
  competencyRadar: CompetencyRadar
  competencyDetails: {
    competencyId: string
    logsCount: number
    rawSum: number
    diminishedSum: number
  }[]
  summary: {
    positiveRaw: number
    positiveDiminished: number
    negativeTotal: number
    rawScore: number
    consistencyBonus: number
    streakBonus: number
    finalScore: number
    isWarning: boolean
  }
}

interface LeaderboardRecord {
  rank: number
  employeeId: string
  name: string
  avatar: string
  dept: string
  score: number
}

interface LeaderboardData {
  topFive: LeaderboardRecord[]
  myPrivateRank: {
    rank: number | null
    percentile: number
    score: number
    totalCount: number
  }
}

interface ManagerData {
  competencies: {
    id: string
    name: string
    direction: string
    actionTypes: {
      id: string
      title: string
      defaultScore: number
      maxSeverity: string
    }[]
  }[]
  employees: {
    id: string
    name: string
    customFields: any
  }[]
  logs: (PerformanceLog & { employee: { name: string; customFields: any } })[]
}

interface AppealRequest {
  id: string
  logId: string
  employeeId: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  log: PerformanceLog & { employee: { name: string } }
}

export default function PerformancePage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  // Tab state
  const [activeTab, setActiveTab] = useState<'scorecard' | 'leaderboard' | 'manager'>('scorecard')

  // Date/Period states
  const currentJalaliMonth = useMemo(() => {
    // Return current Jalali month e.g., "1405-04" or calculate fallback
    const d = new Date()
    const gy = d.getFullYear()
    const gm = d.getMonth() + 1
    const gd = d.getDate()
    
    // Simple inline Gregorian to Jalali calculation for default period
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    const gy2 = gm > 2 ? gy + 1 : gy
    let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1]
    let jy = -1595 + 33 * Math.floor(days / 12053)
    days %= 12053
    jy += 4 * Math.floor(days / 1461)
    days %= 1461
    if (days > 365) {
      jy += Math.floor((days - 1) / 365)
      days = (days - 1) % 365
    }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
    return `${jy}-${String(jm).padStart(2, '0')}`
  }, [])

  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentJalaliMonth)
  
  // Available periods list for dropdown
  const periodsList = useMemo(() => {
    const year = parseInt(currentJalaliMonth.split('-')[0])
    const month = parseInt(currentJalaliMonth.split('-')[1])
    const list = []
    for (let i = 0; i < 6; i++) {
      let m = month - i
      let y = year
      if (m <= 0) {
        m += 12
        y -= 1
      }
      list.push(`${y}-${String(m).padStart(2, '0')}`)
    }
    return list
  }, [currentJalaliMonth])

  // Auth & role checks
  const isManagerOrAdmin = useMemo(() => {
    const roleKey = user?.roleKey || ''
    return ['admin', 'super_admin', 'manager', 'chief', 'supervisor'].includes(roleKey)
  }, [user])

  // Scorecard state
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null)
  const [loadingScorecard, setLoadingScorecard] = useState<boolean>(true)
  const [scorecardError, setScorecardError] = useState<string>('')

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false)
  const [leaderboardError, setLeaderboardError] = useState<string>('')

  // Manager state
  const [managerData, setManagerData] = useState<ManagerData | null>(null)
  const [loadingManager, setLoadingManager] = useState<boolean>(false)
  const [managerError, setManagerError] = useState<string>('')
  
  // Appeals state (in manager view)
  const [pendingAppeals, setPendingAppeals] = useState<AppealRequest[]>([])
  const [loadingAppeals, setLoadingAppeals] = useState<boolean>(false)

  // Nomination state (in manager view)
  const [activeNomination, setActiveNomination] = useState<any>(null)
  const [loadingNomination, setLoadingNomination] = useState<boolean>(false)

  // New Action Type Form States
  const [customAction, setCustomAction] = useState({
    competencyId: '',
    title: '',
    defaultScore: 10,
    maxSeverity: 'L1' as 'L1' | 'L2' | 'L3'
  })
  const [submittingCustomAction, setSubmittingCustomAction] = useState(false)
  const [customActionSuccess, setCustomActionSuccess] = useState('')
  const [customActionError, setCustomActionError] = useState('')

  // Interactive Form States
  const [quickLog, setQuickLog] = useState({
    employeeId: '',
    competencyId: '',
    actionTypeId: '',
    severity: 'L1' as 'L1' | 'L2' | 'L3',
    note: '',
    evidenceUrl: ''
  })
  const [submittingLog, setSubmittingLog] = useState(false)
  const [logSuccessMessage, setLogSuccessMessage] = useState('')
  const [logErrorMessage, setLogErrorMessage] = useState('')

  // Appeal Modal States
  const [appealModalOpen, setAppealModalOpen] = useState(false)
  const [appealLogId, setAppealLogId] = useState<string | null>(null)
  const [appealReason, setAppealReason] = useState('')
  const [submittingAppeal, setSubmittingAppeal] = useState(false)
  
  // Appeal review action state
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({})
  const [submittingReview, setSubmittingReview] = useState<string | null>(null) // contains appealId

  // Fetch Scorecard Data
  const fetchScorecard = async (period: string, empId?: string) => {
    setLoadingScorecard(true)
    setScorecardError('')
    try {
      const url = `/api/performance/scorecard?periodId=${period}${empId ? `&employeeId=${empId}` : ''}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'خطا در دریافت کارنامه عملکرد')
      }
      const json = await res.json()
      setScorecard(json.data)
    } catch (err: any) {
      setScorecardError(err.message || 'خطا در ارتباط با سرور')
    } finally {
      setLoadingScorecard(false)
    }
  }

  // Fetch Leaderboard Data
  const fetchLeaderboard = async (period: string) => {
    setLoadingLeaderboard(true)
    setLeaderboardError('')
    try {
      const res = await fetch(`/api/performance/leaderboard?periodId=${period}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!res.ok) throw new Error('خطا در دریافت جدول رده‌بندی')
      const json = await res.json()
      setLeaderboard(json.data)
    } catch (err: any) {
      setLeaderboardError(err.message || 'خطا در ارتباط با سرور')
    } finally {
      setLoadingLeaderboard(false)
    }
  }

  // Fetch Manager Data (employees, action types, competencies)
  const fetchManagerData = async (period: string) => {
    setLoadingManager(true)
    setManagerError('')
    try {
      const res = await fetch(`/api/admin/performance/logs?periodId=${period}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات مدیریت')
      const json = await res.json()
      setManagerData(json.data)
    } catch (err: any) {
      setManagerError(err.message || 'خطا در ارتباط با سرور')
    } finally {
      setLoadingManager(false)
    }
  }

  // Fetch Appeals list (manager view)
  const fetchAppeals = async () => {
    setLoadingAppeals(true)
    try {
      const res = await fetch('/api/admin/performance/appeal', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setPendingAppeals(json.data || [])
      }
    } catch {
      // silent fail
    } finally {
      setLoadingAppeals(false)
    }
  }

  // Fetch active period nomination
  const fetchNomination = async (period: string) => {
    setLoadingNomination(true)
    try {
      const res = await fetch(`/api/admin/performance/nominate?periodId=${period}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setActiveNomination(json.data || null)
      }
    } catch {
      // silent
    } finally {
      setLoadingNomination(false)
    }
  }

  // Effect to load data based on active tab and period
  useEffect(() => {
    if (accessToken) {
      if (activeTab === 'scorecard') {
        fetchScorecard(selectedPeriod)
      } else if (activeTab === 'leaderboard') {
        fetchLeaderboard(selectedPeriod)
      } else if (activeTab === 'manager' && isManagerOrAdmin) {
        fetchManagerData(selectedPeriod)
        fetchAppeals()
        fetchNomination(selectedPeriod)
      }
    }
  }, [activeTab, selectedPeriod, accessToken, isManagerOrAdmin])

  // Handle Quick Log Form submission
  const handleQuickLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickLog.employeeId || !quickLog.actionTypeId) {
      setLogErrorMessage('لطفا پرسنل و نوع عملکرد را انتخاب کنید')
      return
    }
    setSubmittingLog(true)
    setLogSuccessMessage('')
    setLogErrorMessage('')
    try {
      const res = await fetch('/api/admin/performance/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          employeeId: quickLog.employeeId,
          actionTypeId: quickLog.actionTypeId,
          severity: quickLog.severity,
          note: quickLog.note,
          evidenceUrl: quickLog.evidenceUrl
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'خطا در ثبت رویداد')

      setLogSuccessMessage(json.message || 'رویداد عملکرد با موفقیت ثبت شد')
      setQuickLog({
        employeeId: '',
        competencyId: '',
        actionTypeId: '',
        severity: 'L1',
        note: '',
        evidenceUrl: ''
      })
      // Refresh manager data logs
      fetchManagerData(selectedPeriod)
    } catch (err: any) {
      setLogErrorMessage(err.message || 'خطا در ارتباط با سرور')
    } finally {
      setSubmittingLog(false)
    }
  }

  // Handle new action type submission (Custom catalog)
  const handleCustomActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customAction.competencyId || !customAction.title.trim()) {
      setCustomActionError('لطفا عنوان و محور شایستگی را وارد کنید')
      return
    }
    setSubmittingCustomAction(true)
    setCustomActionSuccess('')
    setCustomActionError('')
    try {
      const res = await fetch('/api/admin/performance/action-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          competencyId: customAction.competencyId,
          title: customAction.title,
          defaultScore: Number(customAction.defaultScore),
          maxSeverity: customAction.maxSeverity
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'خطا در افزودن نوع عملکرد')

      setCustomActionSuccess(json.message || 'نوع عملکرد جدید با موفقیت اضافه شد')
      setCustomAction({
        competencyId: '',
        title: '',
        defaultScore: 10,
        maxSeverity: 'L1'
      })
      // Refresh manager data to populate dropdowns with the new item!
      fetchManagerData(selectedPeriod)
    } catch (err: any) {
      setCustomActionError(err.message || 'خطا در ارتباط با سرور')
    } finally {
      setSubmittingCustomAction(false)
    }
  }

  // Handle Appeal Submission
  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appealLogId || !appealReason.trim()) return
    setSubmittingAppeal(true)
    try {
      const res = await fetch('/api/performance/appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          logId: appealLogId,
          reason: appealReason
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'خطا در ثبت اعتراض')

      setAppealModalOpen(false)
      setAppealReason('')
      setAppealLogId(null)
      // Refresh scorecard
      fetchScorecard(selectedPeriod)
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت اعتراض')
    } finally {
      setSubmittingAppeal(false)
    }
  }

  // Handle Appeal Review (HR/Admin)
  const handleAppealReview = async (appealId: string, status: 'approved' | 'rejected') => {
    setSubmittingReview(appealId)
    try {
      const res = await fetch(`/api/admin/performance/appeal/${appealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status,
          note: reviewNote[appealId] || ''
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'خطا در بررسی اعتراض')

      // Refresh appeals queue and manager log list
      await fetchAppeals()
      await fetchManagerData(selectedPeriod)
      // Clear review note for this appeal
      setReviewNote((prev) => {
        const next = { ...prev }
        delete next[appealId]
        return next
      })
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت بررسی اعتراض')
    } finally {
      setSubmittingReview(null)
    }
  }

  // Handle auto-nomination calculation
  const handleTriggerNomination = async () => {
    setLoadingNomination(true)
    try {
      const res = await fetch('/api/admin/performance/nominate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ periodId: selectedPeriod })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'خطا در محاسبه عملکرد و نامزدی')

      alert(json.message || 'محاسبات دوره با موفقیت انجام و پرسنل نمونه مشخص گردید')
      // Refresh nomination and manager logs
      await fetchNomination(selectedPeriod)
      await fetchManagerData(selectedPeriod)
    } catch (err: any) {
      alert(err.message || 'خطا در فرآیند محاسبه')
    } finally {
      setLoadingNomination(false)
    }
  }

  // 1. Math calculation helper for custom SVG Radar Chart points
  // 6 vertices representing the 6 core competencies in our schema
  const radarAxes = [
    { key: 'discipline', label: 'انضباط فردی' },
    { key: 'productivity', label: 'بهره‌وری' },
    { key: 'quality', label: 'کیفیت خروجی' },
    { key: 'innovation', label: 'نوآوری و خلاقیت' },
    { key: 'teamwork', label: 'روحیه تیمی' },
    { key: 'compliance', label: 'امنیت و انطباق' }
  ]

  const radarCoordinates = useMemo(() => {
    if (!scorecard) return []
    const center = 160
    const maxRadius = 100
    const radar = scorecard.competencyRadar

    return radarAxes.map((axis, i) => {
      const score = (radar as any)[axis.key] || 80 // Default to 80 if missing
      const angle = -Math.PI / 2 + i * (2 * Math.PI / 6) // Hexagon vertices
      const radius = (score / 100) * maxRadius
      return {
        key: axis.key,
        label: axis.label,
        score,
        // Calculate standard trigonometry projection
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
        // Grid points at 20%, 40%, 60%, 80%, 100% of max radius for drawing background grids
        grids: [20, 40, 60, 80, 100].map((g) => {
          const r = (g / 100) * maxRadius
          return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
          }
        })
      }
    })
  }, [scorecard])

  // Grid polygon paths for background hexagon grids
  const backgroundGridPaths = useMemo(() => {
    if (radarCoordinates.length === 0) return []
    const paths = []
    for (let gIndex = 0; gIndex < 5; gIndex++) {
      const points = radarCoordinates.map((c) => c.grids[gIndex])
      const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
      paths.push(pathStr)
    }
    return paths
  }, [radarCoordinates])

  // Main data polygon path for the radar chart
  const radarDataPath = useMemo(() => {
    if (radarCoordinates.length === 0) return ''
    return radarCoordinates.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ') + ' Z'
  }, [radarCoordinates])

  // Selected competency action types (filtered for manager log select dropdown)
  const availableActionTypes = useMemo(() => {
    if (!managerData || !quickLog.competencyId) return []
    const selectedComp = managerData.competencies.find((c) => c.id === quickLog.competencyId)
    return selectedComp ? selectedComp.actionTypes : []
  }, [managerData, quickLog.competencyId])

  // department statistics calculated dynamically from manager logs
  const departmentStats = useMemo(() => {
    if (!managerData || managerData.logs.length === 0) return []
    const depts: Record<string, { total: number; count: number }> = {}
    
    // Group logs by department/post
    managerData.logs.forEach((log) => {
      const dept = (log.employee?.customFields as any)?.post || 'عملیات'
      const val = log.scoreValue
      if (!depts[dept]) {
        depts[dept] = { total: 100 + val, count: 1 } // start from base 100
      } else {
        depts[dept].total += val
        depts[dept].count += 1
      }
    })

    return Object.entries(depts).map(([name, data]) => ({
      name,
      avgScore: Math.max(0, Math.round(data.total / data.count))
    }))
  }, [managerData])

  // Persian translations for severity labels
  const severityLabels: Record<string, string> = {
    L1: 'L1 - جزئی',
    L2: 'L2 - متوسط',
    L3: 'L3 - شدید (بحرانی)'
  }

  // Competency IDs to Persian labels map
  const competencyLabels: Record<string, string> = {
    discipline: 'انضباط فردی',
    productivity: 'بهره‌وری',
    quality: 'کیفیت خروجی',
    innovation: 'خلاقیت و نوآوری',
    teamwork: 'روحیه تیمی',
    compliance: 'امنیت و انطباق'
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface" dir="rtl">
      <TopAppBar
        title="ارزیابی عملکرد و شاخص‌های کلیدی (KPI)"
        subtitle="کارنامه عملکردی، لیدربورد محرمانه و سیستم ثبت سریع پرسنل خط ۱"
        showHealth
      />

      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-6 space-y-6">
        
        {/* Header Section: Period Selector and Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          
          {/* Tab buttons */}
          <div className="flex gap-1.5 p-1 bg-surface-container rounded-lg border border-border/50 max-w-fit">
            <Button
              variant={activeTab === 'scorecard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('scorecard')}
              className="text-xs font-semibold"
            >
              <FileText className="size-3.5 me-1.5" />
              کارنامه عملکرد من
            </Button>
            <Button
              variant={activeTab === 'leaderboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('leaderboard')}
              className="text-xs font-semibold"
            >
              <Trophy className="size-3.5 me-1.5" />
              جدول برترین‌ها (رده‌بندی)
            </Button>
            {isManagerOrAdmin && (
              <Button
                variant={activeTab === 'manager' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('manager')}
                className="text-xs font-semibold text-accent-foreground"
              >
                <Briefcase className="size-3.5 me-1.5" />
                پنل مدیریت عملکرد
              </Button>
            )}
          </div>

          {/* Period Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-muted font-bold">دوره ارزیابی:</span>
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none w-40 bg-surface-container border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-accent ps-8 cursor-pointer"
              >
                {periodsList.map((p) => (
                  <option key={p} value={p}>
                    {toFa(p.replace('-', ' / '))}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute start-2.5 top-2.5 size-3.5 text-foreground-muted pointer-events-none" />
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* TAB 1: MY SCORECARD */}
        {/* ========================================================================= */}
        {activeTab === 'scorecard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {loadingScorecard ? (
              <div className="flex flex-col items-center justify-center p-24 gap-3">
                <Activity className="size-10 animate-spin text-accent" />
                <span className="text-sm text-foreground-muted">در حال محاسبه و تجمیع کارنامه عملکرد...</span>
              </div>
            ) : scorecardError ? (
              <div className="bg-critical/10 border border-critical/30 rounded-lg p-4 text-critical text-sm text-center flex items-center justify-center gap-2">
                <AlertTriangle className="size-5" />
                <span>{scorecardError}</span>
              </div>
            ) : scorecard ? (
              <>
                {/* Scorecard Profile Header & Alert Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Score Radial Gauge Card */}
                  <Card className="border border-border bg-surface-container-lowest/70 shadow-sm flex flex-col items-center justify-center p-6 text-center">
                    <CardHeader className="p-0 pb-3 text-center">
                      <CardTitle className="text-sm font-bold">امتیاز نهایی ارزیابی دوره</CardTitle>
                      <CardDescription className="text-[10px]">
                        ترکیب امتیاز پایه، بازده نزولی شایستگی‌ها و بونوس‌ها
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col items-center justify-center">
                      {/* SVG Radial Gauge */}
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                          {/* Outer Track */}
                          <circle
                            cx="100"
                            cy="100"
                            r="76"
                            stroke="var(--color-border)"
                            strokeWidth="10"
                            fill="transparent"
                            className="opacity-20"
                          />
                          {/* Progress Circle (Scaled out of 120 max index) */}
                          <circle
                            cx="100"
                            cy="100"
                            r="76"
                            stroke={scorecard.summary.isWarning ? '#ef4444' : 'var(--color-accent)'}
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={477.5}
                            strokeDashoffset={477.5 - Math.min(1, scorecard.summary.finalScore / 120) * 477.5}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        
                        {/* Text Inside Gauge */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className={`text-4xl font-black font-mono ${scorecard.summary.isWarning ? 'text-critical' : 'text-foreground'}`}>
                            {toFa(scorecard.summary.finalScore)}
                          </span>
                          <span className="text-[10px] text-foreground-muted font-bold mt-0.5">
                            سقف عملکرد ۱۲۰+
                          </span>
                        </div>
                      </div>

                      {/* Performance Alarm Banner */}
                      {scorecard.summary.isWarning ? (
                        <div className="mt-4 bg-critical/15 border border-critical/30 text-critical text-[11px] px-3 py-1.5 rounded-full font-bold animate-pulse flex items-center gap-1.5">
                          <AlertCircle className="size-3.5" />
                          <span>هشدار عملکرد: امتیاز کل بحرانی و زیر ۷۰</span>
                        </div>
                      ) : (
                        <div className="mt-4 bg-success/10 text-success text-[11px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5" />
                          <span>وضعیت مطلوب و در محدوده تعهد سازمانی</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Competency Radar Chart Card */}
                  <Card className="border border-border bg-surface-container-lowest/70 shadow-sm md:col-span-2 flex flex-col">
                    <CardHeader className="py-4 border-b border-border/40 bg-surface-container-lowest flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold">نقشه تار عنکبوتی شایستگی‌ها (Radar)</CardTitle>
                        <CardDescription className="text-[10px]">
                          نمودار چندبُعدی نقاط قوت و ضعف رفتاری و فنی پرسنل
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-accent/5 text-accent font-bold">
                        ۶ بُعد محوری
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col md:flex-row items-center justify-center gap-6">
                      
                      {/* SVG Radar Chart */}
                      <div className="w-64 h-64 shrink-0 relative">
                        <svg className="w-full h-full" viewBox="0 0 320 320">
                          {/* Concentric grid lines (Concentric Hexagons) */}
                          {backgroundGridPaths.map((pathStr, idx) => (
                            <polygon
                              key={idx}
                              points={pathStr.replace(/[MLZ]/g, '').trim()}
                              fill="none"
                              stroke="var(--color-border)"
                              strokeWidth="1"
                              className="opacity-30"
                            />
                          ))}

                          {/* Grid Labels for 20%, 40%, 60%, 80%, 100% on the vertical axis */}
                          {[20, 40, 60, 80, 100].map((gridVal, idx) => {
                            const y = 160 - (gridVal / 100) * 100
                            return (
                              <text
                                key={idx}
                                x="164"
                                y={y + 3}
                                fill="var(--color-foreground-muted)"
                                className="text-[8px] font-bold font-mono opacity-50"
                              >
                                {toFa(gridVal)}
                              </text>
                            )
                          })}

                          {/* Hexagon spokes/axes from center */}
                          {radarCoordinates.map((coord, idx) => (
                            <line
                              key={idx}
                              x1="160"
                              y1="160"
                              x2={coord.grids[4].x}
                              y2={coord.grids[4].y}
                              stroke="var(--color-border)"
                              strokeWidth="1"
                              className="opacity-40"
                            />
                          ))}

                          {/* Data Polygon Path */}
                          {radarDataPath && (
                            <polygon
                              points={radarDataPath.replace(/[MLZ]/g, '').trim()}
                              fill="var(--color-accent)"
                              fillOpacity="0.25"
                              stroke="var(--color-accent)"
                              strokeWidth="2.5"
                              className="transition-all duration-500"
                            />
                          )}

                          {/* Vertex Dots with Hover Tooltips */}
                          {radarCoordinates.map((coord, idx) => (
                            <g key={idx} className="group/dot">
                              <circle
                                cx={coord.x}
                                cy={coord.y}
                                r="4.5"
                                fill="var(--color-surface)"
                                stroke="var(--color-accent)"
                                strokeWidth="2.5"
                                className="cursor-pointer transition-all duration-150 hover:r-6"
                              />
                              {/* Axis Label Text */}
                              {(() => {
                                // Dynamic offset to keep labels outside the chart bounds
                                const angle = -Math.PI / 2 + idx * (2 * Math.PI / 6)
                                const textDist = 122
                                const tx = 160 + textDist * Math.cos(angle)
                                const ty = 160 + textDist * Math.sin(angle)
                                return (
                                  <text
                                    x={tx}
                                    y={ty + 3}
                                    fill="var(--color-foreground)"
                                    className="text-[9px] font-bold"
                                    textAnchor="middle"
                                  >
                                    {coord.label}
                                  </text>
                                )
                              })()}
                            </g>
                          ))}
                        </svg>
                      </div>

                      {/* Radar legends & values list */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full max-w-xs">
                        {radarCoordinates.map((coord, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded bg-surface border border-border/40">
                            <span className="text-foreground-muted font-bold truncate">{coord.label}</span>
                            <span className="font-mono font-black text-foreground">
                              {toFa(coord.score)}
                            </span>
                          </div>
                        ))}
                      </div>

                    </CardContent>
                  </Card>

                </div>

                {/* Score breakdown metrics and bonus cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <Card className="border border-border bg-surface-container-lowest/70 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-foreground-muted">امتیاز پایه پیش‌فرض</span>
                        <h4 className="text-2xl font-bold font-mono text-foreground">{toFa(scorecard.baseScore)}</h4>
                        <p className="text-[9px] text-foreground-muted">نقطه شروع در اول ماه ارزیابی</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-surface border border-border text-foreground-muted">
                        <Activity className="size-5" />
                      </div>
                    </div>
                  </Card>

                  <Card className="border border-border bg-surface-container-lowest/70 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-foreground-muted">مجموع تشویق‌ها (تعدیل‌شده)</span>
                        <h4 className="text-2xl font-bold font-mono text-success">
                          {toFa(scorecard.summary.positiveRaw)} ({toFa(scorecard.summary.positiveDiminished)}+)
                        </h4>
                        <p className="text-[9px] text-success font-semibold">ضریب کاهشی با فرمول بازده نزولی</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-success/15 text-success">
                        <Check className="size-5" />
                      </div>
                    </div>
                  </Card>

                  <Card className="border border-border bg-surface-container-lowest/70 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-foreground-muted">جرایم و کسر امتیاز</span>
                        <h4 className="text-2xl font-bold font-mono text-critical">
                          {toFa(scorecard.summary.negativeTotal)}-
                        </h4>
                        <p className="text-[9px] text-foreground-muted">ضرب در ضریب شدت سطح L1 تا L3</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-critical/15 text-critical">
                        <X className="size-5" />
                      </div>
                    </div>
                  </Card>

                  {/* Bonus Card */}
                  <Card className="border border-border bg-surface-container-lowest/70 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-foreground-muted">بونوس‌های ثبات و استمرار</span>
                        <h4 className="text-2xl font-bold font-mono text-accent">
                          {toFa(scorecard.summary.consistencyBonus + scorecard.summary.streakBonus)}+
                        </h4>
                        <div className="flex gap-1.5 mt-1">
                          {scorecard.summary.consistencyBonus > 0 && (
                            <Badge variant="outline" className="text-[8px] bg-accent/5 text-accent border-accent/20">
                              ثبات ۲F
                            </Badge>
                          )}
                          {scorecard.summary.streakBonus > 0 && (
                            <Badge variant="outline" className="text-[8px] bg-yellow-500/5 text-yellow-500 border-yellow-500/20">
                              استمرار ۳M
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-accent/15 text-accent">
                        <Award className="size-5" />
                      </div>
                    </div>
                  </Card>

                </div>

                {/* Timeline of Performance Logs */}
                <Card className="border border-border bg-surface-container-lowest/70 shadow-sm">
                  <CardHeader className="py-4 border-b border-border/40 bg-surface-container-lowest flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold">ریز رویدادها و سوابق ثبتی دوره</CardTitle>
                      <CardDescription className="text-[10px]">
                        لیست حسابرسی‌شده تمام امتیازات ثبت‌شده به صورت روزشمار
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {toFa(scorecard.logs.length)} رویداد فعال
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4">
                    {scorecard.logs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-10 text-center">
                        <CheckCircle2 className="size-12 text-success/60 mb-2" />
                        <span className="text-xs text-foreground-muted font-bold">
                          هیچ امتیاز مثبت یا منفی در این دوره ثبت نشده است. عملکرد کاملاً نرمال و بدون گزارش.
                        </span>
                      </div>
                    ) : (
                      <div className="relative border-s border-border/70 mr-3 pr-4 space-y-6">
                        {scorecard.logs.map((log) => {
                          const isPositive = log.scoreValue > 0
                          const isAppealed = log.status === 'appealed'
                          const isOverturned = log.status === 'overturned'

                          return (
                            <div key={log.id} className="relative">
                              
                              {/* Icon Pin on timeline */}
                              <span className={`absolute -right-[27px] top-1.5 flex size-5 items-center justify-center rounded-full border-2 ${
                                isOverturned
                                  ? 'bg-surface border-foreground-muted text-foreground-muted'
                                  : isPositive
                                    ? 'bg-success/20 border-success text-success'
                                    : 'bg-critical/20 border-critical text-critical'
                              }`}>
                                {isOverturned ? (
                                  <Check className="size-2.5" />
                                ) : isPositive ? (
                                  <ThumbsUp className="size-2.5" />
                                ) : (
                                  <AlertTriangle className="size-2.5" />
                                )}
                              </span>

                              {/* Log Card body */}
                              <div className="bg-surface rounded-lg border border-border/50 p-4 transition-all hover:border-border">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  
                                  {/* Title & badge */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-foreground">
                                      {competencyLabels[log.actionType.competencyId] || log.actionType.competency.name} : {log.actionType.title}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[9px] font-mono font-semibold ${
                                        isOverturned
                                          ? 'bg-surface border-border text-foreground-muted'
                                          : isPositive
                                            ? 'bg-success/5 border-success/20 text-success'
                                            : 'bg-critical/5 border-critical/20 text-critical'
                                      }`}
                                    >
                                      {isOverturned ? 'باطل‌شده' : isPositive ? `${toFa(log.scoreValue)}+ امتیاز` : `${toFa(Math.abs(log.scoreValue))}- امتیاز`}
                                    </Badge>

                                    {log.severity && log.scoreValue < 0 && (
                                      <Badge variant="outline" className="text-[8px] bg-outline-variant/30 font-bold">
                                        شدت {toFa(log.severity)}
                                      </Badge>
                                    )}

                                    {/* Appeal Status Badges */}
                                    {isAppealed && (
                                      <Badge className="text-[8px] bg-warning/25 text-warning hover:bg-warning/25 border-warning/20">
                                        در حال بررسی اعتراض
                                      </Badge>
                                    )}
                                    {isOverturned && (
                                      <Badge className="text-[8px] bg-success/25 text-success hover:bg-success/25 border-success/20">
                                        اعتراض تایید شده و کسر امتیاز لغو شد
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Timestamp */}
                                  <div className="text-[10px] text-foreground-muted font-bold font-mono">
                                    {jalali(log.createdAt)} در ساعت {faTime(log.createdAt)}
                                  </div>

                                </div>

                                {/* Log Note */}
                                {log.note && (
                                  <p className="mt-2 text-xs text-foreground-muted leading-relaxed bg-surface-container-lowest p-2 rounded border border-border/30">
                                    {log.note}
                                  </p>
                                )}

                                {/* recordedBy and evidence */}
                                <div className="mt-3 pt-2 border-t border-border/40 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[10px] text-foreground-muted font-bold">
                                  <span>ثبت شده توسط: {log.recordedBy?.name || 'سیستم'}</span>
                                  
                                  <div className="flex items-center gap-3">
                                    {log.evidenceUrl && (
                                      <a
                                        href={log.evidenceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-accent hover:underline flex items-center gap-1"
                                      >
                                        <FileText className="size-3" />
                                        مشاهده مدرک پیوست
                                      </a>
                                    )}

                                    {/* Appeal Button */}
                                    {!isPositive && !isAppealed && !isOverturned && (
                                      <Button
                                        variant="outline"
                                        size="icon-sm"
                                        className="h-6 px-2 text-[9px] font-bold text-critical border-critical/30 hover:bg-critical/5 hover:border-critical transition-colors"
                                        onClick={() => {
                                          setAppealLogId(log.id)
                                          setAppealModalOpen(true)
                                        }}
                                      >
                                        ثبت اعتراض روی رویداد
                                      </Button>
                                    )}
                                  </div>
                                </div>

                              </div>

                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

              </>
            ) : (
              <div className="text-center text-xs text-foreground-muted p-10 bg-surface-container border border-border rounded-lg">
                اطلاعات کارنامه‌ای یافت نشد.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LEADERBOARD */}
        {/* ========================================================================= */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {loadingLeaderboard ? (
              <div className="flex flex-col items-center justify-center p-24 gap-3">
                <Activity className="size-10 animate-spin text-accent" />
                <span className="text-sm text-foreground-muted">در حال بارگذاری جدول رده‌بندی کل سازمان...</span>
              </div>
            ) : leaderboardError ? (
              <div className="bg-critical/10 border border-critical/30 rounded-lg p-4 text-critical text-sm text-center flex items-center justify-center gap-2">
                <AlertTriangle className="size-5" />
                <span>{leaderboardError}</span>
              </div>
            ) : leaderboard ? (
              <>
                
                {/* 3D-Like Podium Display for Top 3 */}
                <div className="flex flex-col md:flex-row items-end justify-center gap-6 py-10 px-4 bg-surface-container-lowest border border-border rounded-lg shadow-sm">
                  
                  {/* Rank 2: Silver */}
                  {leaderboard.topFive[1] && (
                    <div className="flex flex-col items-center order-2 md:order-1 w-full max-w-[200px]">
                      {/* User Info */}
                      <div className="flex flex-col items-center text-center mb-3">
                        <div className="relative size-14 rounded-full border-2 border-slate-400 bg-surface flex items-center justify-center font-bold text-slate-400 text-lg shadow">
                          {leaderboard.topFive[1].avatar}
                        </div>
                        <span className="text-xs font-black mt-2 text-foreground truncate max-w-[120px]">{leaderboard.topFive[1].name}</span>
                        <span className="text-[9px] text-foreground-muted font-bold">{leaderboard.topFive[1].dept}</span>
                      </div>
                      {/* Silver Pillar */}
                      <div className="w-full bg-slate-400/25 border-t border-slate-400/50 rounded-t-lg h-28 flex flex-col items-center justify-center p-4">
                        <Trophy className="size-6 text-slate-400 mb-1.5" />
                        <span className="text-[10px] font-black text-slate-400">رتبه دوم</span>
                        <span className="text-sm font-black font-mono mt-1 text-foreground">{toFa(leaderboard.topFive[1].score)}</span>
                      </div>
                    </div>
                  )}

                  {/* Rank 1: Gold (Tallest and centered) */}
                  {leaderboard.topFive[0] && (
                    <div className="flex flex-col items-center order-1 md:order-2 w-full max-w-[220px] -mt-6">
                      {/* User Info */}
                      <div className="flex flex-col items-center text-center mb-3">
                        <div className="relative size-18 rounded-full border-4 border-yellow-500 bg-surface flex items-center justify-center font-bold text-yellow-500 text-xl shadow-lg ring-4 ring-yellow-500/15">
                          {leaderboard.topFive[0].avatar}
                          <span className="absolute -top-2.5 -right-2.5 bg-yellow-500 text-black text-[10px] font-black size-5 rounded-full flex items-center justify-center ring-2 ring-surface">۱</span>
                        </div>
                        <span className="text-sm font-black mt-2 text-foreground truncate max-w-[140px]">{leaderboard.topFive[0].name}</span>
                        <span className="text-[10px] text-foreground-muted font-bold">{leaderboard.topFive[0].dept}</span>
                      </div>
                      {/* Gold Pillar */}
                      <div className="w-full bg-yellow-500/20 border-t-2 border-yellow-500/40 rounded-t-lg h-36 flex flex-col items-center justify-center p-4 shadow-md">
                        <Trophy className="size-8 text-yellow-500 mb-1.5 animate-bounce" />
                        <span className="text-[11px] font-black text-yellow-500">پرسنل برتر ماه</span>
                        <span className="text-base font-black font-mono mt-1 text-yellow-500">{toFa(leaderboard.topFive[0].score)}</span>
                      </div>
                    </div>
                  )}

                  {/* Rank 3: Bronze */}
                  {leaderboard.topFive[2] && (
                    <div className="flex flex-col items-center order-3 md:order-3 w-full max-w-[200px]">
                      {/* User Info */}
                      <div className="flex flex-col items-center text-center mb-3">
                        <div className="relative size-14 rounded-full border-2 border-amber-600 bg-surface flex items-center justify-center font-bold text-amber-600 text-lg shadow">
                          {leaderboard.topFive[2].avatar}
                        </div>
                        <span className="text-xs font-black mt-2 text-foreground truncate max-w-[120px]">{leaderboard.topFive[2].name}</span>
                        <span className="text-[9px] text-foreground-muted font-bold">{leaderboard.topFive[2].dept}</span>
                      </div>
                      {/* Bronze Pillar */}
                      <div className="w-full bg-amber-600/25 border-t border-amber-600/50 rounded-t-lg h-24 flex flex-col items-center justify-center p-4">
                        <Trophy className="size-5 text-amber-600 mb-1.5" />
                        <span className="text-[10px] font-black text-amber-700">رتبه سوم</span>
                        <span className="text-sm font-black font-mono mt-1 text-foreground">{toFa(leaderboard.topFive[2].score)}</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Rank 4 and 5 List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leaderboard.topFive.slice(3, 5).map((rec) => (
                    <Card key={rec.employeeId} className="border border-border bg-surface-container-lowest/50 shadow-sm p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-foreground-muted font-mono w-6">
                            #{toFa(rec.rank)}
                          </span>
                          <div className="size-9 rounded-full bg-surface-container border border-border flex items-center justify-center font-bold text-xs">
                            {rec.avatar}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-foreground">{rec.name}</div>
                            <div className="text-[9px] text-foreground-muted font-semibold">{rec.dept}</div>
                          </div>
                        </div>
                        <span className="text-xs font-black font-mono text-foreground">
                          {toFa(rec.score)} امتیاز
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Private Rank Status Card (Ensures low rankings are hidden from public to save morale) */}
                <Card className="border border-border bg-accent/5 shadow-md border-accent/25 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-accent flex items-center gap-2">
                        <ShieldCheck className="size-4" />
                        کارنامه و وضعیت رتبه‌بندی اختصاصی شما (محرمانه)
                      </h4>
                      <p className="text-xs text-foreground-muted leading-relaxed">
                        این رتبه صرفاً برای ایجاد انگیزه و رصد تحلیلی فردی به شما نمایش داده می‌شود. رتبه‌های خارج از ۵ نفر برتر برای هیچ پرسنل دیگری قابل رویت نیست.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-3 sm:border-t-0 sm:pt-0 shrink-0 text-center">
                      <div className="bg-surface border border-border/60 p-2.5 rounded-lg">
                        <div className="text-[10px] text-foreground-muted font-bold">رتبه شما</div>
                        <div className="text-lg font-black font-mono text-foreground mt-1">
                          {leaderboard.myPrivateRank.rank ? `${toFa(leaderboard.myPrivateRank.rank)}` : '—'}
                          <span className="text-[10px] text-foreground-muted font-normal ms-0.5">
                            از {toFa(leaderboard.myPrivateRank.totalCount)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-surface border border-border/60 p-2.5 rounded-lg">
                        <div className="text-[10px] text-foreground-muted font-bold">صدک رده</div>
                        <div className="text-lg font-black font-mono text-accent mt-1">
                          {toFa(leaderboard.myPrivateRank.percentile)}٪
                        </div>
                      </div>
                      <div className="bg-surface border border-border/60 p-2.5 rounded-lg">
                        <div className="text-[10px] text-foreground-muted font-bold">امتیاز نرمال</div>
                        <div className="text-lg font-black font-mono text-foreground mt-1">
                          {toFa(leaderboard.myPrivateRank.score)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/30 text-[11px] text-foreground-muted flex items-start gap-2">
                    <HelpCircle className="size-4 text-accent shrink-0 mt-0.5" />
                    <span>
                      شاخص صدک {toFa(leaderboard.myPrivateRank.percentile)}٪ نشان می‌دهد که عملکرد شما بر اساس فرمول Z-Score واحد، بهتر از {toFa(leaderboard.myPrivateRank.percentile)} درصد از همکاران هم‌سمت در این ماه بوده است. با ارتقای انضباط فردی و افزایش خلاقیت‌ها می‌توانید رتبه خود را رشد دهید.
                    </span>
                  </div>
                </Card>

              </>
            ) : (
              <div className="text-center text-xs text-foreground-muted p-10">اطلاعات جدول رده‌بندی یافت نشد.</div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MANAGER PANEL */}
        {/* ========================================================================= */}
        {activeTab === 'manager' && isManagerOrAdmin && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {loadingManager ? (
              <div className="flex flex-col items-center justify-center p-24 gap-3">
                <Activity className="size-10 animate-spin text-accent" />
                <span className="text-sm text-foreground-muted">در حال بارگذاری اطلاعات پنل مدیریتی...</span>
              </div>
            ) : managerError ? (
              <div className="bg-critical/10 border border-critical/30 rounded-lg p-4 text-critical text-sm text-center flex items-center justify-center gap-2">
                <AlertTriangle className="size-5" />
                <span>{managerError}</span>
              </div>
            ) : managerData ? (
              <div className="space-y-6">

                
                {/* 1. Quick Log Form Card & Monthly calculation trigger */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Quick Log Form */}
                  <Card className="border border-border bg-surface-container-lowest/70 shadow-sm lg:col-span-2">
                    <CardHeader className="py-4 border-b border-border/40 bg-surface-container-lowest">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Plus className="size-4 text-accent" />
                        ثبت سریع رویداد عملکرد پرسنل (در لحظه)
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        مدیر محترم، امتیازدهی باید بر اساس واقعیت و با درج مستندات باشد. ثبت با موفقیت در سجل ثبت می‌شود.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <form onSubmit={handleQuickLogSubmit} className="space-y-4">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Employee Select */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">انتخاب کارمند / راهبر:</label>
                            <select
                              value={quickLog.employeeId}
                              onChange={(e) => setQuickLog({ ...quickLog, employeeId: e.target.value })}
                              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent cursor-pointer"
                              required
                            >
                              <option value="">-- انتخاب پرسنل خط ۱ --</option>
                              {managerData.employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({((emp.customFields as any)?.post) || 'پرسنل'})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Competency Group Select */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">محور شایستگی:</label>
                            <select
                              value={quickLog.competencyId}
                              onChange={(e) => setQuickLog({ ...quickLog, competencyId: e.target.value, actionTypeId: '' })}
                              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent cursor-pointer"
                              required
                            >
                              <option value="">-- انتخاب محور شایستگی --</option>
                              {managerData.competencies.map((comp) => (
                                <option key={comp.id} value={comp.id}>
                                  {comp.name} ({comp.direction === 'positive' ? 'تشویقی' : comp.direction === 'negative' ? 'تنبیهی' : 'دوطرفه'})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Action Type Select (Dependent on Competency) */}
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-bold text-foreground">نوع عملکرد اختصاصی:</label>
                            <select
                              value={quickLog.actionTypeId}
                              onChange={(e) => setQuickLog({ ...quickLog, actionTypeId: e.target.value })}
                              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent cursor-pointer"
                              disabled={!quickLog.competencyId}
                              required
                            >
                              <option value="">-- ابتدا محور شایستگی را انتخاب کنید --</option>
                              {availableActionTypes.map((act) => (
                                <option key={act.id} value={act.id}>
                                  {act.title} (امتیاز پیش‌فرض: {toFa(act.defaultScore)} | سقف شدت: {toFa(act.maxSeverity)})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Severity Selector (only enabled for negative actions or general) */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">سطح شدت رویداد (Severity):</label>
                            <select
                              value={quickLog.severity}
                              onChange={(e) => setQuickLog({ ...quickLog, severity: e.target.value as any })}
                              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent cursor-pointer"
                            >
                              <option value="L1">{severityLabels.L1}</option>
                              <option value="L2">{severityLabels.L2}</option>
                              <option value="L3">{severityLabels.L3}</option>
                            </select>
                          </div>

                          {/* Evidence Link */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">لینک مستند پیوست (اختیاری):</label>
                            <input
                              type="url"
                              value={quickLog.evidenceUrl}
                              onChange={(e) => setQuickLog({ ...quickLog, evidenceUrl: e.target.value })}
                              placeholder="https://example.com/evidence"
                              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent text-start"
                            />
                          </div>

                          {/* Note / Reason */}
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-bold text-foreground">توضیحات و علت ثبت (یادداشت پرونده):</label>
                            <textarea
                              value={quickLog.note}
                              onChange={(e) => setQuickLog({ ...quickLog, note: e.target.value })}
                              placeholder="بابت چه موضوعی، در چه ساعتی و چه شرحی این عملکرد ثبت می‌شود؟..."
                              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent min-h-[80px]"
                              required
                            />
                          </div>

                        </div>

                        {/* Error and Success alerts */}
                        {logErrorMessage && (
                          <div className="bg-critical/10 border border-critical/30 rounded px-3 py-2 text-critical text-xs flex items-center gap-1.5">
                            <AlertCircle className="size-3.5" />
                            <span>{logErrorMessage}</span>
                          </div>
                        )}
                        {logSuccessMessage && (
                          <div className="bg-success/10 border border-success/30 rounded px-3 py-2 text-success text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5" />
                            <span>{logSuccessMessage}</span>
                          </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={submittingLog}
                            className="text-xs font-bold bg-accent hover:bg-accent-hover text-accent-foreground px-5 py-2 rounded-lg transition-colors"
                          >
                            {submittingLog ? 'در حال ثبت در پرونده...' : 'ثبت قطعی در سجل عملکرد'}
                          </Button>
                        </div>

                      </form>
                    </CardContent>
                  </Card>

                  {/* Trigger monthly calculations and normalizations */}
                  <div className="space-y-6">
                    
                    <Card className="border border-border bg-surface-container-lowest/70 shadow-sm">
                      <CardHeader className="py-4 border-b border-border/40 bg-surface-container-lowest">
                        <CardTitle className="text-sm font-bold">محاسبه و تایید نهایی دوره</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <p className="text-xs text-foreground-muted leading-relaxed">
                          در پایان هر ماه ارزیابی، برای اعمال Z-Score واحدها، محاسبه صدک‌ها و فعال‌سازی موتور تساوی‌شکن پرسنل نمونه، دکمه زیر را کلیک کنید.
                        </p>
                        
                        <Button
                          type="button"
                          onClick={handleTriggerNomination}
                          disabled={loadingNomination}
                          className="w-full text-xs font-bold bg-accent hover:bg-accent-hover text-accent-foreground py-2.5 rounded-lg flex items-center justify-center gap-2"
                        >
                          <Activity className="size-4 animate-pulse" />
                          {loadingNomination ? 'در حال محاسبه و نرمال‌سازی...' : 'محاسبه عملکرد و نرمال‌سازی Z-Score'}
                        </Button>
                        
                        <p className="text-[9px] text-foreground-muted text-center">
                          اجرای محاسبات سوابق قبلی را بازنویسی و نتایج نهایی را در Snapshots ذخیره می‌کند.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Active Nomination Congratulation Digital Card */}
                    {activeNomination ? (
                      <Card className="border-2 border-yellow-500 bg-gradient-to-br from-yellow-950/20 to-surface-container shadow-lg relative overflow-hidden p-6 text-center">
                        <div className="absolute -right-6 -top-6 opacity-10">
                          <Trophy className="size-32 text-yellow-500" />
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <Award className="size-12 text-yellow-500 mb-2 animate-pulse" />
                          <Badge className="bg-yellow-500 text-black text-[9px] font-black uppercase tracking-wider mb-2">
                            پرسنل نمونه دوره {toFa(selectedPeriod.replace('-', ' / '))}
                          </Badge>
                          <h4 className="text-xl font-black text-foreground mt-1">
                            {activeNomination.periodEmployee?.name}
                          </h4>
                          <span className="text-xs text-foreground-muted font-semibold">
                            سمت: {((activeNomination.periodEmployee?.customFields as any)?.post) || 'راهبر قطار'}
                          </span>

                          <p className="mt-4 text-[11px] text-foreground-muted leading-relaxed bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/25">
                            <span className="font-bold text-yellow-500">علت انتخاب (تساوی‌شکن):</span><br />
                            {activeNomination.tiebreakerReason}
                          </p>

                          <div className="mt-4 bg-yellow-500/10 text-yellow-500 text-[10px] px-3 py-1.5 rounded-full font-bold inline-block border border-yellow-500/20">
                            کارت تبریک دیجیتال صادر و پاداش HR فعال گردید
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card className="border border-border bg-surface-container-lowest/40 p-6 text-center text-xs text-foreground-muted">
                        <HelpCircle className="size-8 mx-auto mb-2 text-foreground-muted/50" />
                        <span>هنوز هیچ پرسنل نمونه‌ای برای این دوره محاسبه و نهایی نشده است. دکمه محاسبات را کلیک کنید.</span>
                      </Card>
                    )}

                </div>

                </div>

                {/* Catalog & Manage Action Types (Custom actions list & creation) */}
                <Card className="border border-border bg-surface-container-lowest/70 shadow-sm">
                  <CardHeader className="py-4 border-b border-border/40 bg-surface-container-lowest flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Award className="size-4 text-accent" />
                        کاتالوگ و مدیریت عملکردهای پیش‌فرض (تخصیص نمرات سازمان)
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        به عنوان مدیر می‌توانید گزینه‌های جدیدی به منوی عملکردها اضافه کرده و امتیاز پایه و شدت آن را شخصاً تعیین کنید.
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Add Custom Action Form */}
                    <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-l border-border/50 pb-6 lg:pb-0 lg:pl-6 space-y-4">
                      <h4 className="text-xs font-black text-foreground flex items-center gap-1">
                        <Plus className="size-3.5 text-accent" />
                        افزودن نوع عملکرد جدید به منو
                      </h4>
                      <form onSubmit={handleCustomActionSubmit} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-foreground">عنوان عملکرد جدید:</label>
                          <input
                            type="text"
                            placeholder="مثال: مهار حریق یا همکاری داوطلبانه..."
                            value={customAction.title}
                            onChange={(e) => setCustomAction({ ...customAction, title: e.target.value })}
                            className="w-full bg-surface border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-foreground">محور شایستگی مربوطه:</label>
                          <select
                            value={customAction.competencyId}
                            onChange={(e) => setCustomAction({ ...customAction, competencyId: e.target.value })}
                            className="w-full bg-surface border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent cursor-pointer"
                            required
                          >
                            <option value="">-- انتخاب شایستگی --</option>
                            {managerData.competencies.map((comp) => (
                              <option key={comp.id} value={comp.id}>
                                {comp.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">امتیاز پایه پیش‌فرض:</label>
                            <input
                              type="number"
                              placeholder="مثال: 10 یا -15"
                              value={customAction.defaultScore}
                              onChange={(e) => setCustomAction({ ...customAction, defaultScore: Number(e.target.value) })}
                              className="w-full bg-surface border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-foreground">حداکثر شدت مجاز:</label>
                            <select
                              value={customAction.maxSeverity}
                              onChange={(e) => setCustomAction({ ...customAction, maxSeverity: e.target.value as any })}
                              className="w-full bg-surface border border-border rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent cursor-pointer"
                            >
                              <option value="L1">L1 - جزئی</option>
                              <option value="L2">L2 - متوسط</option>
                              <option value="L3">L3 - شدید</option>
                            </select>
                          </div>
                        </div>

                        {customActionError && (
                          <div className="bg-critical/10 border border-critical/30 rounded px-2.5 py-1.5 text-critical text-[10px] flex items-center gap-1">
                            <AlertCircle className="size-3" />
                            <span>{customActionError}</span>
                          </div>
                        )}
                        {customActionSuccess && (
                          <div className="bg-success/10 border border-success/30 rounded px-2.5 py-1.5 text-success text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="size-3" />
                            <span>{customActionSuccess}</span>
                          </div>
                        )}

                        <Button
                          type="submit"
                          disabled={submittingCustomAction}
                          className="w-full text-xs font-bold bg-accent hover:bg-accent-hover text-accent-foreground py-2 rounded transition-colors"
                        >
                          {submittingCustomAction ? 'در حال افزودن...' : 'افزودن و ثبت زنده در منو'}
                        </Button>
                      </form>
                    </div>

                    {/* View existing actions catalog grouped by competency */}
                    <div className="lg:col-span-2 space-y-4 max-h-[340px] overflow-y-auto pr-2">
                      <h4 className="text-xs font-black text-foreground flex items-center gap-1">
                        <FileSpreadsheet className="size-3.5 text-accent" />
                        لیست عملکردهای فعال و ساختار نمرات کنونی خط ۱
                      </h4>
                      <div className="space-y-4">
                        {managerData.competencies.map((comp) => (
                          <div key={comp.id} className="border border-border/50 rounded-lg p-3 bg-surface/30">
                            <h5 className="text-xs font-black text-foreground border-b border-border/40 pb-1.5 mb-2 flex items-center justify-between">
                              <span>{comp.name}</span>
                              <Badge variant="outline" className="text-[9px] font-semibold bg-accent/5 text-accent">
                                {comp.direction === 'positive' ? 'مثبت' : comp.direction === 'negative' ? 'منفی' : 'دوطرفه'}
                              </Badge>
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {comp.actionTypes.map((act) => (
                                <div key={act.id} className="flex items-center justify-between p-2 rounded bg-surface border border-border/30 text-xs">
                                  <span className="font-semibold text-foreground-muted truncate max-w-[170px]" title={act.title}>
                                    {act.title}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <Badge variant="outline" className={`text-[9px] font-mono font-bold ${
                                      act.defaultScore > 0 ? 'bg-success/5 border-success/20 text-success' : 'bg-critical/5 border-critical/20 text-critical'
                                    }`}>
                                      {act.defaultScore > 0 ? `+${toFa(act.defaultScore)}` : `${toFa(act.defaultScore)}`}
                                    </Badge>
                                    <Badge variant="outline" className="text-[8px] opacity-75 font-mono">
                                      {toFa(act.maxSeverity)}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* 2. Appeals Queue Section (HR/Admin Panel) */}
                <Card className="border border-border bg-surface-container-lowest/70 shadow-sm">
                  <CardHeader className="py-4 border-b border-border/40 bg-surface-container-lowest flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <AlertCircle className="size-4 text-warning" />
                        صف بررسی اعتراضات پرسنل به جرایم و کسورات
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        پرسنل می‌توانند ظرف ۷ روز از ثبت جریمه، اعتراض بنویسند. بررسی و رد/تایید آن با HR/مدیر است.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs bg-warning/5 text-warning font-bold">
                      {toFa(pendingAppeals.length)} مورد در انتظار
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4">
                    {loadingAppeals ? (
                      <div className="text-center py-4 text-xs text-foreground-muted">در حال دریافت صف اعتراضات...</div>
                    ) : pendingAppeals.length === 0 ? (
                      <div className="text-center py-6 text-xs text-foreground-muted font-bold flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="size-10 text-success/50" />
                        <span>هیچ اعتراض معلقی در سیستم ثبت نشده است. همه‌چیز تایید و کالیبره است.</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingAppeals.map((app) => (
                          <div key={app.id} className="p-4 rounded-lg border border-border bg-surface flex flex-col md:flex-row md:items-start justify-between gap-4">
                            
                            <div className="space-y-2">
                              {/* Header: Employee & log details */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-foreground">{app.log.employee?.name}</span>
                                <Badge variant="outline" className="text-[9px] bg-critical/5 text-critical border-critical/20 font-bold">
                                  کسر امتیاز بابت: {app.log.actionType?.title} ({toFa(app.log.scoreValue)} امتیاز)
                                </Badge>
                                <span className="text-[10px] text-foreground-muted font-mono">
                                  تاریخ ثبت رویداد: {jalali(app.log.createdAt)}
                                </span>
                              </div>
                              
                              {/* Log note */}
                              {app.log.note && (
                                <p className="text-[10px] text-foreground-muted bg-surface-container-lowest p-2 rounded">
                                  <strong className="text-foreground">یادداشت جریمه مدیر:</strong> {app.log.note}
                                </p>
                              )}

                              {/* Appeal Reason */}
                              <div className="text-[11px] text-foreground-muted bg-warning/5 border border-warning/15 p-3 rounded-lg leading-relaxed">
                                <strong className="text-warning">دلیل و دفاعیه پرسنل:</strong> {app.reason}
                              </div>

                              {/* Review Note text input */}
                              <div className="pt-2 flex items-center gap-2">
                                <span className="text-[10px] text-foreground-muted font-bold shrink-0">یادداشت بررسی مدیر:</span>
                                <input
                                  type="text"
                                  placeholder="علت پذیرش یا رد اعتراض (اختیاری)..."
                                  value={reviewNote[app.id] || ''}
                                  onChange={(e) => setReviewNote({ ...reviewNote, [app.id]: e.target.value })}
                                  className="w-full max-w-md bg-surface-container border border-border rounded px-2 py-1 text-[10px] text-foreground focus:outline-none focus:border-accent"
                                />
                              </div>

                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 shrink-0 self-end md:self-start">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] font-bold text-success border-success/30 hover:bg-success/5 hover:border-success h-8"
                                onClick={() => handleAppealReview(app.id, 'approved')}
                                disabled={submittingReview === app.id}
                              >
                                {submittingReview === app.id ? 'بررسی...' : 'پذیرش اعتراض (ابطال جریمه)'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-[10px] font-bold text-critical border-critical/30 hover:bg-critical/5 hover:border-critical h-8"
                                onClick={() => handleAppealReview(app.id, 'rejected')}
                                disabled={submittingReview === app.id}
                              >
                                {submittingReview === app.id ? 'بررسی...' : 'رد اعتراض (جریمه باقی بماند)'}
                              </Button>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 3. Comparative department statistics (Calibration dashboard) */}
                <Card className="border border-border bg-surface-container-lowest/70 shadow-sm">
                  <CardHeader className="py-4 border-b border-border/40 bg-surface-container-lowest">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <TrendingUp className="size-4 text-accent" />
                      داشبورد کالیبراسیون: میانگین امتیاز عملکرد به تفکیک واحد / سمت
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      برای رصد سوگیری‌های سیستماتیک ارزشیابی مدیران (سخت‌گیری/دست‌ودلبازیش بیش از حد بین واحدها)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 h-64 flex items-center justify-center">
                    {departmentStats.length === 0 ? (
                      <div className="text-xs text-foreground-muted">داده‌ای برای ترسیم نمودار واحدها وجود ندارد</div>
                    ) : (
                      <svg className="w-full h-full max-w-2xl" viewBox="0 0 500 180">
                        {/* Grid lines */}
                        {[0, 0.5, 1].map((ratio, i) => {
                          const y = 20 + 130 * ratio
                          const val = Math.round(150 * (1 - ratio))
                          return (
                            <g key={i} className="opacity-30">
                              <line x1="60" y1={y} x2="480" y2={y} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 3" />
                              <text x="50" y={y + 4} fill="var(--color-foreground-muted)" className="text-[9px]" textAnchor="end">
                                {toFa(val)}
                              </text>
                            </g>
                          )
                        })}

                        {/* Bar charts for each department */}
                        {departmentStats.map((item, idx) => {
                          const maxBarWidth = 46
                          const chartWidth = 420
                          const gap = (chartWidth - maxBarWidth * departmentStats.length) / (departmentStats.length + 1)
                          const x = 60 + gap + (maxBarWidth + gap) * idx
                          const barH = (item.avgScore / 150) * 130
                          const y = 20 + 130 - barH

                          return (
                            <g key={idx} className="group/bar">
                              <rect
                                x={x}
                                y={y}
                                width={maxBarWidth}
                                height={barH}
                                rx="4"
                                fill="var(--color-accent)"
                                fillOpacity="0.75"
                                className="transition-all duration-300 hover:fill-opacity-100 cursor-pointer"
                              />
                              {/* Score text */}
                              <text x={x + maxBarWidth / 2} y={y - 6} fill="var(--color-foreground)" className="text-[9px] font-black" textAnchor="middle">
                                {toFa(item.avgScore)}
                              </text>
                              {/* Department label */}
                              <text x={x + maxBarWidth / 2} y="170" fill="var(--color-foreground-muted)" className="text-[9px] font-bold" textAnchor="middle">
                                {item.name}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    )}
                  </CardContent>
                </Card>

              </div>
            ) : (
              <div className="text-center text-xs text-foreground-muted p-10">داده مدیریتی یافت نشد.</div>
            )}
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* APPEAL REQUEST OVERLAY MODAL */}
      {/* ========================================================================= */}
      {appealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" dir="rtl">
          <Card className="w-full max-w-md border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="py-4 border-b border-border/40 bg-surface-container-lowest">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-critical">
                <AlertCircle className="size-4" />
                ثبت اعتراض رسمی روی رکورد جریمه عملکرد
              </CardTitle>
              <CardDescription className="text-[10px]">
                اعتراض شما مستقیما در کارتابل مدیریت و منابع انسانی خط ۱ قرار گرفته و مورد حسابرسی قرار می‌گیرد.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleAppealSubmit} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">دلایل، شواهد و دفاعیات شما:</label>
                  <textarea
                    required
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="لطفاً مستندات، ساعات شیفت یا عدم انتساب این خطا به خود را با شرح جزئیات و با ادبیات حرفه‌ای بنویسید..."
                    className="w-full bg-surface-container border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent min-h-[120px]"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold"
                    onClick={() => {
                      setAppealModalOpen(false)
                      setAppealReason('')
                      setAppealLogId(null)
                    }}
                  >
                    انصراف و بازگشت
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingAppeal}
                    className="text-xs font-bold bg-critical hover:bg-critical/90 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {submittingAppeal ? 'در حال ثبت...' : 'ثبت قطعی اعتراض'}
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  )
}
