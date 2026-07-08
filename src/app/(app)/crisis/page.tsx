'use client'

import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toFa, jalali } from '@/lib/fa'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Plus,
  ListFilter,
  Clock,
  Check,
  Eye,
  Trash,
  PhoneCall,
  Volume2,
  Mic,
  Battery,
  Wifi,
  MapPin,
  Loader2,
  Play,
  RotateCcw
} from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface CrisisEvent {
  id: string
  title: string
  description: string | null
  level: string
  activatedAt: string
  resolvedAt: string | null
  activator?: { name: string }
}

interface IncidentReport {
  id: string
  title: string
  type: 'accident' | 'near_miss' | 'safety_violation' | 'equipment_failure' | 'delay'
  dateTime: string
  location: string
  trainNo: string
  rootCause: string
  correctiveAction: string
  description: string
  status: 'under_review' | 'action_taken' | 'closed'
  reporterName?: string
  reporter?: { name: string }
  timeline: Array<{ time: string; text: string }>
}

// ── مدل اطلاعات سیگنال اضطراری SOS — بخش ۱۲.۲ سند tosee.md
interface SOSAlert {
  id: string
  reporter?: { name: string }
  reporterName?: string
  reporterShift: string
  reporterRole: string
  locationCoordinates: string // مختصات ماهواره‌ای
  batteryPercentage: number    // درصد باتری تبلت
  networkStatus: string        // وضعیت قدرت آنتن
  audioMemoUrl?: string        // آدرس ویس ضبط شده
  status: 'submitted' | 'seen' | 'dispatch' | 'resolved' | 'closed'
  createdAt: string
  timeline: Array<{ time: string; text: string }>
}

const INCIDENT_TYPES = {
  accident: { label: 'حادثه', color: 'text-red-400 border-red-500/30 bg-red-950/20' },
  near_miss: { label: 'شبه‌حادثه', color: 'text-amber-400 border-amber-500/30 bg-amber-950/20' },
  safety_violation: { label: 'تخلف ایمنی', color: 'text-orange-400 border-orange-500/30 bg-orange-950/20' },
  equipment_failure: { label: 'نقص تجهیز', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20' },
  delay: { label: 'تأخیر عملیاتی', color: 'text-pink-400 border-pink-500/30 bg-pink-950/20' },
}

const STATUS_LABELS = {
  under_review: { label: 'در حال بررسی', color: 'bg-warning/10 text-warning border-warning/30' },
  action_taken: { label: 'اقدام اصلاحی شد', color: 'bg-info/10 text-info border-info/30' },
  closed: { label: 'بسته شده', color: 'bg-success/10 text-success border-success/30' },
}

const SOS_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: 'ثبت شد 🚨', color: 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' },
  seen: { label: 'مشاهده شد 👀', color: 'bg-warning/10 text-warning border-warning/30' },
  dispatch: { label: 'نیرو اعزام شد 🚒', color: 'bg-info/10 text-info border-info/30' },
  resolved: { label: 'حل شد ✅', color: 'bg-success/10 text-success border-success/30' },
  closed: { label: 'بسته شد 🔐', color: 'bg-neutral-800 text-neutral-400 border-neutral-700' }
}

const SAMPLE_SOS_ALERTS: SOSAlert[] = [
  {
    id: 'sos-1',
    reporterName: 'سهراب مرادی',
    reporterShift: 'لوحه الف - کابین ۱۲',
    reporterRole: 'راهبر قطار خط ۱',
    locationCoordinates: '۳۵.۷۲۱۹° N, ۵۱.۴۰۸۷° E (بلاک ۶ بلافاصله بعد ایستگاه شریعتی)',
    batteryPercentage: 84,
    networkStatus: 'عالی (Wi-Fi سازمانی - 88dBm)',
    audioMemoUrl: '/assets/simulated-sos-audio.mp3',
    status: 'dispatch',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    timeline: [
      { time: new Date(Date.now() - 1800000).toISOString(), text: 'سیگنال اضطراری SOS با ۳ ثانیه لمس طولانی تبلت فعال شد.' },
      { time: new Date(Date.now() - 1750000).toISOString(), text: 'ارسال خودکار مختصات ماهواره‌ای و ۵ ثانیه صوت کابین به OCC.' },
      { time: new Date(Date.now() - 1700000).toISOString(), text: 'رئیس قطار دیسپاچینگ سیگنال را مشاهده کرد و به تیم اطفای ایستگاه شریعتی دستور اعزام داد.' }
    ]
  }
]

