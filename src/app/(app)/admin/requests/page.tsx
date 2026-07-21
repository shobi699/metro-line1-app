'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toFa, jalali } from '@/lib/fa'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  FileText,
  ClipboardList,
  Users,
  CalendarDays,
  AlertCircle,
  Inbox,
} from 'lucide-react'

/* ────── Types ────── */

interface RequestUser {
  id: string
  name: string
  personnelCode?: string
}

interface LeaveRequest {
  id: string
  userId: string
  type: string
  fromDate: string
  toDate: string
  reason: string | null
  amount: number | null
  unit: string | null
  calculatedAmount: number | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  user: RequestUser
  reviewedBy: { name: string } | null
}

interface RequestType {
  id: string
  label: string
  category: string
  unit: string
  multiplier: number
  requiresApproval: boolean
  isEnabled: boolean
}

/* ────── Constants ────── */

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'در انتظار بررسی', color: 'text-warning bg-warning/10 border-warning/30', icon: Clock },
  approved: { label: 'تایید شده', color: 'text-success bg-success/10 border-success/30', icon: CheckCircle2 },
  rejected: { label: 'رد شده', color: 'text-destructive bg-destructive/10 border-destructive/30', icon: XCircle },
  cancelled: { label: 'لغو شده', color: 'text-muted-foreground bg-muted/50 border-border', icon: XCircle },
}

const CATEGORY_MAP: Record<string, string> = {
  leave: 'مرخصی',
  duty: 'کشیک',
  overtime: 'اضافه‌کار',
  mission: 'مأموریت',
}

const UNIT_MAP: Record<string, string> = {
  hours: 'ساعت',
  days: 'روز',
  count: 'مورد',
}

/* ────── Sub-components ────── */

