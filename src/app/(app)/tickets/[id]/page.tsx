'use client'

import { useEffect, useState, use } from 'react'
import { useAuthStore } from '@/features/auth'
import { toFa, jalali, faTime } from '@/lib/fa'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
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

  const getActiveStepIndex = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'under_review':
      case 'needs_info':
      case 'rejected':
      case 'reopened':
        return 0
      case 'approved':
      case 'deferred':
        return 1
      case 'in_repair':
        return 2
      case 'repaired':
        return 3
      case 'verified_closed':
        return 4
      default:
        return 0
    }
  }

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
    <div className="flex flex-1 flex-col gap-6 p-6 print:p-0" dir="rtl">
      {/* Header breadcrumb & controls */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4 no-print">
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
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer">
            🖨️ چاپ شناسنامه فالت
          </Button>
          <Button onClick={loadReport} variant="outline" className="text-xs">
            به‌روزرسانی
          </Button>
        </div>
      </div>

      {/* Horizontal Lifecycle Step Tracker */}
      <div className="bg-surface p-6 rounded-xl border border-border no-print">
        <h2 className="text-xs font-bold text-foreground-muted mb-4">چرخه پیشرفت فالت فنی:</h2>
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-800 -z-10" />
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 bg-red-600 transition-all duration-500 -z-10"
            style={{
              width: `${(getActiveStepIndex(report.status) / 4) * 100}%`,
            }}
          />

          {[
            { label: 'ثبت فالت', desc: 'توسط راهبر / پرسنل' },
            { label: 'بررسی و ارجاع', desc: 'توسط سرسرپرست شیفت' },
            { label: 'شروع تعمیرات', desc: 'توسط تکنسین متخصص' },
            { label: 'رفع خرابی', desc: 'ثبت گزارش فنی تعمیر' },
            { label: 'تأیید و بستن', desc: 'کنترل کیفی و آرشیو' }
          ].map((step, idx) => {
            const activeIdx = getActiveStepIndex(report.status)
            const isCompleted = idx < activeIdx
            const isActive = idx === activeIdx
            const isFuture = idx > activeIdx

            return (
              <div key={idx} className="flex flex-col items-center flex-1 text-center relative">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shadow-md bg-zinc-950",
                    isCompleted ? "border-red-600 text-red-500 bg-red-500/10" :
                    isActive ? "border-red-500 text-red-500 scale-110 ring-4 ring-red-500/20" :
                    "border-zinc-800 text-zinc-500"
                  )}
                >
                  {isCompleted ? '✓' : toFa(idx + 1)}
                </div>
                <span className={cn(
                  "text-xs font-bold mt-2",
                  isActive ? "text-red-500" : isCompleted ? "text-zinc-300" : "text-zinc-500"
                )}>
                  {step.label}
                </span>
                <span className="text-[9px] text-zinc-600 hidden sm:block mt-0.5">
                  {step.desc}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
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

      {/* ── PRINT-ONLY OFFICIAL SHEET ── */}
      <div className="hidden print:block print-container text-black font-sans p-8 space-y-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold">شناسنامه فنی و برگه تعمیرات خط ۱ متروی تهران</h1>
            <p className="text-xs">دپوی غرب / دپوی علی‌آباد - مدیریت سیر و حرکت</p>
          </div>
          <div className="text-left">
            <div className="font-mono font-bold text-lg">F-{report.faultNo}</div>
            <div className="text-[10px]">تاریخ ثبت: {jalali(report.createdAt)}</div>
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-xs">
          <tbody>
            <tr>
              <td className="border border-black p-2 font-bold bg-zinc-100 w-1/4">شماره قطار:</td>
              <td className="border border-black p-2 w-1/4">قطار {toFa(report.train.trainNumber)} ({report.train.fleetSeries})</td>
              <td className="border border-black p-2 font-bold bg-zinc-100 w-1/4">شماره واگن مربوطه:</td>
              <td className="border border-black p-2 w-1/4">{report.wagon ? `واگن ${toFa(report.wagon.position)}` : 'کل قطار'}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold bg-zinc-100">کد خطای کاتالوگ:</td>
              <td className="border border-black p-2">{report.faultCode.code}</td>
              <td className="border border-black p-2 font-bold bg-zinc-100">عنوان و دسته‌بندی فالت:</td>
              <td className="border border-black p-2">{report.faultCode.title} ({report.faultCode.category.title})</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold bg-zinc-100">اولویت اقدام:</td>
              <td className="border border-black p-2">اولویت {PRIORITY_LABELS[report.priority]}</td>
              <td className="border border-black p-2 font-bold bg-zinc-100">وضعیت فعلی:</td>
              <td className="border border-black p-2">{STATUS_LABELS[report.status]}</td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold bg-zinc-100">راهبر ثبت‌کننده:</td>
              <td className="border border-black p-2">{report.reporter.name}</td>
              <td className="border border-black p-2 font-bold bg-zinc-100">مهلت اقدام (SLA):</td>
              <td className="border border-black p-2">{report.slaDueAt ? `${jalali(report.slaDueAt)} ${faTime(report.slaDueAt)}` : 'تعریف نشده'}</td>
            </tr>
          </tbody>
        </table>

        <div className="space-y-2">
          <h3 className="text-sm font-bold border-b border-black pb-1">شرح گزارش نقص فنی</h3>
          <p className="text-xs leading-relaxed whitespace-pre-wrap">{report.description}</p>
        </div>

        {report.locationNote && (
          <div className="space-y-1">
            <h4 className="text-xs font-bold">موقعیت وقوع فالت:</h4>
            <p className="text-xs">{report.locationNote}</p>
          </div>
        )}

        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold border-b border-black pb-1">اقدامات نگهداری و نظرات فنی ثبت شده</h3>
          <div className="space-y-3">
            {report.logs.map((log) => (
              <div key={log.id} className="border-b border-zinc-200 pb-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span>{LOG_ACTION_LABELS[log.action] || log.action} - توسط {log.actor.name}</span>
                  <span className="font-mono">{jalali(log.createdAt)} {faTime(log.createdAt)}</span>
                </div>
                {log.note && <p className="mt-1 text-zinc-700 italic">{log.note}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Signature lines */}
        <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs">
          <div className="space-y-8">
            <span className="font-bold">امضای راهبر ثبت‌کننده</span>
            <div className="h-12 border-b border-dashed border-black" />
          </div>
          <div className="space-y-8">
            <span className="font-bold">امضای تکنسین تعمیرات</span>
            <div className="h-12 border-b border-dashed border-black" />
          </div>
          <div className="space-y-8">
            <span className="font-bold">مهر و تأیید رئیس مرکز OCC</span>
            <div className="h-12 border-b border-dashed border-black" />
          </div>
        </div>
      </div>
    </div>
  )
}
