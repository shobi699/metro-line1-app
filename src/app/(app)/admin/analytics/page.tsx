'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toFa, jalali } from '@/lib/fa'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Users,
  AlertTriangle,
  Activity,
  Clock,
  ShieldCheck,
  Calendar,
  Loader2,
  RefreshCw,
  Database,
  Server,
  Search,
  Filter,
  TrendingUp,
  Shield,
  Wrench,
  BookOpen,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────

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
  ticketPriorityStats: Record<string, number>
  ticketStatusStats: Record<string, number>
  shiftDistribution: Record<string, number>
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

interface AuditLog {
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
    name: string | null
    nationalId: string
    role: { name: string } | null
  } | null
}

// ── Constants ──────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  create: 'ایجاد',
  update: 'بروزرسانی',
  delete: 'حذف',
  login: 'ورود',
  logout: 'خروج',
  import: 'ایمپورت',
  export: 'خروجی',
}

const ENTITY_LABELS: Record<string, string> = {
  User: 'کاربر',
  Role: 'نقش',
  Shift: 'شیفت',
  Ticket: 'تیکت',
  FaultReport: 'گزارش خرابی',
  SafetyBulletin: 'بخشنامه',
  Holiday: 'تعطیلی',
  OrgEvent: 'رویداد سازمانی',
  LeaveRequest: 'مرخصی',
  Setting: 'تنظیمات',
  ChatRoom: 'اتاق گفتگو',
  Train: 'قطار',
}

const TICKET_STATUS_LABELS: Record<string, string> = {
  open: 'باز',
  in_progress: 'در حال بررسی',
  resolved: 'حل شده',
  closed: 'بسته شده',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  critical: 'بحرانی',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-muted',
  medium: 'bg-blue-500',
  high: 'bg-amber-500',
  critical: 'bg-destructive',
}

const SHIFT_LABELS: Record<string, string> = {
  morning: 'صبح',
  evening: 'عصر',
  night: 'شب',
  off: 'آف',
}

const SHIFT_COLORS: Record<string, string> = {
  morning: 'bg-amber-400',
  evening: 'bg-violet-500',
  night: 'bg-indigo-600',
  off: 'bg-muted-foreground/40',
}

const WEEK_LABELS = ['هفته ۴', 'هفته ۳', 'هفته ۲', 'این هفته']

