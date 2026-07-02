'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/features/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toFa, jalali, faTime } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { SystemHealthPips } from '@/components/shared/system-health-pips'
import {
  Users,
  Calendar,
  ArrowLeftRight,
  AlertTriangle,
  FileSpreadsheet,
  MessageCircle,
  Newspaper,
  Shield,
  Clock,
  TrendingUp,
  Bot,
  MapPin,
  CheckCircle,
  ClipboardCheck,
  Activity,
  Database,
  ArrowUpRight,
  Info,
  ChevronLeft,
  Server,
  Cpu,
  Volume2,
  VolumeX,
  BellRing,
  Radio,
  Flame,
  ShieldAlert,
  Trophy,
  Sun,
  Wind,
  Plus,
  Send,
  Wrench,
  CheckCircle2,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────

interface DashboardStats {
  users: number
  shifts: number
  pendingSwaps: number
  openTickets: number
  unreadBulletins: number
  unreadNotifications: number
}

interface TodayShift {
  code: string
  note: string | null
}

interface RecentBulletin {
  id: string
  title: string
  createdAt: string
}

interface AnalyticsData {
  kpis: {
    activeUsers: number
    openTickets: number
    criticalTickets: number
    safetyCompliance: number
    mttrMinutes: number
    shiftCoverageRate: number
    totalAssignedShifts: number
  }
  ticketPriorityStats: {
    low: number
    medium: number
    high: number
    critical: number
  }
  ticketStatusStats: {
    open: number
    in_progress: number
    resolved: number
    closed: number
  }
  shiftDistribution: {
    morning: number
    evening: number
    night: number
    off: number
  }
  bulletinEngagement: {
    id: string
    title: string
    readCount: number
    totalExpected: number
    rate: number
  }[]
  weeklyTrends: number[]
  systemHealth: {
    database: string
    latencyMs: number
    uptime: string
    serverTime: string
  }
}

interface MetroStation {
  id: string
  name: string
  status: 'normal' | 'alert' | 'delayed'
  type: string
  crowd: string
  elevator: string
  chief: string
}

interface ActiveTrain {
  id: string
  name: string
  fromStationId: string
  toStationId: string
  progress: number
  speedKmH: number
  status: 'normal' | 'delayed' | 'stopped'
}

interface SCADASubsystem {
  name: string
  key: string
  status: 'normal' | 'alert' | 'warning'
  value: string
  unit?: string
  trend: 'up' | 'down' | 'stable'
}

interface OperationLog {
  id: string
  message: string
  time: string
  type: 'info' | 'success' | 'warning' | 'critical'
}

const STATION_POSITIONS: Record<string, number> = {
  '1': 10,  // تجریش (راست)
  '2': 32,  // قلهک
  '3': 55,  // هفت تیر
  '4': 78,  // امام خمینی
  '5': 93   // کهریزک (چپ)
}

function getTrainPosition(train: ActiveTrain) {
  const fromPos = STATION_POSITIONS[train.fromStationId] ?? 0
  const toPos = STATION_POSITIONS[train.toStationId] ?? 0
  return fromPos + (toPos - fromPos) * (train.progress / 100)
}

// ── Web Audio Synth Alert Sound ────────────────────────────────────

function playAlertSound(type: 'info' | 'warning' | 'success') {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'warning') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1) // C#5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2) // E5
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } else if (type === 'success') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08) // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16) // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } else {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    }
  } catch {
    // audio context not supported
  }
}

function playEmergencyAlarm(active: boolean) {
  if (typeof window === 'undefined' || !active) return
  try {
    const ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(660, ctx.currentTime) // E5
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15) // A5
    osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.3) // E5

    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.45)
  } catch {
    // audio context not supported
  }
}

// ── Recommended Content Widget ─────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  news: 'اخبار',
  blog: 'وبلاگ',
  training: 'آموزش',
  circular: 'بخش‌نامه',
  gallery: 'گالری',
  announcement: 'اطلاعیه',
  directive: 'دستورالعمل',
  form: 'فرم',
}