function KpiCard({ label, value, icon: Icon, variant }: {
  label: string
  value: string | number
  icon: typeof Clock
  variant?: 'warning' | 'success' | 'destructive' | 'default'
}) {
  const colors = {
    warning: 'text-warning',
    success: 'text-success',
    destructive: 'text-destructive',
    default: 'text-muted-foreground',
  }
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-lg p-2.5 bg-muted/50 ${colors[variant ?? 'default']}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tracking-tight">{toFa(value)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status]
  if (!cfg) return <Badge variant="outline">{status}</Badge>
  const Icon = cfg.icon
  return (
    <Badge variant="outline" className={cfg.color}>
      <Icon className="size-3 me-1" />
      {cfg.label}
    </Badge>
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

function EmptyState({ status }: { status: string }) {
  const isAll = status === 'all'
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Inbox className="size-12 text-muted-foreground/40" />
      <h3 className="text-base font-medium">درخواستی یافت نشد</h3>
      <p className="text-sm text-muted-foreground max-w-xs text-center">
        {isAll
          ? 'هنوز هیچ درخواستی در سیستم ثبت نشده است.'
          : 'تمام درخواست‌های این بخش بررسی شده‌اند.'}
      </p>
    </div>
  )
}

/* ────── Main Page ────── */

export default function AdminRequestsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)

  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [types, setTypes] = useState<RequestType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Review dialog
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean
    request: LeaveRequest | null
    action: 'approved' | 'rejected'
  }>({ open: false, request: null, action: 'approved' })
  const [reviewNote, setReviewNote] = useState('')
  const [reviewing, setReviewing] = useState(false)

  // Detail dialog
  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null)

  const fetchData = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const statusParam = statusFilter === 'all' ? '' : statusFilter
      const [resReq, resTypes] = await Promise.all([
        fetch(`/api/requests${statusParam ? `?status=${statusParam}` : ''}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/requests/types', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ])

      if (!resReq.ok) throw new Error('خطا در دریافت درخواست‌ها')
      const reqData = await resReq.json()
      setRequests(reqData.data ?? [])

      if (resTypes.ok) {
        const typesData = await resTypes.json()
        setTypes(typesData.data ?? [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطای ناشناخته')
    } finally {
      setLoading(false)
    }
  }, [accessToken, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleReview = async () => {
    if (!accessToken || !reviewDialog.request) return
    setReviewing(true)
    try {
      const res = await fetch(`/api/requests/${reviewDialog.request.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          status: reviewDialog.action,
          note: reviewNote || undefined,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message ?? json.error ?? 'خطا در ثبت بررسی')
      }
      setReviewDialog({ open: false, request: null, action: 'approved' })
      setReviewNote('')
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطای ناشناخته')
    } finally {
      setReviewing(false)
    }
  }

  const openReview = (req: LeaveRequest, action: 'approved' | 'rejected') => {
    setReviewDialog({ open: true, request: req, action })
    setReviewNote('')
  }

  // Resolve type label
  const getTypeLabel = (typeId: string) => {
    const t = types.find((x) => x.id === typeId)
    return t?.label ?? typeId
  }

  const getTypeCategory = (typeId: string) => {
    const t = types.find((x) => x.id === typeId)
    return t ? (CATEGORY_MAP[t.category] ?? t.category) : ''
  }

  // Filtered requests
  const filtered = useMemo(() => {
    let result = requests
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.type === typeFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (r) =>
          r.user.name.toLowerCase().includes(q) ||
          (r.user.personnelCode && r.user.personnelCode.includes(q)) ||
          r.id.toLowerCase().includes(q),
      )
    }
    return result
  }, [requests, typeFilter, searchQuery])

  // KPI counts
  const kpis = useMemo(() => {
    const all = statusFilter === 'all' ? requests : requests
    return {
      pending: requests.filter((r) => r.status === 'pending').length,
      approved: requests.filter((r) => r.status === 'approved').length,
      rejected: requests.filter((r) => r.status === 'rejected').length,
      total: requests.length,
    }
  }, [requests])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مدیریت درخواست‌های پرسنلی</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            بررسی و تایید/رد مرخصی، اضافه‌کار، کشیک و مأموریت پرسنل
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`size-3.5 me-1.5 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="در انتظار بررسی" value={kpis.pending} icon={Clock} variant="warning" />
        <KpiCard label="تایید شده" value={kpis.approved} icon={CheckCircle2} variant="success" />
        <KpiCard label="رد شده" value={kpis.rejected} icon={XCircle} variant="destructive" />
        <KpiCard label="مجموع درخواست‌ها" value={kpis.total} icon={ClipboardList} variant="default" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="flex-shrink-0">
          <TabsList>
            <TabsTrigger value="pending">در انتظار</TabsTrigger>
            <TabsTrigger value="approved">تایید شده</TabsTrigger>
            <TabsTrigger value="rejected">رد شده</TabsTrigger>
            <TabsTrigger value="all">همه</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="جستجوی نام یا کد پرسنلی..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>
          {types.length > 0 && (
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="نوع درخواست" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه انواع</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : filtered.length === 0 ? (
        <EmptyState status={statusFilter} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-start">پرسنل</TableHead>
                    <TableHead className="text-start">نوع درخواست</TableHead>
                    <TableHead className="text-start">تاریخ شروع</TableHead>
                    <TableHead className="text-start">تاریخ پایان</TableHead>
                    <TableHead className="text-start">مقدار</TableHead>
                    <TableHead className="text-start">وضعیت</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((req) => (
                    <TableRow
                      key={req.id}
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => setDetailRequest(req)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{req.user.name}</p>
                            {toFa(req.user.personnelCode || '')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{getTypeLabel(req.type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {getTypeCategory(req.type)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {toFa(jalali(req.fromDate))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {toFa(jalali(req.toDate))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {req.amount != null ? (
                          <span>
                            {toFa(req.amount)} {UNIT_MAP[req.unit ?? ''] ?? req.unit ?? ''}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        {req.status === 'pending' ? (
                          <div
                            className="flex items-center justify-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-success/30 hover:bg-success/10 text-success"
                              onClick={() => openReview(req, 'approved')}
                            >
                              <CheckCircle2 className="size-3 me-1" />
                              تایید
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs hover:bg-destructive/10 text-destructive"
                              onClick={() => openReview(req, 'rejected')}
                            >
                              <XCircle className="size-3 me-1" />
                              رد
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDetailRequest(req)
                            }}
                          >
                            <FileText className="size-3 me-1" />
                            جزئیات
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-3 border-t text-xs text-muted-foreground text-center">
              {toFa(filtered.length)} درخواست نمایش داده شده
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog.open}
        onOpenChange={(open) => {
          if (!open) setReviewDialog({ open: false, request: null, action: 'approved' })
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewDialog.action === 'approved' ? (
                <>
                  <CheckCircle2 className="size-5 text-success" />
                  تایید درخواست
                </>
              ) : (
                <>
                  <XCircle className="size-5 text-destructive" />
                  رد درخواست
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {reviewDialog.request && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">درخواست‌دهنده:</span>
                  <span className="font-medium">{reviewDialog.request.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نوع:</span>
                  <span>{getTypeLabel(reviewDialog.request.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">بازه:</span>
                  <span>
                    {toFa(jalali(reviewDialog.request.fromDate))} تا{' '}
                    {toFa(jalali(reviewDialog.request.toDate))}
                  </span>
                </div>
                {reviewDialog.request.amount != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">مقدار:</span>
                    <span>
                      {toFa(reviewDialog.request.amount)}{' '}
                      {UNIT_MAP[reviewDialog.request.unit ?? ''] ?? ''}
                    </span>
                  </div>
                )}
                {reviewDialog.request.reason && (
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground text-xs mb-1">توضیحات پرسنل:</p>
                    <p className="text-sm">{reviewDialog.request.reason}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-note">یادداشت بررسی (اختیاری)</Label>
                <Textarea
                  id="review-note"
                  placeholder="در صورت نیاز توضیحات خود را وارد کنید..."
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
              onClick={() => setReviewDialog({ open: false, request: null, action: 'approved' })}
              disabled={reviewing}
            >
              انصراف
            </Button>
            <Button
              size="sm"
              onClick={handleReview}
              disabled={reviewing}
              className={
                reviewDialog.action === 'approved'
                  ? 'bg-success hover:bg-success/90 text-white'
                  : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              }
            >
              {reviewing && <Loader2 className="size-3.5 me-1.5 animate-spin" />}
              {reviewDialog.action === 'approved' ? 'تایید درخواست' : 'رد درخواست'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={!!detailRequest}
        onOpenChange={(open) => {
          if (!open) setDetailRequest(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              جزئیات درخواست
            </DialogTitle>
          </DialogHeader>

          {detailRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{detailRequest.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    کد پرسنلی: {toFa(detailRequest.user.personnelCode || '')}
                  </p>
                </div>
                <StatusBadge status={detailRequest.status} />
              </div>

              <div className="rounded-lg bg-muted/30 p-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">نوع درخواست</p>
                    <p className="font-medium">{getTypeLabel(detailRequest.type)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">دسته‌بندی</p>
                    <p className="font-medium">{getTypeCategory(detailRequest.type) || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">تاریخ شروع</p>
                    <p className="font-medium">{toFa(jalali(detailRequest.fromDate))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">تاریخ پایان</p>
                    <p className="font-medium">{toFa(jalali(detailRequest.toDate))}</p>
                  </div>
                  {detailRequest.amount != null && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">مقدار درخواستی</p>
                      <p className="font-medium">
                        {toFa(detailRequest.amount)}{' '}
                        {UNIT_MAP[detailRequest.unit ?? ''] ?? detailRequest.unit ?? ''}
                      </p>
                    </div>
                  )}
                  {detailRequest.calculatedAmount != null && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">مقدار محاسبه‌شده نهایی</p>
                      <p className="font-bold text-primary">
                        {toFa(detailRequest.calculatedAmount)}{' '}
                        {UNIT_MAP[detailRequest.unit ?? ''] ?? ''}
                      </p>
                    </div>
                  )}
                </div>

                {detailRequest.reason && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-1">توضیحات پرسنل</p>
                    <p>{detailRequest.reason}</p>
                  </div>
                )}

                <div className="pt-3 border-t text-xs text-muted-foreground">
                  <p>تاریخ ثبت: {toFa(jalali(detailRequest.createdAt))}</p>
                  {detailRequest.reviewedBy && (
                    <p className="mt-1">
                      بررسی‌کننده: {detailRequest.reviewedBy.name}
                      {detailRequest.reviewedAt && (
                        <span> — {toFa(jalali(detailRequest.reviewedAt))}</span>
                      )}
                    </p>
                  )}
                  {detailRequest.reviewNote && (
                    <div className="mt-2 p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-0.5">یادداشت بررسی‌کننده:</p>
                      <p className="text-sm text-foreground">{detailRequest.reviewNote}</p>
                    </div>
                  )}
                </div>
              </div>

              {detailRequest.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-success hover:bg-success/90 text-white"
                    onClick={() => {
                      setDetailRequest(null)
                      openReview(detailRequest, 'approved')
                    }}
                  >
                    <CheckCircle2 className="size-4 me-1.5" />
                    تایید
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setDetailRequest(null)
                      openReview(detailRequest, 'rejected')
                    }}
                  >
                    <XCircle className="size-4 me-1.5" />
                    رد
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
