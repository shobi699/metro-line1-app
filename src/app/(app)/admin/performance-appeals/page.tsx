'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toFa, jalali } from '@/lib/fa'
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Appeal {
  id: string
  logId: string
  employeeId: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  note: string | null
  createdAt: string
  resolvedAt: string | null
  employee: { id: string; name: string; customFields: Record<string, unknown> }
  reviewedBy: { id: string; name: string } | null
  log: {
    id: string
    scoreValue: number
    severity: string
    periodId: string
    status: string
    actionType: {
      title: string
      competency: { name: string }
    }
    recordedBy: { name: string }
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  pending: { label: 'در انتظار بررسی', color: 'text-warning border-warning/30 bg-warning/5', icon: Clock },
  approved: { label: 'پذیرفته شد', color: 'text-success border-success/30 bg-success/5', icon: CheckCircle2 },
  rejected: { label: 'رد شد', color: 'text-critical border-critical/30 bg-critical/5', icon: XCircle },
}

export default function AdminAppealsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    if (!accessToken) return
    setLoading(true)
    try {
      const url = filter === 'all'
        ? '/api/admin/performance/appeal'
        : `/api/admin/performance/appeal?status=${filter}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await res.json()
      setAppeals(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [accessToken, filter])

  async function handleReview(appealId: string, status: 'approved' | 'rejected') {
    setReviewing(appealId)
    setError('')
    try {
      const res = await fetch(`/api/admin/performance/appeal/${appealId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, note: reviewNote }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'خطا در بررسی اعتراض')
      } else {
        setExpanded(null)
        setReviewNote('')
        await load()
      }
    } catch {
      setError('خطای شبکه')
    } finally {
      setReviewing(null)
    }
  }

  const pendingCount = appeals.filter((a) => a.status === 'pending').length

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="size-6 text-accent" />
            مدیریت اعتراضات ارزیابی عملکرد
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            بررسی و داوری درخواست‌های اعتراض پرسنل به نمرات ثبت‌شده
          </p>
        </div>
        {pendingCount > 0 && filter !== 'pending' && (
          <Badge className="bg-warning/15 text-warning border border-warning/30 shrink-0">
            {toFa(pendingCount)} در انتظار
          </Badge>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface-container-low p-1 self-start">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === f
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            {f === 'all' ? 'همه' : STATUS_CONFIG[f].label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-critical bg-critical/5 border border-critical/20 rounded-lg p-3">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container-low border border-border" />
          ))}
        </div>
      ) : appeals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
            <FileText className="size-10 text-foreground-muted/40" />
            <p className="text-sm text-foreground-muted">هیچ اعتراضی در این دسته وجود ندارد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appeals.map((appeal) => {
            const statusCfg = STATUS_CONFIG[appeal.status]
            const StatusIcon = statusCfg.icon
            const isExpanded = expanded === appeal.id
            const isPositive = appeal.log.scoreValue >= 0

            return (
              <Card key={appeal.id} className={cn('overflow-hidden', appeal.status === 'pending' && 'ring-1 ring-warning/20')}>
                <button
                  type="button"
                  className="w-full text-start"
                  onClick={() => setExpanded(isExpanded ? null : appeal.id)}
                >
                  <div className="flex items-start gap-3 p-4">
                    {/* Status icon */}
                    <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg border', statusCfg.color)}>
                      <StatusIcon className="size-4" />
                    </div>

                    <div className="flex-1 min-w-0 text-start">
                      {/* Employee name + action type */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{appeal.employee.name}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusCfg.color}`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground-muted mt-0.5 truncate">
                        عملکرد: {appeal.log.actionType.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn('text-xs font-bold', isPositive ? 'text-success' : 'text-critical')}>
                          {isPositive ? '+' : ''}{toFa(appeal.log.scoreValue)} امتیاز
                        </span>
                        <span className="text-[10px] text-foreground-muted">
                          دوره: {appeal.log.periodId}
                        </span>
                        <span className="text-[10px] text-foreground-muted">
                          {jalali(appeal.createdAt)}
                        </span>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="size-4 text-foreground-muted shrink-0 mt-1" />
                    ) : (
                      <ChevronDown className="size-4 text-foreground-muted shrink-0 mt-1" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
                    {/* Appeal reason */}
                    <div className="rounded-lg bg-surface-container-low/50 p-3 space-y-1">
                      <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wide">دلیل اعتراض پرسنل</p>
                      <p className="text-sm text-foreground leading-relaxed">{appeal.reason}</p>
                    </div>

                    {/* Log details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-surface-container-low/30 p-2">
                        <p className="text-foreground-muted mb-0.5">ثبت‌کننده نمره</p>
                        <p className="font-medium text-foreground">{appeal.log.recordedBy.name}</p>
                      </div>
                      <div className="rounded-lg bg-surface-container-low/30 p-2">
                        <p className="text-foreground-muted mb-0.5">محور شایستگی</p>
                        <p className="font-medium text-foreground">{appeal.log.actionType.competency.name}</p>
                      </div>
                    </div>

                    {/* Review note (if reviewed) */}
                    {appeal.note && (
                      <div className="rounded-lg bg-surface-container/30 border border-border/40 p-3">
                        <p className="text-[11px] font-semibold text-foreground-muted mb-1">یادداشت داور</p>
                        <p className="text-xs text-foreground">{appeal.note}</p>
                        {appeal.reviewedBy && (
                          <p className="text-[10px] text-foreground-muted mt-1">
                            توسط: {appeal.reviewedBy.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Review actions (only for pending) */}
                    {appeal.status === 'pending' && (
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                          <label className="text-xs text-foreground-muted">یادداشت داور (اختیاری)</label>
                          <textarea
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="توضیح تصمیم یا دلیل رد/قبول..."
                            rows={2}
                            className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReview(appeal.id, 'rejected')}
                            disabled={reviewing === appeal.id}
                            className="text-xs border-critical/30 text-critical hover:bg-critical/5"
                          >
                            <XCircle className="size-3.5 me-1.5" />
                            رد اعتراض
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReview(appeal.id, 'approved')}
                            disabled={reviewing === appeal.id}
                            className="text-xs bg-success/90 hover:bg-success text-white"
                          >
                            <CheckCircle2 className="size-3.5 me-1.5" />
                            {reviewing === appeal.id ? 'در حال ثبت...' : 'تایید و حذف نمره جریمه'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
