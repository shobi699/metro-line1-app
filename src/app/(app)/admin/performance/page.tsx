'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toFa } from '@/lib/fa'
import {
  Loader2,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  FileText,
  Shield,
  Award,
  Scale,
  Inbox,
  AlertCircle,
  Eye,
} from 'lucide-react'

/* ────── Types ────── */

interface Competency {
  id: string
  title: string
  direction: 'positive' | 'negative' | 'both'
}

interface ActionType {
  id: string
  title: string
  defaultScore: number
  maxSeverity: string
  competency: Competency
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
  status: string
  createdAt: string
  actionType: ActionType
  recordedBy: { name: string }
  appeals: PerformanceAppeal[]
}

interface PerformanceAppeal {
  id: string
  logId: string
  employeeId: string
  reason: string
  status: string
  note: string | null
  createdAt: string
  resolvedAt: string | null
  employee?: { name: string }
  log?: { actionType: ActionType }
  reviewedBy?: { name: string }
}

interface UserBasic {
  id: string
  name: string
  personnelCode?: string
  phone?: string
}

/* ────── Constants ────── */

const LOG_STATUS: Record<string, { label: string; color: string }> = {
  active: { label: 'فعال', color: 'text-primary bg-primary/10 border-primary/30' },
  appealed: { label: 'در حال اعتراض', color: 'text-warning bg-warning/10 border-warning/30' },
  overturned: { label: 'لغو شده', color: 'text-muted-foreground bg-muted/50 border-border' },
}

const APPEAL_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'در انتظار بررسی', color: 'text-warning bg-warning/10 border-warning/30' },
  approved: { label: 'تایید (لغو رکورد)', color: 'text-success bg-success/10 border-success/30' },
  rejected: { label: 'رد شده', color: 'text-destructive bg-destructive/10 border-destructive/30' },
}

const SEVERITY_MAP: Record<string, { label: string; color: string }> = {
  L1: { label: 'عادی (L1)', color: 'text-muted-foreground' },
  L2: { label: 'متوسط (L2)', color: 'text-warning' },
  L3: { label: 'شدید (L3)', color: 'text-destructive' },
}

const DIRECTION_MAP: Record<string, { label: string; color: string; icon: typeof Award }> = {
  positive: { label: 'تشویقی', color: 'text-success', icon: Award },
  negative: { label: 'تخلف', color: 'text-destructive', icon: AlertTriangle },
  both: { label: 'دوجهته', color: 'text-info', icon: Scale },
}

/* ────── Sub-components ────── */

