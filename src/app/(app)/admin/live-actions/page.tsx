'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/features/auth'
import { toFa, jalali, faTime } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { TopAppBar } from '@/components/shared/top-app-bar'
import {
  Bell,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Activity,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Shield,
  ArrowLeftRight,
  Trophy,
  History,
  Sparkles,
  Zap,
  Check,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  Radio,
  FileSpreadsheet,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────

interface PendingUser {
  id: string
  nationalId: string
  name: string
  phone: string | null
  email: string | null
  createdAt: string
  role: {
    id: string
    key: string
    name: string
  }
}

interface PendingSwap {
  id: string
  requesterId: string
  targetId: string
  sourceShiftId: string
  targetShiftId: string
  status: string
  note: string | null
  createdAt: string
  requester: {
    id: string
    name: string
    nationalId: string
  }
  target: {
    id: string
    name: string
    nationalId: string
  }
  sourceShift: {
    id: string
    date: string
    code: string
  }
  targetShift: {
    id: string
    date: string
    code: string
  }
}

interface PendingAppeal {
  id: string
  logId: string
  employeeId: string
  reason: string
  status: string
  reviewedById: string | null
  note: string | null
  createdAt: string
  employee: {
    id: string
    name: string
    nationalId: string
  }
  log: {
    id: string
    scoreValue: number
    note: string | null
    actionType: {
      id: string
      title: string
    }
  }
}

interface AuditLogEntry {
  id: string
  actorId: string
  entity: string
  entityId: string
  action: string
  before: any
  after: any
  createdAt: string
  actor: {
    id: string
    name: string
    role: {
      name: string
      key: string
    }
  }
}

interface RoleOption {
  id: string
  key: string
  name: string
}

interface DBStatusData {
  pendingUsers: PendingUser[]
  pendingSwapRequests: PendingSwap[]
  pendingAppeals: PendingAppeal[]
  recentAuditLogs: AuditLogEntry[]
  roles: RoleOption[]
}

// ── Web Audio Synth Alert Sound ────────────────────────────────────

function playAlertSound(type: 'info' | 'warning' | 'success') {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'warning') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
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
      osc.frequency.setValueAtTime(440, ctx.currentTime) // A4
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
    }
  } catch (e) {
    console.warn('Audio Context blocked or unsupported:', e)
  }
}

// ── Main Page Component ────────────────────────────────────────────

