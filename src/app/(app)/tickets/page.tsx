'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/features/auth'
import { TicketForm } from '@/components/shared/ticket-form'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { toFa } from '@/lib/fa'

interface Ticket {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  wagonCode: string | null
  createdAt: string
  creator: { id: string; name: string; nationalId: string }
  _count: { logs: number }
}

const STATUS_LABELS: Record<string, string> = {
  open: 'باز',
  in_progress: 'در حال تعمیر',
  resolved: 'حل شده',
  closed: 'بسته شده',
}

const STATUS_CLASSES: Record<string, string> = {
  open: 'bg-warning/10 text-warning border border-warning/20',
  in_progress: 'bg-info/10 text-info border border-info/20',
  resolved: 'bg-success/10 text-success border border-success/20',
  closed: 'bg-foreground-muted/10 text-foreground-muted border border-border-subtle',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  critical: 'بحرانی',
}

const PRIORITY_CLASSES: Record<string, string> = {
  low: 'bg-foreground-muted/10 text-foreground-muted border border-border-subtle',
  medium: 'bg-info/10 text-info border border-info/20',
  high: 'bg-warning/10 text-warning border border-warning/20',
  critical: 'bg-critical/10 text-critical border border-critical/20',
}

export default function TicketsPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    function updateTime() {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      setCurrentTime(`${h}:${m}:${s}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  async function loadTickets() {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const res = await fetch(`/api/tickets${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTickets(data.data.tickets)
        setStats(data.data.stats)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const params = statusFilter ? `?status=${statusFilter}` : ''
        const res = await fetch(`/api/tickets${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setTickets(data.data.tickets)
          setStats(data.data.stats)
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [statusFilter, accessToken])

  async function handleStatusChange(ticketId: string, newStatus: string) {
    const note = prompt('یادداشت (اختیاری):')
    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus, note: note || undefined }),
      })
      if (res.ok) loadTickets()
    } catch {
      // silent
    }
  }

  const NEXT_STATUS: Record<string, string> = {
    open: 'in_progress',
    in_progress: 'resolved',
    resolved: 'closed',
  }

  const NEXT_LABEL: Record<string, string> = {
    open: 'شروع تعمیر',
    in_progress: 'حل شده',
    resolved: 'بستن',
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground mb-1">
            تیکت‌های خرابی قطار
          </h1>
          <p className="text-sm text-foreground-muted">ثبت و پیگیری گزارش‌های خرابی ناوگان و تجهیزات خط ۱</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live Clock */}
          {currentTime && (
            <div className="bg-surface px-3 py-1 rounded-lg border border-border flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="font-mono text-xs text-foreground-muted" dir="ltr">
                {toFa(currentTime)}
              </span>
            </div>
          )}
          <TicketForm onCreated={loadTickets} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'open', label: 'باز', count: stats.open },
          { key: 'in_progress', label: 'در حال تعمیر', count: stats.inProgress },
          { key: 'resolved', label: 'حل شده', count: stats.resolved },
          { key: 'closed', label: 'بسته شده', count: stats.closed },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key ? '' : s.key)}
            className={`rounded-lg border p-4 text-center transition-all duration-150 active:scale-[0.98] ${
              statusFilter === s.key
                ? 'border-accent bg-accent/10 text-accent font-semibold shadow-sm'
                : 'border-border bg-surface hover:bg-surface-hover text-foreground-muted hover:text-foreground'
            }`}
          >
            <div className="text-lg font-semibold tracking-tight">{toFa(s.count)}</div>
            <div className="text-xs mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div role="status" className="rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-sm text-foreground-muted">در حال بارگذاری تیکت‌ها...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-12 text-center">
          <p className="text-sm text-foreground-muted">هیچ تیکت خرابی با وضعیت انتخاب‌شده یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="border border-border bg-surface hover:bg-surface-hover hover:border-border-subtle transition-all duration-150 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{ticket.title}</h3>
                      {ticket.wagonCode && (
                        <span className="font-mono text-xs text-foreground-muted bg-background-subtle border border-border-subtle rounded px-1.5 py-0.5" dir="ltr">
                          {ticket.wagonCode}
                        </span>
                      )}
                    </div>
                    {ticket.description && (
                      <p className="text-xs text-foreground-muted line-clamp-2 max-w-3xl leading-relaxed">
                        {ticket.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-foreground-muted">
                      <span>ثبت‌کننده: {ticket.creator.name}</span>
                      <span className="font-mono">
                        تاریخ: {toFa(new Date(ticket.createdAt).toLocaleDateString('fa-IR'))}
                      </span>
                      <span>تعداد وقایع: {toFa(ticket._count.logs)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_CLASSES[ticket.priority] ?? ''}`}
                    >
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[ticket.status] ?? ''}`}
                    >
                      {STATUS_LABELS[ticket.status]}
                    </span>
                    {NEXT_STATUS[ticket.status] && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs px-3 hover:border-accent hover:text-accent transition-colors"
                        onClick={() =>
                          handleStatusChange(ticket.id, NEXT_STATUS[ticket.status])
                        }
                      >
                        {NEXT_LABEL[ticket.status]}
                      </Button>
                    )}
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
