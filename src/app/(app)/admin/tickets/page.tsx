'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  Loader2,
  Clock,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  XCircle,
  Info,
  ArrowRight,
  User,
  MessageSquare,
  Calendar,
  Train,
  Filter,
  BarChart3,
  List,
  Columns3,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { useAuthStore } from '@/features/auth'
import { toFa, jalali } from '@/lib/fa'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────

interface FaultReport {
  id: string
  faultNo: number
  description: string
  locationNote: string | null
  priority: string
  status: string
  serviceImpact: string
  slaBreached: boolean
  occurredAt: string
  createdAt: string
  closedAt: string | null
  repairStartAt: string | null
  repairEndAt: string | null
  photoUrls: string[]
  train: { id: string; trainNumber: string }
  wagon: { id: string; wagonCode: string } | null
  faultCode: {
    id: string
    code: string
    title: string
    category: { id: string; code: string; title: string }
  }
  reporter: { id: string; name: string } | null
  assignee: { id: string; name: string } | null
  reviewer: { id: string; name: string } | null
  verifier: { id: string; name: string } | null
  _count: { logs: number }
}

interface FaultLog {
  id: string
  action: string
  note: string | null
  changes: any
  createdAt: string
  actor: { id: string; name: string; role: string } | null
}

interface FaultDetail extends FaultReport {
  logs: FaultLog[]
  recurrenceOf: any
}

interface KpiData {
  stats: {
    open: number
    criticalOpen: number
    slaBreached: number
    mttrHours: number
  }
  monthlyTrend: { label: string; created: number; closed: number }[]
  topTrains: { trainNumber: string; count: number }[]
  topCategories: { name: string; count: number }[]
}

// ── Constants ──────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  submitted: 'ثبت شده',
  under_review: 'در حال بررسی',
  needs_info: 'نیاز به اطلاعات',
  rejected: 'رد شده',
  approved: 'تایید شده',
  in_repair: 'در حال تعمیر',
  repaired: 'تعمیر شده',
  verified_closed: 'بسته شده',
  deferred: 'ماندگار',
  reopened: 'بازگشایی شده',
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  under_review: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  needs_info: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30',
  approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  in_repair: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
  repaired: 'bg-green-500/10 text-green-500 border-green-500/30',
  verified_closed: 'bg-muted text-muted-foreground border-border',
  deferred: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  reopened: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  critical: 'بحرانی',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-500/10 text-blue-500',
  high: 'bg-amber-500/10 text-amber-500',
  critical: 'bg-destructive/10 text-destructive',
}

const OPEN_STATUSES = ['submitted', 'under_review', 'approved', 'in_repair', 'needs_info', 'reopened']
const KANBAN_COLUMNS = [
  { key: 'submitted', label: 'ثبت شده', icon: AlertCircle },
  { key: 'under_review', label: 'بررسی', icon: Search },
  { key: 'approved', label: 'تایید شده', icon: CheckCircle2 },
  { key: 'in_repair', label: 'تعمیر', icon: Wrench },
  { key: 'repaired', label: 'تعمیر شده', icon: CheckCircle2 },
  { key: 'verified_closed', label: 'بسته', icon: XCircle },
]

const ACTION_LABELS: Record<string, string> = {
  submitted: 'ثبت شد',
  edited: 'ویرایش شد',
  approve: 'تایید شد',
  reject: 'رد شد',
  needs_info: 'نیاز به اطلاعات',
  resolve_info: 'اطلاعات ارسال شد',
  start_repair: 'تعمیر آغاز شد',
  complete_repair: 'تعمیر تکمیل شد',
  verify: 'تایید نهایی و بسته شد',
  defer: 'به تعویق افتاد',
  reopen: 'بازگشایی شد',
  assigned: 'ارجاع شد',
  comment: 'نظر ارسال شد',
}