export default function LiveActionsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  
  // Real DB States
  const [users, setUsers] = useState<PendingUser[]>([])
  const [swaps, setSwaps] = useState<PendingSwap[]>([])
  const [appeals, setAppeals] = useState<PendingAppeal[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [loading, setLoading] = useState(true)

  // Interactive Live Features
  const [pollingActive, setPollingActive] = useState(true)
  const [simulatorActive, setSimulatorActive] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'swaps' | 'appeals' | 'logs'>('all')

  const isTab = (tab: string) => activeTab === 'all' || activeTab === tab

  // Notification and Action States
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({})
  const [appealNotes, setAppealNotes] = useState<Record<string, string>>({})
  const [toastMessages, setToastMessages] = useState<{ id: string; title: string; body: string; type: 'info' | 'warning' }[]>([])

  // Tracking seen items to trigger alerts only on actual additions
  const knownIdsRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)

  // Initialize permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission()
      setNotificationPermission(res)
    }
  }

  const triggerToast = (title: string, body: string, type: 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToastMessages((prev) => [{ id, title, body, type }, ...prev])
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((m) => m.id !== id))
    }, 5000)

    if (audioEnabled) {
      playAlertSound(type === 'warning' ? 'warning' : 'info')
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, dir: 'rtl', lang: 'fa-IR' })
    }
  }

  // ── Fetch Function ───────────────────────────────────────────────

  async function loadLiveData(silent = false) {
    if (!accessToken) return
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/live-actions', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        const data = json.data as DBStatusData

        setUsers(data.pendingUsers)
        setSwaps(data.pendingSwapRequests)
        setAppeals(data.pendingAppeals)
        setAuditLogs(data.recentAuditLogs)
        setRoles(data.roles)

        // Check for new items to sound notification
        let hasNew = false
        const currentIds = new Set<string>()

        data.pendingUsers.forEach((u) => {
          currentIds.add(u.id)
          if (!knownIdsRef.current.has(u.id)) {
            if (initializedRef.current) {
              triggerToast('ثبت‌نام جدید پرسنل', `کاربر جدید «${u.name}» با کدملی ${toFa(u.nationalId)} ثبت‌نام کرده و منتظر تایید است.`, 'warning')
              hasNew = true
            }
            knownIdsRef.current.add(u.id)
          }
        })

        data.pendingSwapRequests.forEach((s) => {
          currentIds.add(s.id)
          if (!knownIdsRef.current.has(s.id)) {
            if (initializedRef.current) {
              triggerToast('درخواست جدید جابجایی شیفت', `درخواست جابجایی از طرف «${s.requester.name}» ثبت شد.`, 'info')
              hasNew = true
            }
            knownIdsRef.current.add(s.id)
          }
        })

        data.pendingAppeals.forEach((a) => {
          currentIds.add(a.id)
          if (!knownIdsRef.current.has(a.id)) {
            if (initializedRef.current) {
              triggerToast('اعتراض جدید به نمره عملکرد', `پرسنل «${a.employee.name}» به ثبت خطا اعتراض کرده است.`, 'info')
              hasNew = true
            }
            knownIdsRef.current.add(a.id)
          }
        })

        // Clean up stale IDs from known sets
        knownIdsRef.current.forEach((id) => {
          if (!currentIds.has(id) && !id.startsWith('mock-')) {
            knownIdsRef.current.delete(id)
          }
        })

        initializedRef.current = true
        setLastUpdated(new Date())
      }
    } catch (e) {
      console.error('Error fetching live control data:', e)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Initial Load
  useEffect(() => {
    void loadLiveData()
  }, [accessToken])

  // Polling Effect (every 8 seconds)
  useEffect(() => {
    if (!pollingActive || !accessToken) return
    const timer = setInterval(() => {
      void loadLiveData(true)
    }, 8000)
    return () => clearInterval(timer)
  }, [pollingActive, accessToken])

  // ── Simulator Effect ──────────────────────────────────────────────

  useEffect(() => {
    if (!simulatorActive) return
    const timer = setInterval(() => {
      // Pick random simulated event
      const events = ['user', 'swap', 'appeal']
      const type = events[Math.floor(Math.random() * events.length)]
      const id = 'mock-' + Math.random().toString(36).substring(2, 9)

      if (type === 'user') {
        const mockNames = ['مرتضی کاظمی', 'وحید صادقی', 'مهدی ابراهیمی']
        const name = mockNames[Math.floor(Math.random() * mockNames.length)]
        const nationalId = '008' + Math.floor(1000000 + Math.random() * 9000000)
        const newUser: PendingUser = {
          id,
          name,
          nationalId,
          phone: '0912' + Math.floor(1000000 + Math.random() * 9000000),
          email: 'simulated@metro.ir',
          createdAt: new Date().toISOString(),
          role: { id: 'temp', key: 'operator', name: 'اپراتور' },
        }
        setUsers((prev) => [newUser, ...prev])
        triggerToast('ثبت‌نام جدید (شبیه‌سازی)', `کاربر جدید «${name}» ثبت‌نام کرد. (شبیه‌ساز)`, 'warning')
      } else if (type === 'swap') {
        const mockNames = ['سعید رضایی', 'احسان قاسمی', 'امیر مرادی']
        const name1 = mockNames[Math.floor(Math.random() * mockNames.length)]
        const name2 = 'کاربر هدف'
        const newSwap: PendingSwap = {
          id,
          requesterId: 'req-sim',
          targetId: 'target-sim',
          sourceShiftId: 's-sim',
          targetShiftId: 't-sim',
          status: 'pending',
          note: 'نیاز به استراحت به علت شیفت فشرده قبلی',
          createdAt: new Date().toISOString(),
          requester: { id: 'req-sim', name: name1, nationalId: '123' },
          target: { id: 'target-sim', name: name2, nationalId: '456' },
          sourceShift: { id: 's-sim', date: new Date().toISOString(), code: 'morning' },
          targetShift: { id: 't-sim', date: new Date().toISOString(), code: 'night' },
        }
        setSwaps((prev) => [newSwap, ...prev])
        triggerToast('درخواست جابجایی شیفت (شبیه‌سازی)', `درخواست جابجایی از طرف «${name1}» ثبت شد. (شبیه‌ساز)`, 'info')
      } else {
        const mockNames = ['علیرضا جلالی', 'سهراب احمدی', 'حامد طاهری']
        const name = mockNames[Math.floor(Math.random() * mockNames.length)]
        const newAppeal: PendingAppeal = {
          id,
          logId: 'log-sim',
          employeeId: 'emp-sim',
          reason: 'تاخیر به دلیل تاخیر در قطار اعزام همکار رخ داده و مدارک پیوست است',
          status: 'pending',
          reviewedById: null,
          note: null,
          createdAt: new Date().toISOString(),
          employee: { id: 'emp-sim', name, nationalId: '987' },
          log: {
            id: 'log-sim',
            scoreValue: -5,
            note: 'تاخیر ورود به شیفت',
            actionType: { id: 'act-sim', title: 'تاخیر ورود به خدمت' },
          },
        }
        setAppeals((prev) => [newAppeal, ...prev])
        triggerToast('اعتراض به عملکرد (شبیه‌سازی)', `پرسنل «${name}» اعتراض ثبت کرد. (شبیه‌ساز)`, 'info')
      }
    }, 18000)

    return () => clearInterval(timer)
  }, [simulatorActive])

  // ── Operations Trigger ───────────────────────────────────────────

  async function handleApproveUser(userId: string) {
    if (!accessToken) return
    const roleKey = selectedRoles[userId] || 'operator'
    setActionLoading(userId)
    try {
      // If it's a mocked user, resolve locally
      if (userId.startsWith('mock-')) {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        setNotification({ type: 'success', text: 'کاربر شبیه‌سازی شده با موفقیت تایید شد.' })
        if (audioEnabled) playAlertSound('success')
        return
      }

      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ roleKey }),
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: 'حساب کاربری پرسنل با موفقیت فعال شد.' })
        setUsers((prev) => prev.filter((u) => u.id !== userId))
        if (audioEnabled) playAlertSound('success')
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در تایید کاربر' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSwapDecision(swapId: string, decision: 'approved' | 'rejected') {
    if (!accessToken) return
    setActionLoading(swapId)
    try {
      if (swapId.startsWith('mock-')) {
        setSwaps((prev) => prev.filter((s) => s.id !== swapId))
        setNotification({ type: 'success', text: `درخواست جابجایی شبیه‌سازی با موفقیت ${decision === 'approved' ? 'تایید' : 'رد'} شد.` })
        if (audioEnabled) playAlertSound('success')
        return
      }

      const res = await fetch('/api/swap-requests/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ swapRequestId: swapId, decision }),
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: decision === 'approved' ? 'درخواست جابجایی تایید و در تقویم اعمال شد.' : 'درخواست جابجایی رد شد.' })
        setSwaps((prev) => prev.filter((s) => s.id !== swapId))
        if (audioEnabled) playAlertSound('success')
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در اعمال تصمیم جابجایی' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleAppealDecision(appealId: string, status: 'approved' | 'rejected') {
    if (!accessToken) return
    const note = appealNotes[appealId] || ''
    setActionLoading(appealId)
    try {
      if (appealId.startsWith('mock-')) {
        setAppeals((prev) => prev.filter((a) => a.id !== appealId))
        setNotification({ type: 'success', text: `اعتراض شبیه‌سازی شده با موفقیت ${status === 'approved' ? 'تایید' : 'رد'} شد.` })
        if (audioEnabled) playAlertSound('success')
        return
      }

      const res = await fetch(`/api/admin/performance/appeal/${appealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status, note }),
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', text: status === 'approved' ? 'اعتراض پذیرفته و نمره خطا اصلاح شد.' : 'اعتراض رد شد.' })
        setAppeals((prev) => prev.filter((a) => a.id !== appealId))
        if (audioEnabled) playAlertSound('success')
      } else {
        setNotification({ type: 'error', text: json.error || 'خطا در ثبت تصمیم اعتراض' })
      }
    } catch {
      setNotification({ type: 'error', text: 'خطا در ارتباط با سرور' })
    } finally {
      setActionLoading(null)
    }
  }

  // Manual Trigger Force Load
  const handleForceRefresh = () => {
    void loadLiveData()
    triggerToast('بروزرسانی دستی', 'وضعیت کل صف‌ها از پایگاه‌داده واکشی مجدد شد.')
  }

  return (
    <div className="flex-1 space-y-6 p-4 lg:p-6" dir="rtl">
      <TopAppBar title="پیشخوان عملیات و رویدادهای زنده" subtitle="مرکز فرماندهی، تایید درخواست‌ها و رویدادهای زنده خط ۱ مترو" showHealth={true} />

      {/* Floating System Messages */}
      {notification && (
        <div
          className={cn(
            'fixed bottom-4 left-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-md',
            notification.type === 'success'
              ? 'bg-success/20 border border-success/40 text-success-foreground'
              : 'bg-critical/20 border border-critical/40 text-critical-foreground',
          )}
        >
          {notification.type === 'success' ? <CheckCircle2 className="size-5 shrink-0" /> : <XCircle className="size-5 shrink-0" />}
          <div className="text-xs font-semibold">{notification.text}</div>
          <button onClick={() => setNotification(null)} className="text-[10px] underline ms-2 hover:opacity-80">بستن</button>
        </div>
      )}

      {/* Floating Interactive Toast Ticker */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toastMessages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'p-4 rounded-xl border shadow-xl flex gap-3 animate-in fade-in slide-in-from-right-4 duration-300 backdrop-blur-md bg-surface-container-high/90',
              msg.type === 'warning' ? 'border-accent/40 text-accent' : 'border-info/30 text-info',
            )}
          >
            <Bell className="size-5 shrink-0 animate-bounce" />
            <div>
              <div className="text-xs font-bold">{msg.title}</div>
              <div className="text-[11px] text-foreground/80 mt-1">{msg.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Dashboard Operations & Controls Panel ───────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3 bg-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                {pollingActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                )}
                <span className={cn('relative inline-flex rounded-full h-3 w-3', pollingActive ? 'bg-accent' : 'bg-foreground-muted/50')}></span>
              </span>
              <h2 className="text-sm font-bold text-foreground">مرکز پایش و کنترل زنده</h2>
              <span className="text-[10px] bg-accent/15 border border-accent/30 text-accent px-2 py-0.5 rounded-full font-bold">زنده</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Force refresh */}
              <button
                onClick={handleForceRefresh}
                className="h-9 px-3 rounded-lg border border-border/50 hover:bg-surface-container-high text-foreground-muted hover:text-foreground text-xs flex items-center gap-1.5 cursor-pointer transition-all duration-200"
                title="تازه سازی پایگاه‌داده"
              >
                <RefreshCw className="size-3.5" />
                <span>بروزرسانی داده‌ها</span>
              </button>

              {/* Polling controller */}
              <button
                onClick={() => setPollingActive(!pollingActive)}
                className={cn(
                  'h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-200 border',
                  pollingActive
                    ? 'border-accent/30 bg-accent/5 text-accent hover:bg-accent/10'
                    : 'border-border/50 bg-transparent text-foreground-muted hover:bg-surface-container-high',
                )}
              >
                {pollingActive ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                <span>{pollingActive ? 'توقف پایش خودکار' : 'شروع پایش خودکار'}</span>
              </button>

              {/* Audio controller */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="h-9 w-9 rounded-lg border border-border/50 hover:bg-surface-container-high text-foreground-muted hover:text-foreground flex items-center justify-center cursor-pointer transition-all duration-200"
                title={audioEnabled ? 'قطع صدای اعلان' : 'فعال‌سازی صدای اعلان'}
              >
                {audioEnabled ? <Volume2 className="size-4 text-accent" /> : <VolumeX className="size-4" />}
              </button>

              {/* Notification Permission Request */}
              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="h-9 px-3 rounded-lg bg-info/10 hover:bg-info/20 text-info border border-info/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Bell className="size-3.5 animate-pulse" />
                  <span>اجازه اعلان دسکتاپ</span>
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] text-foreground-muted flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>آخرین همگام‌سازی دیتابیس:</span>
            <span className="font-mono text-foreground font-bold">{faTime(lastUpdated)}</span>
            <span className="text-foreground/45">• هر ۸ ثانیه وضعیت بررسی می‌شود.</span>
          </div>
        </div>

        {/* Simulator Widget */}
        <div className="bg-gradient-to-br from-surface-container-high/40 to-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-accent">
              <Zap className="size-4 animate-pulse text-accent" />
              <span>شبیه‌ساز رویدادهای زنده</span>
            </div>
            <p className="text-[10px] text-foreground-muted mt-1 leading-relaxed">
              جهت آزمایش و دمو، با فعال‌سازی این بخش درخواست‌های فرضی ثبت‌نام، جابجایی یا اعتراض وارد صف شده و آلارم می‌زنند.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSimulatorActive(!simulatorActive)}
              className={cn(
                'flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all border',
                simulatorActive
                  ? 'bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20'
                  : 'bg-transparent text-foreground hover:bg-surface-container-high border-border',
              )}
            >
              {simulatorActive ? <Pause className="size-3.5" /> : <Play className="size-3.5 text-accent" />}
              <span>{simulatorActive ? 'توقف شبیه‌ساز' : 'فعال‌سازی شبیه‌ساز'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Statistics Counters ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low/40 border border-border-subtle/40 rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
            <User className="size-5" />
          </div>
          <div>
            <div className="text-[10px] text-foreground-muted">ثبت‌نام‌های معلق</div>
            <div className="text-lg font-bold font-mono text-foreground mt-0.5">{toFa(users.length)}</div>
          </div>
        </div>

        <div className="bg-surface-container-low/40 border border-border-subtle/40 rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
            <ArrowLeftRight className="size-5" />
          </div>
          <div>
            <div className="text-[10px] text-foreground-muted">درخواست‌های جابجایی</div>
            <div className="text-lg font-bold font-mono text-foreground mt-0.5">{toFa(swaps.length)}</div>
          </div>
        </div>

        <div className="bg-surface-container-low/40 border border-border-subtle/40 rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
            <Trophy className="size-5 text-accent" />
          </div>
          <div>
            <div className="text-[10px] text-foreground-muted">اعتراضات نمره عملکرد</div>
            <div className="text-lg font-bold font-mono text-foreground mt-0.5">{toFa(appeals.length)}</div>
          </div>
        </div>

        <div className="bg-surface-container-low/40 border border-border-subtle/40 rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <History className="size-5" />
          </div>
          <div>
            <div className="text-[10px] text-foreground-muted">لاگ‌های سیستمی اخیر</div>
            <div className="text-lg font-bold font-mono text-foreground mt-0.5">{toFa(auditLogs.length)}</div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Lists on Right, Logs on Left ───────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Operations Columns (span-2) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Tab Toggles */}
          <div className="flex border-b border-border/50 gap-2">
            {(
              [
                { key: 'all', label: 'همه موارد', count: users.length + swaps.length + appeals.length },
                { key: 'users', label: 'ثبت‌نام‌ها', count: users.length },
                { key: 'swaps', label: 'جابجایی‌ها', count: swaps.length },
                { key: 'appeals', label: 'اعتراضات نمره', count: appeals.length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'pb-3 text-xs font-semibold px-4 cursor-pointer relative transition-all duration-200 flex items-center gap-1.5',
                  activeTab === tab.key
                    ? 'text-accent border-b-2 border-accent font-bold'
                    : 'text-foreground-muted hover:text-foreground',
                )}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                    activeTab === tab.key ? 'bg-accent text-accent-foreground' : 'bg-surface-container-highest text-foreground-muted'
                  )}>
                    {toFa(tab.count)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Conditional Empty State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low/20 border border-border-subtle/30 rounded-2xl">
              <RefreshCw className="size-8 text-foreground-muted animate-spin" />
              <div className="text-xs text-foreground-muted mt-3">در حال بارگذاری وضعیت صف‌ها...</div>
            </div>
          ) : isTab('users') && users.length === 0 &&
              isTab('swaps') && swaps.length === 0 &&
              isTab('appeals') && appeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low/20 border border-border-subtle/30 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="size-10 text-success" />
              <div className="text-sm font-bold text-foreground">همه صف‌ها خالی است</div>
              <p className="text-[11px] text-foreground-muted max-w-sm px-4 leading-relaxed">
                هیچ درخواست تایید کاربری، جابجایی شیفت یا اعتراضی در انتظار بررسی وجود ندارد. می‌توانید شبیه‌ساز را از پنل بالا روشن کنید.
              </p>
            </div>
          ) : null}

          {/* 1. Users Approval List */}
          {isTab('users') && users.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5 px-1.5">
                <User className="size-4 text-warning" />
                <span>عضویت‌های در انتظار تایید ({toFa(users.length)})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-surface-container-low/40 hover:bg-surface-container-low/75 border border-border-subtle/50 rounded-2xl p-4 shadow-sm transition-all duration-300 flex flex-col justify-between gap-3 animate-in zoom-in-95 duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-foreground">{user.name}</div>
                        <span className="text-[10px] bg-warning/10 border border-warning/30 text-warning px-2 py-0.5 rounded-full font-bold">عضویت معلق</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-3 text-[10px] text-foreground-muted">
                        <div>کد ملی: <span className="font-mono text-foreground">{toFa(user.nationalId)}</span></div>
                        <div>تلفن: <span className="font-mono text-foreground">{user.phone ? toFa(user.phone) : '—'}</span></div>
                        <div className="col-span-2">ثبت نام: <span className="text-foreground">{jalali(user.createdAt)}</span></div>
                      </div>
                    </div>

                    <div className="border-t border-border-subtle/50 pt-3 mt-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-foreground-muted shrink-0">تعیین نقش پرسنلی:</label>
                        <select
                          value={selectedRoles[user.id] || 'operator'}
                          onChange={(e) => setSelectedRoles({ ...selectedRoles, [user.id]: e.target.value })}
                          className="flex-1 h-8 rounded-lg border border-border bg-background px-2 text-[10px] text-foreground outline-none cursor-pointer focus:border-accent"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.key}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleApproveUser(user.id)}
                        disabled={actionLoading === user.id}
                        className="w-full h-8 bg-success hover:bg-success/90 disabled:bg-success/50 text-success-foreground text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-success/10 transition-all scale-[0.98] active:scale-95"
                      >
                        <UserCheck className="size-3.5" />
                        <span>تأیید عضویت و فعال‌سازی</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Shift Swaps List */}
          {isTab('swaps') && swaps.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5 px-1.5">
                <ArrowLeftRight className="size-4 text-info" />
                <span>درخواست‌های جابجایی شیفت در انتظار بررسی ({toFa(swaps.length)})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {swaps.map((req) => (
                  <div
                    key={req.id}
                    className="bg-surface-container-low/40 hover:bg-surface-container-low/75 border border-border-subtle/50 rounded-2xl p-4 shadow-sm transition-all duration-300 flex flex-col justify-between gap-3 animate-in zoom-in-95 duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-foreground">درخواست جابجایی</div>
                        <span className="text-[10px] bg-info/10 border border-info/30 text-info px-2 py-0.5 rounded-full font-bold">جابجایی شیفت</span>
                      </div>
                      
                      <div className="space-y-2 mt-3 bg-surface-container-high/30 rounded-xl p-2.5 text-[10px] border border-border/20">
                        <div className="flex items-center justify-between">
                          <span className="text-foreground-muted">متقاضی:</span>
                          <span className="text-foreground font-semibold">{req.requester.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground-muted">همکار جایگزین:</span>
                          <span className="text-foreground font-semibold">{req.target.name}</span>
                        </div>
                        <div className="h-px bg-border/20 my-1"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground-muted">شیفت مبدا:</span>
                          <span className="text-foreground font-mono">
                            {jalali(req.sourceShift.date)} ({req.sourceShift.code === 'morning' ? 'صبح' : req.sourceShift.code === 'evening' ? 'عصر' : 'شب'})
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-foreground-muted">شیفت مقصد:</span>
                          <span className="text-foreground font-mono">
                            {jalali(req.targetShift.date)} ({req.targetShift.code === 'morning' ? 'صبح' : req.targetShift.code === 'evening' ? 'عصر' : 'شب'})
                          </span>
                        </div>
                      </div>

                      {req.note && (
                        <div className="mt-2 text-[10px] text-foreground-muted leading-relaxed bg-surface/20 border border-border/20 rounded-lg p-2">
                          <span className="font-bold text-foreground">توضیح:</span> {req.note}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border-subtle/50 pt-3 mt-1 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSwapDecision(req.id, 'approved')}
                        disabled={actionLoading === req.id}
                        className="h-8 bg-success hover:bg-success/90 disabled:bg-success/50 text-success-foreground text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all scale-[0.98] active:scale-95"
                      >
                        <Check className="size-3.5" />
                        <span>تأیید درخواست</span>
                      </button>
                      <button
                        onClick={() => handleSwapDecision(req.id, 'rejected')}
                        disabled={actionLoading === req.id}
                        className="h-8 bg-critical hover:bg-critical/90 disabled:bg-critical/50 text-critical-foreground text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all scale-[0.98] active:scale-95"
                      >
                        <XCircle className="size-3.5" />
                        <span>رد درخواست</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Performance Appeals List */}
          {isTab('appeals') && appeals.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5 px-1.5">
                <Trophy className="size-4 text-accent" />
                <span>اعتراضات ثبت شده نمره عملکرد ({toFa(appeals.length)})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {appeals.map((appeal) => (
                  <div
                    key={appeal.id}
                    className="bg-surface-container-low/40 hover:bg-surface-container-low/75 border border-border-subtle/50 rounded-2xl p-4 shadow-sm transition-all duration-300 flex flex-col justify-between gap-3 animate-in zoom-in-95 duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-foreground">{appeal.employee.name}</div>
                        <span className="text-[10px] bg-accent/15 border border-accent/30 text-accent px-2 py-0.5 rounded-full font-bold">اعتراض به خطا</span>
                      </div>
                      
                      <div className="mt-3 text-[10px] text-foreground-muted space-y-1 bg-surface-container-high/30 p-2.5 rounded-xl border border-border/20">
                        <div>عنوان جریمه: <span className="text-foreground font-semibold">{appeal.log.actionType?.title || 'خطای پرسنلی'}</span></div>
                        <div>کسر امتیاز: <span className="font-mono text-critical font-bold">{toFa(appeal.log.scoreValue)} امتیاز</span></div>
                        {appeal.log.note && <div>شرح جریمه: <span className="text-foreground">{appeal.log.note}</span></div>}
                      </div>

                      <div className="mt-2 text-[10px] text-foreground-muted leading-relaxed bg-surface/20 border border-border/20 rounded-lg p-2">
                        <span className="font-bold text-foreground">دلیل اعتراض پرسنل:</span> {appeal.reason}
                      </div>
                    </div>

                    <div className="border-t border-border-subtle/50 pt-3 mt-1 space-y-2">
                      <textarea
                        placeholder="یادداشت و دلیل بررسی مدیر (اختیاری)..."
                        value={appealNotes[appeal.id] || ''}
                        onChange={(e) => setAppealNotes({ ...appealNotes, [appeal.id]: e.target.value })}
                        className="w-full min-h-[50px] p-2 rounded-lg border border-border bg-background text-[10px] text-foreground outline-none focus:border-accent leading-relaxed resize-none"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAppealDecision(appeal.id, 'approved')}
                          disabled={actionLoading === appeal.id}
                          className="h-8 bg-success hover:bg-success/90 disabled:bg-success/50 text-success-foreground text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all scale-[0.98] active:scale-95"
                        >
                          <Check className="size-3.5" />
                          <span>پذیرش و حذف جریمه</span>
                        </button>
                        <button
                          onClick={() => handleAppealDecision(appeal.id, 'rejected')}
                          disabled={actionLoading === appeal.id}
                          className="h-8 bg-critical hover:bg-critical/90 disabled:bg-critical/50 text-critical-foreground text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all scale-[0.98] active:scale-95"
                        >
                          <XCircle className="size-3.5" />
                          <span>رد اعتراض پرسنل</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Real-time Audit Timeline Feed (span-1) */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5 px-1.5">
            <History className="size-4 text-success animate-spin-slow" />
            <span>گزارش لحظه‌ای رویدادهای سامانه</span>
          </div>

          <div className="bg-surface-container-low/40 backdrop-blur border border-border-subtle/50 rounded-2xl p-4 shadow-sm max-h-[700px] overflow-y-auto">
            <div className="relative border-r border-border/40 pr-4 space-y-5">
              {auditLogs.length === 0 ? (
                <div className="text-center py-10 text-[10px] text-foreground-muted">رویدادی ثبت نشده است.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="relative animate-in slide-in-from-right-3 duration-200">
                    {/* timeline bullet dot */}
                    <span className="absolute -right-[21px] top-1 flex h-2 w-2 rounded-full bg-accent border border-background"></span>
                    
                    <div className="flex items-center justify-between text-[9px] text-foreground-muted">
                      <span className="font-bold text-foreground">{log.actor?.name || 'سیستم'}</span>
                      <span className="font-mono">{faTime(log.createdAt)}</span>
                    </div>
                    
                    <div className="text-[10px] text-foreground mt-1 leading-relaxed">
                      {log.action === 'login' && 'به سامانه وارد شد.'}
                      {log.action === 'logout' && 'از سامانه خارج شد.'}
                      {log.action === 'create' && `یک ${log.entity === 'User' ? 'کاربر جدید' : log.entity} ایجاد کرد.`}
                      {log.action === 'update' && `اطلاعات ${log.entity === 'User' ? 'یک پرسنل' : log.entity} را ویرایش کرد.`}
                      {log.action === 'delete' && `یک ${log.entity} را حذف کرد.`}
                      {log.action === 'import' && 'یک فایل اکسل را بارگذاری و پردازش نمود.'}
                      {!['login', 'logout', 'create', 'update', 'delete', 'import'].includes(log.action) && `${log.action} روی ${log.entity}`}
                    </div>
                    
                    <div className="text-[9px] text-foreground-muted/70 mt-0.5 bg-surface/20 border border-border/10 rounded px-1.5 py-0.5 inline-block font-mono">
                      {log.actor?.role?.name || 'بدون نقش'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