export default function CrisisPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  
  const [activeCrisis, setActiveCrisis] = useState<CrisisEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'crisis' | 'sos-alerts' | 'incidents'>('crisis')

  // SOS States — بخش ۱۲.۲
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([])
  const [isPressingSos, setIsPressingSos] = useState(false)
  const [pressProgress, setPressProgress] = useState(0) // ۰ تا ۱۰۰
  const [countdownActive, setCountdownActive] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(5)
  const [sosSentInfo, setSosSentInfo] = useState<SOSAlert | null>(null)
  const [selectedSOSDetail, setSelectedSOSDetail] = useState<SOSAlert | null>(null)
  const [simulatedAudioState, setSimulatedAudioState] = useState<'idle' | 'recording' | 'done'>('idle')

  // Crisis Modals
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)

  // Crisis Form States
  const [crisisTitle, setCrisisTitle] = useState('')
  const [crisisDescription, setCrisisDescription] = useState('')
  const [crisisLevel, setCrisisLevel] = useState('high')
  const [stationId, setStationId] = useState('')
  const [submittingCrisis, setSubmittingCrisis] = useState(false)

  // Incidents States
  const [incidents, setIncidents] = useState<IncidentReport[]>([])
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  // Incident Form States
  const [incTitle, setIncTitle] = useState('')
  const [incType, setIncType] = useState<'accident' | 'near_miss' | 'safety_violation' | 'equipment_failure' | 'delay'>('near_miss')
  const [incDateTime, setIncDateTime] = useState('')
  const [incLocation, setIncLocation] = useState('')
  const [incTrainNo, setIncTrainNo] = useState('')
  const [incRootCause, setIncRootCause] = useState('')
  const [incCorrectiveAction, setIncCorrectiveAction] = useState('')
  const [incDescription, setIncDescription] = useState('')

  const isAdmin = user?.roleKey === 'super_admin' || user?.roleKey === 'admin'
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    void loadCrisis()
  }, [accessToken])

  async function loadCrisis() {
    if (!accessToken) return
    setLoading(true)
    try {
      const [crisisRes, sosRes, incRes] = await Promise.all([
        fetch('/api/crisis', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/crisis/sos-alerts', { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch('/api/crisis/incidents', { headers: { Authorization: `Bearer ${accessToken}` } })
      ])
      
      if (crisisRes.ok) setActiveCrisis((await crisisRes.json()).data)
      if (sosRes.ok) setSosAlerts((await sosRes.json()).data)
      if (incRes.ok) setIncidents((await incRes.json()).data)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateIncident(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !incTitle.trim()) return
    
    try {
      const res = await fetch('/api/crisis/incidents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: incTitle,
          type: incType,
          dateTime: incDateTime,
          location: incLocation,
          trainNo: incTrainNo,
          rootCause: incRootCause,
          correctiveAction: incCorrectiveAction,
          description: incDescription
        })
      })
      
      if (res.ok) {
        const { data } = await res.json()
        setIncidents(prev => [data, ...prev])
        setShowNewIncidentModal(false)
        setIncTitle('')
        setIncDescription('')
        setIncRootCause('')
        setIncCorrectiveAction('')
        setIncLocation('')
        setIncTrainNo('')
      } else {
        alert('خطا در ثبت رویداد')
      }
    } catch (err) {
      alert('خطا در برقراری ارتباط با سرور')
    }
  }

  async function handleUpdateIncidentStatus(id: string, newStatus: IncidentReport['status']) {
    try {
      const res = await fetch('/api/crisis/incidents', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      if (res.ok) {
        const { data } = await res.json()
        setIncidents(prev => prev.map(inc => inc.id === id ? data : inc))
        setSelectedIncident(prev => prev && prev.id === id ? data : prev)
      }
    } catch (err) {
      alert('خطا در تغییر وضعیت')
    }
  }

  async function handleActivateCrisis(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !crisisTitle.trim()) return
    setSubmittingCrisis(true)
    try {
      const res = await fetch('/api/crisis', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: crisisTitle,
          description: crisisDescription.trim() || undefined,
          level: crisisLevel,
          stationId: stationId.trim() || undefined,
        }),
      })
      if (res.ok) {
        setIsActivateModalOpen(false)
        setCrisisTitle('')
        setCrisisDescription('')
        setCrisisLevel('high')
        setStationId('')
        void loadCrisis()
      } else {
        const errJson = await res.json()
        alert(errJson.error || 'خطا در فعال‌سازی بحران')
      }
    } catch {
      alert('خطا در برقراری ارتباط با سرور')
    } finally {
      setSubmittingCrisis(false)
    }
  }

  async function handleResolveCrisis() {
    if (!accessToken || !activeCrisis) return
    setSubmittingCrisis(true)
    try {
      const res = await fetch('/api/crisis', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crisisId: activeCrisis.id }),
      })
      if (res.ok) {
        setIsResolveModalOpen(false)
        void loadCrisis()
      } else {
        alert('خطا در رفع بحران')
      }
    } catch {
      alert('خطا در برقراری ارتباط با سرور')
    } finally {
      setSubmittingCrisis(false)
    }
  }

  // ── منطق دکمه اضطراری SOS — بخش ۱۲.۲ ──
  const startSosPress = () => {
    setIsPressingSos(true)
    setPressProgress(0)
    
    let currentPct = 0
    pressTimerRef.current = setInterval(() => {
      currentPct += 10
      setPressProgress(currentPct)
      if (currentPct >= 100) {
        clearInterval(pressTimerRef.current!)
        setIsPressingSos(false)
        triggerSosCountdown()
      }
    }, 300) // ۳ ثانیه طول می‌کشد تا به ۱۰۰٪ برسد
  }

  const cancelSosPress = () => {
    if (pressTimerRef.current) {
      clearInterval(pressTimerRef.current)
    }
    setIsPressingSos(false)
    setPressProgress(0)
  }

  const triggerSosCountdown = () => {
    // باز کردن حالت شمارش معکوس کنسل ۵ ثانیه‌ای
    setCountdownActive(true)
    setCountdownSeconds(5)

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!)
          setCountdownActive(false)
          executeSOSLaunch()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const cancelSosCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    setCountdownActive(false)
    alert('🚨 ارسال سیگنال SOS با موفقیت توسط کاربر لغو گردید.')
  }

  // ثبت و توزیع نهایی سیگنال اضطراری
  const executeSOSLaunch = async () => {
    setSimulatedAudioState('recording')
    // شبیه‌ساز ضبط ۵ ثانیه صوت
    await new Promise(resolve => setTimeout(resolve, 3000))
    setSimulatedAudioState('done')

    try {
      const res = await fetch('/api/crisis/sos-alerts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterShift: 'لوحه الف - شابلون ۳۰۲',
          reporterRole: 'راهبر کابین',
          locationCoordinates: '۳۵.۸۰۱۲° N, ۵۱.۴۳۰۴° E (محدوده سوزن تجریش بلاک ورودی)',
          batteryPercentage: 92,
          networkStatus: 'عالی (4G LTE - 72dBm)',
          audioMemoUrl: '/assets/new-recorded-sos.mp3'
        })
      })
      if (res.ok) {
        const { data } = await res.json()
        setSosAlerts(prev => [data, ...prev])
        setSosSentInfo(data)
      }
    } catch (err) {
      alert('خطا در ارسال سیگنال')
    }
  }

  // به‌روزرسانی گام‌به‌گام وضعیت SOS (ماشین وضعیت)
  const handleUpdateSOSStatus = async (sosId: string, nextStatus: SOSAlert['status']) => {
    const statusTexts: Record<string, string> = {
      seen: 'سیگنال توسط سرپرست دیسپاچینگ مشاهده گردید.',
      dispatch: 'تیم پشتیبانی فنی و اطفای حریق به موقعیت اعزام شد.',
      resolved: 'حادثه کنترل و برطرف شد. وضعیت سیر عادی شد.',
      closed: 'پرونده اضطراری SOS بسته و مختومه اعلام گردید.'
    }

    try {
      const res = await fetch('/api/crisis/sos-alerts', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sosId, status: nextStatus, text: statusTexts[nextStatus] })
      })
      if (res.ok) {
        const { data } = await res.json()
        setSosAlerts(prev => prev.map(s => s.id === sosId ? data : s))
        setSelectedSOSDetail(prev => prev && prev.id === sosId ? data : prev)
      }
    } catch (err) {
      alert('خطا در تغییر وضعیت')
    }
  }

  const levelConfig: Record<string, { label: string; color: string; bg: string }> = {
    normal: { label: 'عادی', color: 'text-success', bg: 'bg-success/15 border-success/30' },
    elevated: { label: 'افزایش یافته', color: 'text-warning', bg: 'bg-warning/15 border-warning/30' },
    high: { label: 'بالا', color: 'text-critical', bg: 'bg-critical/15 border-critical/30' },
    critical: { label: 'بحرانی شدید', color: 'text-white bg-critical animate-pulse', bg: 'bg-critical/35 border-critical shadow-[0_0_20px_rgba(239,68,68,0.3)]' },
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-foreground flex items-center gap-2">
            <Shield className="size-6 text-accent" />
            مدیریت بحران و سوانح خط ۱
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            اعلام وضعیت بحران، سیگنال اضطراری SOS و آرشیو رویدادهای ایمنی راهبران
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-border/50 pb-px text-xs font-semibold overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('crisis')}
          className={cn(
            "pb-2.5 px-3 border-b-2 transition-all cursor-pointer",
            activeTab === 'crisis' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          وضعیت بحران زنده
        </button>
        <button
          onClick={() => setActiveTab('sos-alerts')}
          className={cn(
            "pb-2.5 px-3 border-b-2 transition-all cursor-pointer",
            activeTab === 'sos-alerts' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          کنترل سیگنال‌های SOS پرسنلی ({toFa(sosAlerts.filter(s => s.status !== 'closed').length)})
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={cn(
            "pb-2.5 px-3 border-b-2 transition-all cursor-pointer",
            activeTab === 'incidents' ? "border-accent text-accent font-extrabold" : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          ثبت و گزارش حوادث ({toFa(incidents.length)})
        </button>
      </div>

      {/* TAB 1: Live Crisis & SOS Trigger */}
      {activeTab === 'crisis' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2 flex-wrap">
            {/* SOS Fast launch triggers */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground-muted font-bold">بخش تست سریع سیگنال اضطراری:</span>
              <Button
                variant="destructive"
                className="h-8 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 cursor-pointer animate-pulse"
                onClick={executeSOSLaunch}
              >
                شبیه‌ساز آنی SOS
              </Button>
            </div>

            {isAdmin && (
              <div>
                {!activeCrisis ? (
                  <Button variant="destructive" onClick={() => setIsActivateModalOpen(true)} className="font-bold text-xs h-8 cursor-pointer">
                    <AlertTriangle className="size-4 me-1" />
                    فعال‌سازی وضعیت بحران
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setIsResolveModalOpen(true)} className="font-bold border-success/40 text-success hover:bg-success/10 text-xs h-8 cursor-pointer">
                    <CheckCircle className="size-4 me-1" />
                    خاتمه و رفع وضعیت بحران
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Crisis State Card */}
            <div className="lg:col-span-2 space-y-4">
              {loading ? (
                <div className="h-40 animate-pulse rounded-lg border border-border bg-background-subtle" />
              ) : activeCrisis ? (
                <Card className={`border ${levelConfig[activeCrisis.level]?.bg} transition-all duration-300`}>
                  <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-critical/20 animate-bounce">
                      <AlertTriangle className="size-7 text-critical" />
                    </div>
                    <div>
                      <div className="flex justify-center mb-1">
                        <Badge className={`${levelConfig[activeCrisis.level]?.color} font-bold px-2.5 py-0.5 text-[10px] rounded-full border`}>
                          وضعیت: {levelConfig[activeCrisis.level]?.label}
                        </Badge>
                      </div>
                      <h2 className="font-headline-md text-foreground font-black text-base">
                        {activeCrisis.title}
                      </h2>
                      {activeCrisis.description && (
                        <div className="mt-3.5 p-3 bg-neutral-900/60 rounded-lg max-w-xl text-xs leading-relaxed border border-border/40 text-foreground-muted text-right font-bold">
                          <span className="text-[10px] text-accent font-bold block mb-1">دستورالعمل عملیاتی:</span>
                          {activeCrisis.description}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4 font-data-mono text-[10px] text-foreground-muted border-t border-border/30 pt-3 w-full">
                      <span>زمان فعال‌سازی: {jalali(activeCrisis.activatedAt)}</span>
                      {activeCrisis.activator && (
                        <span>اعلام‌کننده: {activeCrisis.activator.name}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-success/30 bg-success/5">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-success/15 mb-3">
                      <Shield className="size-7 text-success" />
                    </div>
                    <p className="text-sm text-success font-black">وضعیت خط ۱ مترو: عادی</p>
                    <p className="mt-1 text-[11px] text-foreground-muted max-w-sm leading-relaxed">
                      رویداد بحرانی یا اضطراری فعالی در خط وجود ندارد. تمامی ترددها طبق برنامه لوحه در حال انجام است.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ── دکمه اضطراری SOS به همراه مهار خطای انسانی — بخش ۱۲.۲ ── */}
            <div className="lg:col-span-1">
              <Card className="border border-border/50 bg-surface-container-low text-center h-full flex flex-col justify-between p-6">
                <div className="space-y-2 select-none">
                  <h3 className="text-xs font-black text-foreground">دکمه ارسال سیگنال اضطراری SOS</h3>
                  <p className="text-[10px] text-foreground-muted">
                    شرح: فشردن مداوم ۳ ثانیه دکمه قرمز، موقعیت ماهواره‌ای و صدای کابین را مستقیماً به دیسپاچینگ OCC ارسال خواهد کرد.
                  </p>
                </div>

                {/* Interactive button element */}
                <div className="my-6 flex flex-col items-center justify-center">
                  {!countdownActive ? (
                    <div className="relative">
                      {/* Press Progress boundary */}
                      <svg className="size-36 -rotate-90">
                        <circle cx="72" cy="72" r="64" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="72"
                          cy="72"
                          r="64"
                          stroke="rgb(239, 68, 68)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={402}
                          strokeDashoffset={402 - (402 * pressProgress) / 100}
                          className="transition-all duration-100"
                        />
                      </svg>
                      
                      <button
                        onMouseDown={startSosPress}
                        onMouseUp={cancelSosPress}
                        onMouseLeave={cancelSosPress}
                        onTouchStart={startSosPress}
                        onTouchEnd={cancelSosPress}
                        className={cn(
                          "absolute top-6 left-6 size-24 rounded-full bg-gradient-to-br from-red-500 to-rose-700 text-white font-black text-sm flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer border-4 border-black/40",
                          isPressingSos && "animate-pulse"
                        )}
                      >
                        {isPressingSos ? 'نگه‌دارید...' : 'SOS'}
                      </button>
                    </div>
                  ) : (
                    /* 5-second cancel countdown */
                    <div className="flex flex-col items-center gap-3 animate-in zoom-in duration-200">
                      <div className="size-20 rounded-full border-4 border-yellow-500 flex items-center justify-center text-xl font-black text-yellow-500 animate-pulse font-mono">
                        {countdownSeconds}
                      </div>
                      <span className="text-[10px] text-warning font-bold">در حال ارسال سیگنال اضطراری...</span>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={cancelSosCountdown}
                        className="text-[10px] border-neutral-700 hover:bg-neutral-800 text-white font-bold cursor-pointer"
                      >
                        لغو فوری ارسال
                      </Button>
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-foreground-muted select-none">
                  🛡️ قابلیت تشخیص خودکار خطای انسانی (لمس تصادفی) فعال است.
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOS Alerts Control */}
      {activeTab === 'sos-alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active alerts lists */}
          <div className="lg:col-span-1 space-y-3 text-right">
            <h4 className="text-xs font-bold text-foreground">هشدارهای اضطراری فعال در شبکه</h4>

            {sosAlerts.filter(s => s.status !== 'closed').length === 0 ? (
              <div className="text-center py-8 bg-surface-container-low border border-border/30 rounded-lg text-foreground-muted text-xs select-none">
                هشدار اضطراری فعالی ثبت نشده است.
              </div>
            ) : (
              sosAlerts.filter(s => s.status !== 'closed').map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedSOSDetail(item)}
                  className={cn(
                    'p-3 border rounded-lg cursor-pointer transition space-y-1.5',
                    selectedSOSDetail?.id === item.id ? 'bg-red-500/10 border-red-500' : 'bg-surface-container-low border-border hover:border-red-500/40'
                  )}
                >
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="size-3.5" />
                      SOS فعال
                    </span>
                    <Badge variant="outline" className={cn('text-[8px] font-extrabold', SOS_STATUS_LABELS[item.status]?.color)}>
                      {SOS_STATUS_LABELS[item.status]?.label}
                    </Badge>
                  </div>
                  <h5 className="text-xs font-bold text-foreground">{item.reporter?.name || item.reporterName}</h5>
                  <div className="flex justify-between text-[9px] text-foreground-muted font-bold">
                    <span>ثبت: {jalali(item.createdAt)}</span>
                    <span className="text-accent">{item.reporterShift}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SOS Alert details & telemetry logs — بخش ۱۲.۲ */}
          <div className="lg:col-span-2">
            {selectedSOSDetail ? (
              <Card className="bg-surface-container-low border border-red-500/25">
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xs font-black text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="size-4 animate-bounce" />
                      پرونده وضعیت اضطراری: {selectedSOSDetail.reporter?.name || selectedSOSDetail.reporterName}
                    </CardTitle>
                    <Badge className={cn('text-[9px] font-extrabold', SOS_STATUS_LABELS[selectedSOSDetail.status]?.color)}>
                      {SOS_STATUS_LABELS[selectedSOSDetail.status]?.label}
                    </Badge>
                  </div>
                  <span className="text-[9px] text-foreground-muted block mt-1">سمت: {selectedSOSDetail.reporterRole} | شیفت: {selectedSOSDetail.reporterShift}</span>
                </CardHeader>
                <CardContent className="pt-4 space-y-5 text-xs font-bold text-right">
                  {/* Telemetry data box */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-foreground-muted block">اطلاعات تله‌متری تبلت راهبر در زمان حادثه (بخش ۱۲.۲):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-neutral-950/20 border border-border/40 rounded-lg">
                      <div className="flex items-center gap-1 text-[10px]">
                        <Battery className="size-4 text-success" />
                        <span>باتری تبلت: {toFa(selectedSOSDetail.batteryPercentage)}٪</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <Wifi className="size-4 text-accent" />
                        <span>شبکه: {selectedSOSDetail.networkStatus}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] sm:col-span-3">
                        <MapPin className="size-4 text-red-400 shrink-0" />
                        <span className="truncate">موقعیت ماهواره‌ای: {selectedSOSDetail.locationCoordinates}</span>
                      </div>
                    </div>
                  </div>

                  {/* Audio memos playback simulation */}
                  {selectedSOSDetail.audioMemoUrl && (
                    <div className="space-y-2 border-t border-border/20 pt-3">
                      <span className="text-[10px] text-accent block">صداهای ضبط شده کابین پس از فعال‌سازی:</span>
                      <div className="flex items-center gap-3 bg-surface/30 p-2.5 rounded-lg border border-border/30 justify-between">
                        <span className="text-[10px] flex items-center gap-1">
                          <Mic className="size-4 text-red-400" />
                          ۵ ثانیه صوت ضبط شده خودکار
                        </span>
                        <Button size="xs" variant="outline" className="h-7 text-[10px] gap-1 cursor-pointer">
                          <Play className="size-3.5 fill-current" />
                          <span>پخش فایل صوتی</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* State Machine Transition buttons */}
                  <div className="space-y-2 border-t border-border/20 pt-3">
                    <span className="text-[10px] text-foreground-muted block">چرخه تغییر وضعیت سیگنال اضطراری (بخش ۱۲.۲):</span>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {selectedSOSDetail.status === 'submitted' && (
                        <Button
                          size="xs"
                          onClick={() => handleUpdateSOSStatus(selectedSOSDetail.id, 'seen')}
                          className="text-[9px] font-bold bg-warning text-black cursor-pointer"
                        >
                          تغییر به: مشاهده شد
                        </Button>
                      )}
                      {(selectedSOSDetail.status === 'submitted' || selectedSOSDetail.status === 'seen') && (
                        <Button
                          size="xs"
                          onClick={() => handleUpdateSOSStatus(selectedSOSDetail.id, 'dispatch')}
                          className="text-[9px] font-bold bg-info text-white cursor-pointer"
                        >
                          تغییر به: اعزام نیرو
                        </Button>
                      )}
                      {selectedSOSDetail.status === 'dispatch' && (
                        <Button
                          size="xs"
                          onClick={() => handleUpdateSOSStatus(selectedSOSDetail.id, 'resolved')}
                          className="text-[9px] font-bold bg-success text-white cursor-pointer"
                        >
                          تغییر به: حل شد
                        </Button>
                      )}
                      {selectedSOSDetail.status === 'resolved' && (
                        <Button
                          size="xs"
                          onClick={() => handleUpdateSOSStatus(selectedSOSDetail.id, 'closed')}
                          className="text-[9px] font-bold bg-neutral-700 text-white cursor-pointer"
                        >
                          بستن نهایی پرونده SOS
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* SOS Timeline logger */}
                  <div className="space-y-2 border-t border-border/20 pt-3">
                    <span className="text-[10px] text-foreground-muted block">سوابق و زمان‌بندی اقدامات ایمنی:</span>
                    <div className="relative border-r border-border/40 pe-4 space-y-3 mr-1 text-[10px]">
                      {selectedSOSDetail.timeline.map((item, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute top-1 -right-[20.5px] size-1.5 rounded-full bg-red-400" />
                          <div className="text-[9px] text-foreground-muted font-mono">{jalali(item.time)}</div>
                          <div className="text-foreground mt-0.5">{item.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center p-8 border border-dashed border-border rounded-lg text-foreground-muted text-xs select-none">
                💡 موردی از هشدارهای فعال را جهت بازبینی و اقدام از سایدبار انتخاب فرمایید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Incident Report Archive */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-low border border-border p-3 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <ListFilter className="size-4 text-foreground-muted" />
              <span className="font-bold text-foreground-muted">فیلتر نوع گزارش:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:outline-none"
              >
                <option value="all">همه موارد</option>
                <option value="accident">حادثه</option>
                <option value="near_miss">شبه‌حادثه (Near-miss)</option>
                <option value="safety_violation">تخلف ایمنی</option>
                <option value="equipment_failure">نقص تجهیز</option>
                <option value="delay">تأخیر عملیاتی</option>
              </select>
            </div>
            
            <Button onClick={() => setShowNewIncidentModal(true)} className="font-bold text-xs h-8 gap-1 cursor-pointer">
              <Plus className="size-3.5" />
              <span>ثبت رویداد / شبه‌حادثه جدید</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.filter(inc => filterType === 'all' || inc.type === filterType).map((inc) => {
              const typeCfg = INCIDENT_TYPES[inc.type] || INCIDENT_TYPES.near_miss
              return (
                <Card key={inc.id} className="transition-all hover:border-accent/40 flex flex-col justify-between">
                  <div className="p-4 space-y-3 text-right">
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-xs font-bold text-foreground line-clamp-1">{inc.title}</span>
                      <Badge className={cn('text-[9px] border px-2 py-0.5 rounded', typeCfg.color)}>
                        {typeCfg.label}
                      </Badge>
                    </div>
                    
                    <div className="text-[11px] text-foreground-muted space-y-1.5 font-bold">
                      <p>موقعیت: <strong className="text-foreground">{inc.location}</strong></p>
                      <p>رام قطار: <strong className="text-accent font-data-mono">{toFa(inc.trainNo)}</strong></p>
                      <p className="line-clamp-2 leading-relaxed">توضیح: {inc.description}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-container-low/40 border-t border-border/30 flex items-center justify-between mt-auto text-xs">
                    <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 rounded', STATUS_LABELS[inc.status]?.color)}>
                      {STATUS_LABELS[inc.status]?.label}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-foreground-muted font-mono">{jalali(inc.dateTime)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedIncident(inc)}
                        className="h-6 px-2 text-[10px] text-accent font-bold hover:bg-accent/10 cursor-pointer"
                      >
                        <Eye className="size-3.5 me-0.5" />
                        بررسی و اقدامات
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* NEW INCIDENT REPORT MODAL */}
      {showNewIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-neutral-950 border border-border rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]" dir="rtl">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border">
              <AlertTriangle className="size-5 text-accent" />
              <h3 className="font-bold text-base text-foreground">ثبت گزارش سانحه / شبه‌حادثه جدید</h3>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-bold">موضوع رویداد <span className="text-critical">*</span></Label>
                  <Input
                    value={incTitle}
                    onChange={(e) => setIncTitle(e.target.value)}
                    placeholder="موضوع خلاصه..."
                    className="mt-1 h-8 text-xs bg-neutral-900"
                    required
                  />
                </div>
                <div>
                  <Label className="font-bold">نوع رویداد</Label>
                  <select
                    value={incType}
                    onChange={(e) => setIncType(e.target.value as any)}
                    className="mt-1 flex h-8 w-full rounded-lg border border-border bg-neutral-900 px-2 py-1 text-xs text-foreground focus:outline-none"
                  >
                    <option value="near_miss">شبه‌حادثه (Near-miss)</option>
                    <option value="accident">حادثه</option>
                    <option value="safety_violation">تخلف ایمنی</option>
                    <option value="equipment_failure">نقص تجهیز فنی</option>
                    <option value="delay">تأخیر عملیاتی</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="font-bold">تاریخ و ساعت رویداد</Label>
                  <Input
                    type="datetime-local"
                    value={incDateTime}
                    onChange={(e) => setIncDateTime(e.target.value)}
                    className="mt-1 h-8 text-xs text-foreground bg-neutral-900"
                  />
                </div>
                <div>
                  <Label className="font-bold">موقعیت دقیق وقوع <span className="text-critical">*</span></Label>
                  <Input
                    value={incLocation}
                    onChange={(e) => setIncLocation(e.target.value)}
                    placeholder="مثال: بلاک ۵ شمالی"
                    className="mt-1 h-8 text-xs bg-neutral-900"
                    required
                  />
                </div>
                <div>
                  <Label className="font-bold">شماره رام قطار</Label>
                  <Input
                    value={incTrainNo}
                    onChange={(e) => setIncTrainNo(e.target.value)}
                    placeholder="مثال: ۱۲۴"
                    className="mt-1 h-8 text-xs bg-neutral-900"
                  />
                </div>
              </div>

              <div>
                <Label className="font-bold">تحلیل علت ریشه‌ای اولیه (Root Cause)</Label>
                <Input
                  value={incRootCause}
                  onChange={(e) => setIncRootCause(e.target.value)}
                  placeholder="علت ریشه‌ای..."
                  className="mt-1 h-8 text-xs bg-neutral-900"
                />
              </div>

              <div>
                <Label className="font-bold">اقدام اصلاحی تعریف شده (Corrective Action)</Label>
                <Input
                  value={incCorrectiveAction}
                  onChange={(e) => setIncCorrectiveAction(e.target.value)}
                  placeholder="اقدام اصلاحی لازم..."
                  className="mt-1 h-8 text-xs bg-neutral-900"
                />
              </div>

              <div>
                <Label className="font-bold">شرح کامل رویداد</Label>
                <textarea
                  value={incDescription}
                  onChange={(e) => setIncDescription(e.target.value)}
                  placeholder="توضیحات و گزارش تکمیلی..."
                  rows={4}
                  className="mt-1 flex w-full rounded-lg border border-border bg-neutral-900 px-3 py-1.5 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewIncidentModal(false)}
                  className="h-8 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  className="h-8 text-xs font-bold cursor-pointer"
                >
                  ثبت گزارش رویداد
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INCIDENT DETAILS & TIMELINE MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-neutral-950 border border-border rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]" dir="rtl">
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Badge className={cn('text-[10px] border px-2 py-0.5 rounded', INCIDENT_TYPES[selectedIncident.type]?.color)}>
                  {INCIDENT_TYPES[selectedIncident.type]?.label}
                </Badge>
                <h3 className="font-bold text-sm text-foreground">{selectedIncident.title}</h3>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedIncident(null)}
                className="h-6 w-6 text-foreground-muted hover:text-foreground p-0 cursor-pointer"
              >
                <XCircle className="size-4" />
              </Button>
            </div>

            <div className="space-y-4 text-xs font-bold text-right">
              <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-3 rounded-lg border border-border/40 font-mono">
                <p className="text-foreground-muted">موقعیت: <strong className="text-foreground font-sans">{selectedIncident.location}</strong></p>
                <p className="text-foreground-muted">رام قطار: <strong className="text-accent">{toFa(selectedIncident.trainNo)}</strong></p>
                <p className="text-foreground-muted">تاریخ: <strong className="text-foreground">{jalali(selectedIncident.dateTime)}</strong></p>
                <p className="text-foreground-muted">گزارش‌دهنده: <strong className="text-foreground font-sans">{selectedIncident.reporter?.name || selectedIncident.reporterName}</strong></p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-accent">شرح رویداد:</span>
                <p className="bg-neutral-900/60 p-2.5 rounded border border-border/30 text-foreground leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-warning">تحلیل علت ریشه‌ای (Root Cause):</span>
                  <div className="bg-neutral-900/60 p-2.5 rounded border border-border/30 text-foreground-muted min-h-16">
                    {selectedIncident.rootCause}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-success">اقدام اصلاحی نهایی:</span>
                  <div className="bg-neutral-900/60 p-2.5 rounded border border-border/30 text-foreground-muted min-h-16">
                    {selectedIncident.correctiveAction}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Clock className="size-3.5 text-accent" />
                  خط‌زمانی بررسی و کنترل ایمنی رویداد
                </span>
                
                <div className="relative border-r-2 border-border/40 pe-4 space-y-4 mr-2">
                  {selectedIncident.timeline.map((t, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute top-1.5 -right-[21px] size-2.5 rounded-full bg-accent ring-4 ring-neutral-950" />
                      <div className="text-[9px] text-foreground-muted font-mono">{jalali(t.time)}</div>
                      <div className="text-xs text-foreground font-bold mt-0.5">{t.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons for Admins */}
              {isAdmin && (
                <div className="border-t border-border pt-4 mt-4 flex justify-between items-center gap-2">
                  <span className="text-[10px] text-foreground-muted font-bold">مدیریت وضعیت پرونده:</span>
                  <div className="flex gap-1.5">
                    {selectedIncident.status !== 'under_review' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'under_review')}
                        className="h-7 text-[10px] font-bold border-warning/40 text-warning hover:bg-warning/10 cursor-pointer"
                      >
                        ارسال به بررسی مجدد
                      </Button>
                    )}
                    {selectedIncident.status !== 'action_taken' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'action_taken')}
                        className="h-7 text-[10px] font-bold border-info/40 text-info hover:bg-info/10 cursor-pointer"
                      >
                        تأیید اقدام اصلاحی
                      </Button>
                    )}
                    {selectedIncident.status !== 'closed' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateIncidentStatus(selectedIncident.id, 'closed')}
                        className="h-7 text-[10px] font-bold bg-success hover:bg-success/90 text-white cursor-pointer"
                      >
                        بستن پرونده
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVATE CRISIS MODAL */}
      {isActivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-neutral-950 border border-border rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200" dir="rtl">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-border">
              <AlertTriangle className="size-5 text-critical" />
              <h3 className="font-bold text-base text-foreground">فعال‌سازی وضعیت بحران در خط ۱</h3>
            </div>
            
            <form onSubmit={handleActivateCrisis} className="space-y-4">
              <div>
                <Label htmlFor="crisis-title" className="text-xs font-bold">عنوان بحران <span className="text-critical">*</span></Label>
                <Input
                  id="crisis-title"
                  value={crisisTitle}
                  onChange={(e) => setCrisisTitle(e.target.value)}
                  placeholder="مثال: قطعی موقت برق شبکه بالاسری بخش جنوبی خط ۱"
                  className="mt-1.5 text-xs bg-neutral-900"
                  required
                />
              </div>

              <div>
                <Label htmlFor="crisis-level" className="text-xs font-bold">سطح بحران</Label>
                <select
                  id="crisis-level"
                  value={crisisLevel}
                  onChange={(e) => setCrisisLevel(e.target.value)}
                  className="mt-1.5 flex h-9 w-full rounded-lg border border-border bg-neutral-900 px-3 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value="high">بالا (High)</option>
                  <option value="critical">بحرانی شدید (Critical)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="crisis-station" className="text-xs font-bold">ایستگاه یا محدوده وقوع (اختیاری)</Label>
                <Input
                  id="crisis-station"
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  placeholder="مثال: ایستگاه کهریزک"
                  className="mt-1.5 text-xs bg-neutral-900"
                />
              </div>

              <div>
                <Label htmlFor="crisis-desc" className="text-xs font-bold">دستورالعمل و اقدامات ایمنی فوری</Label>
                <textarea
                  id="crisis-desc"
                  value={crisisDescription}
                  onChange={(e) => setCrisisDescription(e.target.value)}
                  placeholder="اقدامات و بایکوت‌های لازم برای راهبران و پرسنل..."
                  rows={4}
                  className="mt-1.5 flex w-full rounded-lg border border-border bg-neutral-900 px-3 py-2 text-xs text-foreground outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-critical/10 border border-critical/20 rounded-lg flex items-start gap-2 text-[10px] text-critical leading-relaxed">
                <Info className="size-4 shrink-0 mt-0.5" />
                <span>با فعال‌سازی وضعیت بحران، این آلارم فوراً به عنوان پیام اضطراری در بالای اپلیکیشن تمامی کاربران حاضر در شیفت نمایش داده خواهد شد.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsActivateModalOpen(false)}
                  className="h-8 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={submittingCrisis}
                  variant="destructive"
                  className="h-8 text-xs font-bold cursor-pointer"
                >
                  {submittingCrisis ? 'در حال ثبت...' : 'فعال‌سازی و انتشار'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE CRISIS MODAL */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-neutral-950 border border-border rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200" dir="rtl">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border text-success">
              <CheckCircle className="size-5" />
              <h3 className="font-bold text-base text-foreground">رفع وضعیت بحران</h3>
            </div>
            
            <p className="text-xs text-foreground-muted leading-relaxed mb-4">
              آیا از خاتمه دادن به وضعیت اضطراری جاری و بازگشت شرایط خط ۱ به حالت عادی مطمئن هستید؟ پیام‌های اضطراری از صفحه اصلی پرسنل حذف خواهند شد.
            </p>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResolveModalOpen(false)}
                className="h-8 text-xs font-bold cursor-pointer"
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={submittingCrisis}
                onClick={handleResolveCrisis}
                className="h-8 text-xs font-bold bg-success hover:bg-success/90 text-white cursor-pointer"
              >
                {submittingCrisis ? 'در حال ثبت...' : 'بله، خاتمه بحران'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
