'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, ArrowLeftRight, Check, X, User } from 'lucide-react'
import { toFa } from '@/lib/fa'

export function PendingSwapsList() {
  const [swaps, setSwaps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSwaps()
  }, [])

  async function fetchSwaps() {
    setLoading(true)
    try {
      const res = await fetch('/api/roster/swap')
      const json = await res.json()
      if (res.ok) {
        setSwaps(json.data || [])
      } else {
        setError(json.error)
      }
    } catch (err) {
      setError('خطا در دریافت درخواست‌های جابه‌جایی')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(swapId: string, action: 'approve' | 'reject') {
    setActionLoading(swapId)
    try {
      const res = await fetch('/api/roster/swap/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swapRequestId: swapId, action })
      })
      const json = await res.json()
      if (res.ok) {
        setSwaps(swaps.filter(s => s.id !== swapId))
      } else {
        alert(json.error || 'خطا در عملیات')
      }
    } catch (err) {
      alert('خطای ارتباط با سرور')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-accent" /></div>
  if (error) return <div className="p-4 text-critical text-sm">{error}</div>
  if (swaps.length === 0) return <div className="p-4 text-sm text-foreground-muted">هیچ درخواست جابه‌جایی در انتظار تاییدی وجود ندارد.</div>

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <ArrowLeftRight className="size-4 text-accent" />
        درخواست‌های جابه‌جایی شیفت
        <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-[10px]">{toFa(swaps.length)} مورد</span>
      </h3>

      <div className="grid gap-3">
        {swaps.map(swap => (
          <div key={swap.id} className="bg-surface-container border border-outline-variant rounded-lg p-3">
            <div className="flex justify-between items-start mb-3">
              <div className="text-xs space-y-1 text-foreground-muted">
                <div>تاریخ ثبت: <span className="font-mono text-foreground">{new Date(swap.createdAt).toLocaleDateString('fa-IR')}</span></div>
                {swap.note && <div className="text-foreground italic">«{swap.note}»</div>}
              </div>
            </div>

            <div className="flex items-center justify-between bg-background border border-outline-variant rounded p-3 relative">
              
              {/* Requester (Source) */}
              <div className="flex-1 text-center">
                <div className="flex justify-center mb-1"><User className="size-4 text-foreground-muted" /></div>
                <div className="font-bold text-xs">{swap.requester.name}</div>
                <div className="text-[10px] text-foreground-muted mt-1 font-mono">
                  قطار {swap.sourceAssignment.trip.trainNumber} | {swap.sourceAssignment.trip.departureTime}
                </div>
              </div>

              {/* Arrow */}
              <div className="mx-4 text-accent">
                <ArrowLeftRight className="size-5" />
              </div>

              {/* Target */}
              <div className="flex-1 text-center">
                <div className="flex justify-center mb-1"><User className="size-4 text-foreground-muted" /></div>
                <div className="font-bold text-xs">{swap.target.name}</div>
                <div className="text-[10px] text-foreground-muted mt-1 font-mono">
                  قطار {swap.targetAssignment.trip.trainNumber} | {swap.targetAssignment.trip.departureTime}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => handleAction(swap.id, 'reject')}
                disabled={actionLoading === swap.id}
                className="px-3 py-1.5 border border-critical/50 text-critical text-xs rounded hover:bg-critical/10 flex items-center gap-1 disabled:opacity-50"
              >
                <X className="size-3.5" />
                رد درخواست
              </button>
              <button
                onClick={() => handleAction(swap.id, 'approve')}
                disabled={actionLoading === swap.id}
                className="px-3 py-1.5 bg-success text-success-foreground text-xs font-bold rounded hover:bg-success/90 flex items-center gap-1 disabled:opacity-50"
              >
                {actionLoading === swap.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                تایید و اعمال
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
