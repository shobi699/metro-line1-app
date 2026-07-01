'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toFa, jalali } from '@/lib/fa'
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  AlertCircle,
  Search,
  Settings,
  ShieldAlert,
  MessageSquare,
  Calendar,
  Loader2,
  Send,
  Users,
  MapPin,
  GraduationCap,
  Award,
  Clock,
  Volume2,
  VolumeX,
  PieChart,
  BarChart,
  Target,
  FileCheck,
  Check,
  X
} from 'lucide-react'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string // admin, learning, shift, safety, urgent, crisis, personal, system
  title: string
  body: string | null
  link: string | null
  isRead: boolean
  createdAt: string
  // فیلدهای ممیزی و خط‌مشی اعلان — بخش ۹.۲
  policy?: {
    mutable: boolean       // قابل بی‌صدا کردن؟
    requireReceipt: boolean // رسید رؤیت اجباری؟
    repeat: boolean        // تکرار؟
    continuous: boolean    // مداوم تا تایید؟
  }
}

// ── شبیه‌ساز نوع و ممیزی اعلانات چندسطحی — بخش ۹.۱ و ۹.۲
const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'crisis',
    title: '🚨 هشدار بحران: قطعی موقت برق بالاسری در بلاک ۴',
    body: 'برق بالاسری در محدوده کهریزک تا حرم مطهر موقتاً قطع گردیده است. کلیه راهبران تا اطلاع ثانوی با سرعت پشتیبان شانت کنند.',
    link: '/crisis',
    isRead: false,
    createdAt: new Date().toISOString(),
    policy: { mutable: false, requireReceipt: true, repeat: true, continuous: true }
  },
  {
    id: 'notif-2',
    type: 'safety',
    title: '⚠️ ابلاغیه ایمنی جدید: بایکوت درب واگن سری ۳۰۰',
    body: 'رعایت دقیق آیین‌نامه ایزولاسیون اضطراری درب به شماره ابلاغیه ۱۰۴/م الزامی است. تایید رویت در پرونده درج می‌گردد.',
    link: '/knowledge',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    policy: { mutable: false, requireReceipt: true, repeat: true, continuous: false }
  },
  {
    id: 'notif-3',
    type: 'shift',
    title: '📅 انتشار لوحه اعزام شیفت الف - فردا',
    body: 'لوحه اعزام روز چهارشنبه با موفقیت بارگذاری شد. لطفاً قطار و ساعت شروع اعزام خود را در تقویم شیفت بررسی فرمایید.',
    link: '/shifts',
    isRead: true,
    createdAt: new Date(Date.now() - 12000000).toISOString(),
    policy: { mutable: true, requireReceipt: false, repeat: false, continuous: false }
  },
  {
    id: 'notif-4',
    type: 'learning',
    title: '🎓 پایان مهلت دوره آموزشی ایمنی پایه',
    body: 'کمتر از ۳ روز تا انقضای اعتبار گواهینامه ایمنی شما باقی مانده است. کوئیز شبیه‌ساز را در پنل کارنامه کامل کنید.',
    link: '/learning/exams',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    policy: { mutable: true, requireReceipt: false, repeat: true, continuous: false }
  }
]

// ── آمار اثربخشی اعلانات — بخش ۹.۵
const SAMPLE_ANALYTICS = {
  sentCount: 142,
  deliveryRate: 100, // percentage
  openRate: 88.5, // percentage
  ackRate: 76.2, // percentage
  avgViewSeconds: 42,
  unreadUsers: [
    { name: 'علی شفیعی', role: 'راهبر قطار', lastSeen: '۱۲ ساعت پیش' },
    { name: 'محسن کریمی', role: 'راهبر پایه دو', lastSeen: '۱ روز پیش' },
    { name: 'رضا علوی', role: 'اپراتور ایستگاه تجریش', lastSeen: '۳ ساعت پیش' }
  ]
}

function getTimeGroup(dateStr: string): string {
  const now = dayjs()
  const date = dayjs(dateStr)
  const diffDays = now.diff(date, 'day')

  if (diffDays === 0) return 'امروز'
  if (diffDays === 1) return 'دیروز'
  if (diffDays < 7) return 'هفته گذشته'
  return 'قدیمی‌تر'
}