function KpiCard({ label, value, sub, icon: Icon, variant }: {
  label: string
  value: string | number
  sub?: string
  icon: typeof TrendingUp
  variant: 'primary' | 'warning' | 'success' | 'muted'
}) {
  const colors = { primary: 'text-primary', warning: 'text-warning', success: 'text-success', muted: 'text-muted-foreground' }
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-lg p-2.5 bg-muted/50 ${colors[variant]}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tracking-tight">{toFa(value)}</p>
          {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">در حال دریافت اطلاعات...</p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <AlertCircle className="size-10 text-destructive/60" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="size-3.5 me-1.5" />
        تلاش مجدد
      </Button>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Inbox className="size-12 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

/* ────── Main Page ────── */

export default function PerformanceAdminPage() {
  const accessToken = useAuthStore((s) => s.accessToken)

  const [logs, setLogs] = useState<PerformanceLog[]>([])
  const [appeals, setAppeals] = useState<PerformanceAppeal[]>([])
  const [types, setTypes] = useState<ActionType[]>([])
  const [users, setUsers] = useState<UserBasic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Active tab
  const [tab, setTab] = useState<'logs' | 'appeals' | 'create'>('logs')
  const [searchQuery, setSearchQuery] = useState('')

  // Create form
  const [formEmployeeId, setFormEmployeeId] = useState('')
  const [formActionTypeId, setFormActionTypeId] = useState('')
  const [formSeverity, setFormSeverity] = useState('L1')
  const [formNote, setFormNote] = useState('')
  const [creating, setCreating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Appeal review dialog
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean
    appeal: PerformanceAppeal | null
    action: 'approved' | 'rejected'
  }>({ open: false, appeal: null, action: 'approved' })
  const [reviewNote, setReviewNote] = useState('')
  const [reviewing, setReviewing] = useState(false)

  // Detail dialog
  const [detailLog, setDetailLog] = useState<PerformanceLog | null>(null)

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }), [accessToken])

  const fetchData = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const [resLogs, resAppeals, resTypes, resUsers] = await Promise.all([
        fetch('/api/performance/logs', { headers }),
        fetch('/api/performance/appeals', { headers }),
        fetch('/api/performance/types', { headers }),
        fetch('/api/users?pageSize=500', { headers }),
      ])

      if (resLogs.ok) setLogs((await resLogs.json()).data ?? [])
      if (resAppeals.ok) setAppeals((await resAppeals.json()).data ?? [])
      if (resTypes.ok) setTypes((await resTypes.json()).data ?? [])
      if (resUsers.ok) {
        const usersJson = await resUsers.json()
        const usersData = usersJson.data
        setUsers(Array.isArray(usersData) ? usersData : usersData?.items ?? [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در ارتباط با سرور')
    } finally {
      setLoading(false)
    }
  }, [accessToken, headers])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getUserName = (userId: string) => {
    const u = users.find((x) => x.id === userId)
    return u?.name ?? '—'
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  // Create log
  const handleCreateLog = async () => {
    if (!accessToken || !formEmployeeId || !formActionTypeId) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/performance/logs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employeeId: formEmployeeId,
          actionTypeId: formActionTypeId,
          severity: formSeverity,
          note: formNote || undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message ?? 'خطا در ثبت')
      }
      setFormEmployeeId('')
      setFormActionTypeId('')
      setFormSeverity('L1')
      setFormNote('')
      setTab('logs')
      showSuccess('گزارش عملکرد با موفقیت ثبت شد.')
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا در ثبت')
    } finally {
      setCreating(false)
    }
  }

  // Review appeal
  const handleReviewAppeal = async () => {
    if (!accessToken || !reviewDialog.appeal) return
    setReviewing(true)
    try {
      const res = await fetch(`/api/performance/appeals/${reviewDialog.appeal.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: reviewDialog.action,
          note: reviewNote || undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message ?? 'خطا در بررسی')
      }
      setReviewDialog({ open: false, appeal: null, action: 'approved' })
      setReviewNote('')
      showSuccess(
        reviewDialog.action === 'approved'
          ? 'اعتراض تایید و اثر رکورد لغو شد.'
          : 'اعتراض رد شد و رکورد عملکردی تایید گردید.',
      )
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا')
    } finally {
      setReviewing(false)
    }
  }

  // Filtered data
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs
    const q = searchQuery.trim().toLowerCase()
    return logs.filter(
      (l) =>
        getUserName(l.employeeId).toLowerCase().includes(q) ||
        l.actionType.title.toLowerCase().includes(q) ||
        l.periodId.includes(q),
    )
  }, [logs, searchQuery, users])

  const filteredAppeals = useMemo(() => {
    if (!searchQuery.trim()) return appeals
    const q = searchQuery.trim().toLowerCase()
    return appeals.filter(
      (a) =>
        (a.employee?.name ?? getUserName(a.employeeId)).toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q),
    )
  }, [appeals, searchQuery, users])

  // KPIs
  const kpis = useMemo(() => ({
    total: logs.length,
    active: logs.filter((l) => l.status === 'active').length,
    appealed: logs.filter((l) => l.status === 'appealed').length,
    pendingAppeals: appeals.filter((a) => a.status === 'pending').length,
  }), [logs, appeals])

  // Group action types by direction for the create form
  const positiveTypes = types.filter((t) => t.competency.direction === 'positive' || t.competency.direction === 'both')
  const negativeTypes = types.filter((t) => t.competency.direction === 'negative' || t.competency.direction === 'both')

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مدیریت عملکرد و تشویق/تنبیه</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ثبت گزارشات عملکردی پرسنل و رسیدگی به اعتراضات
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`size-3.5 me-1.5 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success animate-in fade-in duration-200">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="کل رکوردها" value={kpis.total} icon={TrendingUp} variant="primary" />
        <KpiCard label="فعال" value={kpis.active} icon={Shield} variant="success" />
        <KpiCard label="در حال اعتراض" value={kpis.appealed} icon={AlertTriangle} variant="warning" />
        <KpiCard label="اعتراض‌های معلق" value={kpis.pendingAppeals} icon={Scale} variant="muted"
          sub={kpis.pendingAppeals > 0 ? 'نیاز به بررسی' : undefined} />
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-shrink-0">
          <TabsList>
            <TabsTrigger value="logs">
              <TrendingUp className="size-3.5 me-1.5" />
              سوابق ثبت‌شده
            </TabsTrigger>
            <TabsTrigger value="appeals">
              <AlertTriangle className="size-3.5 me-1.5" />
              اعتراضات
              {kpis.pendingAppeals > 0 && (
                <Badge variant="destructive" className="ms-1.5 h-5 min-w-5 px-1 text-[10px]">
                  {toFa(kpis.pendingAppeals)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="create">
              <PlusCircle className="size-3.5 me-1.5" />
              ثبت مورد جدید
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab !== 'create' && (
          <div className="relative flex-1 sm:max-w-xs w-full">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="جستجوی نام یا عنوان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error && tab !== 'create' ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          {/* ── Logs Tab ── */}
          {tab === 'logs' && (
            filteredLogs.length === 0 ? (
              <EmptyState message="هیچ رکورد عملکردی ثبت نشده است." />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-start">پرسنل</TableHead>
                          <TableHead className="text-start">اقدام عملکردی</TableHead>
                          <TableHead className="text-start">جهت</TableHead>
                          <TableHead className="text-start">شدت</TableHead>
                          <TableHead className="text-start">امتیاز</TableHead>
                          <TableHead className="text-start">دوره</TableHead>
                          <TableHead className="text-start">وضعیت</TableHead>
                          <TableHead className="text-center">جزئیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log) => {
                          const dir = DIRECTION_MAP[log.actionType.competency.direction]
                          const sev = SEVERITY_MAP[log.severity]
                          const st = LOG_STATUS[log.status]
                          return (
                            <TableRow key={log.id} className="hover:bg-muted/20">
                              <TableCell>
                                <p className="font-medium text-sm">{getUserName(log.employeeId)}</p>
                              </TableCell>
                              <TableCell className="text-sm max-w-48 truncate">
                                {log.actionType.title}
                              </TableCell>
                              <TableCell>
                                {dir && (
                                  <span className={`text-xs font-medium ${dir.color}`}>
                                    {dir.label}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className={`text-xs font-medium ${sev?.color ?? ''}`}>
                                  {sev?.label ?? log.severity}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm font-mono">
                                {toFa(log.scoreValue)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground" dir="ltr">
                                {log.periodId}
                              </TableCell>
                              <TableCell>
                                {st && (
                                  <Badge variant="outline" className={st.color}>
                                    {st.label}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs"
                                  onClick={() => setDetailLog(log)}
                                >
                                  <Eye className="size-3 me-1" />
                                  مشاهده
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-3 border-t text-xs text-muted-foreground text-center">
                    {toFa(filteredLogs.length)} رکورد
                  </div>
                </CardContent>
              </Card>
            )
          )}

          {/* ── Appeals Tab ── */}
          {tab === 'appeals' && (
            filteredAppeals.length === 0 ? (
              <EmptyState message="هیچ اعتراضی ثبت نشده است." />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-start">پرسنل معترض</TableHead>
                          <TableHead className="text-start">مورد عملکردی</TableHead>
                          <TableHead className="text-start">دلیل اعتراض</TableHead>
                          <TableHead className="text-start">وضعیت</TableHead>
                          <TableHead className="text-center">عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAppeals.map((ap) => {
                          const st = APPEAL_STATUS[ap.status]
                          return (
                            <TableRow key={ap.id} className="hover:bg-muted/20">
                              <TableCell className="font-medium text-sm">
                                {ap.employee?.name ?? getUserName(ap.employeeId)}
                              </TableCell>
                              <TableCell className="text-sm max-w-48 truncate">
                                {ap.log?.actionType?.title ?? '—'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-56 truncate">
                                {ap.reason}
                              </TableCell>
                              <TableCell>
                                {st && (
                                  <Badge variant="outline" className={st.color}>
                                    {st.label}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {ap.status === 'pending' ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs border-success/30 hover:bg-success/10 text-success"
                                      onClick={() => {
                                        setReviewDialog({ open: true, appeal: ap, action: 'approved' })
                                        setReviewNote('')
                                      }}
                                    >
                                      <CheckCircle2 className="size-3 me-1" />
                                      تایید
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-xs hover:bg-destructive/10 text-destructive"
                                      onClick={() => {
                                        setReviewDialog({ open: true, appeal: ap, action: 'rejected' })
                                        setReviewNote('')
                                      }}
                                    >
                                      <XCircle className="size-3 me-1" />
                                      رد
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    {ap.note ? ap.note : 'بررسی شده'}
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-3 border-t text-xs text-muted-foreground text-center">
                    {toFa(filteredAppeals.length)} اعتراض
                  </div>
                </CardContent>
              </Card>
            )
          )}

          {/* ── Create Tab ── */}
          {tab === 'create' && (
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PlusCircle className="size-5" />
                  ثبت ارزیابی عملکرد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>پرسنل</Label>
                  <Select value={formEmployeeId} onValueChange={(v) => setFormEmployeeId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب پرسنل..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} {u.personnelCode ? `(${toFa(u.personnelCode)})` : u.phone ? `(${toFa(u.phone)})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>نوع اقدام عملکردی</Label>
                  <Select value={formActionTypeId} onValueChange={(v) => setFormActionTypeId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب نوع اقدام..." />
                    </SelectTrigger>
                    <SelectContent>
                      {positiveTypes.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-success">تشویقی</div>
                          {positiveTypes.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.title}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {negativeTypes.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-destructive mt-1">تخلف</div>
                          {negativeTypes.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.title}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {positiveTypes.length === 0 && negativeTypes.length === 0 &&
                        types.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title} — {DIRECTION_MAP[t.competency.direction]?.label ?? t.competency.direction}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>شدت / ضریب</Label>
                  <Select value={formSeverity} onValueChange={(v) => setFormSeverity(v ?? 'L1')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L1">L1 — عادی</SelectItem>
                      <SelectItem value="L2">L2 — متوسط</SelectItem>
                      <SelectItem value="L3">L3 — شدید / عالی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perf-note">توضیحات (اختیاری)</Label>
                  <Textarea
                    id="perf-note"
                    placeholder="توضیحات تکمیلی در مورد عملکرد پرسنل..."
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleCreateLog}
                  disabled={creating || !formEmployeeId || !formActionTypeId}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="size-4 me-1.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4 me-1.5" />
                  )}
                  ثبت گزارش عملکرد
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Appeal Review Dialog */}
      <Dialog
        open={reviewDialog.open}
        onOpenChange={(open) => {
          if (!open) setReviewDialog({ open: false, appeal: null, action: 'approved' })
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewDialog.action === 'approved' ? (
                <>
                  <CheckCircle2 className="size-5 text-success" />
                  تایید اعتراض (لغو اثر رکورد)
                </>
              ) : (
                <>
                  <XCircle className="size-5 text-destructive" />
                  رد اعتراض (تایید رکورد)
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {reviewDialog.appeal && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">معترض:</span>
                  <span className="font-medium">
                    {reviewDialog.appeal.employee?.name ?? getUserName(reviewDialog.appeal.employeeId)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">مورد عملکردی:</span>
                  <span>{reviewDialog.appeal.log?.actionType?.title ?? '—'}</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">دلیل اعتراض:</p>
                  <p className="text-sm">{reviewDialog.appeal.reason}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appeal-review-note">یادداشت بررسی (اختیاری)</Label>
                <Textarea
                  id="appeal-review-note"
                  placeholder="توضیحات بررسی اعتراض..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReviewDialog({ open: false, appeal: null, action: 'approved' })}
              disabled={reviewing}
            >
              انصراف
            </Button>
            <Button
              size="sm"
              onClick={handleReviewAppeal}
              disabled={reviewing}
              className={
                reviewDialog.action === 'approved'
                  ? 'bg-success hover:bg-success/90 text-white'
                  : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              }
            >
              {reviewing && <Loader2 className="size-3.5 me-1.5 animate-spin" />}
              {reviewDialog.action === 'approved' ? 'تایید اعتراض' : 'رد اعتراض'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Detail Dialog */}
      <Dialog open={!!detailLog} onOpenChange={(open) => { if (!open) setDetailLog(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              جزئیات رکورد عملکردی
            </DialogTitle>
          </DialogHeader>

          {detailLog && (() => {
            const dir = DIRECTION_MAP[detailLog.actionType.competency.direction]
            const sev = SEVERITY_MAP[detailLog.severity]
            const st = LOG_STATUS[detailLog.status]
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-lg">{getUserName(detailLog.employeeId)}</p>
                  {st && (
                    <Badge variant="outline" className={st.color}>{st.label}</Badge>
                  )}
                </div>

                <div className="rounded-lg bg-muted/30 p-4 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">اقدام عملکردی</p>
                      <p className="font-medium">{detailLog.actionType.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">جهت</p>
                      <p className={`font-medium ${dir?.color ?? ''}`}>{dir?.label ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">شدت</p>
                      <p className={`font-medium ${sev?.color ?? ''}`}>{sev?.label ?? detailLog.severity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">امتیاز</p>
                      <p className="font-bold text-primary">{toFa(detailLog.scoreValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">دوره</p>
                      <p className="font-medium" dir="ltr">{detailLog.periodId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">ثبت‌کننده</p>
                      <p className="font-medium">{detailLog.recordedBy?.name ?? '—'}</p>
                    </div>
                  </div>

                  {detailLog.note && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">توضیحات</p>
                      <p>{detailLog.note}</p>
                    </div>
                  )}

                  {detailLog.appeals.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">اعتراضات ثبت‌شده:</p>
                      {detailLog.appeals.map((ap) => {
                        const apSt = APPEAL_STATUS[ap.status]
                        return (
                          <div key={ap.id} className="bg-muted/50 p-2 rounded text-xs mb-1.5">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{getUserName(ap.employeeId)}</span>
                              {apSt && <Badge variant="outline" className={`text-[10px] ${apSt.color}`}>{apSt.label}</Badge>}
                            </div>
                            <p className="text-muted-foreground">{ap.reason}</p>
                            {ap.note && <p className="mt-1 text-foreground">پاسخ: {ap.note}</p>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
