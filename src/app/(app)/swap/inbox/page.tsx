'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { ArrowLeftRight, Clock, User, Calendar, Check, X, Inbox, AlertTriangle } from 'lucide-react'
import { jalali, faTime, toFa } from '@/lib/fa'
import { cn } from '@/lib/utils'

interface SwapRequest {
  id: string
  status: string
  note: string | null
  createdAt: string
  requester: { id: string; name: string; personnelCode: string }
  target: { id: string; name: string; personnelCode: string }
  sourceShift: { id: string; date: string; code: string }
  targetShift: { id: string; date: string; code: string }
  violations?: { rule: string; message: string }[]
}

interface TripSwapRequest {
  id: string
  status: string
  note: string | null
  reviewedBy?: string | null
  createdAt: string
  requester: { id: string; name: string; personnelCode: string }
  target: { id: string; name: string; personnelCode: string }
  sourceAssignment: {
    id: string
    role: string
    trip: {
      id: string
      rowNo: number
      trainNumber: string
      departureTime: string
      arrivalTime: string
      direction: string
    }
  }
  targetAssignment: {
    id: string
    role: string
    trip: {
      id: string
      rowNo: number
      trainNumber: string
      departureTime: string
      arrivalTime: string
      direction: string
    }
  }
  violations?: { rule: string; message: string }[]
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
  const [activeTab, setActiveTab] = useState<'shifts' | 'trips'>('shifts')
  const [requests, setRequests] = useState<SwapRequest[]>([])
  const [tripRequests, setTripRequests] = useState<TripSwapRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadRequests() {
    if (!accessToken) return
    setLoading(true)
    try {
      const [shiftsRes, tripsRes] = await Promise.all([
        fetch('/api/swap-requests/inbox', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/trips/swap', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      ])

      if (shiftsRes.ok) {
        const data = await shiftsRes.json()
        setRequests(data.data || [])
      }
      if (tripsRes.ok) {
        const data = await tripsRes.json()
        setTripRequests(data.data || [])
      }
    } catch (err) {
      setError("\u062e\u0637\u0627 \u062f\u0631 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0635\u0646\u062f\u0648\u0642 \u0648\u0631\u0648\u062f\u06cc")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRequests()
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

  async function handleAcceptTrip(tripSwapRequestId: string) {
    setActionLoading(tripSwapRequestId)
    setError(null)
    try {
      const res = await fetch(`/api/trips/swap/${tripSwapRequestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (res.ok) {
        void loadRequests()
      } else {
        const data = await res.json()
        setError(data.error || "\u062e\u0637\u0627 \u062f\u0631 \u0642\u0628\u0648\u0644 \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u062c\u0627\u0628\u062c\u0627\u06cc\u06cc \u0633\u0641\u0631")
      }
    } catch {
      setError("\u062e\u0637\u0627\u06cc \u0627\u0631\u062a\u0628\u0627\u0636 \u0628\u0627 \u0633\u0631\u0648\u0631")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleApproveTrip(tripSwapRequestId: string, decision: 'approved' | 'rejected') {
    setActionLoading(tripSwapRequestId)
    setError(null)
    try {
      const res = await fetch(`/api/trips/swap/${tripSwapRequestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ decision }),
      })
      if (res.ok) {
        void loadRequests()
      } else {
        const data = await res.json()
        setError(data.error || "\u062e\u0637\u0627 \u062f\u0631 \u0627\u0639\u0645\u0627\u0644 \u062a\u0635\u0645\u06cc\u0645 \u062c\u0627\u0628\u062c\u0627\u06cc\u06cc \u0633\u0641\u0631")
      }
    } catch {
      setError("\u062e\u0637\u0627\u06cc \u0627\u0631\u062a\u0628\u0627\u0636 \u0628\u0627 \u0633\u0631\u0648\u0631")
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

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-border-subtle pb-3 no-print">
        <button
          onClick={() => setActiveTab('shifts')}
          className={cn(
            "pb-2 text-xs font-bold border-b-2 px-4 transition-all flex items-center gap-1.5 cursor-pointer",
            activeTab === 'shifts'
              ? "border-accent text-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <ArrowLeftRight className="size-4" />
          <span>{"\u062c\u0627\u0628\u062c\u0627\u06cc\u06cc \u0634\u06cc\u0641\u062a\u200c\u0647\u0627\u06cc \u0639\u0645\u0648\u0645\u06cc"} ({toFa(requests.length)})</span>
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={cn(
            "pb-2 text-xs font-bold border-b-2 px-4 transition-all flex items-center gap-1.5 cursor-pointer",
            activeTab === 'trips'
              ? "border-accent text-accent"
              : "border-transparent text-foreground-muted hover:text-foreground"
          )}
        >
          <Inbox className="size-4" />
          <span>{"\u062c\u0627\u0628\u062c\u0627\u06cc\u06cc \u0633\u0641\u0631\u0647\u0627\u06cc \u0631\u0648\u0632\u0627\u0646\u0647"} ({toFa(tripRequests.length)})</span>
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border p-12 text-center bg-surface/30 backdrop-blur-md">
          <Clock className="size-8 mx-auto text-foreground-muted animate-pulse mb-3" />
          <p className="text-sm text-foreground-muted">{"\u062f\u0631 \u062d\u0627\u0644 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u062f\u0631\u062e\u0648\u0627\u0633\u062a\u200c\u0647\u0627..."}</p>
        </div>
      ) : activeTab === 'shifts' ? (
        requests.length === 0 ? (
          <div className="rounded-lg border border-border-subtle p-12 text-center bg-surface/30 backdrop-blur-md flex flex-col items-center justify-center">
            <Inbox className="size-10 text-foreground-muted mb-3 opacity-40" />
            <p className="text-sm text-foreground-muted font-medium">
              {"\u0635\u0646\u062f\u0648\u0642 \u0648\u0631\u0648\u062f\u06cc \u062e\u0627\u0644\u06cc \u0627\u0633\u062a"}
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              {"\u0647\u06cc\u0686 \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u062a\u0639\u0648\u06cc\u0636 \u0634\u06cc\u0641\u062a \u062c\u062f\u06cc\u062f\u06cc \u0628\u0631\u0625\u06cc \u0628\u0631\u0631\u0633\u06cc \u06cc\u0627 \u062a\u0627\u06cc\u06cc\u062f \u0648\u062c\u0648\u062f \u0646\u062f\u0627\u0631\u062f."}
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
                        <span className="text-xs text-foreground-muted">{"\u062f\u0631\u062e\u0648\u0627\u0633\u062a \u062a\u0639\u0648\u06cc\u0636 \u0634\u06cc\u0641\u062a \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u062a\u0639\u0648\u06cc\u0636 \u0634\u06cc\u0641\u062a \u0628\u0627"}</span>
                        <div className="flex items-center gap-1.5 text-sm font-semibold bg-neutral-800/40 px-2.5 py-1 rounded-md border border-border-subtle">
                          <User className="size-4 text-foreground-muted" />
                          <span>{req.target.name}</span>
                        </div>
                      </div>

                      {/* Shift Swap Comparison Detail */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background-subtle/40 p-3.5 rounded-lg border border-border-subtle max-w-2xl">
                        {/* Source Shift */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-foreground-muted block">{"\u0634\u06cc\u0641\u062a \u0648\u0627\u06af\u0630\u0627\u0631 \u0634\u062f\u0647 (\u0645\u0628\u062f\u0627):"}</span>
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
                          <span className="text-[10px] text-foreground-muted block">{"\u0634\u06cc\u0641\u062a \u062f\u0631\u06cc\u0627\u0641\u062a \u0634\u062f\u0647 (\u0645\u0642\u0635\u062f):"}</span>
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
                          <span className="font-semibold text-foreground block mb-1">{"\u0639\u0644\u062a \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u062c\u0627\u0628\u062c\u0627\u06cc\u06cc:"}</span>
                          {req.note}
                        </div>
                      )}

                      {/* Safety Rules Engine Check */}
                      <div className="max-w-2xl">
                        {req.violations && req.violations.length > 0 ? (
                          <div className="bg-critical/10 border border-critical/30 rounded-lg p-3 space-y-1.5 text-xs text-critical">
                            <div className="font-bold flex items-center gap-1.5">
                              <AlertTriangle className="size-3.5 animate-pulse" />
                              <span>{"\u0645\u063a\u0627\u06cc\u0631\u062a \u0628\u0627 \u0642\u0648\u0627\u0646\u06cc\u0646 \u0648 \u0622\u06cc\u06cc\u0646\u200c\u0646\u0627\u0645\u0647\u200c\u0647\u0627\u06cc \u0631\u0627\u0647\u0628\u0631\u06cc:"}</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 pe-4 text-foreground-muted">
                              {req.violations.map((v, i) => (
                                <li key={i} className="text-[11px] text-critical/90 font-semibold">
                                  {v.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="bg-success/10 border border-success/30 rounded-lg p-2.5 text-xs text-success flex items-center gap-1.5 font-medium">
                            <Check className="size-4 shrink-0" />
                            <span>{"\u0628\u0631\u0631\u0633\u06cc \u0642\u0648\u0627\u0646\u06cc\u0646 \u0627\u06cc\u0645\u0646\u06cc: \u0628\u062f\u0648\u0646 \u0645\u063a\u0627\u06cc\u0631\u062a (\u0645\u062c\u0627\u0632 \u062c\u0647\u062a \u062a\u0623\u06cc\u06cc\u062f \u0648 \u062c\u0627\u0628\u062c\u0627\u06cc\u06cc)"}</span>
                          </div>
                        )}
                      </div>

                      {/* Meta creation details */}
                      <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted font-mono pt-1">
                        <Clock className="size-3" />
                        <span>{"\u0632\u0645\u0627\u0646 \u062b\u0628\u062a:"} {jalali(req.createdAt)} {faTime(req.createdAt)}</span>
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
                                {"\u0642\u0628\u0648\u0644 \u062c\u0627\u0628\u062c\u0627\u06cc\u06cc"}
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
                                  {"\u062a\u0627\u06cc\u06cc\u062f \u0627\u062f\u0645\u06cc\u0646"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleApprove(req.id, 'rejected')}
                                  disabled={actionLoading === req.id}
                                  className="gap-1 h-8 rounded-md cursor-pointer"
                                >
                                  <X className="size-3.5" />
                                  {"\u0631\u062f"}
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
        )
      ) : (
        tripRequests.length === 0 ? (
          <div className="rounded-lg border border-border-subtle p-12 text-center bg-surface/30 backdrop-blur-md flex flex-col items-center justify-center">
            <Inbox className="size-10 text-foreground-muted mb-3 opacity-40" />
            <p className="text-sm text-foreground-muted font-medium">
              {"\u0635\u0646\u062f\u0648\u0642 \u0648\u0631\u0648\u062f\u06cc \u062c\u0627\u0628\u062c\u0627\u06cc\u06cc \u0633\u0641\u0631\u0647\u0627 \u062e\u0627\u0644\u06cc \u0627\u0633\u062a"}
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              {"\u0647\u06cc\u0686 \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u062c\u0627\u0628\u062c\u0627\u06cc\u06cc \u0633\u0641\u0631 \u0645\u0639\u0644\u0642\u06cc \u0628\u0631\u0625\u06cc \u0628\u0631\u0631\u0633\u06cc \u06cc\u0627 \u062a\u0627\u06cc\u06cc\u062f \u0648\u062c\u0648\u062f \u0646\u062f\u0627\u0631\u062f."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tripRequests.map((req) => (
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
                        <span className="text-xs text-foreground-muted">{"\u062f\u0631\u062e\u0648\u0627\u0633\u062a \u062c\u0627\u0628\u062c\u0627\u06cc\u06cc \u0633\u0641\u0631 \u0628\u0627"}</span>
                        <div className="flex items-center gap-1.5 text-sm font-semibold bg-neutral-800/40 px-2.5 py-1 rounded-md border border-border-subtle">
                          <User className="size-4 text-foreground-muted" />
                          <span>{req.target.name}</span>
                        </div>
                      </div>

                      {/* Trip Swap Details Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background-subtle/40 p-3.5 rounded-lg border border-border-subtle max-w-2xl text-[11px]">
                        {/* Source Trip */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-foreground-muted block">{"\u0633\u0641\u0631 \u0648\u0627\u06af\u0630\u0627\u0631 \u0634\u062f\u0647 (\u0645\u0628\u062f\u0627):"}</span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-foreground font-bold">
                              <span>{"\u0627\u0639\u0632\u0627\u0645"} {toFa(req.sourceAssignment.trip.rowNo)}</span>
                              <span className="text-foreground-muted px-1">|</span>
                              <span>{"\u0642\u062a\u0627\u0631"} {toFa(req.sourceAssignment.trip.trainNumber)}</span>
                              <span className="text-foreground-muted px-1">|</span>
                              <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-[9px] text-accent-foreground font-bold">{req.sourceAssignment.role}</span>
                            </div>
                            <div className="text-foreground-muted font-mono flex items-center gap-1.5 text-[10px] pt-0.5">
                              <Calendar className="size-3.5 text-foreground-muted" />
                              <span>{jalali(req.sourceAssignment.trip.departureTime)}</span>
                              <span className="font-semibold text-accent">
                                ({toFa(req.sourceAssignment.trip.departureTime.split('T')[1]?.substring(0, 5) || '')} ← {toFa(req.sourceAssignment.trip.arrivalTime.split('T')[1]?.substring(0, 5) || '')})
                              </span>
                            </div>
                            <div className="text-[9px] text-foreground-muted">
                              {"\u062c\u0647\u062a \u062d\u0631\u06a9\u062a"}: {req.sourceAssignment.trip.direction === 'UP' ? 'تجریش ← شهرری' : 'شهرری ← تجریش'}
                            </div>
                          </div>
                        </div>

                        {/* Target Trip */}
                        <div className="space-y-1.5 border-t sm:border-t-0 sm:border-r border-border-subtle pt-2.5 sm:pt-0 sm:pr-4">
                          <span className="text-[10px] text-foreground-muted block">{"\u0633\u0641\u0631 \u062f\u0631\u06cc\u0627\u0641\u062a \u0634\u062f\u0647 (\u0645\u0642\u0635\u062f):"}</span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-foreground font-bold">
                              <span>{"\u0627\u0639\u0632\u0627\u0645"} {toFa(req.targetAssignment.trip.rowNo)}</span>
                              <span className="text-foreground-muted px-1">|</span>
                              <span>{"\u0642\u062a\u0627\u0631"} {toFa(req.targetAssignment.trip.trainNumber)}</span>
                              <span className="text-foreground-muted px-1">|</span>
                              <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-[9px] text-accent-foreground font-bold">{req.targetAssignment.role}</span>
                            </div>
                            <div className="text-foreground-muted font-mono flex items-center gap-1.5 text-[10px] pt-0.5">
                              <Calendar className="size-3.5 text-foreground-muted" />
                              <span>{jalali(req.targetAssignment.trip.departureTime)}</span>
                              <span className="font-semibold text-accent">
                                ({toFa(req.targetAssignment.trip.departureTime.split('T')[1]?.substring(0, 5) || '')} ← {toFa(req.targetAssignment.trip.arrivalTime.split('T')[1]?.substring(0, 5) || '')})
                              </span>
                            </div>
                            <div className="text-[9px] text-foreground-muted">
                              {"\u062c\u0647\u062a \u062d\u0631\u06a9\u062a"}: {req.targetAssignment.trip.direction === 'UP' ? 'تجریش ← شهرری' : 'شهرری ← تجریش'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Note if exists */}
                      {req.note && (
                        <div className="bg-surface/70 p-3 rounded-lg border border-border-subtle text-xs text-foreground-muted leading-relaxed max-w-2xl">
                          <span className="font-semibold text-foreground block mb-1">{"\u0639\u0644\u062a \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u062c\u0627\u0628\u062c\u0627\u06cc\u06cc \u0633\u0641\u0631:"}</span>
                          {req.note}
                        </div>
                      )}

                      {/* Safety Rules Engine Check */}
                      <div className="max-w-2xl">
                        {req.violations && req.violations.length > 0 ? (
                          <div className="bg-critical/10 border border-critical/30 rounded-lg p-3 space-y-1.5 text-xs text-critical">
                            <div className="font-bold flex items-center gap-1.5">
                              <AlertTriangle className="size-3.5 animate-pulse" />
                              <span>{"\u0645\u063a\u0627\u06cc\u0631\u062a \u0628\u0627 \u0642\u0648\u0627\u0646\u06cc\u0646 \u0648 \u0622\u06cc\u06cc\u0646\u200c\u0646\u0627\u0645\u0647\u200c\u0647\u0627\u06cc \u0631\u0627\u0647\u0628\u0631\u06cc:"}</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 pe-4 text-foreground-muted">
                              {req.violations.map((v, i) => (
                                <li key={i} className="text-[11px] text-critical/90 font-semibold">
                                  {v.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="bg-success/10 border border-success/30 rounded-lg p-2.5 text-xs text-success flex items-center gap-1.5 font-medium">
                            <Check className="size-4 shrink-0" />
                            <span>{"\u0628\u0631\u0631\u0633\u06cc \u0642\u0648\u0627\u0646\u06cc\u0646 \u0627\u06cc\u0645\u0646\u06cc: \u0628\u062f\u0648\u0646 \u0645\u063a\u0627\u06cc\u0631\u062a (\u0645\u062c\u0627\u0632 \u062c\u0647\u062a \u062a\u0623\u06cc\u06cc\u062f \u0648 \u062c\u0627\u0628\u062c\u0627\u06cc\u06cc)"}</span>
                          </div>
                        )}
                      </div>

                      {/* Meta creation details */}
                      <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted font-mono pt-1">
                        <Clock className="size-3" />
                        <span>{"\u0632\u0645\u0627\u0646 \u062b\u0628\u062a:"} {jalali(req.createdAt)} {faTime(req.createdAt)}</span>
                      </div>
                    </div>

                    {/* Right Side: Status Badge and Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 border-border-subtle pt-3.5 md:pt-0">
                      {(() => {
                        let label = STATUS_LABELS[req.status] || req.status
                        let classNames = STATUS_CLASSES[req.status] || 'bg-neutral-800 text-foreground-muted border-border'
                        if (req.status === 'pending') {
                          if (req.reviewedBy && req.reviewedBy.startsWith('accepted:')) {
                            label = 'در انتظار تایید مدیریت'
                            classNames = 'bg-info/10 text-info border-info/20'
                          } else {
                            label = 'در انتظار پذیرش همکار'
                            classNames = 'bg-warning/10 text-warning border-warning/20'
                          }
                        }
                        return (
                          <Badge variant="outline" className={`rounded-md px-2.5 py-1 text-xs font-semibold ${classNames}`}>
                            {label}
                          </Badge>
                        )
                      })()}

                      {/* Actions Panel */}
                      <div className="flex gap-2">
                        {req.status === 'pending' && (
                          <>
                            {/* Colleague accepts */}
                            {!req.reviewedBy && req.target.id === user?.id && (
                              <Button
                                size="sm"
                                onClick={() => handleAcceptTrip(req.id)}
                                disabled={actionLoading === req.id}
                                className="bg-success hover:bg-success/90 text-white font-medium gap-1 h-8 rounded-md cursor-pointer"
                              >
                                <Check className="size-3.5" />
                                {"\u0642\u0628\u0648\u0644 \u062c\u0627\u0628\u062c\u0627\u06cc\u06cc"}
                              </Button>
                            )}

                            {/* Requester status explanation */}
                            {!req.reviewedBy && req.requester.id === user?.id && (
                              <span className="text-[10px] text-foreground-muted bg-surface px-2 py-1 rounded border border-border-subtle">
                                {"\u062f\u0631 \u062d\u0627\u0644 \u0628\u0631\u0631\u0633\u06cc \u062a\u0648\u0633\u0637 \u0647\u0645\u06a9\u0627\u0631"}
                              </span>
                            )}

                            {/* Colleague accepted, waiting for admin approval messages */}
                            {req.reviewedBy?.startsWith('accepted:') && (
                              <>
                                {req.target.id === user?.id && (
                                  <span className="text-[10px] text-info bg-info/10 px-2 py-1 rounded border border-info/20 font-medium">
                                    {"\u067e\u0630\u06cc\u0631\u0641\u062a\u0647 \u0634\u062f\u0647\u060c \u062f\u0631 \u0627\u0646\u062a\u0638\u0627\u0631 \u062a\u0627\u06cc\u06cc\u062f \u0645\u062f\u06cc\u0631\u06cc\u062a"}
                                  </span>
                                )}
                                {req.requester.id === user?.id && (
                                  <span className="text-[10px] text-info bg-info/10 px-2 py-1 rounded border border-info/20 font-medium">
                                    {"\u067e\u0630\u06cc\u0631\u0641\u062a\u0647 \u0634\u062f\u0647\u060c \u062f\u0631 \u0627\u0646\u062a\u0638\u0627\u0631 \u062a\u0627\u06cc\u06cc\u062f \u0645\u062f\u06cc\u0631\u06cc\u062a"}
                                  </span>
                                )}
                              </>
                            )}

                            {/* Admin Actions */}
                            {isAdmin && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApproveTrip(req.id, 'approved')}
                                  disabled={actionLoading === req.id || !req.reviewedBy?.startsWith('accepted:')}
                                  className="border-success/30 hover:bg-success/15 hover:text-success text-success gap-1 h-8 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={!req.reviewedBy?.startsWith('accepted:') ? "باید ابتدا توسط همکار پذیرفته شود" : "تایید نهایی و اعمال جابجایی"}
                                >
                                  <Check className="size-3.5" />
                                  {"\u062a\u0627\u06cc\u06cc\u062f \u0627\u062f\u0645\u06cc\u0646"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleApproveTrip(req.id, 'rejected')}
                                  disabled={actionLoading === req.id}
                                  className="gap-1 h-8 rounded-md cursor-pointer"
                                >
                                  <X className="size-3.5" />
                                  {"\u0631\u062f"}
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
        )
      )}
    </div>
  )
}