const TRANSITION_MAP: Record<string, { action: string; label: string; variant: 'default' | 'destructive' | 'outline' }[]> = {
  submitted: [
    { action: 'approve', label: 'تایید', variant: 'default' },
    { action: 'needs_info', label: 'نیاز به اطلاعات', variant: 'outline' },
    { action: 'reject', label: 'رد', variant: 'destructive' },
  ],
  needs_info: [
    { action: 'resolve_info', label: 'اطلاعات ارسال شد', variant: 'default' },
  ],
  approved: [
    { action: 'start_repair', label: 'شروع تعمیر', variant: 'default' },
    { action: 'defer', label: 'به تعویق', variant: 'outline' },
  ],
  in_repair: [
    { action: 'complete_repair', label: 'تکمیل تعمیر', variant: 'default' },
  ],
  repaired: [
    { action: 'verify', label: 'تایید نهایی و بستن', variant: 'default' },
    { action: 'reopen', label: 'بازگشایی', variant: 'destructive' },
  ],
  rejected: [
    { action: 'reopen', label: 'بازگشایی', variant: 'outline' },
  ],
  deferred: [
    { action: 'reopen', label: 'بازگشایی', variant: 'outline' },
  ],
  verified_closed: [
    { action: 'reopen', label: 'بازگشایی', variant: 'destructive' },
  ],
  reopened: [
    { action: 'approve', label: 'تایید', variant: 'default' },
    { action: 'reject', label: 'رد', variant: 'destructive' },
  ],
}

// ── Page ───────────────────────────────────────────────