function RecommendedContentWidget({ accessToken }: { accessToken: string | null }) {
  const [recommended, setRecommended] = useState<Array<{
    id: string; type: string; title: string; slug: string; excerpt: string | null
    coverUrl: string | null; mandatory: boolean; category: string | null; createdAt: string
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    fetch('/api/posts/recommended', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => r.json())
      .then((d) => setRecommended(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [accessToken])

  if (loading || recommended.length === 0) return null

  return (
    <div className="bg-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border/30 pb-2">
        <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Newspaper className="size-4 text-accent" />
          <span>محتوای پیشنهادی برای شما</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {recommended.slice(0, 4).map((post) => (
          <Link key={post.id} href={`/content/${post.slug}`}>
            <div className="p-3 bg-surface/30 hover:bg-surface/50 border border-border/40 rounded-xl transition-all flex flex-col gap-2 cursor-pointer hover:border-accent/30">
              {post.coverUrl && (
                <img src={post.coverUrl} alt="" className="h-20 w-full rounded-lg object-cover" />
              )}
              <div className="flex items-center gap-1.5">
                {post.mandatory && <span className="size-1.5 rounded-full bg-critical animate-pulse" />}
                <span className="text-[9px] text-accent font-semibold">{TYPE_LABELS[post.type] ?? post.type}</span>
              </div>
              <div className="text-[11px] font-bold text-foreground leading-relaxed line-clamp-2">{post.title}</div>
              {post.excerpt && <div className="text-[9px] text-foreground-muted line-clamp-2">{post.excerpt}</div>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Main Dashboard Page ─────────────────────────────────────────────

export default function DashboardPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview')
  
  // General Dashboard States
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    shifts: 0,
    pendingSwaps: 0,
    openTickets: 0,
    unreadBulletins: 0,
    unreadNotifications: 0,
  })
  const [todayShift, setTodayShift] = useState<TodayShift | null>(null)
  const [recentBulletins, setRecentBulletins] = useState<RecentBulletin[]>([])
  const [loading, setLoading] = useState(true)

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')

  // Control Room Features (Emergency & Announcements)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [marqueeIndex, setMarqueeIndex] = useState(0)
  
  const [bannerConfig, setBannerConfig] = useState<{ enabled: boolean; url: string; link: string } | null>(null)

  // Interactive Live Dispatcher Console States
  const [broadcastInput, setBroadcastInput] = useState('')
  const [announcements, setAnnouncements] = useState([
    'خط ۱ مترو: عملیات و اعزام قطارها طبق برنامه عادی سیر در حال انجام است.',
    'تذکر ایمنی: راهبران گرامی، رعایت فواصل مجاز سر فاصله‌ها در ساعات پیک شلوغی الزامی است.',
    'آماده‌باش فنی: آماده‌باش فنی اکیپ‌های تعمیرات پایانه فتح‌آباد جهت پایداری کامل تجهیزات ریلی.',
    'بخشنامه جدید: بخشنامه ایمنی شماره ۱۴۰۵/۱۲/۲۴ در کارتابل قرار گرفت. تایید و امضای آن الزامی است.',
  ])

  // Schematic Subway Map States
  const [selectedStation, setSelectedStation] = useState<MetroStation | null>(null)
  const [stations, setStations] = useState<MetroStation[]>([
    { id: '1', name: 'تجریش', status: 'normal', type: 'ایستگاه مبدا (شمال)', crowd: 'کم', elevator: 'فعال', chief: 'مهندس حسینی' },
    { id: '2', name: 'قلهک', status: 'normal', type: 'ایستگاه میانی صخره‌ای', crowd: 'متوسط', elevator: 'فعال', chief: 'مهندس رضایی' },
    { id: '3', name: 'هفت تیر', status: 'normal', type: 'ایستگاه تقاطعی شلوغ', crowd: 'زیاد', elevator: 'در دست تعمیر', chief: 'مهندس قاسمی' },
    { id: '4', name: 'امام خمینی', status: 'normal', type: 'مرکزی / تقاطعی با خط ۲', crowd: 'بسیار زیاد', elevator: 'فعال', chief: 'مهندس مرادی' },
    { id: '5', name: 'کهریزک', status: 'normal', type: 'ایستگاه پایانه جنوبی', crowd: 'کم', elevator: 'فعال', chief: 'مهندس جلالی' },
  ])

  // Active trains simulation state
  const [trains, setTrains] = useState<ActiveTrain[]>([
    { id: 'T-101', name: 'T-101', fromStationId: '1', toStationId: '2', progress: 10, speedKmH: 55, status: 'normal' },
    { id: 'T-102', name: 'T-102', fromStationId: '3', toStationId: '4', progress: 45, speedKmH: 60, status: 'normal' },
    { id: 'T-103', name: 'T-103', fromStationId: '5', toStationId: '4', progress: 80, speedKmH: 48, status: 'normal' },
  ])

  // SCADA Subsystems state
  const [scadaSystems, setScadaSystems] = useState<SCADASubsystem[]>([
    { name: 'برق ریل سوم (Traction Power)', key: 'traction', status: 'normal', value: '745', unit: 'V DC', trend: 'stable' },
    { name: 'سیگنالینگ و ATP/ATO', key: 'signaling', status: 'normal', value: 'عادی / خودکار', trend: 'stable' },
    { name: 'تهویه تونل‌ها (Ventilation)', key: 'ventilation', status: 'normal', value: '1850', unit: 'm³/s', trend: 'stable' },
    { name: 'شبکه بیسیم اتاق فرمان (OCC Radio)', key: 'radio', status: 'normal', value: '98', unit: '٪ کیفیت سیگنال', trend: 'stable' },
  ])

  // Operation Logs for Control Command Center
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([
    { id: '1', message: 'سیستم شبیه‌ساز عملیات خط ۱ مترو راه‌اندازی شد.', time: faTime(new Date()), type: 'info' },
    { id: '2', message: 'پایش زیرساخت‌های SCADA در حال دریافت اطلاعات است.', time: faTime(new Date()), type: 'info' },
  ])

  const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  // Fetch real dashboard data from API
  useEffect(() => {
    if (!accessToken) return
    fetch('/api/dashboard', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((json) => {
        const d = json?.data
        if (!d) return
        if (d.stations?.length) setStations(d.stations)
        if (d.trains?.length) setTrains(d.trains)
        if (d.scadaSystems?.length) setScadaSystems(d.scadaSystems)
        if (d.recentAuditLogs?.length) setOperationLogs(d.recentAuditLogs)
      })
      .catch(() => {})
  }, [accessToken])
  
  // Fetch banner configuration
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((json) => {
        if (json?.data?.mobile?.dashboardBanner) {
          setBannerConfig(json.data.mobile.dashboardBanner)
        }
      })
      .catch(() => {})
  }, [])

  // Sync Station Status with Emergency Mode
  useEffect(() => {
    setStations((prev) =>
      prev.map((st) => {
        if (emergencyMode) {
          if (st.name === 'امام خمینی') return { ...st, status: 'alert', crowd: 'بحرانی (تخلیه اضطراری)' }
          if (st.name === 'هفت تیر') return { ...st, status: 'delayed', crowd: 'متوقف شده' }
        } else {
          if (st.name === 'امام خمینی') return { ...st, status: 'normal', crowd: 'بسیار زیاد' }
          if (st.name === 'هفت تیر') return { ...st, status: 'normal', crowd: 'زیاد' }
        }
        return { ...st, status: 'normal' }
      })
    )
    if (selectedStation) {
      const updated = stations.find((s) => s.id === selectedStation.id)
      if (updated) setSelectedStation(updated)
    }
  }, [emergencyMode])

  // Rotate announcements
  useEffect(() => {
    const timer = setInterval(() => {
      setMarqueeIndex((prev) => (prev + 1) % announcements.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [announcements])

  // Emergency sound alert loop
  useEffect(() => {
    if (!emergencyMode || !audioEnabled) return
    const timer = setInterval(() => {
      playEmergencyAlarm(true)
    }, 2500)
    return () => clearInterval(timer)
  }, [emergencyMode, audioEnabled])

  // Active trains simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTrains((prevTrains) =>
        prevTrains.map((train) => {
          let nextProgress = train.progress + (emergencyMode ? 2 : 5) // Faster/slower progress
          let nextFrom = train.fromStationId
          let nextTo = train.toStationId

          if (nextProgress >= 100) {
            nextProgress = 0
            const fromNum = parseInt(train.fromStationId)
            const toNum = parseInt(train.toStationId)

            if (fromNum < toNum) {
              // Moving south (1 -> 5)
              if (toNum === 5) {
                // Turn around
                nextFrom = '5'
                nextTo = '4'
              } else {
                nextFrom = toNum.toString()
                nextTo = (toNum + 1).toString()
              }
            } else {
              // Moving north (5 -> 1)
              if (toNum === 1) {
                // Turn around
                nextFrom = '1'
                nextTo = '2'
              } else {
                nextFrom = toNum.toString()
                nextTo = (toNum - 1).toString()
              }
            }
          }

          // Randomize speed slightly to look real
          const speedChange = Math.floor(Math.random() * 9) - 4
          const newSpeed = Math.max(30, Math.min(80, train.speedKmH + speedChange))

          return {
            ...train,
            progress: nextProgress,
            fromStationId: nextFrom,
            toStationId: nextTo,
            speedKmH: newSpeed,
          }
        })
      )
    }, 1500)
    return () => clearInterval(interval)
  }, [emergencyMode])

  // SCADA subsystems Simulation
  useEffect(() => {
    const scadaInterval = setInterval(() => {
      setScadaSystems((prev) =>
        prev.map((sys) => {
          if (emergencyMode) {
            if (sys.key === 'traction') return { ...sys, status: 'warning', value: '712', trend: 'down' }
            if (sys.key === 'signaling') return { ...sys, status: 'alert', value: 'کنترل دستی (فرمان موضعی)', trend: 'down' }
            if (sys.key === 'ventilation') return { ...sys, status: 'normal', value: '2400', trend: 'up' }
            if (sys.key === 'radio') return { ...sys, status: 'warning', value: '82', trend: 'down' }
          } else {
            if (sys.key === 'traction') {
              const val = 740 + Math.floor(Math.random() * 11) - 5
              return { ...sys, status: val < 735 ? 'warning' : 'normal', value: val.toString(), trend: val > 745 ? 'up' : val < 740 ? 'down' : 'stable' }
            }
            if (sys.key === 'ventilation') {
              const val = 1800 + Math.floor(Math.random() * 101) - 50
              return { ...sys, status: 'normal', value: val.toString(), trend: val > 1850 ? 'up' : val < 1800 ? 'down' : 'stable' }
            }
            if (sys.key === 'radio') {
              const val = 95 + Math.floor(Math.random() * 5)
              return { ...sys, status: 'normal', value: val.toString(), trend: 'stable' }
            }
            if (sys.key === 'signaling') {
              return { ...sys, status: 'normal', value: 'عادی / خودکار', trend: 'stable' }
            }
          }
          return sys
        })
      )
    }, 3000)
    return () => clearInterval(scadaInterval)
  }, [emergencyMode])

  // 1. Fetch general overview stats
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const headers = { Authorization: `Bearer ${accessToken}` }

        const [usersRes, swapsRes, ticketsRes, bulletinsRes, shiftsRes] =
          await Promise.all([
            fetch('/api/users?pageSize=1', { headers }),
            fetch('/api/swap-requests/inbox', { headers }),
            fetch('/api/tickets', { headers }),
            fetch('/api/bulletins/pending', { headers }),
            fetch('/api/shifts/me', { headers }),
          ])

        const [usersData, swapsData, ticketsData, bulletinsData, shiftsData] =
          await Promise.all([
            usersRes.ok ? usersRes.json() : { data: { total: 0 } },
            swapsRes.ok ? swapsRes.json() : { data: [] },
            ticketsRes.ok ? ticketsRes.json() : { data: { stats: { open: 0 } } },
            bulletinsRes.ok ? bulletinsRes.json() : { data: [] },
            shiftsRes.ok ? shiftsRes.json() : { data: [] },
          ])

        if (!cancelled) {
          const today = new Date().toISOString().split('T')[0]
          const todayShiftData = Array.isArray(shiftsData.data)
            ? shiftsData.data.find(
                (s: { date: string }) => s.date?.startsWith(today),
              )
            : null

          setStats({
            users: usersData.data?.total ?? 0,
            shifts: 0,
            pendingSwaps: Array.isArray(swapsData.data) ? swapsData.data.length : 0,
            openTickets: ticketsData.data?.stats?.open ?? 0,
            unreadBulletins: Array.isArray(bulletinsData.data) ? bulletinsData.data.length : 0,
            unreadNotifications: 0,
          })

          setTodayShift(todayShiftData ?? null)
          setRecentBulletins(
            Array.isArray(bulletinsData.data) ? bulletinsData.data.slice(0, 3) : [],
          )
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [accessToken])

  // 2. Fetch detailed system analytics
  useEffect(() => {
    if (activeTab === 'analytics' && isAdmin && !analyticsData) {
      setLoadingAnalytics(true)
      setAnalyticsError('')
      fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('خطا در دریافت اطلاعات تحلیلی سیستم')
          return res.json()
        })
        .then((json) => {
          setAnalyticsData(json.data)
        })
        .catch((err) => {
          setAnalyticsError(err.message || 'خطا در ارتباط با سرور')
        })
        .finally(() => {
          setLoadingAnalytics(false)
        })
    }
  }, [activeTab, isAdmin, accessToken, analyticsData])

  const shiftLabel: Record<string, string> = {
    morning: 'صبح',
    evening: 'عصر',
    night: 'شب',
    off: 'استراحت',
  }

  const quickActions = [
    { label: 'پیشخوان رویدادهای زنده', href: '/admin/live-actions', icon: Activity, adminOnly: true, glow: true },
    { label: 'چک‌لیست حرکت قطارها', href: '/checklists', icon: ClipboardCheck },
    { label: 'گفت‌وگو و بیسیم متنی', href: '/chat', icon: MessageCircle },
    { label: 'اخبار و آموزش علمی', href: '/content', icon: Newspaper },
    { label: 'دستیار هوشمند AI', href: '/ai', icon: Bot },
    { label: 'بخشنامه‌های ایمنی', href: '/admin/bulletins', icon: Shield, adminOnly: true },
    { label: 'بارگذاری فایل لوحه', href: '/roster/upload', icon: FileSpreadsheet, adminOnly: true },
  ]

  // Broadcast command dispatcher
  const handlePublishBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastInput.trim()) return
    setAnnouncements((prev) => [broadcastInput.trim(), ...prev])
    setMarqueeIndex(0)
    setBroadcastInput('')
    playAlertSound('warning')
  }

  const handleDispatchBackupTrain = () => {
    if (trains.length >= 6) return
    const nextNum = trains.length + 1
    const trainId = `T-10${nextNum}`
    const newTrain: ActiveTrain = {
      id: trainId,
      name: trainId,
      fromStationId: '1',
      toStationId: '2',
      progress: 0,
      speedKmH: 50,
      status: 'normal'
    }
    setTrains((prev) => [...prev, newTrain])
    playAlertSound('success')
    setOperationLogs((prev) => [
      {
        id: Math.random().toString(),
        message: `فرمان اعزام قطار کمکی صادر شد: قطار ${toFa(trainId)} روی خط آهن خط ۱ قرار گرفت.`,
        time: faTime(new Date()),
        type: 'success'
      },
      ...prev
    ])
  }

  const handleAdjustHeadway = () => {
    const nextHeadway = Math.floor(Math.random() * 3) + 2
    playAlertSound('info')
    setOperationLogs((prev) => [
      {
        id: Math.random().toString(),
        message: `سرفاصله زمانی اعزام قطارها (Headway) به ${toFa(nextHeadway)} دقیقه تنظیم گردید.`,
        time: faTime(new Date()),
        type: 'info'
      },
      ...prev
    ])
  }

  const handleTriggerEscalatorFault = () => {
    playAlertSound('warning')
    const stationNames = ['تجریش', 'قلهک', 'هفت تیر', 'امام خمینی', 'کهریزک']
    const randStation = stationNames[Math.floor(Math.random() * stationNames.length)]
    
    setStats(prev => ({ ...prev, openTickets: prev.openTickets + 1 }))
    
    setOperationLogs((prev) => [
      {
        id: Math.random().toString(),
        message: `خطای سخت‌افزاری: نقص فنی در پله‌برقی شمالی ایستگاه ${randStation} ثبت گردید.`,
        time: faTime(new Date()),
        type: 'warning'
      },
      ...prev
    ])
  }

  // Render SVG Weekly Trend Area Chart
  function renderWeeklyTrendsChart(trends: number[]) {
    const maxVal = Math.max(...trends, 5)
    const width = 500
    const height = 180
    const top = 20
    const bottom = 30
    const left = 45
    const right = 20
    const chartW = width - left - right
    const chartH = height - top - bottom

    const points = trends.map((val, idx) => {
      const x = left + (chartW * idx) / 3
      const y = top + chartH - (val / maxVal) * chartH
      return { x, y }
    })

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const fillPath = `${linePath} L ${points[points.length - 1].x} ${top + chartH} L ${points[0].x} ${top + chartH} Z`

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio, i) => {
          const y = top + chartH * ratio
          const gridVal = Math.round(maxVal * (1 - ratio))
          return (
            <g key={i} className="opacity-40">
              <line x1={left} y1={y} x2={width - right} y2={y} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
              <text x={left - 8} y={y + 4} fill="var(--color-foreground-muted)" className="text-[10px] font-mono text-end" textAnchor="end">
                {toFa(gridVal)}
              </text>
            </g>
          )
        })}
        <path d={fillPath} fill="url(#trendGradient)" />
        <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i} className="group/point">
            <circle cx={p.x} cy={p.y} r="5" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.5" className="transition-all duration-200 hover:r-7 cursor-pointer" />
            <text x={p.x} y={p.y - 12} fill="var(--color-foreground)" className="text-[10px] font-bold opacity-0 group-hover/point:opacity-100 transition-opacity bg-surface px-1 py-0.5 rounded shadow" textAnchor="middle">
              {toFa(trends[i])}
            </text>
          </g>
        ))}
        {['۴ هفته قبل', '۳ هفته قبل', '۲ هفته قبل', 'هفته اخیر'].map((lbl, i) => {
          const x = left + (chartW * i) / 3
          return (
            <text key={i} x={x} y={height - 8} fill="var(--color-foreground-muted)" className="text-[10px] font-semibold" textAnchor="middle">
              {lbl}
            </text>
          )
        })}
      </svg>
    )
  }

  // Render SVG Shift Distribution Bar Chart
  function renderShiftDistributionChart(shifts: { morning: number; evening: number; night: number; off: number }) {
    const data = [shifts.morning, shifts.evening, shifts.night, shifts.off]
    const maxVal = Math.max(...data, 5)
    const width = 500
    const height = 180
    const top = 20
    const bottom = 30
    const left = 40
    const right = 20
    const chartW = width - left - right
    const chartH = height - top - bottom
    const barWidth = 46
    const gap = (chartW - barWidth * 4) / 5

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio, i) => {
          const y = top + chartH * ratio
          const gridVal = Math.round(maxVal * (1 - ratio))
          return (
            <g key={i} className="opacity-40">
              <line x1={left} y1={y} x2={width - right} y2={y} stroke="var(--color-border)" strokeWidth="1" />
              <text x={left - 8} y={y + 4} fill="var(--color-foreground-muted)" className="text-[10px] font-mono" textAnchor="end">
                {toFa(gridVal)}
              </text>
            </g>
          )
        })}
        {data.map((val, i) => {
          const barH = (val / maxVal) * chartH
          const x = left + gap + (barWidth + gap) * i
          const y = top + chartH - barH
          return (
            <g key={i} className="group/bar">
              <rect x={x} y={y} width={barWidth} height={barH} rx="5" fill="url(#barGradient)" className="transition-all duration-300 hover:fill-accent-hover cursor-pointer" />
              <text x={x + barWidth / 2} y={y - 6} fill="var(--color-foreground)" className="text-[10px] font-bold text-center" textAnchor="middle">
                {toFa(val)}
              </text>
            </g>
          )
        })}
        {['صبح', 'عصر', 'شب', 'استراحت'].map((lbl, i) => {
          const x = left + gap + (barWidth + gap) * i + barWidth / 2
          return (
            <text key={i} x={x} y={height - 8} fill="var(--color-foreground-muted)" className="text-[10px] font-semibold" textAnchor="middle">
              {lbl}
            </text>
          )
        })}
      </svg>
    )
  }

  // Render SVG Ticket Priority Donut Chart
  function renderPriorityDonut(priors: { low: number; medium: number; high: number; critical: number }) {
    const total = priors.low + priors.medium + priors.high + priors.critical
    const slices = [
      { value: priors.critical, color: 'var(--color-critical)', label: 'بحرانی' },
      { value: priors.high, color: 'var(--color-warning)', label: 'بالا' },
      { value: priors.medium, color: 'var(--color-info)', label: 'متوسط' },
      { value: priors.low, color: 'var(--color-foreground-muted)', label: 'پایین' },
    ].filter((s) => s.value > 0)

    if (total === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center h-full">
          <CheckCircle className="size-10 text-success/60 mb-2" />
          <span className="text-xs text-foreground-muted">هیچ تیکت فعالی ثبت نشده است.</span>
        </div>
      )
    }

    const radius = 55
    const circ = 2 * Math.PI * radius
    let accumulatedPercent = 0

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-2 h-full">
        <div className="relative w-36 h-36 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="transparent" stroke="var(--color-border)" strokeWidth="12" className="opacity-30" />
            {slices.map((slice, idx) => {
              const share = slice.value / total
              const strokeOffset = circ - share * circ
              const rotation = (accumulatedPercent * 360) / 100
              accumulatedPercent += share * 100
              return (
                <circle
                  key={idx}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="13"
                  strokeDasharray={circ}
                  strokeDashoffset={strokeOffset}
                  transform={`rotate(${rotation} 70 70)`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold font-mono text-foreground">{toFa(total)}</span>
            <span className="text-[9px] text-foreground-muted font-medium">تیکت فعال</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-[140px]">
          {slices.map((slice, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="text-foreground-muted">{slice.label}</span>
              </div>
              <span className="font-mono text-foreground">{toFa(slice.value)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-1 flex-col gap-5 p-4 lg:p-6 transition-all duration-500',
        emergencyMode && 'bg-critical/5 shadow-inner shadow-critical/5',
      )}
      dir="rtl"
    >
      {/* ── Mobile PWA Dashboard (matches mobile app experience) ─────────── */}
      <div className="flex md:hidden flex-col gap-5 w-full">
        {/* Compact greeting card */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-3">
            <img 
              src={user?.customFields?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3-83sYQfLES0gmvDO5q2w28Raab5S1KepqfdSRMpxZnef78ytjqK2n-NdvYbNjQS_ca544VkccdbSdSpqgoRryJucwTRlS5GxTmUFbVKeezJ1QkeNGF0xe6zNAU4TXydoyFGGOhEl5FdxzcPCCHoPZT84FY-8OQlEniA0nZHCon-Db2rkNuNlkkufryldM1drCGtAjfTeaYeTT-yhX3Cp1zI12skUoqT9lhAWWGomB57lbAnzwP0gimpOjbQlw6053Iws6FeBdLtL'} 
              alt="Avatar" 
              className="size-11 rounded-full border-2 border-accent object-cover" 
            />
            <div className="text-right">
              <h2 className="text-sm font-black text-foreground">سلام، {user?.name?.split(' ')[0] || 'همکار'} عزیز</h2>
              <span className="text-[10px] text-foreground-muted mt-0.5 block">{jalali(new Date())}</span>
            </div>
          </div>
        </div>

        {/* Shift Card */}
        <Link href="/shifts">
          <div className="relative overflow-hidden bg-surface-container-low/60 border border-border-subtle/50 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all">
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="size-4 text-amber-500" />
                <span>شیفت امروز</span>
              </span>
              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold">
                {todayShift ? (shiftLabel[todayShift.code] ?? todayShift.code) : 'نامشخص'}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-lg font-black text-foreground font-mono">۰۷:۰۰ - ۱۹:۰۰</span>
                <div className="flex items-center gap-1 text-[10px] text-foreground-muted mt-1">
                  <MapPin className="size-3.5" />
                  <span>ایستگاه امام خمینی</span>
                </div>
              </div>
              <span className="text-[10px] text-accent font-bold flex items-center gap-1 bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                <span className="size-1.5 bg-accent rounded-full animate-ping" />
                در انتظار حضور
              </span>
            </div>
          </div>
        </Link>

        {/* Quick Access Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-foreground text-right px-1">دسترسی سریع</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'اعلام خرابی', href: '/tickets', icon: AlertTriangle, iconColor: 'text-red-500', bgClass: 'bg-red-500/10', borderClass: 'border-red-500/20' },
              { label: 'لوحه شیفت', href: '/shifts', icon: Calendar, iconColor: 'text-sky-500', bgClass: 'bg-sky-500/10', borderClass: 'border-sky-500/20' },
              { label: 'دفتر تلفن', href: '/directory', icon: Users, iconColor: 'text-teal-500', bgClass: 'bg-teal-500/10', borderClass: 'border-teal-500/20' },
              { label: 'بخشنامه‌ها', href: '/content', icon: Newspaper, iconColor: 'text-orange-500', bgClass: 'bg-orange-500/10', borderClass: 'border-orange-500/20' },
              { label: 'دستیار AI', href: '/ai', icon: Bot, iconColor: 'text-violet-500', bgClass: 'bg-violet-500/10', borderClass: 'border-violet-500/20' },
              { label: 'بی‌سیم', href: '/comms/radio', icon: Radio, iconColor: 'text-blue-500', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-500/20' },
              { label: 'چک‌لیست‌ها', href: '/checklists', icon: ClipboardCheck, iconColor: 'text-green-500', bgClass: 'bg-green-500/10', borderClass: 'border-green-500/20' },
              { label: 'SOS اضطراری', href: '/crisis', icon: ShieldAlert, iconColor: 'text-red-600', bgClass: 'bg-red-600/10', borderClass: 'border-red-600/20' },
              { label: 'حضور و غیاب', href: '/attendance', icon: MapPin, iconColor: 'text-emerald-500', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20' },
              { label: 'آموزش پرسنل', href: '/learning/exams', icon: Trophy, iconColor: 'text-indigo-500', bgClass: 'bg-indigo-500/10', borderClass: 'border-indigo-500/20' },
              { label: 'کارنامه عملکرد', href: '/performance', icon: TrendingUp, iconColor: 'text-orange-600', bgClass: 'bg-orange-600/10', borderClass: 'border-orange-600/20' },
              { label: 'اعلان‌ها', href: '/notifications', icon: BellRing, iconColor: 'text-pink-500', bgClass: 'bg-pink-500/10', borderClass: 'border-pink-500/20' },
            ].map((service, index) => (
              <Link href={service.href} key={index}>
                <div className="bg-surface-container-low/60 border border-border-subtle/50 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition-all min-h-[90px] hover:bg-surface-container-high/40">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center border", service.bgClass, service.borderClass)}>
                    <service.icon className={cn("size-5", service.iconColor)} />
                  </div>
                  <span className="text-[10px] font-bold text-foreground leading-tight">{service.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Dynamic Banner (if enabled) */}
        {bannerConfig?.enabled && (
          <a 
            href={bannerConfig.link || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full relative h-24 rounded-2xl overflow-hidden shadow-sm border border-border/20 block active:scale-[0.98] transition-all"
          >
            <img 
              src={bannerConfig.url || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80"} 
              alt="Dashboard Banner" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 right-4 text-white text-right">
              <h2 className="text-xs font-black text-white">شرکت بهره‌برداری راه‌آهن شهری حومه و تهران</h2>
              <p className="text-[9px] text-white/80 mt-0.5">پیشخوان مدیریت و کنترل عملیات - خط ۱</p>
            </div>
          </a>
        )}

        {/* Monthly Overview metrics */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-foreground text-right px-1 font-sans">نمای کلی ماه</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low/60 border border-border-subtle/50 rounded-2xl p-4 flex items-center justify-between">
              <div className="text-right">
                <span className="text-[10px] text-foreground-muted block font-sans">تیکت‌های باز</span>
                <span className="text-lg font-black text-foreground font-mono mt-1 block">{toFa(stats.openTickets)}</span>
              </div>
              <div className="size-9 rounded-lg bg-[#dc2626]/10 flex items-center justify-center border border-[#dc2626]/20">
                <AlertTriangle className="size-4.5 text-[#dc2626]" />
              </div>
            </div>
            <div className="bg-surface-container-low/60 border border-border-subtle/50 rounded-2xl p-4 flex items-center justify-between">
              <div className="text-right">
                <span className="text-[10px] text-foreground-muted block font-sans">اعلان جدید</span>
                <span className="text-lg font-black text-foreground font-mono mt-1 block">{toFa(stats.unreadBulletins)}</span>
              </div>
              <div className="size-9 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Newspaper className="size-4.5 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop Command Dashboard ────────────────────────────────────── */}
      <div className="hidden md:flex flex-col gap-5 w-full">
        {/* ── Dispatcher Live Announcement Ticker ─────────────────────────── */}
        <div className="w-full bg-surface-container-low/60 border border-border-subtle/50 rounded-xl p-3 flex items-center justify-between gap-3 overflow-hidden backdrop-blur">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          <span className="text-[10px] font-black text-accent uppercase tracking-wider">دیسپچینگ خط ۱</span>
        </div>
        <div className="flex-1 overflow-hidden relative h-5">
          <div
            key={marqueeIndex}
            className="text-[11px] text-foreground font-semibold truncate animate-in slide-in-from-bottom-3 duration-300"
          >
            {announcements[marqueeIndex]}
          </div>
        </div>
        <div className="text-[9px] text-foreground-muted font-mono shrink-0">
          {faTime(new Date())}
        </div>
      </div>

      {/* ── Top Command Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-lg font-black text-foreground">اتاق فرمان و عملیات خط ۱</h1>
          <p className="text-xs text-foreground-muted mt-1">
            خوش‌آمدید، {user?.name || 'همکار گرامی'} • دسترسی سریع به پنل‌ها و وضعیت خط
          </p>
        </div>

        <div className="flex items-center gap-2">
          {emergencyMode && (
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="h-9 w-9 rounded-lg border border-border/50 bg-background/50 hover:bg-surface-container-high text-foreground flex items-center justify-center cursor-pointer transition"
              title={audioEnabled ? 'قطع صدای هشدار' : 'وصل صدای هشدار'}
            >
              {audioEnabled ? <Volume2 className="size-4 text-critical animate-pulse" /> : <VolumeX className="size-4" />}
            </button>
          )}

          <button
            onClick={() => setEmergencyMode(!emergencyMode)}
            className={cn(
              'h-9 px-4 rounded-lg text-xs font-black flex items-center gap-2 cursor-pointer transition-all duration-300 border shadow-sm',
              emergencyMode
                ? 'bg-critical text-critical-foreground border-critical animate-pulse'
                : 'bg-surface-container-low text-foreground-muted border-border hover:bg-surface-container-high hover:text-foreground',
            )}
          >
            <Flame className={cn('size-4', emergencyMode ? 'animate-bounce' : 'text-foreground-muted')} />
            <span>{emergencyMode ? 'لغو وضعیت بحران و اضطرار' : 'اعلام وضعیت بحران (SOS)'}</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher (Admins only) */}
      {isAdmin && (
        <div className="flex border-b border-border/40 pb-1 gap-4 justify-start">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-accent text-accent font-black'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
          >
            پیشخوان عملیاتی
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-accent text-accent font-black'
                : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
          >
            نمودارهای تحلیلی و شاخص‌ها (KPIs)
          </button>
        </div>
      )}

      {/* ── Emergency SOS Alert Banner ──────────────────────────────────── */}
      {emergencyMode && (
        <div className="w-full bg-critical/20 border border-critical/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex gap-4 items-start">
            <div className="size-12 rounded-xl bg-critical/25 text-critical flex items-center justify-center shrink-0 animate-pulse">
              <ShieldAlert className="size-6 text-critical" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">هشدار وضعیت بحرانی ریلی فعال است (سطح ۲ آماده‌باش)</h3>
              <p className="text-[11px] text-foreground/80 mt-1.5 leading-relaxed">
                پروتکل تخلیه اضطراری و آماده‌باش تیم‌های دیسپچینگ فعال گردیده است. کلیه راهبران و اپراتورها موظف به برقراری ارتباط مداوم رادیویی از کانال‌های پشتیبان می‌باشند.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href="/crisis"
              className="h-8 px-3.5 bg-critical text-critical-foreground text-[10px] font-black rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:bg-critical/90 transition"
            >
              <span>اتاق کنترل مدیریت بحران</span>
            </Link>
            <Link
              href="/admin/live-actions"
              className="h-8 px-3.5 bg-background border border-critical/30 text-foreground text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer hover:bg-surface-container-high transition"
            >
              <span>پیشخوان رویدادهای زنده</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Web Dashboard Banner ───────────────────────────────────────── */}
      {!emergencyMode && bannerConfig?.enabled && (
        <a 
          href={bannerConfig.link || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full relative h-32 md:h-48 rounded-2xl overflow-hidden mb-2 shadow-sm border border-border/20 block hover:opacity-95 transition-opacity"
        >
          <img 
            src={bannerConfig.url || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80"} 
            alt="Dashboard Banner" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-4 right-6 text-white text-right">
            <h2 className="text-lg font-black text-white">شرکت بهره‌برداری راه‌آهن شهری حومه و تهران</h2>
            <p className="text-xs text-white/80 mt-1">پیشخوان مدیریت و کنترل عملیات - خط ۱</p>
          </div>
        </a>
      )}

      {activeTab === 'overview' ? (
        <>
          {/* ── Top Level Widgets: Operational Stats, Weather, and Top Driver ─ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            
            {/* Live Line Status Card */}
            <div className="bg-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
              <h2 className="text-xs font-bold text-foreground-muted flex items-center gap-2">
                <Activity className="size-4 text-accent" />
                <span>وضعیت عملکرد خط یک</span>
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-black text-foreground">
                    {emergencyMode ? 'آماده‌باش اضطراری' : 'سیر و حرکت عادی'}
                  </div>
                  <div className="text-[10px] text-foreground-muted mt-1">ترافیک و اعزام‌ها طبق برنامه</div>
                </div>
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-1',
                  emergencyMode ? 'bg-critical/15 text-critical animate-pulse' : 'bg-success/15 text-success'
                )}>
                  <CheckCircle className="size-3" />
                  {emergencyMode ? 'بحرانی' : 'سبز'}
                </span>
              </div>
            </div>

            {/* Shift Duty Card */}
            <div className="bg-gradient-to-br from-accent/20 to-accent/5 backdrop-blur border border-accent/20 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-foreground-muted flex items-center gap-2">
                  <Clock className="size-4 text-accent" />
                  <span>شیفت بعدی من</span>
                </h2>
                <Badge variant="outline" className="border-accent/30 text-accent font-bold text-[8px]">برنامه لوحه</Badge>
              </div>
              {todayShift ? (
                <div>
                  <div className="text-base font-black text-foreground">
                    {shiftLabel[todayShift.code] ?? todayShift.code}
                  </div>
                  {todayShift.note && (
                    <div className="text-[10px] text-foreground-muted mt-1.5 flex items-center gap-1">
                      <MapPin className="size-3" />
                      <span>{todayShift.note}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm font-black text-foreground-muted">شیفتی ثبت نشده</div>
              )}
            </div>

            {/* Weather & Operating Conditions Widget */}
            <div className="bg-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-foreground-muted flex items-center gap-2">
                  <Sun className="size-4 text-warning" />
                  <span>پایش شرایط اقلیمی تهران</span>
                </h2>
                <span className="text-[8px] bg-warning/15 border border-warning/30 text-warning px-2 py-0.5 rounded-full font-bold">پیک روزانه</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-foreground">دمای هوا: ۲۸°C</div>
                  <div className="text-[9px] text-foreground-muted mt-1 flex items-center gap-1">
                    <Wind className="size-3" />
                    <span>شاخص آلایندگی: ۱۰۴ (ناسالم حساس)</span>
                  </div>
                </div>
                <div className="text-[8px] text-warning bg-warning/5 border border-warning/10 p-1.5 rounded-lg text-center max-w-[80px]">
                  افزایش تهویه واگن‌ها
                </div>
              </div>
            </div>

            {/* Top Driver Highlight (Gamification Card) */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/0 border border-yellow-500/25 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-yellow-500 flex items-center gap-1.5">
                  <Trophy className="size-4 text-yellow-500" />
                  <span>راهبر برتر ماه خط ۱</span>
                </h2>
                <span className="text-[8px] bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded-full font-bold">طلایی</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-foreground">کاپیتان رضا علوی</div>
                  <div className="text-[9px] text-foreground-muted mt-1 font-semibold">طی مسیر: ۲,۴۵۰ کیلومتر بدون خطا</div>
                </div>
                <div className="font-mono text-xs font-black text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded px-1.5 py-0.5">
                  ۹۹.۵٪
                </div>
              </div>
            </div>

          </div>

          {/* ── Schematic Metro Line 1 Station Status Track Map ────────────── */}
          <div className="bg-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-5 shadow-sm space-y-5">
            <div>
              <h2 className="text-xs font-black text-foreground flex items-center gap-2">
                <Radio className="size-4 text-accent animate-pulse" />
                <span>نقشه تعاملی و مانیتورینگ زنده قطارها (ATS)</span>
              </h2>
              <p className="text-[10px] text-foreground-muted mt-1">
                پایش خودکار و موقعیت قطارهای فعال روی خط آهن خط ۱ مترو تهران به صورت زنده.
              </p>
            </div>

            {/* Train Line SVG Track */}
            <div className="flex flex-col lg:flex-row items-center gap-6 justify-between pt-2">
              <div className="flex-1 w-full bg-surface-container-high/30 border border-border/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-around gap-6 relative min-h-[120px]">
                {/* Connecting Track Line */}
                <div className="absolute left-6 right-6 h-1.5 bg-border/40 rounded-full hidden sm:block">
                  <div className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    emergencyMode ? "bg-critical/60 shadow-[0_0_10px_var(--color-critical)] animate-pulse w-full" : "bg-accent/40 w-full"
                  )} />
                </div>
                <div className="absolute top-6 bottom-6 w-1 bg-border/40 sm:hidden"></div>

                {/* Train Icons Floating on the track (Desktop only for precision) */}
                {trains.map((train) => {
                  const rightOffset = getTrainPosition(train)
                  return (
                    <div
                      key={train.id}
                      className="absolute -top-3 z-30 transition-all duration-1000 ease-linear cursor-pointer hidden sm:flex flex-col items-center group"
                      style={{ right: `${rightOffset}%` }}
                    >
                      {/* Train Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-surface-container-high border border-border rounded px-2 py-1 text-[9px] font-black text-foreground shadow-lg transition-opacity pointer-events-none whitespace-nowrap z-50 flex flex-col items-center">
                        <span>قطار {toFa(train.name)}</span>
                        <span className="text-[8px] text-foreground-muted font-normal mt-0.5">سرعت: {toFa(train.speedKmH)} کیلومتر بر ساعت</span>
                      </div>

                      {/* Physical train pip */}
                      <div className={cn(
                        "size-6 rounded-lg bg-surface border-2 flex items-center justify-center shadow-lg relative transition-transform hover:scale-110",
                        emergencyMode ? "border-critical shadow-critical/20" : "border-accent shadow-accent/20"
                      )}>
                        <Activity className={cn(
                          "size-3",
                          emergencyMode ? "text-critical animate-bounce" : "text-accent animate-pulse"
                        )} />
                        <span className={cn(
                          "absolute -top-0.5 -right-0.5 size-2 rounded-full",
                          emergencyMode ? "bg-critical animate-ping" : "bg-accent animate-ping"
                        )} />
                      </div>
                      <span className="text-[8px] font-mono font-bold mt-1 text-foreground/80 bg-surface-container-high/80 px-1 rounded border border-border/30">
                        {toFa(train.name)}
                      </span>
                    </div>
                  )
                })}

                {/* Stations buttons */}
                {stations.map((st, i) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStation(st)}
                    className={cn(
                      'relative z-10 size-11 rounded-full border-2 bg-background flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 shadow-lg',
                      st.status === 'normal' && 'border-success hover:border-success-hover shadow-success/10',
                      st.status === 'alert' && 'border-critical hover:border-critical/80 shadow-critical/20 animate-pulse',
                      st.status === 'delayed' && 'border-warning hover:border-warning-hover shadow-warning/20',
                      selectedStation?.id === st.id && 'ring-4 ring-accent/30 scale-105',
                    )}
                  >
                    <span className={cn(
                      'size-3 rounded-full',
                      st.status === 'normal' && 'bg-success',
                      st.status === 'alert' && 'bg-critical',
                      st.status === 'delayed' && 'bg-warning',
                    )}></span>

                    {/* Farsi labels */}
                    <div className="absolute -bottom-6 sm:bottom-auto sm:-top-6 text-[10px] font-bold text-foreground whitespace-nowrap">
                      {st.name}
                    </div>
                  </button>
                ))}
              </div>

              {/* Station Detail Box */}
              <div className="w-full lg:w-80 h-44 bg-surface-container-low/80 border border-border/50 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
                {selectedStation ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <span className="text-xs font-black text-foreground">{selectedStation.name}</span>
                        <span className={cn(
                          'text-[9px] px-2 py-0.5 rounded font-bold',
                          selectedStation.status === 'normal' && 'bg-success/10 text-success border border-success/20',
                          selectedStation.status === 'alert' && 'bg-critical/15 text-critical border border-critical/30',
                          selectedStation.status === 'delayed' && 'bg-warning/10 text-warning border border-warning/20',
                        )}>
                          {selectedStation.status === 'normal' ? 'عادی' : selectedStation.status === 'alert' ? 'هشدار تخلیه' : 'کندی حرکت'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 mt-3 text-[10px] text-foreground-muted">
                        <div>رئیس ایستگاه: <span className="text-foreground font-semibold">{selectedStation.chief}</span></div>
                        <div>آسانسورها: <span className="text-foreground font-semibold">{selectedStation.elevator}</span></div>
                        <div className="col-span-2">حجم مسافران: <span className="text-foreground font-bold">{selectedStation.crowd}</span></div>
                        <div className="col-span-2">نوع ایستگاه: <span className="text-foreground">{selectedStation.type}</span></div>
                      </div>
                    </div>
                    <Link
                      href="/admin/infrastructure"
                      className="text-[9px] text-accent font-bold hover:underline flex items-center gap-1.5 self-end"
                    >
                      <span>مدیریت دارایی و خرابی فنی ایستگاه</span>
                      <ChevronLeft className="size-3" />
                    </Link>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-foreground-muted space-y-2">
                    <Activity className="size-6 text-foreground-muted/40 animate-pulse" />
                    <span className="text-[10px]">یک ایستگاه را روی ریل انتخاب کنید تا اطلاعات اتاق مانیتورینگ آن بارگذاری شود.</span>
                  </div>
                )}
              </div>
            </div>

            {/* List of active trains for detailed tracking */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border/20 pt-4">
              {trains.map((train) => {
                const fromStation = stations.find((s) => s.id === train.fromStationId)?.name
                const toStation = stations.find((s) => s.id === train.toStationId)?.name
                return (
                  <div key={train.id} className="p-3 bg-surface/30 border border-border/30 rounded-xl flex items-center justify-between gap-2 shadow-sm hover:border-accent/40 transition">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "size-2 rounded-full",
                        train.status === 'normal' ? 'bg-success animate-pulse' : 'bg-critical'
                      )} />
                      <div>
                        <span className="text-[10px] font-black text-foreground">قطار {toFa(train.name)}</span>
                        <p className="text-[8px] text-foreground-muted mt-0.5">سیر: {fromStation} ← {toStation}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="text-[9px] font-mono font-bold text-accent">{toFa(train.progress)}٪</span>
                      <p className="text-[8px] text-foreground-muted mt-0.5 font-semibold">{toFa(train.speedKmH)} km/h</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── SCADA Subsystem Diagnostics Grid ────────────────────────────── */}
          <div className="bg-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-2">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Database className="size-4 text-accent" />
                <span>سامانه دیسپچینگ و پایش لحظه‌ای زیرساخت‌ها (SCADA)</span>
              </h2>
              <span className={cn(
                "text-[8px] px-2 py-0.5 rounded-full font-bold",
                emergencyMode ? "bg-critical/15 text-critical" : "bg-success/15 text-success"
              )}>
                {emergencyMode ? "هشدار سیستمی فعال" : "وضعیت زیرساخت: نرمال"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {scadaSystems.map((sys) => (
                <div
                  key={sys.key}
                  className="bg-surface/30 p-4 rounded-xl border border-border/20 flex flex-col justify-between gap-3 shadow-sm hover:border-accent/25 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-foreground-muted">{sys.name}</span>
                    <span className={cn(
                      "size-2 rounded-full",
                      sys.status === 'normal' && 'bg-success',
                      sys.status === 'warning' && 'bg-warning',
                      sys.status === 'alert' && 'bg-critical animate-ping'
                    )} />
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-sm font-black text-foreground font-mono">
                        {toFa(sys.value)}
                      </span>
                      {sys.unit && (
                        <span className="text-[9px] text-foreground-muted me-1 font-semibold">
                          {sys.unit}
                        </span>
                      )}
                    </div>

                    <span className={cn(
                      "text-[9px] font-bold",
                      sys.trend === 'up' && 'text-success',
                      sys.trend === 'down' && 'text-critical',
                      sys.trend === 'stable' && 'text-foreground-muted'
                    )}>
                      {sys.trend === 'up' && '↑ افزایشی'}
                      {sys.trend === 'down' && '↓ کاهشی'}
                      {sys.trend === 'stable' && '↔ پایدار'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Dispatcher Quick Control Center & Commands ─────────────────── */}
          {isAdmin && (
            <div className="bg-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Wrench className="size-4 text-accent" />
                  <span>کنسول فرمان‌های فرماندهی و اعزام سریع دیسپچینگ</span>
                </h2>
                <Badge variant="outline" className="border-accent/20 text-accent text-[8px] font-mono">ADMIN CONTROL</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleDispatchBackupTrain}
                  disabled={trains.length >= 6}
                  className={cn(
                    "h-11 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 border shadow-sm transition active:scale-[0.98] cursor-pointer",
                    trains.length >= 6
                      ? "bg-surface-container-high border-border text-foreground-muted cursor-not-allowed"
                      : "bg-gradient-to-r from-success/15 to-success/5 border-success/30 text-success hover:border-success/60 hover:from-success/20"
                  )}
                >
                  <Plus className="size-4" />
                  <span>اعزام رام قطار کمکی (پشتیبان)</span>
                </button>

                <button
                  onClick={handleAdjustHeadway}
                  className="h-11 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-accent/15 to-accent/5 border border-accent/30 text-accent hover:border-accent/60 hover:from-accent/20 flex items-center justify-center gap-2 border shadow-sm transition active:scale-[0.98] cursor-pointer"
                >
                  <Clock className="size-4" />
                  <span>تنظیم مجدد سرفاصله خط (Headway)</span>
                </button>

                <button
                  onClick={handleTriggerEscalatorFault}
                  className="h-11 px-4 rounded-xl text-xs font-black bg-gradient-to-r from-warning/15 to-warning/5 border border-warning/30 text-warning hover:border-warning/60 hover:from-warning/20 flex items-center justify-center gap-2 border shadow-sm transition active:scale-[0.98] cursor-pointer"
                >
                  <AlertTriangle className="size-4" />
                  <span>اعلام شبیه‌ساز نقص فنی پله‌برقی</span>
                </button>
              </div>

              {/* Live Operational Action Log */}
              <div className="bg-surface/30 rounded-xl p-3.5 border border-border/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-foreground-muted">تاریخچه وقایع عملیاتی فرماندهی (زنده)</span>
                  <span className="size-2 rounded-full bg-success animate-pulse" />
                </div>
                <div className="space-y-1.5 max-h-24 overflow-y-auto divide-y divide-border/10">
                  {operationLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-[9px] pt-1.5 first:pt-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          log.type === 'success' && 'bg-success',
                          log.type === 'warning' && 'bg-warning',
                          log.type === 'critical' && 'bg-critical',
                          log.type === 'info' && 'bg-info'
                        )} />
                        <span className="text-foreground font-semibold">{log.message}</span>
                      </div>
                      <span className="text-foreground-muted font-mono">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Broadcast Command input */}
              <form onSubmit={handlePublishBroadcast} className="flex gap-2 pt-2 border-t border-border/10">
                <input
                  type="text"
                  placeholder="متن پیام جدید برای تابلو روان و بیسیم سراسری خط یک را وارد کنید..."
                  value={broadcastInput}
                  onChange={(e) => setBroadcastInput(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-xs text-foreground outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="h-10 px-4 bg-accent text-accent-foreground text-xs font-black rounded-lg flex items-center gap-1.5 cursor-pointer shadow hover:bg-accent-hover transition animate-pulse"
                >
                  <Send className="size-3.5" />
                  <span>انتشار بیانیه</span>
                </button>
              </form>
            </div>
          )}

          {/* Bento Stats and Recent Bulletins */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Quick stats list */}
            <div className="bg-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-foreground-muted">آمار عمومی صف‌های تایید</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface/30 p-3 rounded-xl border border-border/20">
                  <div className="text-[10px] text-foreground-muted">پرسنل کل</div>
                  <div className="text-base font-black font-mono text-foreground">{toFa(stats.users)}</div>
                </div>
                <div className="bg-surface/30 p-3 rounded-xl border border-border/20">
                  <div className="text-[10px] text-foreground-muted">تیکت خرابی فعال</div>
                  <div className="text-base font-black font-mono text-accent">{toFa(stats.openTickets)}</div>
                </div>
                <div className="bg-surface/30 p-3 rounded-xl border border-border/20">
                  <div className="text-[10px] text-foreground-muted">درخواست تعویض شیفت</div>
                  <div className="text-base font-black font-mono text-warning">{toFa(stats.pendingSwaps)}</div>
                </div>
                <div className="bg-surface/30 p-3 rounded-xl border border-border/20">
                  <div className="text-[10px] text-foreground-muted">بخشنامه‌های ایمنی</div>
                  <div className="text-base font-black font-mono text-critical">{toFa(stats.unreadBulletins)}</div>
                </div>
              </div>
            </div>

            {/* Recent bulletins listing */}
            {recentBulletins.length > 0 && (
              <div className="lg:col-span-2 bg-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Shield className="size-4 text-accent" />
                    <span>بخشنامه‌های ایمنی سیر و حرکت (امضا الزامی)</span>
                  </h2>
                  <AlertTriangle className="size-4 text-accent animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recentBulletins.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-surface/30 hover:bg-surface/50 border border-border/40 rounded-xl transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="text-[11px] font-bold text-foreground leading-relaxed truncate">{b.title}</div>
                        <div className="text-[9px] text-foreground-muted font-mono mt-1.5">{jalali(b.createdAt)}</div>
                      </div>
                      <Link
                        href="/admin/bulletins"
                        className="text-[9px] text-accent font-bold hover:underline flex items-center gap-1 self-start"
                      >
                        <span>مطالعه و امضا</span>
                        <ChevronLeft className="size-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommended Content Widget */}
          <RecommendedContentWidget accessToken={accessToken} />

          {/* Quick Access Menu Grid */}
          <div className="bg-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-foreground-muted">دسترسی سریع پرسنلی و مدیریتی</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {quickActions
                .filter((a) => !a.adminOnly || isAdmin)
                .map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-bold transition-all hover:bg-surface-container-high active:scale-[0.97]',
                      action.glow
                        ? 'border-accent/40 bg-accent/5 text-accent hover:border-accent shadow shadow-accent/5'
                        : 'border-border/40 bg-surface/20 text-foreground hover:border-accent/30',
                    )}
                  >
                    <action.icon className={cn('size-4 shrink-0', action.glow ? 'text-accent' : 'text-foreground-muted')} />
                    <span className="truncate">{action.label}</span>
                  </Link>
                ))}
            </div>
          </div>
        </>
      ) : (
        /* ── Advanced Analytical Dashboard (KPIs & Charts) ──────────────── */
        <div className="space-y-6 animate-in fade-in duration-300">
          {loadingAnalytics ? (
            <div className="flex flex-col items-center justify-center p-24 gap-3 bg-surface-container-low/20 border border-border-subtle/30 rounded-2xl">
              <Activity className="size-10 animate-spin text-accent" />
              <span className="text-xs text-foreground-muted">در حال بارگذاری و تحلیل کلان‌داده‌های راه‌آهن شهری...</span>
            </div>
          ) : analyticsError ? (
            <div className="bg-critical/10 border border-critical/30 rounded-2xl p-4 text-critical text-xs text-center flex items-center justify-center gap-2">
              <AlertTriangle className="size-5" />
              <span>{analyticsError}</span>
            </div>
          ) : analyticsData ? (
            <>
              {/* Operational KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-border/40 bg-surface-container-low/30 backdrop-blur shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-foreground-muted">نرخ تعهد ایمنی بخشنامه</span>
                      <h4 className="text-xl font-black text-foreground font-mono">
                        {toFa(analyticsData.kpis.safetyCompliance)}٪
                      </h4>
                      <p className="text-[9px] text-success flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
                        منطبق با پروتکل ایمنی
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-success/15 text-success">
                      <Shield className="size-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/40 bg-surface-container-low/30 backdrop-blur shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-foreground-muted">خرابی‌های فعال ریلی</span>
                      <h4 className="text-xl font-black text-accent font-mono">
                        {toFa(analyticsData.kpis.openTickets)} تیکت
                      </h4>
                      {analyticsData.kpis.criticalTickets > 0 ? (
                        <p className="text-[9px] text-critical flex items-center gap-1 font-semibold animate-pulse">
                          <AlertTriangle className="size-3 shrink-0 text-critical" />
                          {toFa(analyticsData.kpis.criticalTickets)} مورد بحرانی فعال
                        </p>
                      ) : (
                        <p className="text-[9px] text-success flex items-center gap-1 font-semibold">
                          <CheckCircle className="size-3" />
                          فاقد نقص بحرانی
                        </p>
                      )}
                    </div>
                    <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
                      <AlertTriangle className="size-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/40 bg-surface-container-low/30 backdrop-blur shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-foreground-muted">پوشش شیفت‌های لوحه</span>
                      <h4 className="text-xl font-black text-foreground font-mono">
                        {toFa(analyticsData.kpis.shiftCoverageRate)}٪
                      </h4>
                      <p className="text-[9px] text-foreground-muted">
                        پوشش سراسری خط ۱ مترو
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-info/15 text-info">
                      <Calendar className="size-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/40 bg-surface-container-low/30 backdrop-blur shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-foreground-muted">پایداری عملیات (MTTR)</span>
                      <h4 className="text-xl font-black text-foreground font-mono">
                        {toFa(analyticsData.kpis.mttrMinutes)} دقیقه
                      </h4>
                      <p className="text-[9px] text-success flex items-center gap-0.5 font-semibold">
                        <TrendingUp className="size-3" />
                        بهبود ۱۲ درصدی حل نقص
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                      <Clock className="size-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-border/40 bg-surface-container-low/30 backdrop-blur shadow-sm">
                  <CardHeader className="py-4 border-b border-border/40 bg-surface-container-low/40">
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                      <TrendingUp className="size-4 text-accent" />
                      روند هفتگی نقایص فنی گزارش شده
                    </CardTitle>
                    <CardDescription className="text-[9px]">
                      تعداد خرابی‌های ثبت شده در کل خط به تفکیک هفته (۴ هفته اخیر)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 h-52 flex items-center justify-center">
                    {renderWeeklyTrendsChart(analyticsData.weeklyTrends)}
                  </CardContent>
                </Card>

                <Card className="border border-border/40 bg-surface-container-low/30 backdrop-blur shadow-sm">
                  <CardHeader className="py-4 border-b border-border/40 bg-surface-container-low/40">
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                      <Users className="size-4 text-accent" />
                      توزیع شیفتی پرسنل در سازمان کار
                    </CardTitle>
                    <CardDescription className="text-[9px]">
                      تعداد پرسنل تخصیص یافته به کدهای شیفتی خط یک
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 h-52 flex items-center justify-center">
                    {renderShiftDistributionChart(analyticsData.shiftDistribution)}
                  </CardContent>
                </Card>

                <Card className="border border-border/40 bg-surface-container-low/30 backdrop-blur shadow-sm">
                  <CardHeader className="py-4 border-b border-border/40 bg-surface-container-low/40">
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                      <AlertTriangle className="size-4 text-accent" />
                      شدت اولویت نقایص فنی فعال
                    </CardTitle>
                    <CardDescription className="text-[9px]">
                      سهم تیکت‌های خرابی باز بر اساس اولویت
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 h-52">
                    {renderPriorityDonut(analyticsData.ticketPriorityStats)}
                  </CardContent>
                </Card>

                <Card className="border border-border/40 bg-surface-container-low/30 backdrop-blur shadow-sm flex flex-col justify-between">
                  <CardHeader className="py-4 border-b border-border/40 bg-surface-container-low/40">
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                      <Shield className="size-4 text-accent" />
                      میزان امضا و تعهد بخشنامه‌های ایمنی سیر
                    </CardTitle>
                    <CardDescription className="text-[9px]">
                      تعهد و امضای بخشنامه‌های اخیر توسط کادر فعال خط یک
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 flex-1 flex flex-col justify-center gap-3.5">
                    {analyticsData.bulletinEngagement.length === 0 ? (
                      <div className="text-center text-xs text-foreground-muted py-8">هیچ بخشنامه ایمنی یافت نشد.</div>
                    ) : (
                      analyticsData.bulletinEngagement.map((b) => (
                        <div key={b.id} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-foreground">
                            <span className="truncate max-w-[280px]">{b.title}</span>
                            <span className="font-mono text-accent">{toFa(b.rate)}٪</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all duration-500"
                              style={{ width: `${b.rate}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-foreground-muted">
                            {toFa(b.readCount)} امضا از مجموع {toFa(b.totalExpected)} پرسنل فعال
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* System Infrastructure Monitor Card */}
              <Card className="border border-border/40 bg-surface-container-low/30 backdrop-blur shadow-sm">
                <CardHeader className="py-4 border-b border-border/40 bg-surface-container-low/40">
                  <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                    <Activity className="size-4 text-accent" />
                    پایش زیرساخت سخت‌افزاری و پایگاه‌داده سامانه
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/30 bg-surface/30">
                    <Database className="size-5 text-success shrink-0" />
                    <div>
                      <h5 className="text-[10px] font-bold text-foreground-muted">اتصال پایگاه‌داده</h5>
                      <span className="text-xs font-black text-foreground">
                        برقرار (SQLite Realtime)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/30 bg-surface/30">
                    <Server className="size-5 text-success shrink-0" />
                    <div>
                      <h5 className="text-[10px] font-bold text-foreground-muted">زمان پاسخ‌دهی سرور</h5>
                      <span className="text-xs font-black text-foreground font-mono">
                        {toFa(analyticsData.systemHealth.latencyMs)} میلی‌ثانیه
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/30 bg-surface/30">
                    <Cpu className="size-5 text-success shrink-0" />
                    <div>
                      <h5 className="text-[10px] font-bold text-foreground-muted">پایداری سرورها (Uptime)</h5>
                      <span className="text-xs font-black text-foreground font-mono">
                        {toFa(analyticsData.systemHealth.uptime)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center text-xs text-foreground-muted py-12">خطا در بارگذاری اطلاعات تحلیلی.</div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
