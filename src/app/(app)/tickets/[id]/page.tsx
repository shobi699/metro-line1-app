'use client'

import { useEffect, useState, use } from 'react'
import { useAuthStore } from '@/features/auth'
import { toFa, jalali, faTime } from '@/lib/fa'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface UserRef {
  id: string
  name: string
}

interface FaultLog {
  id: string
  createdAt: string
  action: string
  fromStatus: string | null
  toStatus: string | null
  note: string | null
  changes: string | null
  actor: { id: string; name: string; role: { name: string } }
}

interface FaultReport {
  id: string
  faultNo: number
  trainId: string
  wagonId: string | null
  faultCodeId: string
  status: string
  priority: string
  reporterId: string
  reviewerId: string | null
  assigneeId: string | null
  verifierId: string | null
  description: string
  locationNote: string | null
  occurredAt: string
  serviceImpact: string
  photoUrls: string | null
  annotations: string | null
  slaDueAt: string
  slaBreached: boolean
  createdAt: string
  train: { id: string; trainNumber: string; fleetSeries: string }
  wagon: { wagonCode: string; position: number } | null
  faultCode: { code: string; title: string; category: { title: string }; operatorGuide: string | null; safetyCritical: boolean }
  reporter: UserRef
  assignee: UserRef | null
  reviewer: UserRef | null
  verifier: UserRef | null
  recurrenceOf: { id: string; faultNo: number; faultCode: { code: string } } | null
  logs: FaultLog[]
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'ثبت شده',
  under_review: 'در حال بررسی',
  needs_info: 'نیاز به اطلاعات',
  rejected: 'رد شده',
  approved: 'تایید شده',
  in_repair: 'در حال تعمیر',
  repaired: 'تعمیر شده',
  verified_closed: 'بسته شده',
  deferred: 'ماندگار (Deferred)',
  reopened: 'بازگشایی شده',
}

const STATUS_CLASSES: Record<string, string> = {
  submitted: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  under_review: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  needs_info: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
  approved: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  in_repair: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  repaired: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
  verified_closed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  deferred: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  reopened: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  critical: 'بحرانی',
}

const PRIORITY_CLASSES: Record<string, string> = {
  low: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  medium: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  high: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  critical: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse',
}

