'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

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
  pending: 'در انتظار',
  approved: 'تایید شده',
  rejected: 'رد شده',
}

const SHIFT_LABELS: Record<string, string> = {
  morning: 'صبح',
  evening: 'عصر',
  night: 'شب',
  off: 'استراحت',
}

export default function SwapInboxPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const [requests, setRequests] = useState<SwapRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  async function handleApprove(swapRequestId: string, decision: 'approved' | 'rejected') {
    setActionLoading(swapRequestId)
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
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'super_admin'

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <h1 className="text-lg font-semibold tracking-tight">
        صندوق درخواست‌ها
      </h1>

      {loading ? (
        <div role="status" className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-foreground-muted">در حال بارگذاری...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-foreground-muted">
            درخواست جدیدی وجود ندارد
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {req.requester.name}
                      </span>
                      <span className="text-xs text-foreground-muted">
                        درخواست تعویض شیفت با
                      </span>
                      <span className="text-sm font-medium">
                        {req.target.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-foreground-muted">
                      <div>
                        مبدا:{' '}
                        <span className="font-mono">
                          {new Date(req.sourceShift.date).toLocaleDateString('fa-IR')}
                        </span>{' '}
                        ({SHIFT_LABELS[req.sourceShift.code]})
                      </div>
                      <div>
                        مقصد:{' '}
                        <span className="font-mono">
                          {new Date(req.targetShift.date).toLocaleDateString('fa-IR')}
                        </span>{' '}
                        ({SHIFT_LABELS[req.targetShift.code]})
                      </div>
                    </div>

                    {req.note && (
                      <p className="text-xs text-foreground-muted">{req.note}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'pending' && (
                      <>
                        {req.target.id === user?.id && (
                          <Button
                            size="sm"
                            onClick={() => handleAccept(req.id)}
                            disabled={actionLoading === req.id}
                          >
                            قبول
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(req.id, 'approved')}
                              disabled={actionLoading === req.id}
                            >
                              تایید
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApprove(req.id, 'rejected')}
                              disabled={actionLoading === req.id}
                            >
                              رد
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    <Badge variant="secondary">
                      {STATUS_LABELS[req.status]}
                    </Badge>
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
