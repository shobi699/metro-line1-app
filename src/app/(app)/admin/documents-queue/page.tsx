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
import { toFa, jalali } from '@/lib/fa'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  Eye,
  Inbox,
  AlertCircle,
  FileText,
} from 'lucide-react'

/* ────── Types ────── */

interface DocUser {
  id: string
  name: string
  personnelCode: string
  phone?: string
}

interface DocType {
  key: string
  title: string
}

interface UserDocument {
  id: string
  userId: string
  typeKey: string
  fileUrl: string
  status: 'pending' | 'approved' | 'rejected'
  issuedAt: string | null
  expiresAt: string | null
  reviewNote: string | null
  reviewedBy: string | null
  createdAt: string
  user: DocUser
  type: DocType
}

interface KpiData {
  pending: number
  approved: number
  rejected: number
  total: number
}

/* ────── Constants ────── */

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'در انتظار بررسی', color: 'text-warning bg-warning/10 border-warning/30', icon: Clock },
  approved: { label: 'تایید شده', color: 'text-success bg-success/10 border-success/30', icon: CheckCircle2 },
  rejected: { label: 'رد شده', color: 'text-destructive bg-destructive/10 border-destructive/30', icon: XCircle },
}

/* ────── Sub-components ────── */

function KpiCard({ label, value, icon: Icon, variant }: {
  label: string
  value: number
  icon: typeof Clock
  variant: 'warning' | 'success' | 'destructive' | 'muted'
}) {
  const colors = { warning: 'text-warning', success: 'text-success', destructive: 'text-destructive', muted: 'text-muted-foreground' }
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-lg p-2.5 bg-muted/50 ${colors[variant]}`}>
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
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Inbox className="size-12 text-muted-foreground/40" />
      <h3 className="text-base font-medium">سندی یافت نشد</h3>
      <p className="text-sm text-muted-foreground max-w-xs text-center">
        {status === 'pending'
          ? 'سند معلقی در صف تایید وجود ندارد.'
          : 'هیچ سندی با این فیلتر یافت نشد.'}
      </p>
    </div>
  )
}

/* ────── Main Page ────── */

export default function DocumentsQueuePage() {
  const accessToken = useAuthStore((s) => s.accessToken)

  const [docs, setDocs] = useState<UserDocument[]>([])
  const [kpi, setKpi] = useState<KpiData>({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')

  // Review dialog
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean
    doc: UserDocument | null
    action: 'approved' | 'rejected'
  }>({ open: false, doc: null, action: 'approved' })
  const [reviewNote, setReviewNote] = useState('')
  const [reviewing, setReviewing] = useState(false)

  // Preview dialog
  const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null)

  // Success message
  const [successMsg, setSuccessMsg] = useState('')

  const fetchData = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/documents/queue?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات')
      const json = await res.json()
      setDocs(json.data?.items ?? [])
      setKpi(json.data?.kpi ?? { pending: 0, approved: 0, rejected: 0, total: 0 })
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
    if (!accessToken || !reviewDialog.doc) return
    setReviewing(true)
    try {
      const res = await fetch(`/api/admin/documents/queue/${reviewDialog.doc.id}`, {
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
        throw new Error(json.error?.message ?? 'خطا در ثبت بررسی')
      }
      setReviewDialog({ open: false, doc: null, action: 'approved' })
      setReviewNote('')
      setSuccessMsg(
        reviewDialog.action === 'approved'
          ? 'سند با موفقیت تایید شد.'
          : 'سند رد شد و دلیل رد برای پرسنل ارسال گردید.',
      )
      setTimeout(() => setSuccessMsg(''), 4000)
      fetchData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطای ناشناخته')
    } finally {
      setReviewing(false)
    }
  }

  const openReview = (doc: UserDocument, action: 'approved' | 'rejected') => {
    setReviewDialog({ open: true, doc, action })
    setReviewNote('')
  }

  // Filtered docs
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return docs
    const q = searchQuery.trim().toLowerCase()
    return docs.filter(
      (d) =>
        d.user.name.toLowerCase().includes(q) ||
        (d.user.personnelCode && d.user.personnelCode.includes(q)) ||
        (d.user.phone && d.user.phone.includes(q)) ||
        d.type.title.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q),
    )
  }, [docs, searchQuery])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">صف تایید مدارک رسمی</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            بررسی صلاحیت‌های راهبری و استخدامی پرسنل
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
        <KpiCard label="در انتظار بررسی" value={kpi.pending} icon={Clock} variant="warning" />
        <KpiCard label="تایید شده" value={kpi.approved} icon={CheckCircle2} variant="success" />
        <KpiCard label="رد شده" value={kpi.rejected} icon={XCircle} variant="destructive" />
        <KpiCard label="مجموع مدارک" value={kpi.total} icon={FileCheck} variant="muted" />
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

        <div className="relative flex-1 sm:max-w-xs w-full">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی نام، کد پرسنلی یا نوع مدرک..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
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
                    <TableHead className="text-start">نوع مدرک</TableHead>
                    <TableHead className="text-start">تاریخ ارسال</TableHead>
                    <TableHead className="text-start">تاریخ انقضا</TableHead>
                    <TableHead className="text-start">وضعیت</TableHead>
                    <TableHead className="text-center">پیوست</TableHead>
                    <TableHead className="text-center">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{doc.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.user.phone
                              ? toFa(doc.user.phone)
                              : toFa(doc.user.personnelCode)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{doc.type.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {toFa(jalali(doc.createdAt))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {doc.expiresAt ? (
                          <span
                            className={
                              new Date(doc.expiresAt) < new Date()
                                ? 'text-destructive font-medium'
                                : 'text-muted-foreground'
                            }
                          >
                            {toFa(jalali(doc.expiresAt))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={doc.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <Eye className="size-3 me-1" />
                          مشاهده
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        {doc.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-success/30 hover:bg-success/10 text-success"
                              onClick={() => openReview(doc, 'approved')}
                            >
                              <CheckCircle2 className="size-3 me-1" />
                              تایید
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs hover:bg-destructive/10 text-destructive"
                              onClick={() => openReview(doc, 'rejected')}
                            >
                              <XCircle className="size-3 me-1" />
                              رد
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {doc.reviewNote ?? 'بررسی شده'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-3 border-t text-xs text-muted-foreground text-center">
              {toFa(filtered.length)} سند نمایش داده شده
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) setPreviewDoc(null) }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              جزئیات مدرک ارسالی
            </DialogTitle>
          </DialogHeader>

          {previewDoc && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/30 p-3 space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">فرستنده</p>
                    <p className="font-medium">{previewDoc.user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">کد پرسنلی</p>
                    <p className="font-medium">
                      {toFa(previewDoc.user.phone || previewDoc.user.personnelCode)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5">نوع مدرک</p>
                    <p className="font-medium">{previewDoc.type.title}</p>
                  </div>
                  {previewDoc.issuedAt && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">تاریخ صدور</p>
                      <p>{toFa(jalali(previewDoc.issuedAt))}</p>
                    </div>
                  )}
                  {previewDoc.expiresAt && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">تاریخ انقضا</p>
                      <p className={new Date(previewDoc.expiresAt) < new Date() ? 'text-destructive font-medium' : ''}>
                        {toFa(jalali(previewDoc.expiresAt))}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">تاریخ ارسال: {toFa(jalali(previewDoc.createdAt))}</span>
                  <StatusBadge status={previewDoc.status} />
                </div>
                {previewDoc.reviewNote && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-0.5">یادداشت بررسی‌کننده</p>
                    <p className="text-sm">{previewDoc.reviewNote}</p>
                  </div>
                )}
              </div>

              {previewDoc.fileUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted/20 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewDoc.fileUrl}
                    alt="سند ارسالی"
                    className="max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                      const parent = (e.target as HTMLImageElement).parentElement
                      if (parent) {
                        const fallback = document.createElement('div')
                        fallback.className = 'flex flex-col items-center gap-2 text-muted-foreground'
                        fallback.innerHTML = '<span class="text-sm">پیش‌نمایش تصویر در دسترس نیست</span>'
                        parent.appendChild(fallback)
                      }
                    }}
                  />
                </div>
              )}

              {previewDoc.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-success hover:bg-success/90 text-white"
                    onClick={() => {
                      setPreviewDoc(null)
                      openReview(previewDoc, 'approved')
                    }}
                  >
                    <CheckCircle2 className="size-4 me-1.5" />
                    تایید صلاحیت
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setPreviewDoc(null)
                      openReview(previewDoc, 'rejected')
                    }}
                  >
                    <XCircle className="size-4 me-1.5" />
                    رد مدرک
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog.open}
        onOpenChange={(open) => {
          if (!open) setReviewDialog({ open: false, doc: null, action: 'approved' })
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewDialog.action === 'approved' ? (
                <>
                  <CheckCircle2 className="size-5 text-success" />
                  تایید صلاحیت و ثبت سند
                </>
              ) : (
                <>
                  <ShieldAlert className="size-5 text-destructive" />
                  رد صلاحیت و نقص مدرک
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {reviewDialog.doc && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">فرستنده:</span>
                  <span className="font-medium">{reviewDialog.doc.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نوع مدرک:</span>
                  <span>{reviewDialog.doc.type.title}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-review-note">
                  {reviewDialog.action === 'rejected'
                    ? 'دلیل رد (به اطلاع پرسنل خواهد رسید)'
                    : 'یادداشت (اختیاری)'}
                </Label>
                <Textarea
                  id="doc-review-note"
                  placeholder={
                    reviewDialog.action === 'rejected'
                      ? 'مثلاً: کیفیت مدرک خوانا نیست یا تاریخ اعتبار منقضی شده است.'
                      : 'توضیحات تکمیلی...'
                  }
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
              onClick={() => setReviewDialog({ open: false, doc: null, action: 'approved' })}
              disabled={reviewing}
            >
              انصراف
            </Button>
            <Button
              size="sm"
              onClick={handleReview}
              disabled={reviewing || (reviewDialog.action === 'rejected' && !reviewNote.trim())}
              className={
                reviewDialog.action === 'approved'
                  ? 'bg-success hover:bg-success/90 text-white'
                  : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              }
            >
              {reviewing && <Loader2 className="size-3.5 me-1.5 animate-spin" />}
              {reviewDialog.action === 'approved' ? 'تایید صلاحیت' : 'رد مدرک و ارسال اعلان'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