export default function AdminFaultDashboard() {
  const accessToken = useAuthStore((s) => s.accessToken)

  // KPI
  const [kpi, setKpi] = useState<KpiData | null>(null)
  const [loadingKpi, setLoadingKpi] = useState(true)

  // Faults list
  const [faults, setFaults] = useState<FaultReport[]>([])
  const [loadingFaults, setLoadingFaults] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('open')
  const [priorityFilter, setPriorityFilter] = useState('all')

  // Detail
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<FaultDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Transition
  const [transitioning, setTransitioning] = useState(false)
  const [transitionNote, setTransitionNote] = useState('')

  // Pagination
  const PAGE_SIZE = 20
  const [page, setPage] = useState(1)

  // ── Fetchers ─────────────────────────────────────────

  const fetchKpi = useCallback(async () => {
    if (!accessToken) return
    setLoadingKpi(true)
    try {
      const res = await fetch('/api/fault-reports/kpi', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setKpi(json.data)
      }
    } catch {
      // silent
    } finally {
      setLoadingKpi(false)
    }
  }, [accessToken])

  const fetchFaults = useCallback(async () => {
    if (!accessToken) return
    setLoadingFaults(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all' && statusFilter !== 'open') {
        params.set('status', statusFilter)
      }
      if (priorityFilter !== 'all') {
        params.set('priority', priorityFilter)
      }
      if (search.trim()) {
        params.set('q', search.trim())
      }

      const res = await fetch(`/api/faults?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setFaults(json.data ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoadingFaults(false)
    }
  }, [accessToken, statusFilter, priorityFilter, search])

  const fetchDetail = useCallback(async (id: string) => {
    if (!accessToken) return
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/faults/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setDetail(json.data)
      }
    } catch {
      // silent
    } finally {
      setLoadingDetail(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchKpi()
    fetchFaults()
  }, [fetchKpi, fetchFaults])

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId)
      setTransitionNote('')
    }
  }, [selectedId, fetchDetail])

  // ── Computed ─────────────────────────────────────────

  const filteredFaults = useMemo(() => {
    let list = faults
    if (statusFilter === 'open') {
      list = list.filter((f) => OPEN_STATUSES.includes(f.status))
    }
    return list
  }, [faults, statusFilter])

  const totalPages = Math.ceil(filteredFaults.length / PAGE_SIZE)
  const pagedFaults = filteredFaults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const kanbanData = useMemo(() => {
    const map: Record<string, FaultReport[]> = {}
    for (const col of KANBAN_COLUMNS) map[col.key] = []
    for (const f of faults) {
      if (map[f.status]) map[f.status].push(f)
    }
    return map
  }, [faults])

  // ── Actions ──────────────────────────────────────────

  async function handleTransition(action: string) {
    if (!accessToken || !selectedId) return
    setTransitioning(true)
    try {
      const res = await fetch(`/api/faults/${selectedId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action, note: transitionNote || undefined }),
      })
      if (res.ok) {
        fetchDetail(selectedId)
        fetchFaults()
        fetchKpi()
        setTransitionNote('')
      }
    } catch {
      // silent
    } finally {
      setTransitioning(false)
    }
  }

  async function handleExport() {
    if (!accessToken) return
    try {
      const res = await fetch('/api/fault-reports/export?type=all', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'faults-all.xlsx'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      // silent
    }
  }

  // ── Render ───────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            مدیریت جامع خرابی‌ها
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            نظارت، گردشکار و تحلیل تمامی گزارش‌های خرابی قطارها و تجهیزات
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 ms-2" />
            خروجی اکسل
          </Button>
          <Button variant="outline" size="sm" onClick={() => { fetchKpi(); fetchFaults() }}>
            <RefreshCw className="w-4 h-4 ms-2" />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="خرابی‌های باز"
          value={kpi?.stats.open}
          loading={loadingKpi}
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          accent="text-amber-500"
        />
        <KpiCard
          title="بحرانی باز"
          value={kpi?.stats.criticalOpen}
          loading={loadingKpi}
          icon={<ShieldAlert className="w-5 h-5 text-destructive" />}
          accent="text-destructive"
        />
        <KpiCard
          title="نقض SLA (ماه جاری)"
          value={kpi?.stats.slaBreached}
          loading={loadingKpi}
          icon={<Clock className="w-5 h-5 text-orange-500" />}
          accent="text-orange-500"
        />
        <KpiCard
          title="MTTR میانگین (ساعت)"
          value={kpi?.stats.mttrHours}
          loading={loadingKpi}
          icon={<Wrench className="w-5 h-5 text-violet-500" />}
          accent="text-violet-500"
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list" className="gap-2">
            <List className="w-4 h-4" /> فهرست خرابی‌ها
          </TabsTrigger>
          <TabsTrigger value="board" className="gap-2">
            <Columns3 className="w-4 h-4" /> بورد گردشکار
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" /> تحلیل و گزارشات
          </TabsTrigger>
        </TabsList>

        {/* ─ Tab: List ─ */}
        <TabsContent value="list">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در شرح، کد خطا..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="ps-9"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {[
                { key: 'open', label: 'باز' },
                { key: 'all', label: 'همه' },
                { key: 'submitted', label: 'ثبت شده' },
                { key: 'in_repair', label: 'تعمیر' },
                { key: 'repaired', label: 'تعمیرشده' },
                { key: 'verified_closed', label: 'بسته' },
                { key: 'deferred', label: 'ماندگار' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setStatusFilter(f.key); setPage(1) }}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-md transition-all border',
                    statusFilter === f.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground border-transparent'
                  )}
                >
                  {f.label}
                </button>
              ))}

              <span className="text-muted-foreground mx-1">|</span>

              {[
                { key: 'all', label: 'همه اولویت' },
                { key: 'critical', label: 'بحرانی' },
                { key: 'high', label: 'زیاد' },
                { key: 'medium', label: 'متوسط' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setPriorityFilter(f.key); setPage(1) }}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-md transition-all border',
                    priorityFilter === f.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground border-transparent'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loadingFaults ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">
              <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
              در حال دریافت...
            </div>
          ) : pagedFaults.length === 0 ? (
            <div className="p-12 text-center border rounded-xl bg-card/30 border-dashed">
              <AlertTriangle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-lg font-medium">گزارشی یافت نشد</h3>
              <p className="text-muted-foreground text-sm mt-1">فیلترها را تغییر دهید یا جستجو کنید</p>
            </div>
          ) : (
            <>
              <div className="relative w-full overflow-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="border-b">
                      <th className="p-3 text-start font-medium whitespace-nowrap">شماره</th>
                      <th className="p-3 text-start font-medium whitespace-nowrap">قطار</th>
                      <th className="p-3 text-start font-medium whitespace-nowrap">کد خطا</th>
                      <th className="p-3 text-start font-medium">شرح</th>
                      <th className="p-3 text-start font-medium whitespace-nowrap">اولویت</th>
                      <th className="p-3 text-start font-medium whitespace-nowrap">وضعیت</th>
                      <th className="p-3 text-start font-medium whitespace-nowrap">SLA</th>
                      <th className="p-3 text-start font-medium whitespace-nowrap">مسئول</th>
                      <th className="p-3 text-start font-medium whitespace-nowrap">تاریخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pagedFaults.map((f) => (
                      <tr
                        key={f.id}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setSelectedId(f.id)}
                      >
                        <td className="p-3 font-mono text-xs whitespace-nowrap">
                          F-{toFa(f.faultNo)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Train className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{f.train.trainNumber}</span>
                            {f.wagon && (
                              <span className="text-muted-foreground text-xs">
                                /{f.wagon.wagonCode}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                            {f.faultCode.code}
                          </span>
                        </td>
                        <td className="p-3 max-w-[250px]">
                          <div className="truncate text-sm">{f.faultCode.title}</div>
                          {f.description && (
                            <div className="truncate text-xs text-muted-foreground mt-0.5">
                              {f.description}
                            </div>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', PRIORITY_COLORS[f.priority])}>
                            {PRIORITY_LABELS[f.priority]}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge variant="outline" className={cn('text-[11px]', STATUS_COLORS[f.status])}>
                            {STATUS_LABELS[f.status]}
                          </Badge>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {f.slaBreached ? (
                            <Badge variant="destructive" className="text-[10px]">نقض</Badge>
                          ) : (
                            <span className="text-xs text-success">OK</span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap text-xs">
                          {f.assignee?.name ?? <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                          {toFa(jalali(f.occurredAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    {toFa(filteredFaults.length)} مورد — صفحه {toFa(page)} از {toFa(totalPages)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ─ Tab: Kanban Board ─ */}
        <TabsContent value="board">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {KANBAN_COLUMNS.map((col) => {
              const items = kanbanData[col.key] ?? []
              const Icon = col.icon
              return (
                <div
                  key={col.key}
                  className="flex flex-col rounded-xl border bg-muted/20 min-h-[300px]"
                >
                  <div className="flex items-center gap-2 p-3 border-b bg-muted/40 rounded-t-xl">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{col.label}</span>
                    <Badge variant="secondary" className="ms-auto text-[10px] h-5">
                      {toFa(items.length)}
                    </Badge>
                  </div>
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[500px]">
                    {items.length === 0 ? (
                      <div className="text-center text-muted-foreground text-xs py-8">—</div>
                    ) : (
                      items.slice(0, 15).map((f) => (
                        <div
                          key={f.id}
                          onClick={() => setSelectedId(f.id)}
                          className={cn(
                            'p-2.5 rounded-lg border bg-card hover:bg-muted/40 cursor-pointer transition-colors text-xs space-y-1.5',
                            f.priority === 'critical' && 'border-destructive/40',
                            f.slaBreached && 'ring-1 ring-destructive/30'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-muted-foreground">
                              F-{toFa(f.faultNo)}
                            </span>
                            <span className={cn('px-1.5 py-0.5 rounded-full text-[10px]', PRIORITY_COLORS[f.priority])}>
                              {PRIORITY_LABELS[f.priority]}
                            </span>
                          </div>
                          <div className="font-medium line-clamp-2 leading-relaxed">
                            {f.faultCode.title}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Train className="w-3 h-3" />
                            <span>{f.train.trainNumber}</span>
                          </div>
                          {f.slaBreached && (
                            <Badge variant="destructive" className="text-[9px] h-4">نقض SLA</Badge>
                          )}
                        </div>
                      ))
                    )}
                    {items.length > 15 && (
                      <div className="text-center text-muted-foreground text-[10px] py-1">
                        و {toFa(items.length - 15)} مورد دیگر...
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* ─ Tab: Analytics ─ */}
        <TabsContent value="analytics">
          {loadingKpi ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">
              <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
              در حال بارگذاری...
            </div>
          ) : kpi ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Monthly Trend */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">روند ماهانه ثبت و بستن خرابی‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {kpi.monthlyTrend.map((m, i) => {
                      const maxVal = Math.max(...kpi.monthlyTrend.map((t) => Math.max(t.created, t.closed)), 1)
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-24 text-sm text-end text-muted-foreground shrink-0">
                            {m.label}
                          </span>
                          <div className="flex-1 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-5 bg-destructive/30 rounded-sm transition-all"
                                style={{ width: `${(m.created / maxVal) * 100}%`, minWidth: m.created > 0 ? '8px' : '0' }}
                              />
                              <span className="text-xs text-muted-foreground shrink-0">
                                {toFa(m.created)} ثبت
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-5 bg-success/30 rounded-sm transition-all"
                                style={{ width: `${(m.closed / maxVal) * 100}%`, minWidth: m.closed > 0 ? '8px' : '0' }}
                              />
                              <span className="text-xs text-muted-foreground shrink-0">
                                {toFa(m.closed)} بسته
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Faulty Trains */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Train className="w-4 h-4" />
                    قطارهای پرخرابی
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kpi.topTrains.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">داده‌ای موجود نیست</p>
                  ) : (
                    <div className="space-y-3">
                      {kpi.topTrains.map((t, i) => {
                        const maxCount = kpi.topTrains[0]?.count ?? 1
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="w-16 text-sm font-mono text-end shrink-0">
                              {t.trainNumber}
                            </span>
                            <div className="flex-1">
                              <div
                                className="h-6 bg-destructive/20 rounded-sm flex items-center pe-2 justify-end transition-all"
                                style={{ width: `${(t.count / maxCount) * 100}%`, minWidth: '40px' }}
                              >
                                <span className="text-xs font-medium">{toFa(t.count)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    دسته‌بندی‌های پرتکرار
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kpi.topCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">داده‌ای موجود نیست</p>
                  ) : (
                    <div className="space-y-3">
                      {kpi.topCategories.map((c, i) => {
                        const maxCount = kpi.topCategories[0]?.count ?? 1
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="w-28 text-sm text-end shrink-0 truncate" title={c.name}>
                              {c.name}
                            </span>
                            <div className="flex-1">
                              <div
                                className="h-6 bg-primary/20 rounded-sm flex items-center pe-2 justify-end transition-all"
                                style={{ width: `${(c.count / maxCount) * 100}%`, minWidth: '40px' }}
                              >
                                <span className="text-xs font-medium">{toFa(c.count)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">خطا در بارگذاری اطلاعات</div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─ Detail Dialog ─ */}
      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) { setSelectedId(null); setDetail(null) } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {detail ? (
                <>
                  <span className="font-mono text-muted-foreground">F-{toFa(detail.faultNo)}</span>
                  <Badge variant="outline" className={cn(STATUS_COLORS[detail.status])}>
                    {STATUS_LABELS[detail.status]}
                  </Badge>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', PRIORITY_COLORS[detail.priority])}>
                    {PRIORITY_LABELS[detail.priority]}
                  </span>
                </>
              ) : (
                <span>جزئیات خرابی</span>
              )}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail || !detail ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">در حال بارگذاری...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoRow icon={Train} label="قطار" value={`${detail.train.trainNumber}${detail.wagon ? ` / واگن ${detail.wagon.wagonCode}` : ''}`} />
                <InfoRow icon={AlertTriangle} label="کد خطا" value={`${detail.faultCode.code} — ${detail.faultCode.title}`} />
                <InfoRow icon={Calendar} label="زمان وقوع" value={toFa(jalali(detail.occurredAt))} />
                <InfoRow icon={Calendar} label="تاریخ ثبت" value={toFa(jalali(detail.createdAt))} />
                <InfoRow icon={User} label="گزارش‌دهنده" value={detail.reporter?.name ?? '—'} />
                <InfoRow icon={User} label="مسئول تعمیر" value={detail.assignee?.name ?? 'تعیین نشده'} />
                {detail.reviewer && <InfoRow icon={User} label="بازبین" value={detail.reviewer.name} />}
                {detail.verifier && <InfoRow icon={CheckCircle2} label="تاییدکننده نهایی" value={detail.verifier.name} />}
                <InfoRow icon={Info} label="تاثیر سرویس" value={
                  detail.serviceImpact === 'none' ? 'بدون تاثیر'
                    : detail.serviceImpact === 'delay' ? 'تاخیر'
                    : detail.serviceImpact === 'evacuated' ? 'تخلیه مسافر'
                    : detail.serviceImpact === 'removed_from_service' ? 'خروج از سرویس'
                    : detail.serviceImpact
                } />
                <InfoRow icon={Clock} label="SLA" value={detail.slaBreached ? 'نقض شده' : 'رعایت شده'} />
              </div>

              {/* Description */}
              {detail.description && (
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> شرح خرابی
                  </h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{detail.description}</p>
                </div>
              )}

              {detail.locationNote && (
                <div className="text-sm">
                  <span className="font-medium">موقعیت: </span>
                  <span className="text-muted-foreground">{detail.locationNote}</span>
                </div>
              )}

              {/* Photos */}
              {detail.photoUrls?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">تصاویر پیوست</h4>
                  <div className="flex gap-2 flex-wrap">
                    {detail.photoUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`تصویر ${i + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Workflow Actions */}
              {TRANSITION_MAP[detail.status] && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-semibold text-primary">اقدام گردشکار</h4>
                  <Input
                    placeholder="یادداشت (اختیاری)..."
                    value={transitionNote}
                    onChange={(e) => setTransitionNote(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {TRANSITION_MAP[detail.status]?.map((t) => (
                      <Button
                        key={t.action}
                        variant={t.variant}
                        size="sm"
                        disabled={transitioning}
                        onClick={() => handleTransition(t.action)}
                      >
                        {transitioning && <Loader2 className="w-3 h-3 ms-1 animate-spin" />}
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  تاریخچه رویدادها
                  <Badge variant="secondary" className="text-[10px]">{toFa(detail.logs.length)}</Badge>
                </h4>
                <div className="space-y-0 relative">
                  <div className="absolute start-3 top-0 bottom-0 w-px bg-border" />
                  {detail.logs.map((log, i) => (
                    <div key={log.id} className="flex gap-3 relative pb-4">
                      <div className="relative z-10 mt-1">
                        <div className="w-6 h-6 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {ACTION_LABELS[log.action] ?? log.action}
                          </span>
                          {log.actor && (
                            <span className="text-xs text-muted-foreground">
                              توسط {log.actor.name}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ms-auto">
                            {toFa(jalali(log.createdAt))}
                          </span>
                        </div>
                        {log.note && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{log.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────

function KpiCard({ title, value, loading, icon, accent }: {
  title: string
  value: number | undefined
  loading: boolean
  icon: React.ReactNode
  accent: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className={cn('text-2xl font-bold mt-0.5', accent)}>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              toFa(value ?? 0)
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ComponentType<any>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  )
}