// ── Page ───────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [auditSearch, setAuditSearch] = useState('')
  const [auditAction, setAuditAction] = useState('')
  const [auditEntity, setAuditEntity] = useState('')

  const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  const fetchAnalytics = useCallback(async () => {
    if (!accessToken) return
    setLoadingData(true)
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch {
      // silent
    } finally {
      setLoadingData(false)
    }
  }, [accessToken])

  const fetchAuditLogs = useCallback(async () => {
    if (!accessToken) return
    setLoadingLogs(true)
    try {
      const params = new URLSearchParams()
      if (auditSearch.trim()) params.set('search', auditSearch.trim())
      if (auditAction) params.set('action', auditAction)
      if (auditEntity) params.set('entity', auditEntity)

      const res = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setAuditLogs(json.data ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoadingLogs(false)
    }
  }, [accessToken, auditSearch, auditAction, auditEntity])

  useEffect(() => {
    if (isAdmin) fetchAnalytics()
  }, [isAdmin, fetchAnalytics])

  useEffect(() => {
    if (isAdmin) fetchAuditLogs()
  }, [isAdmin, fetchAuditLogs])

  if (!isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">شما دسترسی به این بخش را ندارید</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            داشبورد تحلیلی
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            شاخص‌های عملکرد، آمار ماژول‌ها و دفتر ثبت وقایع سیستم
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchAnalytics(); fetchAuditLogs() }}>
          <RefreshCw className="w-4 h-4 ms-2" />
          بروزرسانی
        </Button>
      </div>

      <Tabs defaultValue="kpis" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="kpis" className="gap-2">
            <Activity className="w-4 h-4" /> شاخص‌های عملکرد
          </TabsTrigger>
          <TabsTrigger value="distributions" className="gap-2">
            <BarChart3 className="w-4 h-4" /> توزیع و آمار
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Server className="w-4 h-4" /> سلامت سیستم
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Shield className="w-4 h-4" /> دفتر وقایع
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: KPIs ── */}
        <TabsContent value="kpis">
          {loadingData ? (
            <LoadingState />
          ) : data ? (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title="پرسنل فعال"
                  value={data.kpis.activeUsers}
                  icon={<Users className="w-5 h-5 text-primary" />}
                  accent="text-primary"
                />
                <KpiCard
                  title="تیکت‌های باز"
                  value={data.kpis.openTickets}
                  icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                  accent="text-amber-500"
                  subtitle={`${toFa(data.kpis.criticalTickets)} بحرانی`}
                />
                <KpiCard
                  title="انطباق ایمنی"
                  value={data.kpis.safetyCompliance}
                  suffix="%"
                  icon={<ShieldCheck className="w-5 h-5 text-success" />}
                  accent="text-success"
                />
                <KpiCard
                  title="MTTR میانگین"
                  value={data.kpis.mttrMinutes}
                  suffix=" دقیقه"
                  icon={<Wrench className="w-5 h-5 text-violet-500" />}
                  accent="text-violet-500"
                />
              </div>

              {/* Second Row KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard
                  title="پوشش شیفت‌ها"
                  value={data.kpis.shiftCoverageRate}
                  suffix="%"
                  icon={<Calendar className="w-5 h-5 text-blue-500" />}
                  accent="text-blue-500"
                />
                <KpiCard
                  title="کل شیفت‌های ثبت‌شده"
                  value={data.kpis.totalAssignedShifts}
                  icon={<Clock className="w-5 h-5 text-emerald-500" />}
                  accent="text-emerald-500"
                />
                <Card className="col-span-2 lg:col-span-1">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-2">روند تیکت‌ها (۴ هفته اخیر)</div>
                    <div className="flex items-end gap-2 h-16">
                      {data.weeklyTrends.map((count, i) => {
                        const maxVal = Math.max(...data.weeklyTrends, 1)
                        const height = (count / maxVal) * 100
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">{toFa(count)}</span>
                            <div
                              className={cn(
                                'w-full rounded-t-sm transition-all',
                                i === 3 ? 'bg-primary' : 'bg-primary/30'
                              )}
                              style={{ height: `${Math.max(height, 4)}%` }}
                            />
                            <span className="text-[9px] text-muted-foreground">{WEEK_LABELS[i]}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Safety Bulletin Engagement */}
              {data.bulletinEngagement.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      میزان مطالعه بخشنامه‌های ایمنی
                    </CardTitle>
                    <CardDescription>نرخ رؤیت هر بخشنامه فعال</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.bulletinEngagement.map((b) => (
                        <div key={b.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[60%]">{b.title}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {toFa(b.readCount)} / {toFa(b.totalExpected)} — {toFa(b.rate)}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                b.rate >= 80 ? 'bg-success' : b.rate >= 50 ? 'bg-amber-500' : 'bg-destructive'
                              )}
                              style={{ width: `${b.rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <ErrorState onRetry={fetchAnalytics} />
          )}
        </TabsContent>

        {/* ── Tab: Distributions ── */}
        <TabsContent value="distributions">
          {loadingData ? (
            <LoadingState />
          ) : data ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Ticket Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">توزیع وضعیت تیکت‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarList
                    items={Object.entries(data.ticketStatusStats).map(([key, count]) => ({
                      label: TICKET_STATUS_LABELS[key] ?? key,
                      value: count,
                      color: key === 'open' ? 'bg-destructive/60' : key === 'in_progress' ? 'bg-amber-500/60' : key === 'resolved' ? 'bg-success/60' : 'bg-muted-foreground/40',
                    }))}
                  />
                </CardContent>
              </Card>

              {/* Ticket Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">توزیع اولویت تیکت‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarList
                    items={Object.entries(data.ticketPriorityStats).map(([key, count]) => ({
                      label: PRIORITY_LABELS[key] ?? key,
                      value: count,
                      color: PRIORITY_COLORS[key] ?? 'bg-muted',
                    }))}
                  />
                </CardContent>
              </Card>

              {/* Shift Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    توزیع شیفت‌ها
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarList
                    items={Object.entries(data.shiftDistribution).map(([key, count]) => ({
                      label: SHIFT_LABELS[key] ?? key,
                      value: count,
                      color: SHIFT_COLORS[key] ?? 'bg-muted',
                    }))}
                  />
                </CardContent>
              </Card>

              {/* Weekly Trend Detail */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    روند هفتگی تیکت‌ها
                  </CardTitle>
                  <CardDescription>تعداد تیکت‌های ثبت‌شده در ۴ هفته اخیر</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.weeklyTrends.map((count, i) => {
                      const maxVal = Math.max(...data.weeklyTrends, 1)
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-16 text-sm text-end text-muted-foreground shrink-0">
                            {WEEK_LABELS[i]}
                          </span>
                          <div className="flex-1">
                            <div
                              className={cn(
                                'h-6 rounded-sm flex items-center pe-2 justify-end transition-all',
                                i === 3 ? 'bg-primary/30' : 'bg-muted'
                              )}
                              style={{ width: `${Math.max((count / maxVal) * 100, 8)}%` }}
                            >
                              <span className="text-xs font-medium">{toFa(count)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <ErrorState onRetry={fetchAnalytics} />
          )}
        </TabsContent>

        {/* ── Tab: System Health ── */}
        <TabsContent value="health">
          {loadingData ? (
            <LoadingState />
          ) : data ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <HealthCard
                title="پایگاه داده"
                icon={<Database className="w-5 h-5" />}
                status={data.systemHealth.database === 'connected' ? 'healthy' : 'error'}
                label={data.systemHealth.database === 'connected' ? 'متصل' : 'قطع'}
              />
              <HealthCard
                title="تاخیر پاسخ سرور"
                icon={<Activity className="w-5 h-5" />}
                status={data.systemHealth.latencyMs < 50 ? 'healthy' : data.systemHealth.latencyMs < 100 ? 'warning' : 'error'}
                label={`${toFa(data.systemHealth.latencyMs)} میلی‌ثانیه`}
              />
              <HealthCard
                title="Uptime"
                icon={<Server className="w-5 h-5" />}
                status="healthy"
                label={data.systemHealth.uptime}
              />
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-4 flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">زمان سرور:</span>
                  <span className="font-mono text-xs" dir="ltr">{data.systemHealth.serverTime}</span>
                </CardContent>
              </Card>
            </div>
          ) : (
            <ErrorState onRetry={fetchAnalytics} />
          )}
        </TabsContent>

        {/* ── Tab: Audit Logs ── */}
        <TabsContent value="audit">
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو نام، کد ملی، شناسه..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="ps-9"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {[
                  { key: '', label: 'همه عملیات' },
                  { key: 'create', label: 'ایجاد' },
                  { key: 'update', label: 'بروزرسانی' },
                  { key: 'delete', label: 'حذف' },
                  { key: 'login', label: 'ورود' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setAuditAction(f.key)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-md transition-all border',
                      auditAction === f.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground border-transparent'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs Table */}
            {loadingLogs ? (
              <LoadingState />
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center border rounded-xl bg-card/30 border-dashed">
                <Shield className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-lg font-medium">رویدادی یافت نشد</h3>
                <p className="text-muted-foreground text-sm mt-1">فیلترها را تغییر دهید</p>
              </div>
            ) : (
              <div className="relative w-full overflow-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="border-b">
                      <th className="p-3 text-start font-medium whitespace-nowrap">زمان</th>
                      <th className="p-3 text-start font-medium whitespace-nowrap">کاربر</th>
                      <th className="p-3 text-start font-medium whitespace-nowrap">عملیات</th>
                      <th className="p-3 text-start font-medium whitespace-nowrap">موجودیت</th>
                      <th className="p-3 text-start font-medium whitespace-nowrap">شناسه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                          {toFa(jalali(log.createdAt))}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="text-sm">{log.actor?.name ?? '—'}</div>
                          {log.actor?.role && (
                            <div className="text-[10px] text-muted-foreground">{log.actor.role.name}</div>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[11px]',
                              log.action === 'delete' ? 'text-destructive border-destructive/30' :
                              log.action === 'create' ? 'text-success border-success/30' :
                              log.action === 'login' ? 'text-blue-500 border-blue-500/30' :
                              ''
                            )}
                          >
                            {ACTION_LABELS[log.action] ?? log.action}
                          </Badge>
                        </td>
                        <td className="p-3 whitespace-nowrap text-xs">
                          {ENTITY_LABELS[log.entity] ?? log.entity}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {log.entityId.length > 12 ? `${log.entityId.slice(0, 12)}...` : log.entityId}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────

function KpiCard({ title, value, suffix, icon, accent, subtitle }: {
  title: string
  value: number
  suffix?: string
  icon: React.ReactNode
  accent: string
  subtitle?: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className={cn('text-2xl font-bold mt-0.5', accent)}>
            {toFa(value)}{suffix ?? ''}
          </div>
          {subtitle && <div className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function BarList({ items }: { items: { label: string; value: number; color: string }[] }) {
  const maxVal = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-16 text-sm text-end shrink-0">{item.label}</span>
          <div className="flex-1">
            <div
              className={cn('h-6 rounded-sm flex items-center pe-2 justify-end transition-all', item.color + '/30')}
              style={{ width: `${Math.max((item.value / maxVal) * 100, 8)}%` }}
            >
              <span className="text-xs font-medium">{toFa(item.value)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function HealthCard({ title, icon, status, label }: {
  title: string
  icon: React.ReactNode
  status: 'healthy' | 'warning' | 'error'
  label: string
}) {
  const statusStyles = {
    healthy: 'text-success border-success/20 bg-success/5',
    warning: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
    error: 'text-destructive border-destructive/20 bg-destructive/5',
  }
  const dotStyles = {
    healthy: 'bg-success',
    warning: 'bg-amber-500',
    error: 'bg-destructive',
  }
  return (
    <Card className={cn('border', statusStyles[status])}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="shrink-0">{icon}</div>
        <div className="flex-1">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs mt-1">{label}</div>
        </div>
        <div className={cn('w-3 h-3 rounded-full shrink-0 animate-pulse', dotStyles[status])} />
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <div className="p-12 text-center text-muted-foreground">
      <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
      در حال بارگذاری...
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-12 text-center border rounded-xl bg-card/30 border-dashed">
      <AlertTriangle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
      <h3 className="text-lg font-medium">خطا در بارگذاری اطلاعات</h3>
      <p className="text-muted-foreground text-sm mt-1 mb-4">لطفاً دوباره تلاش کنید</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 ms-2" />
        تلاش مجدد
      </Button>
    </div>
  )
}
