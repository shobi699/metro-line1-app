'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
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
  open: 'bg-warning/10 text-warning',
  in_progress: 'bg-info/10 text-info',
  resolved: 'bg-success/10 text-success',
  closed: 'bg-background-subtle text-foreground-muted',
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'زیاد',
  critical: 'بحرانی',
}

const PRIORITY_CLASSES: Record<string, string> = {
  low: 'bg-background-subtle text-foreground-muted',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-destructive/10 text-destructive',
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
        <h1 className="text-lg font-semibold tracking-tight">تیکت‌ها</h1>
        <TicketForm onCreated={loadTickets} />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'open', label: 'باز', count: stats.open },
          { key: 'in_progress', label: 'در حال تعمیر', count: stats.inProgress },
          { key: 'resolved', label: 'حل شده', count: stats.resolved },
          { key: 'closed', label: 'بسته شده', count: stats.closed },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key ? '' : s.key)}
            className={`rounded-lg border p-3 text-center transition-colors ${
              statusFilter === s.key
                ? 'border-accent bg-accent/10'
                : 'border-border hover:bg-surface-hover'
            }`}
          >
            <div className="text-lg font-semibold">{toFa(s.count)}</div>
            <div className="text-xs text-foreground-muted">{s.label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div role="status" className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-foreground-muted">در حال بارگذاری...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-sm text-foreground-muted">تیکتی وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{ticket.title}</h3>
                      {ticket.wagonCode && (
                        <span className="font-mono text-xs text-foreground-muted">
                          {ticket.wagonCode}
                        </span>
                      )}
                    </div>
                    {ticket.description && (
                      <p className="text-xs text-foreground-muted line-clamp-2">
                        {ticket.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-foreground-muted">
                      <span>{ticket.creator.name}</span>
                      <span>
                        {new Date(ticket.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                      <span>{ticket._count.logs} رویداد</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASSES[ticket.priority] ?? ''}`}
                    >
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[ticket.status] ?? ''}`}
                    >
                      {STATUS_LABELS[ticket.status]}
                    </span>
                    {NEXT_STATUS[ticket.status] && (
                      <Button
                        variant="outline"
                        size="sm"
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
