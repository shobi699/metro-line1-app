'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toFa, jalali } from '@/lib/fa'
import { Bell, CheckCheck, Info, AlertTriangle, AlertCircle, Search, Settings, ShieldAlert, MessageSquare, Calendar, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs-jalali'
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

function getTimeGroup(dateStr: string): string {
  const now = dayjs()
  const date = dayjs(dateStr)
  const diffDays = now.diff(date, 'day')

  if (diffDays === 0) return 'امروز'
  if (diffDays === 1) return 'دیروز'
  if (diffDays < 7) return 'هفته گذشته'
  return 'قدیمی‌تر'
}

function playAlertSound(type: 'info' | 'warning' | 'success') {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
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
  } catch (e) {
    console.warn('Audio Context blocked or unsupported:', e)
  }
}

export default function NotificationsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'feed' | 'settings'>('feed')
  
  // Notifications States
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Preference Settings States
  const [prefCirculars, setPrefCirculars] = useState(true)
  const [prefChat, setPrefChat] = useState(true)
  const [prefShifts, setPrefShifts] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [loadingPrefs, setLoadingPrefs] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
        setNotifications(data.data?.notifications ?? [])
        setUnreadCount(data.data?.unreadCount ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }

  async function loadPreferences() {
    if (!accessToken) return
    setLoadingPrefs(true)
    try {
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        const settings = json.data?.customFields?.notificationSettings
        if (settings) {
          setPrefCirculars(settings.circulars !== false)
          setPrefChat(settings.chat !== false)
          setPrefShifts(settings.shifts !== false)
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingPrefs(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [accessToken, filter])

  useEffect(() => {
    if (activeTab === 'settings') {
      void loadPreferences()
    }
  }, [activeTab, accessToken])

  async function markAsRead(id: string) {
    if (!accessToken) return
    playAlertSound('info')
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
    playAlertSound('success')
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
    if (!accessToken) return
    setSavingPrefs(true)
    setSaveStatus(null)
    try {
      const res = await fetch('/api/profile/notification-settings', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          circulars: prefCirculars,
          chat: prefChat,
          shifts: prefShifts,
        }),
      })
      if (res.ok) {
        playAlertSound('success')
        setSaveStatus({ type: 'success', message: 'تنظیمات ترجیحی اعلانات شما با موفقیت ذخیره گردید.' })
      } else {
        const json = await res.json()
        setSaveStatus({ type: 'error', message: json.error || 'خطا در ذخیره‌سازی ترجیحات اعلانات.' })
      }
    } catch {
      setSaveStatus({ type: 'error', message: 'خطای شبکه در ذخیره اطلاعات.' })
    } finally {
      setSavingPrefs(false)
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

  const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    info: { icon: Info, color: 'text-info', bgColor: 'bg-info/10 border-info/20' },
    warning: { icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10 border-warning/20' },
    urgent: { icon: AlertCircle, color: 'text-critical', bgColor: 'bg-critical/10 border-critical/20 shadow-critical/5' },
    system: { icon: Bell, color: 'text-accent', bgColor: 'bg-accent/10 border-accent/20' },
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 transition-all duration-500" dir="rtl">
      {/* ── Header Area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <h1 className="text-lg font-black text-foreground">مرکز اعلانات و پیام‌های سیستمی</h1>
          <p className="text-xs text-foreground-muted mt-1">
            مشاهده اطلاعیه‌ها، پیام‌های اضطراری سیر و حرکت و ترجیحات اعلان‌ها
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={cn(
              'h-9 px-4 rounded-lg text-xs font-black flex items-center gap-2 cursor-pointer transition border shadow-sm',
              activeTab === 'feed'
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-surface-container-low text-foreground-muted border-border hover:bg-surface-container-high hover:text-foreground',
            )}
          >
            <Bell className="size-4" />
            <span>لیست اعلانات</span>
            {unreadCount > 0 && (
              <span className="ms-1 px-1.5 py-0.5 rounded-full bg-critical text-critical-foreground text-[9px] font-mono animate-pulse">
                {toFa(unreadCount)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              'h-9 px-4 rounded-lg text-xs font-black flex items-center gap-2 cursor-pointer transition border shadow-sm',
              activeTab === 'settings'
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-surface-container-low text-foreground-muted border-border hover:bg-surface-container-high hover:text-foreground',
            )}
          >
            <Settings className="size-4" />
            <span>تنظیمات دریافت</span>
          </button>
        </div>
      </div>

      {activeTab === 'feed' ? (
        <>
          {/* ── Controls & Filter Bar ────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-container-low/40 border border-border-subtle/50 rounded-2xl p-4 backdrop-blur shadow-sm">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs font-bold"
                onClick={() => setFilter('all')}
              >
                همه اعلانات
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                className="text-xs font-bold"
                onClick={() => setFilter('unread')}
              >
                خوانده‌نشده‌ها
              </Button>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs font-bold text-accent hover:bg-accent/10" onClick={markAllAsRead}>
                  <CheckCheck className="size-4 me-1.5" />
                  خواندن همه
                </Button>
              )}
            </div>

            {/* Search Input */}
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

          {/* ── Notifications Feed ─────────────────────────────────────────── */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-2xl border border-border bg-surface-container-low/20"
                />
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
                  <h3 className="text-xs font-black text-foreground-muted px-2 flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-accent rounded-full" />
                    <span>{group}</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {items.map((n) => {
                      const config = typeConfig[n.type] ?? typeConfig.info
                      const Icon = config.icon
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
                          {/* Priority glow bar */}
                          {!n.isRead && (
                            <span className="absolute top-0 bottom-0 start-0 w-1 bg-accent" />
                          )}
                          
                          {/* Circle Icon Container */}
                          <div className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-105', 
                            config.bgColor
                          )}>
                            <Icon className={cn('size-5', config.color)} />
                          </div>

                          {/* Message Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-foreground leading-normal">{n.title}</span>
                              {!n.isRead && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-accent/20 text-accent font-black animate-pulse">جدید</span>
                              )}
                            </div>
                            {n.body && (
                              <p className="mt-1.5 text-[11px] text-foreground-muted leading-relaxed line-clamp-2">
                                {n.body}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-3 text-[9px] text-foreground-muted">
                              <span className="font-semibold">{jalali(n.createdAt)}</span>
                              <span>•</span>
                              <span className="font-semibold uppercase">{n.type === 'system' ? 'سیستمی' : n.type === 'urgent' ? 'فوری' : n.type === 'warning' ? 'هشدار' : 'عمومی'}</span>
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
      ) : (
        /* ── Advanced Preference Subscriptions Panel ───────────────────────── */
        <div className="max-w-2xl bg-surface-container-low/40 border border-border-subtle/50 rounded-2xl p-6 backdrop-blur shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Settings className="size-4 text-accent" />
              <span>تنظیمات کانال‌های دریافت اعلان‌ها</span>
            </h2>
            <p className="text-[11px] text-foreground-muted mt-1">
              مشخص کنید چه نوع پیام‌ها و اعلان‌هایی را می‌خواهید دریافت کنید. تغییرات بلافاصله پس از ذخیره‌سازی روی پروفایل کاربری شما در دیتابیس پایدار اعمال خواهند شد.
            </p>
          </div>

          {loadingPrefs ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-foreground-muted">
              <Loader2 className="size-8 animate-spin text-accent" />
              <span className="text-[11px]">در حال دریافت اطلاعات تنظیمات ترجیحی...</span>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-border/10">
              {/* Preferences switches */}
              <div className="flex flex-col gap-5">
                
                {/* Circulars Subscription */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border/20 bg-surface/30">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="size-4 text-accent" />
                      <span>بخشنامه‌های ایمنی سیر و حرکت (امضا اجباری)</span>
                    </h4>
                    <p className="text-[10px] text-foreground-muted max-w-md leading-relaxed">
                      دریافت اعلان‌ها و هشدارهای جدید مربوط به بخشنامه‌های ایمنی و الزامی که مستلزم تایید سریع توسط شما هستند.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={prefCirculars}
                      onChange={(e) => setPrefCirculars(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-border/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>

                {/* Chat and Radio Subscription */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border/20 bg-surface/30">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <MessageSquare className="size-4 text-accent" />
                      <span>پیام‌های چت و بیسیم متنی OCC</span>
                    </h4>
                    <p className="text-[10px] text-foreground-muted max-w-md leading-relaxed">
                      دریافت پیام‌های دریافتی جدید در کانال‌های گفت‌وگو و هشدارهای صادر شده در بیسیم متنی.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={prefChat}
                      onChange={(e) => setPrefChat(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-border/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>

                {/* Roster & Shifts Subscription */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border/20 bg-surface/30">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <Calendar className="size-4 text-accent" />
                      <span>برنامه لوحه و شیفت‌های کاری</span>
                    </h4>
                    <p className="text-[10px] text-foreground-muted max-w-md leading-relaxed">
                      دریافت اعلان‌ها پیرامون تایید فایل لوحه جدید، جابجایی تایید شده شیفت‌ها یا درخواست تعویض شیفت همکاران.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={prefShifts}
                      onChange={(e) => setPrefShifts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-border/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>

              </div>

              {/* Status Message */}
              {saveStatus && (
                <div className={cn(
                  'p-3.5 rounded-xl text-xs font-bold text-center animate-in fade-in duration-300',
                  saveStatus.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-critical/10 text-critical border border-critical/20'
                )}>
                  {saveStatus.message}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-border/10">
                <Button
                  onClick={savePreferences}
                  disabled={savingPrefs}
                  className="px-6 h-10 text-xs font-black cursor-pointer bg-accent hover:bg-accent-hover text-accent-foreground"
                >
                  {savingPrefs ? (
                    <>
                      <Loader2 className="size-4 me-1.5 animate-spin" />
                      در حال ذخیره‌سازی...
                    </>
                  ) : (
                    'ذخیره تنظیمات دریافت'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
