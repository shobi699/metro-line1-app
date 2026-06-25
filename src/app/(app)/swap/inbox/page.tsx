'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { ArrowLeftRight, Clock, User, Calendar, Check, X, Inbox } from 'lucide-react'
import { toFa, jalali, faTime } from '@/lib/fa'

interface SwapRequest {
  id: string
  status: string
  note: string | null
  createdAt: string
  requester: { id: string; name: string; nationalId: string }
  target: { id: string; name: string; nationalId: string }
  sourceShift: { id: string; date: string; code: string }
  targetShift: { id: string; date: string; code: string }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'در انتظار تایید',
  approved: 'تایید شده',
  rejected: 'رد شده',
}

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-accent/10 text-accent border-accent/20',
}

const SHIFT_LABELS: Record<string, string> = {
  morning: 'صبح',
  evening: 'عصر',
  night: 'شب',
  off: 'استراحت',
}

const SHIFT_CLASSES: Record<string, string> = {
  morning: 'bg-success/15 text-success border-success/30',
  evening: 'bg-info/15 text-info border-info/30',
  night: 'bg-neutral-800 text-foreground-muted border-neutral-700',
  off: 'bg-background-subtle text-foreground-muted border-border-subtle',
}

export default function SwapInboxPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [requests, setRequests] = useState<SwapRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/swap-requests/inbox', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          setRequests(data.data)
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [accessToken])

  async function handleAccept(swapRequestId: string) {
    setActionLoading(swapRequestId)
    setError(null)
    try {
      const res = await fetch('/api/swap-requests/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ swapRequestId }),
      })
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== swapRequestId))
      } else {
        const data = await res.json()
        setError(data.error || 'خطا در قبول درخواست جابجایی')
      }
    } catch {
      setError('خطای ارتباط با سرور')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleApprove(swapRequestId: string, decision: 'approved' | 'rejected') {
    setActionLoading(swapRequestId)
    setError(null)
    try {
      const res = await fetch('/api/swap-requests/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ swapRequestId, decision }),
      })
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== swapRequestId))
      } else {
        const data = await res.json()
        setError(data.error || 'خطا در اعمال تصمیم جابجایی')
      }
    } catch {
      setError('خطای ارتباط با سرور')
    } finally {
      setActionLoading(null)
    }
  }

  const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 max-w-5xl mx-auto w-full" dir="rtl">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          <ArrowLeftRight className="size-5 text-accent" />
          صندوق درخواست‌ها
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          مدیریت درخواست‌های تعویض شیفت راهبران و پرسنل سیر و حرکت خط ۱
        </p>
      </div>

      {error && (
        <div className="bg-critical/10 border border-critical/20 text-critical px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-2 hover:bg-critical/20 text-critical hover:text-critical cursor-pointer"
            onClick={() => setError(null)}
          >
            بستن
          </Button>
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-border p-12 text-center bg-surface/30 backdrop-blur-md">
          <Clock className="size-8 mx-auto text-foreground-muted animate-pulse mb-3" />
          <p className="text-sm text-foreground-muted">در حال بارگذاری درخواست‌ها...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-border-subtle p-12 text-center bg-surface/30 backdrop-blur-md flex flex-col items-center justify-center">
          <Inbox className="size-10 text-foreground-muted mb-3 opacity-40" />
          <p className="text-sm text-foreground-muted font-medium">
            صندوق ورودی خالی است
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            هیچ درخواست تعویض شیفت جدیدی برای بررسی یا تایید وجود ندارد.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="bg-surface/50 backdrop-blur-md border border-border-subtle hover:border-accent/30 transition-all duration-150 rounded-lg">
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    {/* User Info Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-sm font-semibold bg-neutral-800/40 px-2.5 py-1 rounded-md border border-border-subtle">
                        <User className="size-4 text-accent" />
                        <span>{req.requester.name}</span>
                      </div>
                      <span className="text-xs text-foreground-muted">درخواست تعویض شیفت با</span>
                      <div className="flex items-center gap-1.5 text-sm font-semibold bg-neutral-800/40 px-2.5 py-1 rounded-md border border-border-subtle">
                        <User className="size-4 text-foreground-muted" />
                        <span>{req.target.name}</span>
                      </div>
                    </div>

                    {/* Shift Swap Comparison Detail */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background-subtle/40 p-3.5 rounded-lg border border-border-subtle max-w-2xl">
                      {/* Source Shift */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-foreground-muted block">شیفت واگذار شده (مبدا):</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-xs font-semibold ${SHIFT_CLASSES[req.sourceShift.code]}`}>
                            {SHIFT_LABELS[req.sourceShift.code]}
                          </Badge>
                          <span className="text-xs font-mono text-foreground font-semibold flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-foreground-muted" />
                            {jalali(req.sourceShift.date)}
                          </span>
                        </div>
                      </div>

                      {/* Target Shift */}
                      <div className="space-y-1.5 border-t sm:border-t-0 sm:border-r border-border-subtle pt-2.5 sm:pt-0 sm:pr-4">
                        <span className="text-[10px] text-foreground-muted block">شیفت دریافت شده (مقصد):</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-xs font-semibold ${SHIFT_CLASSES[req.targetShift.code]}`}>
                            {SHIFT_LABELS[req.targetShift.code]}
                          </Badge>
                          <span className="text-xs font-mono text-foreground font-semibold flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-foreground-muted" />
                            {jalali(req.targetShift.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Note if exists */}
                    {req.note && (
                      <div className="bg-surface/70 p-3 rounded-lg border border-border-subtle text-xs text-foreground-muted leading-relaxed max-w-2xl">
                        <span className="font-semibold text-foreground block mb-1">علت درخواست جابجایی:</span>
                        {req.note}
                      </div>
                    )}

                    {/* Meta creation details */}
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted font-mono pt-1">
                      <Clock className="size-3" />
                      <span>زمان ثبت: {jalali(req.createdAt)} {faTime(req.createdAt)}</span>
                    </div>
                  </div>

                  {/* Right Side: Status Badge and Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 border-border-subtle pt-3.5 md:pt-0">
                    <Badge variant="outline" className={`rounded-md px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[req.status] || 'bg-neutral-800 text-foreground-muted border-border'}`}>
                      {STATUS_LABELS[req.status] || req.status}
                    </Badge>

                    {/* Actions Panel */}
                    <div className="flex gap-2">
                      {req.status === 'pending' && (
                        <>
                          {req.target.id === user?.id && (
                            <Button
                              size="sm"
                              onClick={() => handleAccept(req.id)}
                              disabled={actionLoading === req.id}
                              className="bg-success hover:bg-success/90 text-white font-medium gap-1 h-8 rounded-md cursor-pointer"
                            >
                              <Check className="size-3.5" />
                              قبول جابجایی
                            </Button>
                          )}
                          {isAdmin && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(req.id, 'approved')}
                                disabled={actionLoading === req.id}
                                className="border-success/30 hover:bg-success/15 hover:text-success text-success gap-1 h-8 rounded-md cursor-pointer"
                              >
                                <Check className="size-3.5" />
                                تایید ادمین
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleApprove(req.id, 'rejected')}
                                disabled={actionLoading === req.id}
                                className="gap-1 h-8 rounded-md cursor-pointer"
                              >
                                <X className="size-3.5" />
                                رد
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