const LOG_ACTION_LABELS: Record<string, string> = {
  created: 'ثبت اولیه فالت',
  status_changed: 'تغییر وضعیت',
  edited: 'ویرایش مشخصات',
  assigned: 'تخصیص کارشناس',
  comment: 'درج نظر فنی',
  priority_changed: 'تغییر اولویت',
  attachment_added: 'افزودن پیوست تصویر',
  sla_breached: 'نقض زمان SLA 🚨',
  reopened: 'بازگشایی مجدد فالت',
  deferred: 'انتقال به فالت‌های ماندگار',
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { accessToken } = useAuthStore()
  const [report, setReport] = useState<FaultReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    loadReport()
  }, [id])

  async function loadReport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/faults/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const json = await res.json()
        setReport(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function submitComment() {
    if (!commentText.trim()) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/faults/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ note: commentText.trim() }),
      })
      if (res.ok) {
        setCommentText('')
        loadReport()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-20" dir="rtl">
        <span className="text-sm text-foreground-muted animate-pulse">در حال بارگذاری جزئیات فالت...</span>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-1 items-center justify-center p-20" dir="rtl">
        <span className="text-sm text-red-400">گزارش فالت یافت نشد یا دسترسی شما محدود شده است.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6" dir="rtl">
      {/* Header breadcrumb & controls */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <Link href="/tickets" className="hover:text-foreground">لیست فالت‌ها</Link>
            <span>/</span>
            <span>جزئیات فالت F-{report.faultNo}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              گزارش خرابی F-{report.faultNo}
            </h1>
            <Badge className={STATUS_CLASSES[report.status]}>{STATUS_LABELS[report.status]}</Badge>
            <Badge className={PRIORITY_CLASSES[report.priority]}>اولویت {PRIORITY_LABELS[report.priority]}</Badge>
          </div>
        </div>
        <Button onClick={loadReport} variant="outline" className="text-xs">
          به‌روزرسانی
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Specification Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-foreground">شناسه و مشخصات فنی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-foreground-muted">قطار مربوطه:</span>
                <Link href={`/fleet/train/${report.train.id}`} className="font-bold text-red-400 hover:underline">
                  قطار {toFa(report.train.trainNumber)} ({report.train.fleetSeries})
                </Link>
              </div>

              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-foreground-muted">واگن خرابی:</span>
                <span className="font-bold text-foreground">
                  {report.wagon ? `واگن ${toFa(report.wagon.position)} (${report.wagon.wagonCode})` : 'کادر کامل قطار'}
                </span>
              </div>

              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-foreground-muted">کد خطا (کاتالوگ):</span>
                <span className="font-mono font-bold text-foreground">{report.faultCode.code}</span>
              </div>

              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-foreground-muted">عنوان خطا:</span>
                <span className="font-bold text-foreground text-left">{report.faultCode.title}</span>
              </div>

              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-foreground-muted">ثبت‌کننده فالت:</span>
                <span className="font-bold text-foreground">{report.reporter.name}</span>
              </div>

              {report.assignee && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-foreground-muted">ارجاع شده به:</span>
                  <span className="font-bold text-foreground">{report.assignee.name}</span>
                </div>
              )}

              {report.slaDueAt && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-foreground-muted">زمان اقدام (SLA):</span>
                  <span className={`font-bold ${report.slaBreached ? 'text-red-400 font-extrabold animate-pulse' : 'text-foreground'}`}>
                    {jalali(report.slaDueAt)} {faTime(report.slaDueAt)}
                    {report.slaBreached && ' (نقض شده 🚨)'}
                  </span>
                </div>
              )}

              {report.recurrenceOf && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-foreground-muted">تکرار فالت قبلی:</span>
                  <Link href={`/tickets/${report.recurrenceOf.id}`} className="font-bold text-amber-500 hover:underline">
                    F-{report.recurrenceOf.faultNo} ({report.recurrenceOf.faultCode.code})
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guide Card */}
          {report.faultCode.operatorGuide && (
            <Card className="border-amber-500/20 bg-amber-500/5 text-amber-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold">راهنمای اقدام فوری راهبر</CardTitle>
              </CardHeader>
              <CardContent className="text-xs leading-relaxed">
                {report.faultCode.operatorGuide}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Lifecycle Timeline and Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <Card className="border border-border bg-surface">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground">شرح گزارش نقص فنی</h3>
              <p className="text-xs text-foreground-muted leading-relaxed whitespace-pre-wrap">{report.description}</p>
              {report.locationNote && (
                <div className="text-xs text-foreground-muted bg-background-subtle border border-border-subtle p-2.5 rounded-lg">
                  <span className="font-semibold block mb-1">موقعیت وقوع فالت:</span>
                  {report.locationNote}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline and Logs */}
          <Card className="border border-border bg-surface">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-foreground">تایم‌لاین چرخه عمر فالت و وقایع نگهداری</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative border-s border-zinc-800 ms-3 space-y-6">
                {report.logs.map((log) => (
                  <div key={log.id} className="relative ps-6">
                    {/* Bullet marker */}
                    <span className={`absolute -start-[6px] top-1.5 w-3 h-3 rounded-full border border-zinc-950 ${
                      log.action === 'comment' ? 'bg-sky-500' : 'bg-red-500'
                    }`} />
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">
                          {LOG_ACTION_LABELS[log.action] || log.action}
                        </span>
                        <span className="text-[10px] text-foreground-muted">
                          {jalali(log.createdAt)} - ساعت {faTime(log.createdAt)}
                        </span>
                      </div>
                      <div className="text-[11px] text-foreground-muted">
                        ثبت شده توسط: <span className="font-semibold text-zinc-300">{log.actor.name}</span> ({log.actor.role?.name || 'پرسنل'})
                      </div>
                      {log.note && (
                        <p className="text-xs text-foreground bg-zinc-900 border border-zinc-800 p-2.5 rounded-md mt-1 leading-relaxed whitespace-pre-wrap">
                          {log.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comment input form */}
          <Card className="border border-border bg-surface">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-xs font-semibold">درج نظر فنی یا گزارش کار جدید:</Label>
                <Textarea
                  id="comment"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="نکات فنی، قطعات مصرفی یا مشاهدات خود را یادداشت کنید..."
                  className="text-xs h-20"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={submitComment}
                  disabled={submittingComment || !commentText.trim()}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  {submittingComment ? 'در حال ثبت...' : 'درج نظر'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