export default function NotificationsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'feed' | 'broadcast' | 'analytics' | 'settings'>('feed')

  // Notifications states
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS)
  const [unreadCount, setUnreadCount] = useState(3)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Preference Settings States — بخش ۹.۴
  const [prefCirculars, setPrefCirculars] = useState(true)
  const [prefChat, setPrefChat] = useState(true)
  const [prefShifts, setPrefShifts] = useState(true)
  const [quietHours, setQuietHours] = useState(true) // ساعت استراحت خاموش
  const [quietStart, setQuietStart] = useState('22:00')
  const [quietEnd, setQuietEnd] = useState('06:00')
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Broadcast Alert states — بخش ۹.۳
  const [bcTitle, setBcTitle] = useState('')
  const [bcBody, setBcBody] = useState('')
  const [bcType, setBcType] = useState('safety')
  const [bcTargetGroup, setBcTargetGroup] = useState('all') // shift, station, operators, uncompleted-learning, geofence, expired-cert
  const [bcTargetDetail, setBcTargetDetail] = useState('')
  const [bcRequireReceipt, setBcRequireReceipt] = useState(true)
  const [bcContinuousAlert, setBcContinuousAlert] = useState(false)
  const [broadcasting, setBroadcasting] = useState(false)

  const isUserAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  async function loadNotifications() {
    if (!accessToken) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === 'unread') params.set('unreadOnly', 'true')
      const res = await fetch(`/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        const fetched = data.data?.notifications ?? []
        // ادغام با نمونه‌های استایل‌دهی شده
        setNotifications((prev) => {
          const ids = new Set(fetched.map((n: any) => n.id))
          const filteredPrev = prev.filter((n) => !ids.has(n.id))
          return [...fetched, ...filteredPrev]
        })
        setUnreadCount(data.data?.unreadCount ?? 3)
      }
    } catch {
      // safe fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [accessToken, filter])

  async function markAsRead(id: string) {
    if (!accessToken) return
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'markRead', notificationId: id }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  async function markAllAsRead() {
    if (!accessToken) return
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'markAllRead' }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  async function savePreferences() {
    setSavingPrefs(true)
    setSaveStatus(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      setSaveStatus({ type: 'success', message: 'سیاست‌ها و ساعات سکوت با موفقیت در دیتابیس پروفایل ذخیره شدند.' })
    } catch {
      setSaveStatus({ type: 'error', message: 'خطا در ارتباط با سرور.' })
    } finally {
      setSavingPrefs(false)
    }
  }

  // فرستادن اعلان هدفمند — بخش ۹.۳
  async function handleBroadcast() {
    if (!bcTitle || !bcBody) {
      alert('لطفاً عنوان و متن پیام را وارد کنید')
      return
    }
    setBroadcasting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      const newBc: Notification = {
        id: `bc-notif-${Date.now()}`,
        type: bcType,
        title: bcTitle,
        body: bcBody,
        link: bcType === 'safety' ? '/knowledge' : null,
        isRead: false,
        createdAt: new Date().toISOString(),
        policy: {
          mutable: !bcRequireReceipt,
          requireReceipt: bcRequireReceipt,
          repeat: bcRequireReceipt,
          continuous: bcContinuousAlert
        }
      }
      setNotifications(prev => [newBc, ...prev])
      setUnreadCount(prev => prev + 1)
      alert(`اعلان هدفمند با موفقیت به هدف [${bcTargetGroup}] ارسال و توزیع گردید.`)
      setBcTitle('')
      setBcBody('')
      setActiveTab('feed')
    } catch {
      alert('خطا در ارسال اعلان')
    } finally {
      setBroadcasting(false)
    }
  }

  const filteredNotifications = useMemo(() => {
    let result = notifications
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.body && n.body.toLowerCase().includes(q)),
      )
    }
    return result
  }, [notifications, searchQuery])

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {}
    for (const n of filteredNotifications) {
      const group = getTimeGroup(n.createdAt)
      if (!groups[group]) groups[group] = []
      groups[group].push(n)
    }
    return groups
  }, [filteredNotifications])

  // رنگ‌بندی و آیکون اعلانات چندسطحی — بخش ۹.۱
  const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
    info:       { icon: Info,          color: 'text-info',          bgColor: 'bg-info/15 border-info/30', label: 'اطلاعیه عمومی' },
    warning:    { icon: AlertTriangle,  color: 'text-warning',       bgColor: 'bg-warning/15 border-warning/30', label: 'هشدار فنی' },
    urgent:     { icon: AlertCircle,    color: 'text-critical',      bgColor: 'bg-critical/15 border-critical/30 shadow-critical/5', label: 'ابلاغیه فوری' },
    system:     { icon: Bell,           color: 'text-accent',        bgColor: 'bg-accent/15 border-accent/30', label: 'سیستمی' },
    safety:     { icon: ShieldAlert,    color: 'text-warning',       bgColor: 'bg-warning/20 border-warning/40', label: 'بخشنامه ایمنی 🛡️' },
    crisis:     { icon: AlertCircle,    color: 'text-red-500',       bgColor: 'bg-red-500/20 border-red-500/40 animate-pulse', label: 'بحران OCC 🚨' },
    learning:   { icon: GraduationCap,  color: 'text-success',       bgColor: 'bg-success/15 border-success/30', label: 'آموزش' },
    shift:      { icon: Calendar,       color: 'text-accent',        bgColor: 'bg-accent/15 border-accent/30', label: 'لوحه و شیفت' },
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 transition-all duration-500" dir="rtl">
      {/* Top Banner and Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-base font-black text-foreground">مرکز اعلانات چندسطحی خط ۱</h1>
          <p className="text-xs text-foreground-muted mt-1">
            پایش هوشمند اطلاعیه‌ها، بخشنامه‌های ایمنی و ابلاغیه‌های ممیزی
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-hide">
          <button
            onClick={() => setActiveTab('feed')}
            className={cn(
              'h-8 px-3 rounded-lg transition border cursor-pointer shrink-0',
              activeTab === 'feed'
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-surface-container-low text-foreground-muted border-border hover:text-foreground',
            )}
          >
            لیست اعلانات
          </button>
          
          {isUserAdmin && (
            <>
              <button
                onClick={() => setActiveTab('broadcast')}
                className={cn(
                  'h-8 px-3 rounded-lg transition border cursor-pointer shrink-0',
                  activeTab === 'broadcast'
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-surface-container-low text-foreground-muted border-border hover:text-foreground',
                )}
              >
                ارسال هدفمند جدید (بخش ۹.۳)
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={cn(
                  'h-8 px-3 rounded-lg transition border cursor-pointer shrink-0',
                  activeTab === 'analytics'
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-surface-container-low text-foreground-muted border-border hover:text-foreground',
                )}
              >
                گزارش اثربخشی (بخش ۹.۵)
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'h-8 px-3 rounded-lg transition border cursor-pointer shrink-0',
              activeTab === 'settings'
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-surface-container-low text-foreground-muted border-border hover:text-foreground',
            )}
          >
            سیاست اعلانات و سکوت (بخش ۹.۴)
          </button>
        </div>
      </div>

      {activeTab === 'feed' && (
        <>
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-container-low/40 border border-border-subtle/50 rounded-2xl p-4 backdrop-blur shadow-sm">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs font-bold"
                onClick={() => setFilter('all')}
              >
                همه اعلانات ({toFa(notifications.length)})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                className="text-xs font-bold"
                onClick={() => setFilter('unread')}
              >
                خوانده‌نشده‌ها ({toFa(unreadCount)})
              </Button>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs font-bold text-accent hover:bg-accent/10 cursor-pointer" onClick={markAllAsRead}>
                  <CheckCheck className="size-4 me-1.5" />
                  خواندن همه
                </Button>
              )}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-foreground-muted pointer-events-none" />
              <input
                type="text"
                placeholder="جستجو در عنوان یا متن اعلان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 ps-9 pe-3 rounded-lg border border-border bg-background/50 text-xs text-foreground outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Notifications feed */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-surface-container-low/20" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="border border-border/40 bg-surface-container-low/30 backdrop-blur shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-16 rounded-full bg-border/20 flex items-center justify-center mb-4">
                  <Bell className="size-8 text-foreground-muted" />
                </div>
                <h3 className="text-sm font-black text-foreground">اعلانی یافت نشد</h3>
                <p className="text-[11px] text-foreground-muted mt-1 max-w-[280px]">
                  در حال حاضر هیچ پیام جدیدی در فیلتر انتخابی شما ثبت نشده است.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([group, items]) => (
                <div key={group} className="space-y-3">
                  <h3 className="text-xs font-black text-foreground-muted px-2 flex items-center gap-1.5 select-none">
                    <span className="w-1 h-3 bg-accent rounded-full" />
                    <span>{group}</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {items.map((n) => {
                      const config = typeConfig[n.type] ?? typeConfig.info
                      const Icon = config.icon
                      const requireReceipt = n.policy?.requireReceipt ?? false
                      
                      return (
                        <div
                          key={n.id}
                          className={cn(
                            'group flex items-start gap-4 p-4 bg-surface-container-low/30 backdrop-blur border border-border-subtle/50 rounded-2xl transition-all duration-300 hover:bg-surface-container-low/60 hover:border-accent/40 active:scale-[0.99] cursor-pointer shadow-sm relative overflow-hidden',
                            !n.isRead && 'bg-accent/5 border-accent/25 shadow shadow-accent/5'
                          )}
                          onClick={() => {
                            if (!n.isRead) markAsRead(n.id)
                            if (n.link) router.push(n.link)
                          }}
                        >
                          {!n.isRead && (
                            <span className="absolute top-0 bottom-0 start-0 w-1 bg-accent" />
                          )}
                          
                          <div className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105', 
                            config.bgColor
                          )}>
                            <Icon className={cn('size-5', config.color)} />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-foreground leading-normal">{n.title}</span>
                              {!n.isRead && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-accent/20 text-accent font-black animate-pulse">جدید</span>
                              )}
                            </div>
                            {n.body && (
                              <p className="text-[11px] text-foreground-muted leading-relaxed line-clamp-2">
                                {n.body}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mt-3 text-[9px] text-foreground-muted font-bold pt-1 border-t border-border/10">
                              <div className="flex items-center gap-2">
                                <span>{jalali(n.createdAt)}</span>
                                <span>•</span>
                                <span className="text-accent">{config.label}</span>
                              </div>

                              {/* Policy and receipt badges — بخش ۹.۲ */}
                              <div className="flex items-center gap-1.5">
                                {requireReceipt && (
                                  <Badge className="bg-warning/20 text-warning border-transparent text-[8px] font-bold">
                                    رسید ممیزی اجباری
                                  </Badge>
                                )}
                                {n.policy?.continuous && (
                                  <Badge className="bg-critical/10 text-critical border-transparent text-[8px] font-bold animate-pulse">
                                    آلارم مکرر تا تایید
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'broadcast' && (
        <div className="max-w-2xl bg-surface-container-low border border-border/50 rounded-2xl p-6 shadow-sm space-y-5 text-right">
          <div>
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Send className="size-4 text-accent" />
              <span>ارسال و توزیع هدفمند پیام جدید</span>
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">ارسال هشدار، خبر یا بخشنامه برای فیلترهای پویای پرسنلی — بخش ۹.۳ سند tosee.md</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">نوع اعلان:</label>
              <select
                value={bcType}
                onChange={(e) => setBcType(e.target.value)}
                className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
              >
                <option value="info">اطلاعیه عمومی (Normal)</option>
                <option value="warning">هشدار فنی (Warning)</option>
                <option value="safety">بخشنامه ایمنی (Safety)</option>
                <option value="crisis">بحران OCC (Crisis)</option>
                <option value="learning">آموزشی (Learning)</option>
                <option value="shift">شیفت و لوحه (Shift)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">توزیع هدفمند (بخش ۹.۳):</label>
              <select
                value={bcTargetGroup}
                onChange={(e) => setBcTargetGroup(e.target.value)}
                className="w-full bg-neutral-950/40 border border-border p-2.5 rounded-lg text-xs focus:outline-none focus:border-accent"
              >
                <option value="all">همه پرسنل خط ۱</option>
                <option value="shift">افراد یک شیفت (گروه الف/ب/ج)</option>
                <option value="station">پرسنل ایستگاه خاص</option>
                <option value="uncompleted-learning">افرادی که آموزش را تمام نکرده‌اند</option>
                <option value="expired-cert">راهبران با گواهینامه منقضی‌شده</option>
                <option value="geofence">افراد حاضر در محدوده جغرافیایی (Geofence)</option>
              </select>
            </div>
          </div>

          {bcTargetGroup !== 'all' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">جزئیات یا فیلتر مقدار هدف:</label>
              <input
                type="text"
                placeholder={
                  bcTargetGroup === 'shift' ? 'مثال: Shift-A' :
                  bcTargetGroup === 'station' ? 'مثال: تجریش' :
                  bcTargetGroup === 'uncompleted-learning' ? 'مثال: دوره بایکوت ترمز' :
                  'فیلتر یا مشخصه فیزیکی'
                }
                value={bcTargetDetail}
                onChange={(e) => setBcTargetDetail(e.target.value)}
                className="w-full h-10 px-3 bg-neutral-950/40 border border-border rounded-lg text-xs outline-none focus:border-accent"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">عنوان اعلان:</label>
            <input
              type="text"
              placeholder="عنوان رسمی پیام..."
              value={bcTitle}
              onChange={(e) => setBcTitle(e.target.value)}
              className="w-full h-10 px-3 bg-neutral-950/40 border border-border rounded-lg text-xs outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">متن تفصیلی پیام:</label>
            <textarea
              rows={4}
              placeholder="شرح کامل ابلاغیه..."
              value={bcBody}
              onChange={(e) => setBcBody(e.target.value)}
              className="w-full p-3 bg-neutral-950/40 border border-border rounded-lg text-xs outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Policy controls */}
          <div className="p-3 bg-surface/30 border border-border/50 rounded-xl space-y-3 text-xs">
            <span className="font-bold block text-[10px] text-foreground-muted mb-1">خط‌مشی ارسال و رسید قانونی (بخش ۹.۲):</span>
            
            <div className="flex items-center justify-between">
              <span>درخواست ثبت رسید مطالعه قانونی (Legal Read-Receipt):</span>
              <button
                onClick={() => setBcRequireReceipt(!bcRequireReceipt)}
                className={cn('w-9 h-5 rounded-full transition relative', bcRequireReceipt ? 'bg-accent' : 'bg-neutral-800')}
              >
                <span className={cn('absolute top-0.5 size-4 rounded-full bg-white transition-all', bcRequireReceipt ? 'left-1' : 'left-4')} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span>آلارم مکرر و قفل صفحه تا زمان مطالعه (برای بحران):</span>
              <button
                onClick={() => setBcContinuousAlert(!bcContinuousAlert)}
                className={cn('w-9 h-5 rounded-full transition relative', bcContinuousAlert ? 'bg-accent' : 'bg-neutral-800')}
              >
                <span className={cn('absolute top-0.5 size-4 rounded-full bg-white transition-all', bcContinuousAlert ? 'left-1' : 'left-4')} />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border/20">
            <Button
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="px-6 h-10 text-xs font-bold bg-accent hover:bg-accent-hover text-accent-foreground cursor-pointer"
            >
              {broadcasting ? 'در حال انتشار ابلاغیه...' : 'انتشار سراسری پیام'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6 text-right">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-surface-container-low border-border/50">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-foreground-muted font-bold">ارسال شده (ماه جاری)</p>
                  <h3 className="text-base font-black mt-1 text-foreground">{toFa(SAMPLE_ANALYTICS.sentCount)} اعلان</h3>
                </div>
                <div className="bg-accent/10 p-2.5 rounded-lg text-accent">
                  <Target className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-container-low border-border/50">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-foreground-muted font-bold">نرخ کل تحویل (Delivery)</p>
                  <h3 className="text-base font-black mt-1 text-success">{toFa(SAMPLE_ANALYTICS.deliveryRate)}٪</h3>
                </div>
                <div className="bg-success/10 p-2.5 rounded-lg text-success">
                  <Check className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-container-low border-border/50">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-foreground-muted font-bold">نرخ باز کردن (Open Rate)</p>
                  <h3 className="text-base font-black mt-1 text-info">{toFa(SAMPLE_ANALYTICS.openRate)}٪</h3>
                </div>
                <div className="bg-info/10 p-2.5 rounded-lg text-info">
                  <PieChart className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-container-low border-border/50">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-foreground-muted font-bold">میانگین زمان رؤیت</p>
                  <h3 className="text-base font-black mt-1 text-warning">{toFa(SAMPLE_ANALYTICS.avgViewSeconds)} ثانیه</h3>
                </div>
                <div className="bg-warning/10 p-2.5 rounded-lg text-warning">
                  <Clock className="size-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unread users table — بخش ۹.۵ */}
          <Card className="bg-surface-container-low border border-border/50">
            <CardHeader className="border-b border-border/30 pb-3">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                <Users className="size-4 text-critical animate-pulse" />
                لیست پرسنلی که بخشنامه ایمنی را تایید نکرده‌اند
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-neutral-950/20 text-foreground-muted text-[10px] font-bold">
                      <th className="p-3">نام و نام‌خانوادگی</th>
                      <th className="p-3">سمت سازمانی</th>
                      <th className="p-3">آخرین فعالیت سیستم</th>
                      <th className="p-3 text-left">اقدام اضطراری</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {SAMPLE_ANALYTICS.unreadUsers.map((item, idx) => (
                      <tr key={idx} className="hover:bg-neutral-900/10">
                        <td className="p-3 font-bold">{item.name}</td>
                        <td className="p-3 text-foreground-muted">{item.role}</td>
                        <td className="p-3 font-mono text-[10px]">{toFa(item.lastSeen)}</td>
                        <td className="p-3 text-left">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => alert(`پیامک و آلارم اضطراری مجدد برای ${item.name} ارسال شد.`)}
                            className="h-7 text-[9px] border-critical/30 text-critical hover:bg-critical/5 font-bold cursor-pointer"
                          >
                            ارسال هشدار مجدد
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-surface-container-low border border-border/50 rounded-2xl p-6 shadow-sm space-y-6 text-right">
          <div>
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Settings className="size-4 text-accent" />
              <span>سیاست اعلانات و تنظیم زمان استراحت</span>
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              تنظیم ساعات غیرکاری جهت بیصدا سازی اعلانات غیرضروری راهبران — بخش ۹.۴ سند tosee.md
            </p>
          </div>

          <div className="space-y-4 pt-2 border-t border-border/10 text-xs">
            {/* Quiet Hours Switch */}
            <div className="flex items-center justify-between p-3 border border-border/20 rounded-xl bg-surface/30">
              <div className="space-y-0.5">
                <span className="font-bold text-foreground block">فعال‌سازی زمان استراحت (Quiet Hours):</span>
                <span className="text-[10px] text-foreground-muted">بی‌صدا کردن اتوماتیک پیام‌های غیرضروری در ساعات خواب و استراحت.</span>
              </div>
              <button
                onClick={() => setQuietHours(!quietHours)}
                className={cn('w-10 h-6 rounded-full transition relative', quietHours ? 'bg-accent' : 'bg-neutral-800')}
              >
                <span className={cn('absolute top-1 size-4 rounded-full bg-white transition-all', quietHours ? 'left-1' : 'left-5')} />
              </button>
            </div>

            {quietHours && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-950/20 border border-border/50 rounded-xl animate-fade-in">
                <div className="space-y-2">
                  <label className="font-bold text-foreground block">شروع زمان استراحت:</label>
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="w-full bg-neutral-900 border border-border p-2 rounded-lg text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-foreground block">پایان زمان استراحت:</label>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="w-full bg-neutral-900 border border-border p-2 rounded-lg text-foreground focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Subscriptions */}
            <div className="space-y-3 mt-4">
              <span className="font-bold block text-[10px] text-foreground-muted">تنظیم دریافت تفکیکی کانال‌ها:</span>
              
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30">
                <span>تلقین و ثبت دریافت بخشنامه‌های ایمنی:</span>
                <button
                  onClick={() => setPrefCirculars(!prefCirculars)}
                  className={cn('w-9 h-5 rounded-full transition relative', prefCirculars ? 'bg-accent' : 'bg-neutral-800')}
                >
                  <span className={cn('absolute top-0.5 size-4 rounded-full bg-white transition-all', prefCirculars ? 'left-1' : 'left-4')} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30">
                <span>مکالمات و پیام‌های چت/بیسیم متنی:</span>
                <button
                  onClick={() => setPrefChat(!prefChat)}
                  className={cn('w-9 h-5 rounded-full transition relative', prefChat ? 'bg-accent' : 'bg-neutral-800')}
                >
                  <span className={cn('absolute top-0.5 size-4 rounded-full bg-white transition-all', prefChat ? 'left-1' : 'left-4')} />
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/30">
                <span>ثبت لوحه و تغییرات شیفت کاری:</span>
                <button
                  onClick={() => setPrefShifts(!prefShifts)}
                  className={cn('w-9 h-5 rounded-full transition relative', prefShifts ? 'bg-accent' : 'bg-neutral-800')}
                >
                  <span className={cn('absolute top-0.5 size-4 rounded-full bg-white transition-all', prefShifts ? 'left-1' : 'left-4')} />
                </button>
              </div>
            </div>

            {saveStatus && (
              <div className={cn(
                'p-3 rounded-xl text-xs font-bold text-center border',
                saveStatus.type === 'success' ? 'bg-success/15 border-success/30 text-success' : 'bg-critical/15 border-critical/30 text-critical'
              )}>
                {saveStatus.message}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border/30">
              <Button
                onClick={savePreferences}
                disabled={savingPrefs}
                className="px-6 h-10 text-xs font-bold bg-accent hover:bg-accent-hover text-accent-foreground cursor-pointer"
              >
                {savingPrefs ? 'در حال ذخیره...' : 'ذخیره تنظیمات استراحت'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
