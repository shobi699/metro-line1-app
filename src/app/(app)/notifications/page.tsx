'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
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
  Users,
  Clock,
  Send,
  Loader2,
  RefreshCw,
  Heart,
  Check,
  X,
  Smartphone,
  MessageSquare,
  FileText,
  Save,
  CheckCircle2,
  AlertOctagon,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  isRead: boolean
  createdAt: string
}

interface OutboxLog {
  id: string
  eventKey: string
  userId: string
  channel: 'inapp' | 'push' | 'sms'
  driver: string | null
  payload: any
  status: 'queued' | 'sent' | 'delivered' | 'seen' | 'failed' | 'expired'
  attempts: number
  lastError: string | null
  sentAt: string | null
  createdAt: string
  user: {
    name: string
    role: { name: string }
  }
}

interface Rule {
  id: string
  eventKey: string
  severity: 'info' | 'normal' | 'important' | 'critical'
  channels: string[]
  audience: string[] | null
  smsIfUnseenMinutes: number | null
  respectQuietHours: boolean
  isActive: boolean
}

interface Template {
  id: string
  eventKey: string
  title: string
  body: string
  smsText: string | null
  link: string | null
  isActive: boolean
  updatedBy: string | null
  updatedAt: string
}

export default function NotificationsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<'feed' | 'broadcast' | 'drivers' | 'rules' | 'outbox' | 'prefs'>('feed')

  // Loading states
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Data states
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [outboxLogs, setOutboxLogs] = useState<OutboxLog[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [driverSettings, setDriverSettings] = useState({
    activePushDriver: 'pushe',
    activeSmsDriver: 'kavenegar',
    pushFallbackChain: ['pushe', 'najva', 'selfhosted'],
    smsFallbackChain: ['kavenegar', 'melipayamak', 'smsir'],
    pusheApiKey: '',
    najvaApiKey: '',
    kavenegarApiKey: '',
  })
  const [driverHealth, setDriverHealth] = useState<any>({ push: {}, sms: {} })
  const [smsQuotaUsed, setSmsQuotaUsed] = useState(0)

  // Filters
  const [feedFilter, setFeedFilter] = useState<'all' | 'unread'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [outboxFilter, setOutboxFilter] = useState<string>('all')

  // User Preference state
  const [userPrefs, setUserPrefs] = useState({
    channels: {} as Record<string, string[]>,
    quietHours: { from: '23:00', to: '07:00' },
  })

  // Broadcast campaign form state
  const [bcForm, setBcForm] = useState({
    title: '',
    body: '',
    severity: 'normal',
    targetGroup: 'all',
    targetDetail: '',
    requireReceipt: false,
    continuousAlert: false,
  })

  // Selected rule/template for editing
  const [selectedEventKey, setSelectedEventKey] = useState<string>('')
  const [ruleEdit, setRuleEdit] = useState<Partial<Rule>>({})
  const [templateEdit, setTemplateEdit] = useState<Partial<Template>>({})

  const isUserAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  // --- FETCH FUNCTIONS ---

  async function fetchFeed() {
    if (!accessToken) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (feedFilter === 'unread') params.set('unreadOnly', 'true')
      const res = await fetch(`/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setNotifications(json.data?.notifications ?? [])
        setUnreadCount(json.data?.unreadCount ?? 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPreferences() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/notifications/preferences', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setUserPrefs({
            channels: json.data.channels || {},
            quietHours: json.data.quietHours || { from: '23:00', to: '07:00' },
          })
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchAdminData() {
    if (!accessToken || !isUserAdmin) return
    try {
      // Drivers settings
      const resDrivers = await fetch('/api/admin/notifications/drivers', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (resDrivers.ok) {
        const json = await resDrivers.json()
        setDriverSettings(json.data)
      }

      // Rules & Templates
      const resRules = await fetch('/api/admin/notifications/rules', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (resRules.ok) {
        const json = await resRules.json()
        setRules(json.data?.rules ?? [])
        setTemplates(json.data?.templates ?? [])
        if (json.data?.rules?.length > 0 && !selectedEventKey) {
          selectEventKey(json.data.rules[0].eventKey, json.data.rules, json.data.templates)
        }
      }

      // Health checks
      const resHealth = await fetch('/api/admin/notifications/health', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (resHealth.ok) {
        const json = await resHealth.json()
        setDriverHealth(json.data)
      }

      // Outbox logs
      await fetchOutbox()
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchOutbox() {
    if (!accessToken || !isUserAdmin) return
    try {
      const params = new URLSearchParams()
      if (outboxFilter !== 'all') params.set('status', outboxFilter)
      const resOutbox = await fetch(`/api/admin/notifications/outbox?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (resOutbox.ok) {
        const json = await resOutbox.json()
        setOutboxLogs(json.data?.outbox ?? [])
        setSmsQuotaUsed(json.data?.smsCountToday ?? 0)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    void fetchFeed()
    void fetchPreferences()
  }, [accessToken, feedFilter])

  useEffect(() => {
    if (activeTab === 'drivers' || activeTab === 'rules' || activeTab === 'outbox') {
      void fetchAdminData()
    }
  }, [activeTab, outboxFilter])

  function selectEventKey(key: string, currentRules = rules, currentTemplates = templates) {
    setSelectedEventKey(key)
    const rule = currentRules.find((r) => r.eventKey === key)
    const template = currentTemplates.find((t) => t.eventKey === key)
    setRuleEdit(rule ? { ...rule } : {})
    setTemplateEdit(template ? { ...template } : {})
  }

  // --- MUTATION ACTIONS ---

  async function handleMarkAsRead(id: string, link: string | null) {
    if (!accessToken) return
    try {
      await fetch('/api/notifications/seen', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId: id }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      if (link) {
        window.location.href = link
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleMarkAllAsRead() {
    if (!accessToken) return
    try {
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
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSavePrefs() {
    if (!accessToken) return
    setActionLoading('prefs')
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPrefs),
      })
      if (res.ok) {
        alert('تنظیمات شخصی ساعات سکوت با موفقیت اعمال شد.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSaveDriverSettings() {
    if (!accessToken || !isUserAdmin) return
    setActionLoading('drivers')
    try {
      const res = await fetch('/api/admin/notifications/drivers', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverSettings),
      })
      if (res.ok) {
        alert('تنظیمات درایورها و زنجیره Fallback با موفقیت بروزرسانی شد.')
        await fetchAdminData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleTestDriver(key: string) {
    if (!accessToken || !isUserAdmin) return
    setActionLoading(`test-${key}`)
    try {
      const res = await fetch(`/api/admin/notifications/drivers/${key}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await res.json()
      if (res.ok && json.data?.success) {
        alert(`تست درایور ${key} موفقیت‌آمیز بود. شناسه پیام: ${json.data.messageId}`)
      } else {
        alert(`خطا در تست درایور ${key}: ${json.error?.message || 'خطای ارتباطی'}`)
      }
      await fetchAdminData()
    } catch (err: any) {
      alert(`خطا در تست: ${err.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSaveRuleAndTemplate() {
    if (!accessToken || !isUserAdmin || !selectedEventKey) return
    setActionLoading('ruleTemplate')
    try {
      // 1. Save rule
      const resRule = await fetch('/api/admin/notifications/rules', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveRule',
          eventKey: selectedEventKey,
          ruleData: ruleEdit,
        }),
      })

      // 2. Save template
      const resTemp = await fetch('/api/admin/notifications/rules', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveTemplate',
          eventKey: selectedEventKey,
          templateData: templateEdit,
        }),
      })

      if (resRule.ok && resTemp.ok) {
        alert(`قوانین و قالب‌های رویداد ${selectedEventKey} با موفقیت ذخیره شدند.`)
        await fetchAdminData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBroadcast() {
    if (!accessToken || !isUserAdmin) return
    if (!bcForm.title || !bcForm.body) {
      alert('لطفاً عنوان و متن اعلان را وارد کنید.')
      return
    }
    setActionLoading('broadcast')
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bcForm),
      })
      const json = await res.json()
      if (res.ok && json.data?.success) {
        alert(json.data.message || 'ارسال پیام سراسری با موفقیت انجام شد.')
        setBcForm({
          title: '',
          body: '',
          severity: 'normal',
          targetGroup: 'all',
          targetDetail: '',
          requireReceipt: false,
          continuousAlert: false,
        })
        setActiveTab('feed')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRetryOutbox(id: string) {
    if (!accessToken || !isUserAdmin) return
    setActionLoading(`retry-${id}`)
    try {
      const res = await fetch('/api/admin/notifications/outbox', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outboxId: id }),
      })
      if (res.ok) {
        alert('درخواست بازارسال با موفقیت ارسال شد.')
        await fetchOutbox()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  // --- HELPER COMPONENT CONFIGS ---

  const typeConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
    info: { icon: Info, color: 'text-info', bgColor: 'bg-info/10 border-info/20', label: 'اطلاعیه عمومی' },
    normal: { icon: Bell, color: 'text-foreground', bgColor: 'bg-surface-container-low border-border', label: 'عادی' },
    important: { icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10 border-warning/20', label: 'مهم' },
    critical: { icon: AlertCircle, color: 'text-critical animate-pulse', bgColor: 'bg-critical/10 border-critical/20 shadow-lg shadow-critical/5', label: 'بحران 🚨' },
  }

  const filteredNotifications = useMemo(() => {
    let result = notifications
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.body && n.body.toLowerCase().includes(q))
      )
    }
    return result
  }, [notifications, searchQuery])

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 transition-all duration-500" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-black text-foreground">مرکز اعلانات چندکاناله خط ۱ مترو</h1>
          <p className="text-xs text-foreground-muted mt-1">
            دروازه ارسال اعلانات چندکاناله (درون برنامه‌ای، پوش و پیامک مقاوم به تحریم)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-hide">
          <button
            onClick={() => setActiveTab('feed')}
            className={cn(
              'h-8 px-3 rounded-lg transition border cursor-pointer shrink-0',
              activeTab === 'feed'
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-surface-container-low text-foreground-muted border-border hover:text-foreground'
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
                    : 'bg-surface-container-low text-foreground-muted border-border hover:text-foreground'
                )}
              >
                کمپین و ارسال دستی
              </button>
              <button
                onClick={() => setActiveTab('drivers')}
                className={cn(
                  'h-8 px-3 rounded-lg transition border cursor-pointer shrink-0',
                  activeTab === 'drivers'
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-surface-container-low text-foreground-muted border-border hover:text-foreground'
                )}
              >
                پیکربندی درایورها
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={cn(
                  'h-8 px-3 rounded-lg transition border cursor-pointer shrink-0',
                  activeTab === 'rules'
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-surface-container-low text-foreground-muted border-border hover:text-foreground'
                )}
              >
                قوانین و قالب‌ها
              </button>
              <button
                onClick={() => setActiveTab('outbox')}
                className={cn(
                  'h-8 px-3 rounded-lg transition border cursor-pointer shrink-0',
                  activeTab === 'outbox'
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-surface-container-low text-foreground-muted border-border hover:text-foreground'
                )}
              >
                صف خروجی (Outbox)
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('prefs')}
            className={cn(
              'h-8 px-3 rounded-lg transition border cursor-pointer shrink-0',
              activeTab === 'prefs'
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-surface-container-low text-foreground-muted border-border hover:text-foreground'
            )}
          >
            ساعت سکوت شخصی
          </button>
        </div>
      </div>

      {/* --- TAB CONTENT: FEED --- */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-container-low/40 border border-border-subtle/50 rounded-2xl p-4 backdrop-blur shadow-sm">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                variant={feedFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs font-bold"
                onClick={() => setFeedFilter('all')}
              >
                همه اعلانات ({toFa(notifications.length)})
              </Button>
              <Button
                variant={feedFilter === 'unread' ? 'default' : 'outline'}
                size="sm"
                className="text-xs font-bold"
                onClick={() => setFeedFilter('unread')}
              >
                خوانده‌نشده‌ها ({toFa(unreadCount)})
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold text-accent hover:bg-accent/10 cursor-pointer"
                  onClick={handleMarkAllAsRead}
                >
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
                  در حال حاضر هیچ پیام جدیدی برای شما ثبت نشده است.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((n) => {
                const config = typeConfig[n.type] || typeConfig.info
                const Icon = config.icon

                return (
                  <div
                    key={n.id}
                    className={cn(
                      'group flex items-start gap-4 p-4 bg-surface-container-low/30 backdrop-blur border border-border-subtle/50 rounded-2xl transition-all duration-300 hover:bg-surface-container-low/60 hover:border-accent/40 active:scale-[0.99] cursor-pointer shadow-sm relative overflow-hidden',
                      !n.isRead && 'bg-accent/5 border-accent/25'
                    )}
                    onClick={() => handleMarkAsRead(n.id, n.link)}
                  >
                    {!n.isRead && <span className="absolute top-0 bottom-0 start-0 w-1 bg-accent" />}

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
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB CONTENT: BROADCAST --- */}
      {activeTab === 'broadcast' && (
        <div className="max-w-2xl bg-surface-container-low border border-border/50 rounded-2xl p-6 shadow-sm space-y-5 text-right">
          <div>
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Send className="size-4 text-accent" />
              <span>ارسال و توزیع دستی اعلان</span>
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">توزیع هشدارها، اخبار یا بخشنامه‌های فوری مترو</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">سطح اهمیت:</label>
              <select
                value={bcForm.severity}
                onChange={(e) => setBcForm({ ...bcForm, severity: e.target.value })}
                className="w-full bg-neutral-900 border border-border p-2.5 rounded-lg text-xs text-foreground focus:outline-none focus:border-accent"
              >
                <option value="info">اطلاعیه عمومی (Info)</option>
                <option value="normal">عادی (Normal)</option>
                <option value="important">مهم (Important)</option>
                <option value="critical">بحران (Critical)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">هدف توزیع:</label>
              <select
                value={bcForm.targetGroup}
                onChange={(e) => setBcForm({ ...bcForm, targetGroup: e.target.value })}
                className="w-full bg-neutral-900 border border-border p-2.5 rounded-lg text-xs text-foreground focus:outline-none focus:border-accent"
              >
                <option value="all">همه پرسنل خط ۱</option>
                <option value="shift">شیفت خاص (morning/evening/night/off)</option>
                <option value="station">پرسنل بر اساس ایستگاه</option>
              </select>
            </div>
          </div>

          {bcForm.targetGroup !== 'all' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-bold text-foreground">فیلتر مقدار یا نام:</label>
              <input
                type="text"
                placeholder={bcForm.targetGroup === 'shift' ? 'مثال: morning' : 'مثال: تجریش'}
                value={bcForm.targetDetail}
                onChange={(e) => setBcForm({ ...bcForm, targetDetail: e.target.value })}
                className="w-full h-10 px-3 bg-neutral-900 border border-border rounded-lg text-xs text-foreground outline-none focus:border-accent"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">عنوان اعلان:</label>
            <input
              type="text"
              placeholder="عنوان پیام را وارد کنید..."
              value={bcForm.title}
              onChange={(e) => setBcForm({ ...bcForm, title: e.target.value })}
              className="w-full h-10 px-3 bg-neutral-900 border border-border rounded-lg text-xs text-foreground outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">متن تفصیلی:</label>
            <textarea
              rows={4}
              placeholder="متن کامل پیام..."
              value={bcForm.body}
              onChange={(e) => setBcForm({ ...bcForm, body: e.target.value })}
              className="w-full p-3 bg-neutral-900 border border-border rounded-lg text-xs text-foreground outline-none focus:border-accent resize-none"
            />
          </div>

          <div className="p-3 bg-neutral-950/20 border border-border/30 rounded-xl space-y-3 text-xs">
            <span className="font-bold block text-[10px] text-foreground-muted">تنظیمات ممیزی و رویت قانونی:</span>

            <div className="flex items-center justify-between">
              <span>درخواست ثبت رسید مطالعه قانونی (Legal Receipt):</span>
              <button
                onClick={() => setBcForm({ ...bcForm, requireReceipt: !bcForm.requireReceipt })}
                className={cn('w-9 h-5 rounded-full transition relative', bcForm.requireReceipt ? 'bg-accent' : 'bg-neutral-800')}
              >
                <span className={cn('absolute top-0.5 size-4 rounded-full bg-white transition-all', bcForm.requireReceipt ? 'left-1' : 'left-4')} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span>آلارم مکرر تا زمان تایید (فقط برای شرایط اضطراری):</span>
              <button
                onClick={() => setBcForm({ ...bcForm, continuousAlert: !bcForm.continuousAlert })}
                className={cn('w-9 h-5 rounded-full transition relative', bcForm.continuousAlert ? 'bg-accent' : 'bg-neutral-800')}
              >
                <span className={cn('absolute top-0.5 size-4 rounded-full bg-white transition-all', bcForm.continuousAlert ? 'left-1' : 'left-4')} />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border/20">
            <Button
              onClick={handleBroadcast}
              disabled={actionLoading === 'broadcast'}
              className="px-6 h-10 text-xs font-bold bg-accent hover:bg-accent-hover text-accent-foreground cursor-pointer"
            >
              {actionLoading === 'broadcast' ? (
                <>
                  <Loader2 className="size-4 animate-spin me-2" />
                  در حال توزیع اعلان...
                </>
              ) : (
                'انتشار سراسری پیام'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: DRIVERS CONFIG --- */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver Health Check indicators */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-foreground">وضعیت زنده درایورها (تحریم گریزی)</h2>
            
            {['pushe', 'najva', 'selfhosted'].map((key) => {
              const health = driverHealth.push?.[key] || { status: 'green', errorCount: 0 }
              const statusColors = {
                green: 'border-success bg-success/5 text-success',
                yellow: 'border-warning bg-warning/5 text-warning',
                red: 'border-critical bg-critical/5 text-critical animate-pulse',
              }

              return (
                <Card key={key} className={cn('border', statusColors[health.status as 'green' | 'yellow' | 'red'])}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase">{key === 'selfhosted' ? 'Self-hosted (ntfy)' : key}</h3>
                      <p className="text-[10px] text-foreground-muted mt-1">
                        تعداد خطاهای متوالی: {toFa(health.errorCount)} از ۵
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleTestDriver(key)}
                        disabled={actionLoading === `test-${key}`}
                        className="text-[9px] font-black h-7"
                      >
                        {actionLoading === `test-${key}` ? <Loader2 className="size-3 animate-spin" /> : 'تست اتصال'}
                      </Button>
                      <span className={cn(
                        'size-2.5 rounded-full shrink-0',
                        health.status === 'green' ? 'bg-success' : health.status === 'yellow' ? 'bg-warning' : 'bg-critical'
                      )} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            <div className="pt-2">
              <h2 className="text-sm font-black text-foreground mb-3">آمار پیامک‌های ارسالی امروز</h2>
              <Card className="bg-surface-container-low border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-foreground-muted font-bold">مصرف سهمیه پیامک</span>
                    <h3 className="text-lg font-black mt-1 text-accent">{toFa(smsQuotaUsed)} پیامک</h3>
                  </div>
                  <Database className="size-8 text-accent/20" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Fallback chain and settings form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-surface-container-low border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-black">تنظیمات اصلی ارائه‌دهندگان پوش و پیامک</CardTitle>
                <CardDescription className="text-xs">انتخاب اولویت و تعریف کلیدهای API جهت احراز هویت در سامانه پوشه و نجوا</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold">درایور پوش فعال (پیش‌فرض):</label>
                    <select
                      value={driverSettings.activePushDriver}
                      onChange={(e) => setDriverSettings({ ...driverSettings, activePushDriver: e.target.value })}
                      className="w-full bg-neutral-900 border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                    >
                      <option value="pushe">پوشه (Pushe)</option>
                      <option value="najva">نجوا (Najva)</option>
                      <option value="selfhosted">Self-hosted (اتصال مستقیم SSE)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold">درایور پیامک فعال:</label>
                    <select
                      value={driverSettings.activeSmsDriver}
                      onChange={(e) => setDriverSettings({ ...driverSettings, activeSmsDriver: e.target.value })}
                      className="w-full bg-neutral-900 border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                    >
                      <option value="kavenegar">کاوهنگار (Kavenegar)</option>
                      <option value="melipayamak">ملی‌پیامک (MeliPayamak)</option>
                      <option value="smsir">SMS.ir</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold border-b border-border/30 pb-1">کلیدهای API ارائه‌دهندگان</h3>

                  <div className="space-y-2">
                    <label className="text-xs text-foreground-muted">توکن API پوشه:</label>
                    <input
                      type="password"
                      value={driverSettings.pusheApiKey}
                      onChange={(e) => setDriverSettings({ ...driverSettings, pusheApiKey: e.target.value })}
                      className="w-full h-9 px-3 bg-neutral-900 border border-border rounded text-xs text-foreground outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-foreground-muted">توکن API نجوا:</label>
                    <input
                      type="password"
                      value={driverSettings.najvaApiKey}
                      onChange={(e) => setDriverSettings({ ...driverSettings, najvaApiKey: e.target.value })}
                      className="w-full h-9 px-3 bg-neutral-900 border border-border rounded text-xs text-foreground outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-foreground-muted">کلید API کاوهنگار:</label>
                    <input
                      type="password"
                      value={driverSettings.kavenegarApiKey}
                      onChange={(e) => setDriverSettings({ ...driverSettings, kavenegarApiKey: e.target.value })}
                      className="w-full h-9 px-3 bg-neutral-900 border border-border rounded text-xs text-foreground outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border/20">
                  <Button
                    onClick={handleSaveDriverSettings}
                    disabled={actionLoading === 'drivers'}
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent-hover font-bold"
                  >
                    {actionLoading === 'drivers' ? (
                      <>
                        <Loader2 className="size-3 animate-spin me-2" />
                        در حال ذخیره‌سازی...
                      </>
                    ) : (
                      <>
                        <Save className="size-4 me-1.5" />
                        ذخیره پیکربندی
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: RULES & TEMPLATES --- */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rules List */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-foreground">رویدادهای سیستم</h2>
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  onClick={() => selectEventKey(rule.eventKey)}
                  className={cn(
                    'p-3 border rounded-xl cursor-pointer transition text-right',
                    selectedEventKey === rule.eventKey
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-surface-container-low hover:border-accent/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">{rule.eventKey}</span>
                    <Badge className={cn(
                      rule.severity === 'critical' ? 'bg-critical/20 text-critical border-transparent' : 'bg-neutral-800 text-foreground'
                    )}>
                      {rule.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-foreground-muted font-bold">
                    <span>کانال‌ها: {rule.channels.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editor Form */}
          <div className="lg:col-span-2">
            {selectedEventKey ? (
              <Card className="bg-surface-container-low border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-black flex items-center justify-between">
                    <span>قواعد و قالب برای {selectedEventKey}</span>
                    <Badge className="bg-accent/15 text-accent border-transparent">ویرایش فعال</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 text-right">
                  {/* Severity & Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold">اهمیت اعلان:</label>
                      <select
                        value={ruleEdit.severity || 'normal'}
                        onChange={(e) => setRuleEdit({ ...ruleEdit, severity: e.target.value as any })}
                        className="w-full bg-neutral-900 border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                      >
                        <option value="info">اطلاعیه عمومی (Info)</option>
                        <option value="normal">عادی (Normal)</option>
                        <option value="important">مهم (Important)</option>
                        <option value="critical">بحران (Critical)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold">زمان انتظار پیامک زاپاس (دقیقه):</label>
                      <input
                        type="number"
                        placeholder="خالی یعنی بدون تاخیر"
                        value={ruleEdit.smsIfUnseenMinutes || ''}
                        onChange={(e) => setRuleEdit({ ...ruleEdit, smsIfUnseenMinutes: e.target.value ? Number(e.target.value) : null })}
                        className="w-full h-9 bg-neutral-900 border border-border p-2 rounded text-xs text-foreground outline-none"
                      />
                    </div>

                    <div className="space-y-2 pt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold">رعایت ساعات سکوت:</span>
                        <button
                          onClick={() => setRuleEdit({ ...ruleEdit, respectQuietHours: !ruleEdit.respectQuietHours })}
                          className={cn('w-9 h-5 rounded-full transition relative', ruleEdit.respectQuietHours ? 'bg-accent' : 'bg-neutral-800')}
                        >
                          <span className={cn('absolute top-0.5 size-4 rounded-full bg-white transition-all', ruleEdit.respectQuietHours ? 'left-1' : 'left-4')} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Channels checkboxes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold block">کانال‌های توزیع:</label>
                    <div className="flex items-center gap-4">
                      {['inapp', 'push', 'sms'].map((chan) => {
                        const hasChan = ruleEdit.channels?.includes(chan) ?? false
                        return (
                          <label key={chan} className="flex items-center gap-2 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={hasChan}
                              onChange={(e) => {
                                let list = [...(ruleEdit.channels ?? [])]
                                if (e.target.checked) {
                                  if (!list.includes(chan)) list.push(chan)
                                } else {
                                  list = list.filter((c) => c !== chan)
                                }
                                setRuleEdit({ ...ruleEdit, channels: list })
                              }}
                              className="size-4 accent-accent"
                            />
                            <span className="capitalize">{chan === 'inapp' ? 'درون‌برنامه‌ای' : chan === 'push' ? 'پوش نوتیفیکیشن' : 'پیامک'}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Template Editors */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold border-b border-border/30 pb-1">پیکربندی قالب پیام</h3>

                    <div className="space-y-1">
                      <label className="text-[11px] text-foreground-muted">عنوان قالب (پشتیبانی از متغیرها مانند {`{date}`}):</label>
                      <input
                        type="text"
                        value={templateEdit.title || ''}
                        onChange={(e) => setTemplateEdit({ ...templateEdit, title: e.target.value })}
                        className="w-full h-9 px-3 bg-neutral-900 border border-border rounded text-xs text-foreground outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-foreground-muted">متن قالب:</label>
                      <textarea
                        rows={3}
                        value={templateEdit.body || ''}
                        onChange={(e) => setTemplateEdit({ ...templateEdit, body: e.target.value })}
                        className="w-full p-2.5 bg-neutral-900 border border-border rounded text-xs text-foreground outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-foreground-muted">متن پیامک زاپاس (کوتاه):</label>
                      <textarea
                        rows={2}
                        value={templateEdit.smsText || ''}
                        onChange={(e) => setTemplateEdit({ ...templateEdit, smsText: e.target.value })}
                        className="w-full p-2.5 bg-neutral-900 border border-border rounded text-xs text-foreground outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border/20">
                    <Button
                      onClick={handleSaveRuleAndTemplate}
                      disabled={actionLoading === 'ruleTemplate'}
                      size="sm"
                      className="bg-accent text-accent-foreground hover:bg-accent-hover font-bold"
                    >
                      {actionLoading === 'ruleTemplate' ? (
                        <>
                          <Loader2 className="size-3 animate-spin me-2" />
                          در حال ذخیره‌سازی...
                        </>
                      ) : (
                        <>
                          <Save className="size-4 me-1.5" />
                          ذخیره قالب و قانون
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-border rounded-2xl p-12 text-foreground-muted text-xs">
                جهت ویرایش قوانین، یک رویداد را از لیست سمت راست انتخاب کنید.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: OUTBOX LOGS --- */}
      {activeTab === 'outbox' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-container-low/40 border border-border-subtle/50 rounded-2xl p-4 backdrop-blur shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">فیلتر وضعیت:</span>
              {['all', 'queued', 'sent', 'delivered', 'failed', 'pending_seen_sms'].map((status) => (
                <Button
                  key={status}
                  variant={outboxFilter === status ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => setOutboxFilter(status)}
                  className="text-[10px] font-bold"
                >
                  {status === 'all' ? 'همه' : status}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={fetchOutbox}
              className="text-[10px]"
            >
              <RefreshCw className="size-3 me-1" />
              بروزرسانی لاگ‌ها
            </Button>
          </div>

          <Card className="bg-surface-container-low border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/50 bg-neutral-950/20 text-foreground-muted text-[10px] font-bold">
                      <th className="p-3">کاربر دریافت‌کننده</th>
                      <th className="p-3">رویداد</th>
                      <th className="p-3">کانال</th>
                      <th className="p-3">درایور</th>
                      <th className="p-3">تعداد تلاش</th>
                      <th className="p-3">وضعیت</th>
                      <th className="p-3">جزئیات خطا</th>
                      <th className="p-3 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {outboxLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-foreground-muted">
                          رکوردی در Outbox یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      outboxLogs.map((log) => {
                        const statusColors = {
                          queued: 'bg-neutral-800 text-foreground',
                          sent: 'bg-info/20 text-info',
                          delivered: 'bg-success/20 text-success',
                          seen: 'bg-success/30 text-success border-success/50',
                          failed: 'bg-critical/20 text-critical font-bold',
                          expired: 'bg-neutral-800/50 text-foreground-muted',
                          pending_seen_sms: 'bg-warning/20 text-warning animate-pulse',
                        }

                        return (
                          <tr key={log.id} className="hover:bg-neutral-900/10">
                            <td className="p-3 font-bold">
                              <div>{log.user?.name}</div>
                              <div className="text-[10px] text-foreground-muted">{log.user?.role?.name}</div>
                            </td>
                            <td className="p-3 font-mono text-[10px]">{log.eventKey}</td>
                            <td className="p-3">
                              <Badge className="bg-neutral-800 text-foreground">{log.channel}</Badge>
                            </td>
                            <td className="p-3 font-mono text-[10px]">{log.driver || '-'}</td>
                            <td className="p-3 font-mono">{toFa(log.attempts)}</td>
                            <td className="p-3">
                              <Badge className={cn('border-transparent text-[9px] font-bold', statusColors[log.status])}>
                                {log.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-critical max-w-[200px] truncate" title={log.lastError || ''}>
                              {log.lastError || '-'}
                            </td>
                            <td className="p-3 text-left">
                              {log.status === 'failed' && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => handleRetryOutbox(log.id)}
                                  disabled={actionLoading === `retry-${log.id}`}
                                  className="h-7 text-[9px] border-critical/30 text-critical hover:bg-critical/5 font-black"
                                >
                                  {actionLoading === `retry-${log.id}` ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    'بازارسال دستی'
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- TAB CONTENT: QUIET HOURS / USER PREFS --- */}
      {activeTab === 'prefs' && (
        <div className="max-w-xl bg-surface-container-low border border-border/50 rounded-2xl p-6 shadow-sm space-y-6 text-right">
          <div>
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Settings className="size-4 text-accent" />
              <span>تنظیم ساعت سکوت شخصی</span>
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              تعیین ساعات استراحت جهت خاموشی اعلانات غیرضروری و غیربحرانی سیستم
            </p>
          </div>

          <div className="space-y-4 pt-2 border-t border-border/10 text-xs">
            <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-950/20 border border-border/50 rounded-xl">
              <div className="space-y-2">
                <label className="font-bold block">شروع ساعت استراحت (سکوت):</label>
                <input
                  type="time"
                  value={userPrefs.quietHours?.from || '23:00'}
                  onChange={(e) =>
                    setUserPrefs({
                      ...userPrefs,
                      quietHours: { from: e.target.value, to: userPrefs.quietHours?.to || '07:00' },
                    })
                  }
                  className="w-full bg-neutral-900 border border-border p-2 rounded-lg text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="font-bold block">پایان ساعت استراحت (سکوت):</label>
                <input
                  type="time"
                  value={userPrefs.quietHours?.to || '07:00'}
                  onChange={(e) =>
                    setUserPrefs({
                      ...userPrefs,
                      quietHours: { from: userPrefs.quietHours?.from || '23:00', to: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900 border border-border p-2 rounded-lg text-foreground focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSavePrefs}
                disabled={actionLoading === 'prefs'}
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent-hover font-bold"
              >
                {actionLoading === 'prefs' ? (
                  <>
                    <Loader2 className="size-3 animate-spin me-2" />
                    در حال ذخیره‌سازی...
                  </>
                ) : (
                  'ذخیره ساعت سکوت'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
